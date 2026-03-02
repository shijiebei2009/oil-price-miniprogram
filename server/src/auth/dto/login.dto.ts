import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';

/**
 * 登录请求 DTO
 */
export class LoginDto {
  @IsString({ message: 'openid 必须是字符串' })
  @IsNotEmpty({ message: 'openid 不能为空' })
  @Length(10, 100, { message: 'openid 长度必须在 10-100 字符之间' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'openid 只能包含字母、数字、下划线和连字符' })
  openid: string;

  @IsString({ message: 'sessionKey 必须是字符串' })
  @IsOptional()
  @Length(0, 100, { message: 'sessionKey 长度不能超过 100 字符' })
  sessionKey?: string;
}
