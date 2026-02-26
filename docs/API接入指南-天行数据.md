# 天行数据 API 接入指南

## 第一步：注册账号

1. 访问天行数据官网：https://www.tianapi.com/
2. 点击右上角"注册"
3. 使用手机号或邮箱注册
4. 完成手机验证

## 第二步：申请 API

1. 登录后，点击顶部"控制台"
2. 在"API接口"中搜索"油价"
3. 找到"全国油价查询"接口
4. 点击"申请接入"
5. 选择免费套餐（每分钟3次）

## 第三步：获取 API Key

1. 在控制台"我的接口"中
2. 找到"全国油价查询"
3. 复制您的 API Key（格式如：`a1b2c3d4e5f6g7h8i9j0`）

## 第四步：配置到项目

在项目根目录的 `.env` 文件中添加：

```bash
TIANAPI_KEY=你的API_Key
```

## API 接口说明

### 接口地址
```
http://api.tianapi.com/oilprice/index
```

### 请求参数

| 参数名 | 必填 | 类型 | 说明 |
|--------|------|------|------|
| key | 是 | string | API Key |
| city | 否 | string | 城市名称，不传则返回全国列表 |

### 请求示例

```bash
# 查询全国油价
curl "http://api.tianapi.com/oilprice/index?key=你的API_Key"

# 查询指定城市
curl "http://api.tianapi.com/oilprice/index?key=你的API_Key&city=北京"
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "result": {
    "updatetime": "2026-02-26",
    "city": "北京",
    "p92": 7.97,
    "p95": 8.48,
    "p98": 9.50,
    "p0": 7.59
  }
}
```

### 响应字段说明

| 字段 | 说明 |
|------|------|
| updatetime | 更新时间 |
| city | 城市名称 |
| p92 | 92号汽油价格 |
| p95 | 95号汽油价格 |
| p98 | 98号汽油价格 |
| p0 | 0号柴油价格 |

## 使用限制

- 免费版：每分钟3次调用
- 付费版：根据套餐提升频率

## 测试

配置完成后，运行以下命令测试：

```bash
curl "http://api.tianapi.com/oilprice/index?key=你的API_Key"
```

返回 code 200 表示成功！
