import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器
 * 从请求中获取当前用户信息（JWT Payload）
 *
 * 使用示例：
 * @Get('profile')
 * async getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export interface JwtPayload {
  sub: string;
  openid: string;
  iat: number;
  exp: number;
}
