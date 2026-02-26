# 聚合数据 API 接入指南

## 第一步：注册账号

1. 访问聚合数据官网：https://www.juhe.cn/
2. 点击右上角"注册"
3. 使用手机号注册
4. 完成验证

## 第二步：申请 API

1. 登录后，进入"数据中心"
2. 搜索"油价"或"汽柴油"
3. 找到"全国汽油柴油实时价格查询"
4. 点击"申请"
5. 选择免费套餐（100次/天）

## 第三步：获取 API Key

1. 在"我的API"中
2. 找到"全国汽油柴油实时价格查询"
3. 复制 Request Key

## 第四步：配置到项目

在项目根目录的 `.env` 文件中添加：

```bash
JUHE_API_KEY=你的API_Key
```

## API 接口说明

### 接口地址
```
http://web.juhe.cn:8080/finance/oil/goldprice
```

### 请求参数

| 参数名 | 必填 | 类型 | 说明 |
|--------|------|------|------|
| key | 是 | string | API Key |
| prov | 否 | string | 省份名称，不传则返回全国 |

### 请求示例

```bash
curl "http://web.juhe.cn:8080/finance/oil/goldprice?key=你的API_Key"
```

### 响应示例

```json
{
  "error_code": 0,
  "reason": "success",
  "result": [
    {
      "prov": "北京",
      "p92": "7.97",
      "p95": "8.48",
      "p98": "9.50",
      "p0": "7.59",
      "updatetime": "2026-02-26"
    }
  ]
}
```

## 使用限制

- 免费版：100次/天
- 付费版：购买次数包

## 测试

配置完成后，运行以下命令测试：

```bash
curl "http://web.juhe.cn:8080/finance/oil/goldprice?key=你的API_Key"
```

返回 error_code 0 表示成功！
