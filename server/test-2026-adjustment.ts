import { OilPriceService } from './src/oil-price/oil-price.service'
import { HttpModule } from '@nestjs/axios'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'

async function runTest() {
  // 构建最小化的测试模块
  const module: TestingModule = await Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot({ envFilePath: '../.env' })],
    providers: [OilPriceService],
  }).compile()

  const service = module.get<OilPriceService>(OilPriceService)

  // 手动初始化服务（加载节假日缓存）
  await (service as any).onModuleInit()

  console.log('=== 2026 年调价日期计算验证 ===')

  // 打印节假日缓存状态
  const holidayCache = (service as any).holidayCache
  console.log(`节假日缓存大小: ${holidayCache.size} 天`)

  // 2026 年真实调价日期
  const realDates = [
    '2026-01-06', '2026-01-20',
    '2026-02-03', '2026-02-24',
    '2026-03-09', '2026-03-23',
    '2026-04-07', '2026-04-21',
    '2026-05-08', '2026-05-21',
    '2026-06-04', '2026-06-18',
    '2026-07-03', '2026-07-17', '2026-07-31',
    '2026-08-14', '2026-08-28',
    '2026-09-11', '2026-09-24',
    '2026-10-15', '2026-10-29',
    '2026-11-12', '2026-11-26',
    '2026-12-10', '2026-12-24'
  ]

  console.log(`\n真实调价日期（共 ${realDates.length} 次）：`)
  realDates.forEach((d, i) => {
    console.log(`${i + 1}. ${d}`)
  })

  // 从第一个调价日期开始，计算后续调价日期
  let current = new Date(realDates[0])
  console.log(`\n基准日期：${current.toISOString().split('T')[0]}（${['周日','周一','周二','周三','周四','周五','周六'][current.getDay()]}）`)

  const calculatedDates: string[] = []
  for (let i = 1; i < realDates.length; i++) {
    const next = (service as any).calculateNextAdjustmentDate(current)
    const nextDateStr = next.toISOString().split('T')[0]
    calculatedDates.push(nextDateStr)
    console.log(`计算结果 #${i + 1}: ${nextDateStr}（${['周日','周一','周二','周三','周四','周五','周六'][next.getDay()]}）`)
    current = next
  }

  // 验证结果
  console.log('\n=== 验证结果 ===')
  const realDatesWithoutFirst = realDates.slice(1)
  const matched: Array<{ index: number; date: string }> = []
  const missed: Array<{ index: number; calc: string; real: string }> = []

  for (let i = 0; i < calculatedDates.length; i++) {
    const calc = calculatedDates[i]
    const real = realDatesWithoutFirst[i]
    if (calc === real) {
      matched.push({ index: i + 2, date: calc })
    } else {
      missed.push({ index: i + 2, calc, real })
    }
  }

  console.log(`\n匹配：${matched.length} / ${calculatedDates.length}`)
  matched.forEach(m => console.log(`  ✅ #${m.index} ${m.date}`))

  console.log(`\n未匹配：${missed.length} / ${calculatedDates.length}`)
  missed.forEach(m => console.log(`  ❌ #${m.index} 计算: ${m.calc}, 真实: ${m.real}`))

  const matchRate = ((matched.length / calculatedDates.length) * 100).toFixed(2)
  console.log(`\n匹配率：${matchRate}%`)

  if (missed.length === 0) {
    console.log('\n🎉 所有调价日期计算正确！')
  } else {
    console.log('\n⚠️ 部分调价日期计算不准确，需要检查节假日数据。')
  }

  await module.close()
  process.exit(missed.length === 0 ? 0 : 1)
}

runTest().catch(err => {
  console.error('测试运行失败：', err)
  process.exit(1)
})
