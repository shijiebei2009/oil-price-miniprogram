import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Get, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser, JwtPayload } from './decorators';
import { Public } from './decorators/public.decorator';
import { LoginDto, RefreshTokenDto, LogoutDto } from './dto';

/**
 * Auth Controller
 * 提供登录、刷新 Token、注销接口
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * 登录接口
   * POST /api/auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto.openid, loginDto.sessionKey);

      return {
        code: 200,
        msg: '登录成功',
        data: result,
      };
    } catch (error) {
      this.logger.error('登录失败:', error.message);
      return {
        code: 401,
        msg: error.message || '登录失败',
        data: null,
      };
    }
  }

  /**
   * 刷新 Token 接口
   * POST /api/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const tokens = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);

      return {
        code: 200,
        msg: '刷新成功',
        data: tokens,
      };
    } catch (error) {
      this.logger.error('刷新 Token 失败:', error.message);
      return {
        code: 401,
        msg: error.message || '刷新 Token 失败',
        data: null,
      };
    }
  }

  /**
   * 注销接口
   * POST /api/auth/logout
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutDto) {
    try {
      await this.authService.logout(logoutDto.refreshToken);

      return {
        code: 200,
        msg: '注销成功',
        data: null,
      };
    } catch (error) {
      this.logger.error('注销失败:', error.message);
      return {
        code: 400,
        msg: error.message || '注销失败',
        data: null,
      };
    }
  }

  /**
   * 清理过期 Token（管理员接口）
   * POST /api/auth/clean-expired
   */
  @Public()
  @Post('clean-expired')
  @HttpCode(HttpStatus.OK)
  async cleanExpired() {
    try {
      await this.authService.cleanExpiredRefreshTokens();

      return {
        code: 200,
        msg: '清理成功',
        data: null,
      };
    } catch (error) {
      this.logger.error('清理失败:', error.message);
      return {
        code: 500,
        msg: error.message || '清理失败',
        data: null,
      };
    }
  }

  /**
   * 获取当前用户信息（需要认证）
   * GET /api/auth/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return {
      code: 200,
      msg: '获取成功',
      data: {
        userId: user.sub,
        openid: user.openid,
        message: '这是受保护的数据，只有认证用户才能访问',
      },
    };
  }
}
