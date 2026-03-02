import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { OilPriceModule } from './oil-price/oil-price.module';
import { LocationModule } from './location/location.module';
import { SubscriptionMessageModule } from './subscription-message/subscription-message.module';
import { WechatModule } from './wechat/wechat.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
