import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface JwtPayload {
  sub: string;
  openid: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 登录：使用微信 openid 登录
   */
  async login(openid: string, sessionKey?: string): Promise<{
    user: any;
    tokens: Tokens;
  }> {
    const client = getSupabaseClient();

    // 查找或创建用户
    let { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    if (error && error.code === 'PGRST116') {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await client
        .from('users')
        .insert({
          openid,
          nickname: `用户_${openid.substring(0, 8)}`,
        })
        .select('*')
        .single();

      if (createError) {
        this.logger.error('创建用户失败:', createError);
        throw new UnauthorizedException('登录失败');
      }

      user = newUser;
      this.logger.log(`✅ 创建新用户: ${user.id}`);
    } else if (error) {
      this.logger.error('查询用户失败:', error);
      throw new UnauthorizedException('登录失败');
    } else {
      this.logger.log(`✅ 用户登录: ${user.id}`);
    }

    // 生成 Token
    const tokens = await this.generateTokens(user.id, user.openid);

    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
      },
      tokens,
    };
  }

  /**
   * 刷新 Access Token
   */
  async refreshAccessToken(refreshToken: string): Promise<Tokens> {
    const client = getSupabaseClient();

    // 查找 Refresh Token
    const { data: tokenRecord, error } = await client
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .is('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !tokenRecord) {
      this.logger.warn('Refresh Token 无效或已过期');
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    // 获取用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', tokenRecord.user_id)
      .single();

    if (userError || !user) {
      this.logger.error('用户不存在');
      throw new UnauthorizedException('用户不存在');
    }

    // 生成新的 Token
    const newTokens = await this.generateTokens(user.id, user.openid);

    // 撤销旧的 Refresh Token
    await this.revokeRefreshToken(refreshToken);

    this.logger.log(`✅ 刷新 Token: ${user.id}`);

    return newTokens;
  }

  /**
   * 注销：撤销 Refresh Token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
    this.logger.log('✅ 用户注销');
  }

  /**
   * 生成 Access Token 和 Refresh Token
   */
  private async generateTokens(userId: string, openid: string): Promise<Tokens> {
    // 生成 Access Token
    const payload: JwtPayload = {
      sub: userId,
      openid,
    };

    const accessToken = this.jwtService.sign(payload);

    // 获取过期时间
    const expiresIn = this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRATION', 15) * 60; // 转换为秒

    // 生成 Refresh Token
    const refreshToken = this.generateRefreshToken();

    // 计算 Refresh Token 过期时间
    const refreshTokenExpiry = this.getRefreshTokenExpiry();

    // 存储 Refresh Token 到数据库
    const client = getSupabaseClient();
    const { error } = await client.from('refresh_tokens').insert({
      user_id: userId,
      token: refreshToken,
      expires_at: refreshTokenExpiry,
    });

    if (error) {
      this.logger.error('存储 Refresh Token 失败:', error);
      throw new Error('生成 Token 失败');
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * 生成随机 Refresh Token
   */
  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * 获取 Refresh Token 过期时间
   */
  private getRefreshTokenExpiry(): string {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d');
    const now = new Date();
    const expiryDate = new Date(now.getTime() + this.parseDuration(expiresIn));
    return expiryDate.toISOString();
  }

  /**
   * 解析时间间隔（如 '7d' -> 毫秒）
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,           // 秒
      m: 60 * 1000,      // 分钟
      h: 60 * 60 * 1000, // 小时
      d: 24 * 60 * 60 * 1000, // 天
    };

    return value * multipliers[unit];
  }

  /**
   * 撤销 Refresh Token
   */
  private async revokeRefreshToken(token: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('refresh_tokens')
      .update({ is_revoked: true, revoked_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      this.logger.error('撤销 Refresh Token 失败:', error);
    }
  }

  /**
   * 验证 Access Token
   */
  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Access Token 无效或已过期');
    }
  }

  /**
   * 清理过期的 Refresh Token（定时任务）
   */
  async cleanExpiredRefreshTokens(): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.logger.error('清理过期 Token 失败:', error);
    } else {
      this.logger.log('✅ 清理过期 Token 成功');
    }
  }
}
