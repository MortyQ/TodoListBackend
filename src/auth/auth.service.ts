import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole } from '../users/schemas/user.schema';

import { CreateUserDto, LoginDto, LoginResponseDto, RefreshTokenDto, RefreshTokenResponseDto } from './dto/auth.dto';
import { AppConfigService } from '../config/app-config.service';
import { ROLE_PERMISSIONS } from '../common/constants/permissions.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: AppConfigService,
  ) {}

  // Регистрация нового пользователя
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Хэшируем пароль с помощью argon2 (более безопасно чем bcrypt)
    const passwordHash = await argon2.hash(password);

    // Создаем нового пользователя
    const user = new this.userModel({
      email,
      passwordHash,
      name,
      role: UserRole.USER, // по умолчанию обычный пользователь
      permissions: ROLE_PERMISSIONS.USER, // назначаем стандартные разрешения для обычного пользователя
    });

    return user.save();
  }

  // Вход в систему
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Ищем пользователя по email, включая поле passwordHash
    const user = await this.userModel.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Проверяем пароль
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Генерируем Access Token (короткий срок жизни)
    const accessToken = this.generateAccessToken(user);

    // Генерируем Refresh Token (длинный срок жизни)
    const refreshToken = this.generateRefreshToken(user);

    // Хешируем refresh token перед сохранением в БД (безопасность)
    const refreshTokenHash = await argon2.hash(refreshToken);

    // Вычисляем дату истечения refresh token
    const refreshExpiresIn = this.configService.jwtRefreshExpiresIn;
    const expirationMs = this.parseExpirationToMs(refreshExpiresIn);
    const refreshTokenExpiresAt = new Date(Date.now() + expirationMs);

    // Сохраняем хешированный refresh token в базе данных
    await this.userModel.findByIdAndUpdate(user.id, {
      refreshToken: refreshTokenHash,
      refreshTokenExpiresAt,
    });

    // Возвращаем оба токена клиенту
    return { accessToken, refreshToken };
  }

  // Получение профиля текущего пользователя
  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // Проверка, существует ли пользователь с данным ID
  async validateUser(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  // Обновление токенов через refresh token
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // 1. Валидируем JWT подпись refresh token
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.jwtRefreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Проверяем тип токена
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // 3. Находим пользователя и получаем сохраненный refresh token
    const user = await this.userModel.findById(payload.sub).select('+refreshToken');

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 4. Проверяем истечение срока действия в БД (двойная проверка)
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 5. Сравниваем предоставленный токен с хешем в БД
    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 6. Генерируем новые токены (Token Rotation)
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // 7. Хешируем новый refresh token
    const newRefreshTokenHash = await argon2.hash(newRefreshToken);

    // 8. Вычисляем новую дату истечения
    const refreshExpiresIn = this.configService.jwtRefreshExpiresIn;
    const expirationMs = this.parseExpirationToMs(refreshExpiresIn);
    const newRefreshTokenExpiresAt = new Date(Date.now() + expirationMs);

    // 9. Обновляем refresh token в БД (старый токен становится недействительным)
    await this.userModel.findByIdAndUpdate(user.id, {
      refreshToken: newRefreshTokenHash,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt,
    });

    // 10. Возвращаем новые токены
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Выход из системы (инвалидация refresh token)
  async logout(userId: string): Promise<void> {
    // Очищаем refresh token из базы данных
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  }

  // Генерация Access Token (короткий срок жизни)
  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      type: 'access', // тип токена для дополнительной безопасности
    };

    const tokenOptions: any = {};
    const expiresIn = this.configService.jwtExpiresIn;
    if (expiresIn) {
      tokenOptions.expiresIn = expiresIn;
    }

    return this.jwtService.sign(payload, tokenOptions);
  }

  // Генерация Refresh Token (длинный срок жизни)
  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh', // тип токена
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.jwtRefreshSecret,
      expiresIn: this.configService.jwtRefreshExpiresIn,
    });
  }

  // Вспомогательный метод для преобразования строки времени в миллисекунды
  private parseExpirationToMs(expiration: string): number {
    const units: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      // По умолчанию 7 дней
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * units[unit];
  }
}
