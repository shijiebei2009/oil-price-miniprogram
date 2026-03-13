# Coze Mini Program

这是一个基于 [Taro 4](https://docs.taro.zone/docs/) + [Nest.js](https://nestjs.com/) 的前后端分离项目，由扣子编程 CLI 创建。

## 技术栈

- **整体框架**: Taro 4.1.9
- **语言**: TypeScript 5.4.5
- **渲染**: React 18.0.0
- **样式**: TailwindCSS 4.1.18
- **Tailwind 适配层**: weapp-tailwindcss 4.9.2
- **状态管理**: Zustand 5.0.9
- **图标库**: lucide-react 0.511.0
- **工程化**: Vite 4.2.0
- **包管理**: pnpm
- **运行时**: Node.js >= 18
- **服务端**: NestJS 10.4.15
- **数据库 ORM**: Drizzle ORM 0.45.1
- **类型校验**: Zod 4.3.5

## 项目结构

```
├── .cozeproj/                # Coze 平台配置
│   └── scripts/              # 构建和运行脚本
├── config/                   # Taro 构建配置
│   ├── index.ts              # 主配置文件
│   ├── dev.ts                # 开发环境配置
│   └── prod.ts               # 生产环境配置
├── server/                   # NestJS 后端服务
│   └── src/  
│       ├── main.ts           # 服务入口
│       ├── app.module.ts     # 根模块
│       ├── app.controller.ts # 应用控制器
│       └── app.service.ts    # 应用服务
├── src/                      # 前端源码
│   ├── pages/                # 页面组件
│   ├── utils/                # 工具函数
│   ├── network.ts            # 网络请求封装
│   ├── app.ts                # 应用入口
│   ├── app.config.ts         # 应用配置
│   └── app.css               # 全局样式
├── types/                    # TypeScript 类型定义
├── key/                      # 小程序密钥（CI 上传用）
├── .env.local                # 环境变量
└── project.config.json       # 微信小程序项目配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 本地开发

同时启动 H5 前端和 NestJS 后端：

```bash
pnpm dev
```

- 前端地址：http://localhost:5000
- 后端地址：http://localhost:3000

单独启动：

```bash
pnpm dev:web      # 仅 H5 前端
pnpm dev:weapp    # 仅微信小程序
pnpm dev:server   # 仅后端服务
```

### 构建

```bash
pnpm build        # 构建所有（H5 + 小程序 + 后端）
pnpm build:web    # 仅构建 H5，输出到 dist-web
pnpm build:weapp  # 仅构建微信小程序，输出到 dist
pnpm build:server # 仅构建后端
```

### 预览小程序

```bash
pnpm preview:weapp # 构建并生成预览小程序二维码
```

## 前端核心开发规范

### 新建页面流程

1. 在 \`src/pages/\` 下创建页面目录
2. 创建 \`index.tsx\`（页面组件）
3. 创建 \`index.config.ts\`（页面配置）
4. 创建 \`index.css\`（页面样式，可选）
5. 在 \`src/app.config.ts\` 的 \`pages\` 数组中注册页面路径

或使用 Taro 脚手架命令：

```bash
pnpm new      # 交互式创建页面/组件
```

### 常用 Taro 组件

引入方式

```typescript
import { Text } from '@tarojs/components'
```
- 基础组件
  - Text
  - Icon
  - Progress
  - RichText
- 表单组件
  - Button
  - Checkbox
  - CheckboxGroup
  - Editor
  - Form
  - Input
  - Label
  - Picker
  - PickerView
  - PickerViewColumn
  - Radio
  - RadioGroup
  - Slider
  - Switch
  - Textarea
- 导航组件
  - FunctionalPageNavigator
  - NavigationBar
  - Navigator
  - TabItem
  - Tabs
- 媒体组件
  - Camera
  - Image
  - Video
- 视图容器
  - ScrollView
  - Swiper
  - SwiperItem
  - View

### 路径别名

项目配置了 `@/*` 路径别名指向 `src/*`：

```typescript
import { SomeComponent } from '@/components/SomeComponent'
import { useUserStore } from '@/stores/user'
```

### 代码模板

#### 页面组件 (TypeScript + React)

```tsx
// src/pages/example/index.tsx
import { View, Text } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import './index.css'

const ExamplePage: FC = () => {
  useLoad(() => {
    console.log('Page loaded.')
  })

  useDidShow(() => {
    console.log('Page showed.')
  })

  return (
    <View className="flex flex-col items-center p-4">
      <Text className="text-lg font-bold">Hello Taro!</Text>
    </View>
  )
}

export default ExamplePage
```

#### 页面配置

```typescript
// src/pages/example/index.config.ts
import { definePageConfig } from '@tarojs/taro'

export default definePageConfig({
  navigationBarTitleText: '示例页面',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark',
})
```

#### 应用配置

```typescript
// src/app.config.ts
import { defineAppConfig } from '@tarojs/taro'

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/example/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'App',
    navigationBarTextStyle: 'black',
  },
  // TabBar 配置 (可选)
  // tabBar: {
  //   list: [
  //     { pagePath: 'pages/index/index', text: '首页' },
  //   ],
  // },
})
```

### 发送请求

**IMPORTANT: 禁止直接使用 Taro.request、Taro.uploadFile、Taro.downloadFile，使用 Network.request、Network.uploadFile、Network.downloadFile 替代。**

Network 是对 Taro.request、Taro.uploadFile、Taro.downloadFile 的封装，自动添加项目域名前缀，参数与 Taro 一致。

✅ 正确使用方式

```typescript
import { Network } from '@/network'

// GET 请求
const data = await Network.request({ 
  url: '/api/hello' 
})

// POST 请求
const result = await Network.request({
  url: '/api/user/login',
  method: 'POST',
  data: { username, password }
})

// 文件上传
await Network.uploadFile({
  url: '/api/upload',
  filePath: tempFilePath,
  name: 'file'
})

// 文件下载
await Network.downloadFile({
  url: '/api/download/file.pdf'
})
```

❌ 错误用法

```typescript
import Taro from '@tarojs/taro'

// ❌ 会导致自动域名拼接无法生效，除非是特殊指定域名
const data = await Network.request({ 
  url: 'http://localhost/api/hello' 
})

// ❌ 不要直接使用 Taro.request
await Taro.request({ url: '/api/hello' })

// ❌ 不要直接使用 Taro.uploadFile
await Taro.uploadFile({ url: '/api/upload', filePath, name: 'file' })
```

### Zustand 状态管理

```typescript
// src/stores/user.ts
import { create } from 'zustand'

interface UserState {
  userInfo: UserInfo | null
  token: string
  setUserInfo: (info: UserInfo) => void
  setToken: (token: string) => void
  logout: () => void
}

interface UserInfo {
  id: string
  name: string
  avatar: string
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: '',
  setUserInfo: (info) => set({ userInfo: info }),
  setToken: (token) => set({ token }),
  logout: () => set({ userInfo: null, token: '' }),
}))
```

### Taro 生命周期 Hooks

```typescript
import {
  useLoad,             // 页面加载 (onLoad)
  useReady,            // 页面初次渲染完成 (onReady)
  useDidShow,          // 页面显示 (onShow)
  useDidHide,          // 页面隐藏 (onHide)
  usePullDownRefresh,  // 下拉刷新 (onPullDownRefresh)
  useReachBottom,      // 触底加载 (onReachBottom)
  useShareAppMessage,  // 分享 (onShareAppMessage)
  useRouter,           // 获取路由参数
} from '@tarojs/taro'
```

### 路由导航

```typescript
import Taro from '@tarojs/taro'

// 保留当前页面，跳转到新页面
Taro.navigateTo({ url: '/pages/detail/index?id=1' })

// 关闭当前页面，跳转到新页面
Taro.redirectTo({ url: '/pages/detail/index' })

// 跳转到 tabBar 页面
Taro.switchTab({ url: '/pages/index/index' })

// 返回上一页
Taro.navigateBack({ delta: 1 })

// 获取路由参数
const router = useRouter()
const { id } = router.params
```

### 图标使用 (lucide-react)

项目集成了 [lucide-react](https://lucide.dev/) 图标库，提供丰富的 SVG 图标：

```tsx
import { View } from '@tarojs/components'
import { Home, Settings, User, Search, Heart, Star } from 'lucide-react'

const IconDemo = () => {
  return (
    <View className="flex gap-4">
      <Home size={24} color="#333" />
      <Settings size={24} className="text-blue-500" />
      <User size={20} strokeWidth={1.5} />
      <Search size={24} />
      <Heart size={24} fill="red" color="red" />
      <Star size={24} className="text-yellow-500" />
    </View>
  )
}
```

常用属性：
- `size` - 图标大小（默认 24）
- `color` - 图标颜色
- `strokeWidth` - 线条粗细（默认 2）
- `className` - 支持 Tailwind 类名

更多图标请访问：https://lucide.dev/icons

### Tailwind CSS 样式开发

IMPORTANT：必须使用 tailwindcss 实现样式，只有在必要情况下才能 fallback 到 css / less

> 项目已集成 Tailwind CSS 4.x + weapp-tailwindcss，支持跨端原子化样式：

```tsx
<View className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <Text className="text-2xl font-bold text-blue-600 mb-4">标题</Text>
  <View className="w-full px-4">
    <Button className="w-full bg-blue-500 text-white rounded-lg py-3">
      按钮
    </Button>
  </View>
</View>
```

### 性能优化

#### 图片懒加载

```tsx
import { Image } from '@tarojs/components'

<Image src={imageUrl} lazyLoad mode="aspectFill" />
```

#### 虚拟列表

```tsx
import { VirtualList } from '@tarojs/components'

<VirtualList
  height={500}
  itemData={list}
  itemCount={list.length}
  itemSize={100}
  renderItem={({ index, style, data }) => (
    <View style={style}>{data[index].name}</View>
  )}
/>
```

#### 分包加载

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: ['pages/index/index'],
  subPackages: [
    {
      root: 'packageA',
      pages: ['pages/detail/index'],
    },
  ],
})
```

### 小程序限制

| 限制项   | 说明                                     |
| -------- | ---------------------------------------- |
| 主包体积 | ≤ 2MB                                    |
| 总包体积 | ≤ 20MB                                   |
| 域名配置 | 生产环境需在小程序后台配置合法域名       |
| 本地开发 | 需在微信开发者工具开启「不校验合法域名」 |

### 权限配置

```typescript
// src/app.config.ts
export default defineAppConfig({
  // ...其他配置
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  },
  requiredPrivateInfos: ['getLocation', 'chooseAddress']
})
```

### 位置服务

```typescript
// 需先在 app.config.ts 中配置 permission
async function getLocation(): Promise<Taro.getLocation.SuccessCallbackResult> {
  return await Taro.getLocation({ type: 'gcj02' })
}
```

## 后端核心开发规范

本项目后端基于 NestJS + TypeScript 构建，提供高效、可扩展的服务端能力。

### 项目结构

```sh
.
├── server/                   # NestJS 后端服务
│   └── src/
│       ├── main.ts           # 服务入口
│       ├── app.module.ts     # 根模块
│       ├── app.controller.ts # 根控制器
│       └── app.service.ts    # 根服务
```

### 开发命令

```sh
pnpm dev:server // 启动开发服务 (热重载, 默认端口 3000)
pnpm build:server // 构建生产版本
```

### 新建模块流程 (CLI)

快速生成样板代码：

```bash
cd server

# 生成完整的 CRUD 资源 (包含 Module, Controller, Service, DTO, Entity)
npx nest g resource modules/product

# 仅生成特定部分
npx nest g module modules/order
npx nest g controller modules/order
npx nest g service modules/order
```

### 环境变量配置

在 server/ 根目录创建 .env 文件：

```sh
## 服务端口
PORT=3000

## 微信小程序配置
WX_APP_ID=你的AppID
WX_APP_SECRET=你的AppSecret

## JWT 密钥
JWT_SECRET=your-super-secret-key
```

在代码中使用 @nestjs/config 读取环境变量：

```typescript
import { ConfigService } from '@nestjs/config';

// 在 Service 中注入
constructor(private configService: ConfigService) {}

getWxConfig() {
  return {
    appId: this.configService.get<string>('WX_APP_ID'),
    secret: this.configService.get<string>('WX_APP_SECRET'),
  };
}
```

### 标准响应封装

建议使用拦截器 (Interceptor) 统一 API 响应格式：

```typeScript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        data,
        message: 'success',
      })),
    );
  }
}
```

在 main.ts 中全局注册：

```typescript
app.useGlobalInterceptors(new TransformInterceptor());
```

### 微信登录后端实现

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async code2Session(code: string) {
    const appId = this.configService.get('WX_APP_ID');
    const secret = this.configService.get('WX_APP_SECRET');
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const { data } = await lastValueFrom(this.httpService.get(url));

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return data; // 包含 openid, session_key
  }
}
```

### 异常处理

使用全局异常过滤器 (Filter) 统一错误响应：

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      code: status,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message,
      data: null,
    });
  }
}
```

在 main.ts 中注册：

```
app.useGlobalFilters(new HttpExceptionFilter());
```

### 数据库 (Drizzle ORM)

推荐使用 [Drizzle ORM](https://orm.drizzle.team/)，已预安装。

### 类型校验 (Zod)

项目集成了 [Zod](https://zod.dev/) 用于运行时类型校验。

#### 定义 Schema

```typescript
import { z } from 'zod';

// 基础类型
const userSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

// 从 schema 推导 TypeScript 类型
type User = z.infer<typeof userSchema>;
```

#### 请求校验

```typescript
// src/modules/user/dto/create-user.dto.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(20, '昵称最多20个字符'),
  avatar: z.string().url('头像必须是有效的URL').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// 在 Controller 中使用
@Post()
create(@Body() body: unknown) {
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.errors);
  }
  return this.userService.create(result.data);
}
```


## 常见问题排查

### 网络请求失败（小程序端）

**症状**: 微信小程序端显示"网络请求失败"

**原因分析**:

1. **服务器域名未配置**
   - 微信小程序要求所有网络请求域名必须在后台配置
   - 开发环境下可以在「开发设置」中关闭"不校验合法域名"
   - 生产环境必须配置服务器域名

2. **域名配置错误**
   - 域名必须是 HTTPS（生产环境）
   - 域名必须在微信公众平台后台配置
   - SSL 证书必须有效

3. **后端服务未启动**
   - 确认后端服务是否运行在 3000 端口
   - 检查后端服务是否正常响应

**解决方案**:

**开发环境**:

```bash
# 1. 检查后端服务是否运行
curl -I http://localhost:3000/api/oil-price/province/current

# 2. 在微信开发者工具中，开启"不校验合法域名"
# 详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
```

**生产环境**:

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「开发管理」→「开发设置」
3. 在「服务器域名」中添加：
   ```
   request 合法域名: https://your-domain.com
   uploadFile 合法域名: https://your-domain.com
   downloadFile 合法域名: https://your-domain.com
   ```
4. 配置环境变量：
   ```bash
   # .env.local
   PROJECT_DOMAIN=https://your-domain.com
   ```

### 网络请求失败（H5 端）

**症状**: H5 端显示"网络请求失败"或控制台出现 "Uncaught (in promise) TypeError: Failed to fetch"

**原因分析**:

1. **后端服务未启动**
2. **端口冲突**
3. **CORS 跨域问题**
4. **浏览器扩展干扰**（常见原因）

**浏览器扩展干扰症状**:

错误堆栈包含类似信息：
```
at window.fetch (chrome-extension://hoklmmgfnpapgjgcpechhaamimifchmp/frame_ant/frame_ant.js:2:11394)
```

常见的干扰扩展包括：
- 中文翻译扩展
- 广告拦截器
- 代理扩展
- 网络请求拦截器

**解决方案**:

```bash
# 1. 检查后端服务
curl -I http://localhost:3000/api/oil-price/province/current

# 2. 检查端口占用
ss -tuln | grep 3000

# 3. 重启开发服务
cd /workspace/projects && coze dev

# 4. 如果怀疑是浏览器扩展干扰，请：
# - 在无痕/隐私模式中测试
# - 临时禁用所有扩展
# - 或允许该网站在扩展的白名单中
```

**项目已内置的错误处理机制**:

项目已经实现了完整的错误处理机制：

1. **window.fetch 覆盖**（核心防护）：
   - 在应用启动时覆盖原生 `window.fetch`
   - 拦截所有 fetch 调用，在底层捕获扩展干扰
   - 检测到扩展干扰时自动重试（500ms 后）
   - 返回模拟的失败 Response，防止应用崩溃
   - **这是最底层的防护，确保 Taro 内部的请求拦截器也能正确处理错误**

2. **Network 模块统一响应格式**：
   - 所有网络请求返回 `{ success, data?, errorMsg?, statusCode? }` 格式
   - 调用方通过 `Network.isSuccessResponse(result)` 类型守卫检查响应
   - 确保 TypeScript 类型安全
   - 检测到扩展干扰时也会自动重试

3. **全局错误处理器**：
   - 在应用启动时注册全局 Promise 拒绝处理器
   - 捕获所有未处理的 Promise 拒绝
   - 阻止错误传播导致页面崩溃
   - **作为最后的安全网**，确保即使有错误传播也不会影响用户体验

4. **用户友好的错误提示**：
   - 超时错误："请求超时，请检查网络连接"
   - 网络连接失败："网络连接失败，请检查网络设置或禁用浏览器扩展"
   - 扩展干扰："网络请求失败，可能受浏览器扩展干扰，建议在无痕模式中测试或禁用扩展"

**多层防护架构**：

```
┌─────────────────────────────────────┐
│ 1. window.fetch 覆盖（底层拦截）    │ ← 最先拦截，捕获所有 fetch 错误
├─────────────────────────────────────┤
│ 2. Taro 内部拦截器（框架层）        │ ← 使用覆盖后的 fetch
├─────────────────────────────────────┤
│ 3. Network.request（业务层）        │ ← 统一响应格式
├─────────────────────────────────────┤
│ 4. 全局 Promise 拒绝处理器（兜底）  │ ← 捕获所有未处理的错误
└─────────────────────────────────────┘
```

**代码示例**：

```typescript
import { Network } from '@/network'

// 正确的错误处理方式
const result = await Network.request({
  url: '/api/oil-price/province/current',
  method: 'GET'
})

// 使用类型守卫检查响应
if (!Network.isSuccessResponse(result)) {
  console.error('请求失败:', result.errorMsg)
  // 显示错误提示
  Taro.showToast({
    title: result.errorMsg || '网络请求失败',
    icon: 'none'
  })
  return
}

// 处理成功响应
if (result.data?.code === 200 && result.data?.data) {
  // 使用 result.data
}
```

### 数据加载失败

**症状**: 页面显示"数据加载失败"或"网络请求失败"

**排查步骤**:

1. **检查网络请求日志**
   - 打开浏览器控制台（F12）
   - 查看 Network 标签页的请求详情
   - 确认请求 URL、方法、参数是否正确

2. **检查后端日志**
   ```bash
   tail -50 /tmp/coze-logs/dev.log
   ```

3. **测试后端 API**
   ```bash
   # 测试油价接口
   curl http://localhost:3000/api/oil-price/province/current

   # 测试省份列表
   curl http://localhost:3000/api/oil-price/provinces
   ```

4. **检查环境变量**
   ```bash
   # 确认 .env 文件存在
   cat .env

   # 确认环境变量加载
   echo $PROJECT_DOMAIN
   ```

### 位置定位失败

**症状**: 点击定位按钮后无法获取当前位置

**原因分析**:

1. **用户未授权位置权限**
2. **设备 GPS 未开启**
3. **高德地图 API Key 无效**

**解决方案**:

1. 引导用户授权：
   ```typescript
   try {
     await Taro.getLocation({ type: 'gcj02' })
   } catch (error) {
     // 提示用户授权
     await Taro.showModal({
       title: '需要位置权限',
       content: '请授权位置信息以获取所在省份的油价',
       confirmText: '去设置',
       success: (res) => {
         if (res.confirm) {
           Taro.openSetting()
         }
       }
     })
   }
   ```

2. 检查高德地图 API Key：
   ```bash
   # .env
   AMAP_API_KEY=your-api-key
   ```

### 云函数调用失败

**症状**: 云开发相关的功能无法使用

**原因分析**:

1. **云环境未初始化**
2. **云函数未部署**
3. **云环境 ID 错误**

**解决方案**:

1. 检查云环境配置（`src/app.ts`）：
   ```typescript
   wx.cloud.init({
     env: 'your-env-id',  // 确认云环境 ID 正确
     traceUser: true
   })
   ```

2. 部署云函数：
   ```bash
   # 在微信开发者工具中
   右键 cloud/functions/get-oil-price → 上传并部署
   ```

### 热更新失效

**症状**: 修改代码后页面没有自动刷新

**解决方案**:

```bash
# 重启开发服务
cd /workspace/projects && coze dev
```

### 构建失败

**症状**: `pnpm build` 报错

**常见错误及解决方案**:

1. **ESLint 错误**
   ```bash
   # 查看错误详情
   pnpm lint:build
   
   # 自动修复
   pnpm lint:fix
   ```

2. **TypeScript 错误**
   ```bash
   # 查看类型错误
   pnpm tsc
   ```

3. **依赖缺失**
   ```bash
   # 重新安装依赖
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

## 调试技巧

### 前端调试

```typescript
// 在页面中添加调试信息
console.log('[Debug] 当前城市:', currentCity)
console.log('[Debug] 油价数据:', priceData)
console.log('[Debug] 错误信息:', error)
```

### 后端调试

```bash
# 查看实时日志
tail -f /tmp/coze-logs/dev.log

# 搜索错误日志
tail -f /tmp/coze-logs/dev.log | grep -i error
```

### 网络请求调试

```typescript
// src/network.ts 已内置详细的请求/响应日志
// 打开浏览器控制台（F12）→ Network 标签页查看所有请求
```

## 环境变量配置

项目使用 `.env.local` 文件管理环境变量：

```bash
# 天聚数行 API Key
TIANAPI_KEY=your-tianapi-key

# 聚合数据 API Key
JUHE_API_KEY=your-juhe-key

# 高德地图 API Key
AMAP_API_KEY=your-amap-key

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# JWT 配置
JWT_SECRET=your-jwt-secret

# 项目域名（生产环境必填）
PROJECT_DOMAIN=https://your-domain.com
```

**注意**:
- `.env.local` 文件已被 `.gitignore` 忽略，不会提交到版本控制
- 生产环境请使用 CI/CD 平台的环境变量配置功能
