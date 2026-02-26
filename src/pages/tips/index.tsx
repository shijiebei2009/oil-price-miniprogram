import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.css'

interface TipItem {
  icon: string
  title: string
  description: string
  tags: string[]
}

const TipsPage = () => {
  const tipsData: TipItem[] = [
    {
      icon: '⏰',
      title: '调价前加油',
      description: '在调价日当天10点之前加油，可以避免涨价带来的损失。通常油价调整会在工作日的24:00生效，提前安排好加油时间。',
      tags: ['必看', '省钱', '时效']
    },
    {
      icon: '📍',
      title: '对比加油站价格',
      description: '不同加油站的价格可能相差0.2-0.5元/升。建议使用加油APP对比附近加油站价格，选择最优惠的站点。',
      tags: ['对比', '实时', '省心']
    },
    {
      icon: '💳',
      title: '使用加油优惠卡',
      description: '办理加油站的会员卡或使用支付宝、微信的加油优惠券，通常可以享受每升0.1-0.3元的优惠。',
      tags: ['会员', '优惠', '积分']
    },
    {
      icon: '🌙',
      title: '避开早晚高峰加油',
      description: '早晚高峰期加油站排队时间长，部分站点会临时调价。建议在上午10点-下午4点之间加油，避开高峰。',
      tags: ['省时', '优惠', '从容']
    },
    {
      icon: '🔄',
      title: '混合加油策略',
      description: '根据调价方向决定加油时机。预计上涨时提前加满，预计下跌时等调价后再加，合理规划每次加油量。',
      tags: ['策略', '规划', '智能']
    },
    {
      icon: '🚗',
      title: '关注油价走势',
      description: '定期查看油价走势图，了解近期价格变化趋势。连续上涨时建议提前加满，连续下跌时可按需少量添加。',
      tags: ['趋势', '数据', '参考']
    },
    {
      icon: '🎯',
      title: '关注促销活动',
      description: '节假日或加油站周年庆时，经常会有促销活动。提前了解周边加油站的活动信息，抓住优惠时机。',
      tags: ['活动', '促销', '限时']
    },
    {
      icon: '📱',
      title: '使用智能提醒',
      description: '开启调价提醒功能，在调价前收到通知，及时安排加油计划。避免错过最佳加油时机。',
      tags: ['提醒', '便捷', '及时']
    }
  ]

  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set())

  const toggleTip = (index: number) => {
    setExpandedTips((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  useLoad(() => {
    console.log('加油建议页面加载')
  })

  return (
    <View className="w-full min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <View className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-6">
        <Text className="block text-2xl font-bold text-white mb-2">加油建议</Text>
        <Text className="block text-sm text-blue-100">省钱攻略，智慧加油</Text>
      </View>

      {/* 主要内容 */}
      <ScrollView className="h-full pb-20" scrollY>
        {/* 快捷提示卡片 */}
        <View className="px-4 py-4">
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <View className="flex flex-row items-center mb-3">
              <View className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <Text className="text-lg">💡</Text>
              </View>
              <Text className="block text-base font-semibold text-gray-900">
                核心建议
              </Text>
            </View>
            <Text className="block text-sm text-gray-600 leading-relaxed">
              每次加油可省 <Text className="text-red-500 font-bold">5-20元</Text>，一年可省
              <Text className="text-red-500 font-bold">1000-5000元</Text>
            </Text>
          </View>
        </View>

        {/* 建议列表 */}
        <View className="px-4 pb-4">
          <Text className="block text-base font-semibold mb-3 text-gray-900">
            省钱攻略
          </Text>

          {tipsData.map((tip, index) => {
            const isExpanded = expandedTips.has(index)

            return (
              <View
                key={index}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                onClick={() => toggleTip(index)}
              >
                <View className="flex flex-row items-start">
                  <View className="text-2xl mr-3">{tip.icon}</View>
                  <View className="flex-1">
                    <View className="flex flex-row items-center justify-between">
                      <Text className="block text-base font-semibold text-gray-900 mb-2">
                        {tip.title}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {isExpanded ? '收起' : '展开'}
                      </Text>
                    </View>

                    {/* 标签 */}
                    <View className="flex flex-row gap-2 mb-2">
                      {tip.tags.map((tag, tagIndex) => (
                        <View
                          key={tagIndex}
                          className="bg-blue-50 rounded-full px-2 py-1"
                        >
                          <Text className="text-xs text-blue-600">{tag}</Text>
                        </View>
                      ))}
                    </View>

                    {/* 描述 */}
                    <Text
                      className={`text-sm text-gray-600 leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {tip.description}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        {/* 免责声明 */}
        <View className="px-4 pb-6">
          <View className="bg-yellow-50 rounded-xl p-4">
            <Text className="block text-sm text-yellow-700 leading-relaxed">
              ⚠️ <Text className="font-semibold">温馨提示：</Text>
              以上建议仅供参考，实际油价以加油站公布为准。请根据实际情况合理安排加油计划。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TipsPage
