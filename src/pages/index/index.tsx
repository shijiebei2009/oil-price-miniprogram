import { View, Text } from '@tarojs/components'
import Taro, { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import CityPicker from '@/components/CityPicker'
import './index.css'

// 油价数据类型
interface OilPrice {
  name: string
  price: number
  previousPrice: number
  change: number
}

interface PriceData {
  currentPrices: OilPrice[]
  nextAdjustment: {
    date: string
    direction: 'up' | 'down' | 'stable'
    expectedChange: number
    daysRemaining: number
    trend?: string
  }
  updateTime: string
  cityName?: string
  provinceName?: string
}

interface CityItem {
  name: string
  region: string
  level: number
  gas92: number
  gas95: number
  gas98: number
  diesel0: number
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [currentCity, setCurrentCity] = useState('上海市')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [cityList, setCityList] = useState<CityItem[]>([])

  // 城市到省份的映射表（简化版，包含主要城市）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cityToProvinceMap: Record<string, string> = {
    // 直辖市
    '北京': '北京市',
    '上海': '上海市',
    '天津': '天津市',
    '重庆': '重庆市',
    // 河北省
    '石家庄': '河北省',
    '唐山': '河北省',
    '秦皇岛': '河北省',
    '邯郸': '河北省',
    '邢台': '河北省',
    '保定': '河北省',
    '张家口': '河北省',
    '承德': '河北省',
    '沧州': '河北省',
    '廊坊': '河北省',
    '衡水': '河北省',
    // 山西省
    '太原': '山西省',
    '大同': '山西省',
    '阳泉': '山西省',
    '长治': '山西省',
    '晋城': '山西省',
    '朔州': '山西省',
    '晋中': '山西省',
    '运城': '山西省',
    '忻州': '山西省',
    '临汾': '山西省',
    '吕梁': '山西省',
    // 内蒙古自治区
    '呼和浩特': '内蒙古自治区',
    '包头': '内蒙古自治区',
    '乌海': '内蒙古自治区',
    '赤峰': '内蒙古自治区',
    '通辽': '内蒙古自治区',
    '鄂尔多斯': '内蒙古自治区',
    '呼伦贝尔': '内蒙古自治区',
    '巴彦淖尔': '内蒙古自治区',
    '乌兰察布': '内蒙古自治区',
    '兴安盟': '内蒙古自治区',
    '锡林郭勒': '内蒙古自治区',
    '阿拉善盟': '内蒙古自治区',
    // 辽宁省
    '沈阳': '辽宁省',
    '大连': '辽宁省',
    '鞍山': '辽宁省',
    '抚顺': '辽宁省',
    '本溪': '辽宁省',
    '丹东': '辽宁省',
    '锦州': '辽宁省',
    '营口': '辽宁省',
    '阜新': '辽宁省',
    '辽阳': '辽宁省',
    '盘锦': '辽宁省',
    '铁岭': '辽宁省',
    '朝阳': '辽宁省',
    '葫芦岛': '辽宁省',
    // 吉林省
    '长春': '吉林省',
    '吉林': '吉林省',
    '四平': '吉林省',
    '辽源': '吉林省',
    '通化': '吉林省',
    '白山': '吉林省',
    '松原': '吉林省',
    '白城': '吉林省',
    '延边': '吉林省',
    // 黑龙江省
    '哈尔滨': '黑龙江省',
    '齐齐哈尔': '黑龙江省',
    '鸡西': '黑龙江省',
    '鹤岗': '黑龙江省',
    '双鸭山': '黑龙江省',
    '大庆': '黑龙江省',
    '伊春': '黑龙江省',
    '佳木斯': '黑龙江省',
    '七台河': '黑龙江省',
    '牡丹江': '黑龙江省',
    '黑河': '黑龙江省',
    '绥化': '黑龙江省',
    '大兴安岭': '黑龙江省',
    // 江苏省
    '南京': '江苏省',
    '无锡': '江苏省',
    '徐州': '江苏省',
    '常州': '江苏省',
    '苏州': '江苏省',
    '南通': '江苏省',
    '连云港': '江苏省',
    '淮安': '江苏省',
    '盐城': '江苏省',
    '扬州': '江苏省',
    '镇江': '江苏省',
    '泰州': '江苏省',
    '宿迁': '江苏省',
    // 浙江省
    '杭州': '浙江省',
    '宁波': '浙江省',
    '温州': '浙江省',
    '嘉兴': '浙江省',
    '湖州': '浙江省',
    '绍兴': '浙江省',
    '金华': '浙江省',
    '衢州': '浙江省',
    '舟山': '浙江省',
    '台州': '浙江省',
    '丽水': '浙江省',
    // 安徽省
    '合肥': '安徽省',
    '芜湖': '安徽省',
    '蚌埠': '安徽省',
    '淮南': '安徽省',
    '马鞍山': '安徽省',
    '淮北': '安徽省',
    '铜陵': '安徽省',
    '安庆': '安徽省',
    '黄山': '安徽省',
    '滁州': '安徽省',
    '阜阳': '安徽省',
    '宿州': '安徽省',
    '六安': '安徽省',
    '亳州': '安徽省',
    '池州': '安徽省',
    '宣城': '安徽省',
    // 福建省
    '福州': '福建省',
    '厦门': '福建省',
    '莆田': '福建省',
    '三明': '福建省',
    '泉州': '福建省',
    '漳州': '福建省',
    '南平': '福建省',
    '龙岩': '福建省',
    '宁德': '福建省',
    // 江西省
    '南昌': '江西省',
    '景德镇': '江西省',
    '萍乡': '江西省',
    '九江': '江西省',
    '新余': '江西省',
    '鹰潭': '江西省',
    '赣州': '江西省',
    '吉安': '江西省',
    '宜春': '江西省',
    '抚州': '江西省',
    '上饶': '江西省',
    // 山东省
    '济南': '山东省',
    '青岛': '山东省',
    '淄博': '山东省',
    '枣庄': '山东省',
    '东营': '山东省',
    '烟台': '山东省',
    '潍坊': '山东省',
    '济宁': '山东省',
    '泰安': '山东省',
    '威海': '山东省',
    '日照': '山东省',
    '临沂': '山东省',
    '德州': '山东省',
    '聊城': '山东省',
    '滨州': '山东省',
    '菏泽': '山东省',
    // 河南省
    '郑州': '河南省',
    '开封': '河南省',
    '洛阳': '河南省',
    '平顶山': '河南省',
    '安阳': '河南省',
    '鹤壁': '河南省',
    '新乡': '河南省',
    '焦作': '河南省',
    '濮阳': '河南省',
    '许昌': '河南省',
    '漯河': '河南省',
    '三门峡': '河南省',
    '南阳': '河南省',
    '商丘': '河南省',
    '信阳': '河南省',
    '周口': '河南省',
    '驻马店': '河南省',
    '济源': '河南省',
    // 湖北省
    '武汉': '湖北省',
    '黄石': '湖北省',
    '十堰': '湖北省',
    '宜昌': '湖北省',
    '襄阳': '湖北省',
    '鄂州': '湖北省',
    '荆门': '湖北省',
    '孝感': '湖北省',
    '荆州': '湖北省',
    '黄冈': '湖北省',
    '咸宁': '湖北省',
    '随州': '湖北省',
    '恩施': '湖北省',
    '仙桃': '湖北省',
    '潜江': '湖北省',
    '天门': '湖北省',
    '神农架': '湖北省',
    // 湖南省
    '长沙': '湖南省',
    '株洲': '湖南省',
    '湘潭': '湖南省',
    '衡阳': '湖南省',
    '邵阳': '湖南省',
    '岳阳': '湖南省',
    '常德': '湖南省',
    '张家界': '湖南省',
    '益阳': '湖南省',
    '郴州': '湖南省',
    '永州': '湖南省',
    '怀化': '湖南省',
    '娄底': '湖南省',
    '湘西': '湖南省',
    // 广东省
    '广州': '广东省',
    '韶关': '广东省',
    '深圳': '广东省',
    '珠海': '广东省',
    '汕头': '广东省',
    '佛山': '广东省',
    '江门': '广东省',
    '湛江': '广东省',
    '茂名': '广东省',
    '肇庆': '广东省',
    '惠州': '广东省',
    '梅州': '广东省',
    '汕尾': '广东省',
    '河源': '广东省',
    '阳江': '广东省',
    '清远': '广东省',
    '东莞': '广东省',
    '中山': '广东省',
    '潮州': '广东省',
    '揭阳': '广东省',
    '云浮': '广东省',
    // 广西壮族自治区
    '南宁': '广西壮族自治区',
    '柳州': '广西壮族自治区',
    '桂林': '广西壮族自治区',
    '梧州': '广西壮族自治区',
    '北海': '广西壮族自治区',
    '防城港': '广西壮族自治区',
    '钦州': '广西壮族自治区',
    '贵港': '广西壮族自治区',
    '玉林': '广西壮族自治区',
    '百色': '广西壮族自治区',
    '贺州': '广西壮族自治区',
    '河池': '广西壮族自治区',
    '来宾': '广西壮族自治区',
    '崇左': '广西壮族自治区',
    // 海南省
    '海口': '海南省',
    '三亚': '海南省',
    '三沙': '海南省',
    '儋州': '海南省',
    // 四川省
    '成都': '四川省',
    '自贡': '四川省',
    '攀枝花': '四川省',
    '泸州': '四川省',
    '德阳': '四川省',
    '绵阳': '四川省',
    '广元': '四川省',
    '遂宁': '四川省',
    '内江': '四川省',
    '乐山': '四川省',
    '南充': '四川省',
    '眉山': '四川省',
    '宜宾': '四川省',
    '广安': '四川省',
    '达州': '四川省',
    '雅安': '四川省',
    '巴中': '四川省',
    '资阳': '四川省',
    '阿坝': '四川省',
    '甘孜': '四川省',
    '凉山': '四川省',
    // 贵州省
    '贵阳': '贵州省',
    '六盘水': '贵州省',
    '遵义': '贵州省',
    '安顺': '贵州省',
    '毕节': '贵州省',
    '铜仁': '贵州省',
    '黔西南': '贵州省',
    '黔东南': '贵州省',
    '黔南': '贵州省',
    // 云南省
    '昆明': '云南省',
    '曲靖': '云南省',
    '玉溪': '云南省',
    '保山': '云南省',
    '昭通': '云南省',
    '丽江': '云南省',
    '普洱': '云南省',
    '临沧': '云南省',
    '楚雄': '云南省',
    '红河': '云南省',
    '文山': '云南省',
    '西双版纳': '云南省',
    '大理': '云南省',
    '德宏': '云南省',
    '怒江': '云南省',
    '迪庆': '云南省',
    // 西藏自治区
    '拉萨': '西藏自治区',
    '日喀则': '西藏自治区',
    '昌都': '西藏自治区',
    '林芝': '西藏自治区',
    '山南': '西藏自治区',
    '那曲': '西藏自治区',
    '阿里': '西藏自治区',
    // 陕西省
    '西安': '陕西省',
    '铜川': '陕西省',
    '宝鸡': '陕西省',
    '咸阳': '陕西省',
    '渭南': '陕西省',
    '延安': '陕西省',
    '汉中': '陕西省',
    '榆林': '陕西省',
    '安康': '陕西省',
    '商洛': '陕西省',
    // 甘肃省
    '兰州': '甘肃省',
    '嘉峪关': '甘肃省',
    '金昌': '甘肃省',
    '白银': '甘肃省',
    '天水': '甘肃省',
    '武威': '甘肃省',
    '张掖': '甘肃省',
    '平凉': '甘肃省',
    '酒泉': '甘肃省',
    '庆阳': '甘肃省',
    '定西': '甘肃省',
    '陇南': '甘肃省',
    '临夏': '甘肃省',
    '甘南': '甘肃省',
    // 青海省
    '西宁': '青海省',
    '海东': '青海省',
    '海北': '青海省',
    '黄南': '青海省',
    '海南': '青海省',
    '果洛': '青海省',
    '玉树': '青海省',
    '海西': '青海省',
    // 宁夏回族自治区
    '银川': '宁夏回族自治区',
    '石嘴山': '宁夏回族自治区',
    '吴忠': '宁夏回族自治区',
    '固原': '宁夏回族自治区',
    '中卫': '宁夏回族自治区',
    // 新疆维吾尔自治区
    '乌鲁木齐': '新疆维吾尔自治区',
    '克拉玛依': '新疆维吾尔自治区',
    '吐鲁番': '新疆维吾尔自治区',
    '哈密': '新疆维吾尔自治区',
    '昌吉': '新疆维吾尔自治区',
    '博尔塔拉': '新疆维吾尔自治区',
    '巴音郭楞': '新疆维吾尔自治区',
    '阿克苏': '新疆维吾尔自治区',
    '克孜勒苏': '新疆维吾尔自治区',
    '喀什': '新疆维吾尔自治区',
    '和田': '新疆维吾尔自治区',
    '伊犁': '新疆维吾尔自治区',
    '塔城': '新疆维吾尔自治区',
    '阿勒泰': '新疆维吾尔自治区',
  }

  // 获取用户位置并转换为所在省份
  const getCurrentProvince = async (): Promise<string> => {
    try {
      console.log('开始获取用户位置...')
      const location = await Taro.getLocation({
        type: 'wgs84'
      })
      console.log('获取到位置:', location)

      // 注意：这里需要使用腾讯地图的逆地理编码API来获取城市名称
      // 由于没有配置API密钥，这里使用简化的方式
      // 实际项目中需要配置腾讯地图API密钥并调用逆地理编码接口
      console.log('需要配置腾讯地图API密钥来获取城市名称')

      // 如果没有配置API密钥，返回默认省份
      return '上海市'
    } catch (error) {
      console.error('获取位置失败:', error)
      return '上海市'
    }
  }

  // 加载油价数据
  const loadPriceData = async (province?: string) => {
    try {
      setLoading(true)
      console.log('开始获取油价数据，省份:', province)

      const res = await Network.request({
        url: '/api/oil-price/province/current',
        method: 'GET',
        data: province ? { province } : {}
      })

      console.log('油价数据响应:', res.data)

      if (res.data?.code === 200 && res.data?.data) {
        setPriceData(res.data.data)
        console.log('油价数据解析成功:', res.data.data)
      } else {
        console.error('油价数据格式错误:', res.data)
      }
    } catch (error) {
      console.error('获取油价数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载城市列表
  const loadCityList = async () => {
    try {
      const res = await Network.request({
        url: '/api/oil-price/provinces',
        method: 'GET'
      })

      if (res.data?.code === 200 && res.data?.data) {
        setCityList(res.data.data)
      }
    } catch (error) {
      console.error('获取城市列表失败:', error)
    }
  }

  // 打开城市选择器
  const handleCityPickerOpen = () => {
    setShowCityPicker(true)
    if (cityList.length === 0) {
      loadCityList()
    }
  }

  // 选择城市
  const handleCitySelect = (cityName: string) => {
    setCurrentCity(cityName)
    loadPriceData(cityName)
  }

  useLoad(async () => {
    console.log('页面加载')

    // 先加载省份列表
    loadCityList()

    // 尝试获取用户位置
    const province = await getCurrentProvince()
    if (province) {
      setCurrentCity(province)
      console.log('自动定位到省份:', province)
    }
  })

  useDidShow(() => {
    console.log('页面显示')
    loadPriceData(currentCity)
  })

  // 获取调价方向的显示
  const getAdjustmentDirection = (direction: string) => {
    switch (direction) {
      case 'up':
        return { text: '预计上涨', color: 'text-red-500', bg: 'bg-red-50' }
      case 'down':
        return { text: '预计下降', color: 'text-green-500', bg: 'bg-green-50' }
      case 'stable':
        return { text: '预计稳定', color: 'text-gray-500', bg: 'bg-gray-50' }
      default:
        return { text: '未知', color: 'text-gray-500', bg: 'bg-gray-50' }
    }
  }

  // 获取涨跌幅显示
  const getChangeDisplay = (change: number) => {
    if (change > 0) {
      return `↑ ${change.toFixed(2)}`
    } else if (change < 0) {
      return `↓ ${Math.abs(change).toFixed(2)}`
    }
    return '0.00'
  }

  // 获取涨跌幅颜色
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 导航到历史价格页面
  const navigateToHistory = () => {
    navigateTo({
      url: '/pages/history/index'
    })
  }

  // 导航到城市对比页面
  const navigateToCityCompare = () => {
    navigateTo({
      url: '/pages/city/index'
    })
  }

  // 导航到通知设置页面
  const navigateToNotice = () => {
    navigateTo({
      url: '/pages/notice/index'
    })
  }

  // 导航到加油建议页面
  const navigateToTips = () => {
    navigateTo({
      url: '/pages/tips/index'
    })
  }

  return (
    <View className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 顶部标题栏 - 渐变背景 */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="block text-lg font-bold text-white">油价查询</Text>
            <Text className="block text-xs text-blue-100 mt-1">
              {loading ? '加载中...' : `更新：${priceData?.updateTime || '暂无数据'}`}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              paddingLeft: '16px',
              paddingRight: '8px',
              paddingTop: '8px',
              paddingBottom: '8px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={handleCityPickerOpen}
          >
            <Text className="block text-sm font-semibold text-white">{currentCity}</Text>
            <View
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text
                style={{
                  fontSize: '10px',
                  color: 'white',
                  lineHeight: 1,
                  marginTop: '2px'
                }}
              >
                ▼
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 主要内容区域 */}
      <View className="p-3">
        {/* 加载状态 */}
        {loading && (
          <View className="flex items-center justify-center py-12">
            <Text className="text-sm text-gray-500">加载中...</Text>
          </View>
        )}

        {/* 数据展示 */}
        {!loading && priceData && (
          <View className="flex flex-col gap-3">
            {/* 当前油价卡片 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="block text-lg font-semibold text-gray-900">当前油价</Text>
                {priceData.provinceName && priceData.cityName && (
                  <Text className="block text-xs text-gray-500">
                    {priceData.provinceName} · {priceData.cityName}
                  </Text>
                )}
              </View>

              {priceData.currentPrices.map((item, index) => (
                <View
                  key={index}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 mb-2 flex flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-gray-900 mb-1">
                      {item.name}
                    </Text>
                    <Text className="block text-xs text-gray-500">元/升</Text>
                  </View>
                  <View className="text-right">
                    <Text className="block text-3xl font-bold text-gray-900">
                      {item.price.toFixed(2)}
                    </Text>
                    <Text className={`block text-sm ${getChangeColor(item.change)}`}>
                      {getChangeDisplay(item.change)}
                    </Text>
                    {item.previousPrice !== undefined && (
                      <Text className="block text-xs text-gray-400 mt-1">
                        上次：{item.previousPrice.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 调价预警卡片 */}
            {priceData.nextAdjustment && (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="block text-lg font-semibold text-gray-900">下次调价</Text>
                  <View className="flex items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500"></View>
                    <Text className="text-xs text-gray-500">
                      距离调价还有 {priceData.nextAdjustment.daysRemaining} 天
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between bg-gray-50 rounded-xl p-4 mb-3">
                  <View>
                    <Text className="block text-xs text-gray-500 mb-1">预计日期</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {priceData.nextAdjustment.date}
                    </Text>
                  </View>
                  <View
                    className={`px-4 py-2 rounded-full ${getAdjustmentDirection(priceData.nextAdjustment.direction).bg}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${getAdjustmentDirection(priceData.nextAdjustment.direction).color}`}
                    >
                      {getAdjustmentDirection(priceData.nextAdjustment.direction).text}
                    </Text>
                  </View>
                </View>

                {/* 趋势说明 */}
                {priceData.nextAdjustment.trend && (
                  <View className="bg-blue-50 rounded-lg px-3 py-2">
                    <Text className="block text-xs text-blue-600">
                      📊 {priceData.nextAdjustment.trend}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 快捷功能入口 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="grid grid-cols-2 gap-3">
                <View
                  className="bg-blue-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToHistory}
                >
                  <Text className="text-2xl mb-2">📈</Text>
                  <Text className="text-sm font-semibold text-gray-900">历史价格</Text>
                  <Text className="text-xs text-gray-500 mt-1">查看走势</Text>
                </View>
                <View
                  className="bg-green-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToNotice}
                >
                  <Text className="text-2xl mb-2">🔔</Text>
                  <Text className="text-sm font-semibold text-gray-900">调价提醒</Text>
                  <Text className="text-xs text-gray-500 mt-1">开启通知</Text>
                </View>
                <View
                  className="bg-purple-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToCityCompare}
                >
                  <Text className="text-2xl mb-2">🌍</Text>
                  <Text className="text-sm font-semibold text-gray-900">多城市对比</Text>
                  <Text className="text-xs text-gray-500 mt-1">查看差异</Text>
                </View>
                <View
                  className="bg-orange-50 rounded-xl p-4 flex flex-col items-center"
                  onClick={navigateToTips}
                >
                  <Text className="text-2xl mb-2">💰</Text>
                  <Text className="text-sm font-semibold text-gray-900">省钱攻略</Text>
                  <Text className="text-xs text-gray-500 mt-1">加油建议</Text>
                </View>
              </View>
            </View>

            {/* 提示信息 */}
            <View className="bg-blue-50 rounded-xl p-4">
              <Text className="block text-xs text-blue-600 text-center">
                提示：油价每10个工作日调整一次，具体以发改委公布为准
              </Text>
            </View>
          </View>
        )}

        {/* 空状态 */}
        {!loading && !priceData && (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="block text-3xl mb-3">📭</Text>
            <Text className="block text-base text-gray-500 text-center">
              暂无数据
            </Text>
            <Text className="block text-sm text-gray-400 text-center mt-2">
              请稍后再试
            </Text>
          </View>
        )}
      </View>

      {/* 城市选择器 */}
      <CityPicker
        visible={showCityPicker}
        currentCity={currentCity}
        cities={cityList}
        onSelect={handleCitySelect}
        onClose={() => setShowCityPicker(false)}
      />
    </View>
  )
}

export default IndexPage
