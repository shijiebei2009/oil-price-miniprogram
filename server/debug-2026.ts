import { OilPriceService } from './src/oil-price/oil-price.service'
import { HttpModule } from '@nestjs/axios'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'

async function debugHolidays() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot({ envFilePath: '../.env' })],
    providers: [OilPriceService],
  }).compile()

  const service = module.get<OilPriceService>(OilPriceService)
  await (service as any).onModuleInit()

  const holidayCache = (service as any).holidayCache
  console.log('节假日缓存大小:', holidayCache.size)

  // 检查 1 月 20 日到 2 月 7 日期间的每一天
  console.log('\n=== 1 月 20 日到 2 月 7 日期间的日期状态 ===')
  const start = new Date('2026-01-20')
  const end = new Date('2026-02-08')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
    const info = holidayCache.get(dateStr)
    if (info) {
      console.log(`${dateStr} (${weekday}): ${info.isHoliday ? '节假日' : '工作日'}, ${info.isWorkday ? '调休上班' : ''} (${info.remark || '无'})`)
    } else {
      console.log(`${dateStr} (${weekday}): 未标记（默认工作日）`)
    }
  }

  // 统计工作日
  console.log('\n=== 工作日统计（1 月 20 日到 2 月 3 日） ===')
  let workdayCount = 0
  for (let d = new Date('2026-01-20'); d <= new Date('2026-02-03'); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const info = holidayCache.get(dateStr)
    const isWorkday = info ? (info.isWorkday ? true : !info.isHoliday) : true
    if (isWorkday) {
      workdayCount++
      const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
      console.log(`  ${dateStr} (${weekday}): 工作日 #${workdayCount}`)
    }
  }
  console.log(`总工作日数: ${workdayCount}`)

  await module.close()
}

debugHolidays().catch(err => {
  console.error('调试失败：', err)
  process.exit(1)
})
