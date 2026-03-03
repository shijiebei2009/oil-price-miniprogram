// 基于真实调价日期反推调休数据
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

console.log('=== 反推调休数据 ===\n')

for (let i = 0; i < realDates.length - 1; i++) {
  const start = new Date(realDates[i])
  const end = new Date(realDates[i + 1])
  const startPlus1 = new Date(start)
  startPlus1.setDate(startPlus1.getDate() + 1)

  console.log(`从 ${start.toISOString().split('T')[0]} 24时 到 ${end.toISOString().split('T')[0]} 24时:`)

  // 统计工作日
  let workdayCount = 0
  let weekendCount = 0
  const workdays = []
  const weekends = []

  for (let d = new Date(startPlus1); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    const dateStr = d.toISOString().split('T')[0]
    const weekday = ['周日','周一','周二','周三','周四','周五','周六'][day]

    if (day === 0 || day === 6) {
      weekendCount++
      weekends.push(dateStr + '(' + weekday + ')')
    } else {
      workdayCount++
      workdays.push(dateStr + '(' + weekday + ')')
    }
  }

  console.log(`  工作日 ${workdayCount} 个: ${workdays.join(', ')}`)
  console.log(`  周末 ${weekendCount} 个: ${weekends.join(', ')}`)
  console.log(`  总天数 ${workdayCount + weekendCount} 天`)
  console.log('')
}
