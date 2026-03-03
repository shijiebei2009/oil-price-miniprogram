// 基于 2026 年真实调价日期反推工作日数据
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

console.log('=== 基于 2026 年真实调价日期反推工作日数据 ===\n')

for (let i = 0; i < realDates.length - 1; i++) {
  const start = new Date(realDates[i])
  const end = new Date(realDates[i + 1])
  const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const weekdays = ['周日','周一','周二','周三','周四','周五','周六']

  // 统计工作日
  let workdayCount = 0
  let weekendCount = 0
  let holidayCount = 0

  const startPlus1 = new Date(start)
  startPlus1.setDate(startPlus1.getDate() + 1)

  for (let d = new Date(startPlus1); d < end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    const dateStr = d.toISOString().split('T')[0]

    if (day === 0 || day === 6) {
      weekendCount++
    } else {
      workdayCount++
    }

    console.log(`  ${dateStr} (${weekdays[day]})`)
  }

  // 结束日期也算一个周期点
  const endDay = end.getDay()
  console.log(`  ${end.toISOString().split('T')[0]} (${weekdays[endDay]}) <- 下次调价日`)

  console.log(`\n调价间隔：${daysDiff} 天（工作日 ${workdayCount}，周末 ${weekendCount}）\n`)
  console.log('---\n')
}
