import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { OilPriceModule } from './oil-price/oil-price.module';
import { LocationModule } from './location/location.module';
import { SubscriptionMessageModule } from './subscription-message/subscription-message.module';
import { WechatModule } from './wechat/wechat.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // NestJS 从 server 目录启动，需要读取父目录的 .env 文件
      envFilePath: path.resolve(process.cwd(), '../.env'),
    }),
    OilPriceModule,
    LocationModule,
    SubscriptionMessageModule,
    WechatModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局应用 JWT 守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局验证管道
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
  ],
})
export class AppModule {}
