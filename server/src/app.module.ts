import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { OilPriceModule } from './oil-price/oil-price.module';

@Module({
  imports: [OilPriceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
