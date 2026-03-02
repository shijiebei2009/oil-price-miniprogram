import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * 注销请求 DTO
 */
export class LogoutDto {
  @IsString({ message: 'refreshToken 必须是字符串' })
  @IsNotEmpty({ message: 'refreshToken 不能为空' })
  @Length(64, 256, { message: 'refreshToken 长度必须在 64-256 字符之间' })
  @Matches(/^[a-f0-9]+$/, { message: 'refreshToken 格式错误' })
  refreshToken: string;
}
