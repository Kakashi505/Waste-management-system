import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { User, UserRole } from '../../database/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    companyName: string;
    mfaEnabled: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async register(registerData: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    role: UserRole;
    phone?: string;
    address?: string;
  }): Promise<LoginResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerData.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('このメールアドレスは既に使用されています');
    }

    const hashedPassword = await bcrypt.hash(registerData.password, 12);
    
    const user = this.userRepository.create({
      email: registerData.email,
      passwordHash: hashedPassword,
      name: registerData.name,
      companyName: registerData.companyName,
      role: registerData.role,
      phone: registerData.phone,
      address: registerData.address,
    });

    const savedUser = await this.userRepository.save(user);
    return this.login(savedUser);
  }

  async generateMfaSecret(userId: string): Promise<string> {
    const secret = authenticator.generateSecret();
    await this.userRepository.update(userId, {
      mfaSecret: secret,
    });
    return secret;
  }

  async enableMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('MFA設定が初期化されていません');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret,
    });

    if (isValid) {
      await this.userRepository.update(userId, {
        mfaEnabled: true,
      });
      return true;
    }

    return false;
  }

  async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret || !user.mfaEnabled) {
      return false;
    }

    return authenticator.verify({
      token,
      secret: user.mfaSecret,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
