import { SetMetadata } from '@nestjs/common';

/**
 * 公开路由装饰器
 * 标记不需要 JWT 认证的路由
 *
 * 使用示例：
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
