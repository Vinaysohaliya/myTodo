import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.issueTokens(user);
  }

  async refresh(rawToken: string) {
    const stored = await this.prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let found: (typeof stored)[0] | undefined;
    for (const t of stored) {
      if (await bcrypt.compare(rawToken, t.tokenHash)) {
        found = t;
        break;
      }
    }

    if (!found) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.prisma.refreshToken.delete({ where: { id: found.id } });
    return this.issueTokens(found.user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async logout(rawToken: string) {
    const stored = await this.prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() } },
    });
    for (const t of stored) {
      if (await bcrypt.compare(rawToken, t.tokenHash)) {
        await this.prisma.refreshToken.delete({ where: { id: t.id } });
        return;
      }
    }
  }

  private async issueTokens(user: { id: string; email: string; name: string; avatar: string | null }) {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' },
    );

    const raw = randomBytes(40).toString('hex');
    const tokenHash = await bcrypt.hash(raw, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken: raw,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    };
  }
}
