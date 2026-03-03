// 查询 2026 年 1 月 24-26 日的调休情况
import axios from 'axios'

const TIANAPI_API_KEY = process.env.TIANAPI_API_KEY || ''
const JUHE_API_KEY = process.env.JUHE_API_KEY || ''

async function queryTianapi(date: string) {
  try {
    const url = `https://apis.tianapi.com/jiejiari/index?key=${TIANAPI_API_KEY}&date=${date}`
    console.log(`查询天聚数行 API: ${url}`)
    const response = await axios.get(url)
    console.log(`${date} 天聚数行 API 返回:`, JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error: any) {
    console.error(`${date} 天聚数行 API 查询失败:`, error.message)
    return null
  }
}

async function queryJuhe(date: string) {
  try {
    const url = `http://apis.juhe.cn/fapig/calendar/day?date=${date}&key=${JUHE_API_KEY}`
    console.log(`查询聚合数据 API: ${url}`)
    const response = await axios.get(url)
    console.log(`${date} 聚合数据 API 返回:`, JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error: any) {
    console.error(`${date} 聚合数据 API 查询失败:`, error.message)
    return null
  }
}

async function main() {
  const dates = [
    '2026-01-24', // 周六
    '2026-01-25', // 周日
    '2026-01-26', // 周一
    '2026-02-03', // 周二（春节最后一天）
    '2026-02-04', // 周三
    '2026-02-06', // 周五
    '2026-02-07', // 周六
    '2026-02-08', // 周日
  ]

  for (const date of dates) {
    console.log(`\n===== ${date} =====`)
    await queryTianapi(date)
    await queryJuhe(date)
  }
}

main().catch(console.error)
