// 测试 1 月 25-26 日的工作日判断
const holidays = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-01-28', name: '春节' },
  { date: '2026-01-29', name: '春节' },
  { date: '2026-01-30', name: '春节' },
  { date: '2026-01-31', name: '春节' },
  { date: '2026-02-01', name: '春节' },
  { date: '2026-02-02', name: '春节' },
  { date: '2026-02-03', name: '春节' },
]

const workdays = [
  { date: '2026-01-04', name: '元旦调休' },
  { date: '2026-01-24', name: '春节调休' },
  { date: '2026-01-25', name: '春节调休' },
  { date: '2026-01-26', name: '春节调休' },
  { date: '2026-02-07', name: '春节调休' },
  { date: '2026-05-30', name: '端午节调休' },
  { date: '2026-09-27', name: '国庆调休' },
  { date: '2026-10-10', name: '国庆调休' }
]

const holidayCache = new Map<string, { isHoliday: boolean; isWorkday: boolean; remark: string }>()

// 先设置节假日
holidays.forEach(h => {
  holidayCache.set(h.date, { isHoliday: true, isWorkday: false, remark: h.name })
})

// 再设置调休上班日（覆盖节假日）
workdays.forEach(w => {
  holidayCache.set(w.date, { isHoliday: false, isWorkday: true, remark: w.name })
})

console.log('节假日缓存大小:', holidayCache.size)

// 检查 1 月 25-26 日
console.log('\n=== 检查 1 月 25-26 日 ===')
['2026-01-24', '2026-01-25', '2026-01-26', '2026-01-27'].forEach(dateStr => {
  const info = holidayCache.get(dateStr)
  if (info) {
    const { isHoliday, isWorkday, remark } = info
    console.log(`${dateStr}: isHoliday=${isHoliday}, isWorkday=${isWorkday}, remark=${remark}`)
  } else {
    console.log(`${dateStr}: 未标记`)
  }
})

// 计算 1 月 20 日到 2 月 3 日的工作日
console.log('\n=== 从 1 月 20 日到 2 月 3 日的工作日 ===')
let count = 0
for (let d = new Date('2026-01-21'); d <= new Date('2026-02-03'); d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0]
  const info = holidayCache.get(dateStr)
  const isWorkday = info ? (info.isWorkday ? true : !info.isHoliday) : true
  const weekday = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]

  if (isWorkday) {
    count++
    console.log(`  ${dateStr} (${weekday}): 工作日 #${count}`)
  } else {
    console.log(`  ${dateStr} (${weekday}): 休息日`)
  }
}

console.log(`\n总工作日数: ${count}`)
