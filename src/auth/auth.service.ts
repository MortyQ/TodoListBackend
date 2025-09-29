import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole } from '../users/schemas/user.schema';
import { CreateUserDto, LoginDto, LoginResponseDto } from './dto/auth.dto';
import { AppConfigService } from '../config/app-config.service';

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

    // Генерируем JWT токен
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokenOptions: any = {};

    // Если JWT_EXPIRES_IN не равно 0, устанавливаем время истечения
    const expiresIn = this.configService.jwtExpiresIn;
    if (expiresIn) {
      tokenOptions.expiresIn = expiresIn;
    }

    const accessToken = this.jwtService.sign(payload, tokenOptions);

    return { accessToken };
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
}
