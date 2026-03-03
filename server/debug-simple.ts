// 简单的节假日数据调试脚本
const holidays: Array<{ date: string; name: string }> = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-01-28', name: '春节' },
  { date: '2026-01-29', name: '春节' },
  { date: '2026-01-30', name: '春节' },
  { date: '2026-01-31', name: '春节' },
  { date: '2026-02-01', name: '春节' },
  { date: '2026-02-02', name: '春节' },
  { date: '2026-02-03', name: '春节' },
]

const workdays: Array<{ date: string; name: string }> = [
  { date: '2026-01-04', name: '元旦调休' },
  { date: '2026-01-24', name: '春节调休' },
  { date: '2026-02-07', name: '春节调休' },
]

const holidayCache = new Map<string, { isHoliday: boolean; isWorkday: boolean; remark: string }>()

// 先设置节假日（会被调休覆盖）
holidays.forEach(h => {
  holidayCache.set(h.date, { isHoliday: true, isWorkday: false, remark: h.name })
})

// 再设置调休上班日（覆盖节假日）
workdays.forEach(w => {
  holidayCache.set(w.date, { isHoliday: false, isWorkday: true, remark: w.name })
})

console.log('节假日缓存大小:', holidayCache.size)
console.log('\n=== 调休日期检查 ===')
workdays.forEach(w => {
  const info = holidayCache.get(w.date)
  console.log(`${w.date}:`, info)
})

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

console.log('\n=== 工作日统计（2 月 3 日到 2 月 24 日，应该 10 个工作日） ===')
workdayCount = 0
for (let d = new Date('2026-02-04'); d <= new Date('2026-02-24'); d.setDate(d.getDate() + 1)) {
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
