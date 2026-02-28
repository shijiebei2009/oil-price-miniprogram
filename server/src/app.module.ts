import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { OilPriceModule } from './oil-price/oil-price.module';
import { LocationModule } from './location/location.module';
import { SubscriptionMessageModule } from './subscription-message/subscription-message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OilPriceModule,
    LocationModule,
    SubscriptionMessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
