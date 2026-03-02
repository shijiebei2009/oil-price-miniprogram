import Taro from '@tarojs/taro'
import { getAccessToken, useAuthStore } from '@/stores/auth.store'

/**
 * 是否正在刷新 Token
 */
let isRefreshing = false
/**
 * 等待刷新 Token 的 Promise 队列
 */
let refreshSubscribers: Array<(token: string | null) => void> = []

/**
 * 添加订阅者
 */
const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback)
}

/**
 * 通知所有订阅者
 */
const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 支持 JWT 认证和 Token 自动刷新
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    /**
     * 刷新 Access Token
     */
    const refreshAccessToken = async (): Promise<string | null> => {
        if (isRefreshing) {
            // 如果正在刷新，等待刷新完成
            return new Promise((resolve) => {
                subscribeTokenRefresh((token) => resolve(token))
            })
        }

        isRefreshing = true

        try {
            const refreshToken = useAuthStore.getState().refreshToken

            if (!refreshToken) {
                throw new Error('Refresh Token 不存在')
            }

            const res = await Taro.request({
                url: createUrl('/api/auth/refresh'),
                method: 'POST',
                data: { refreshToken },
            })

            if (res.statusCode === 200 && res.data.code === 200) {
                const { accessToken, refreshToken: newRefreshToken } = res.data.data

                // 更新 store
                useAuthStore.setState({
                    accessToken,
                    refreshToken: newRefreshToken,
                })

                // 更新本地存储
                Taro.setStorageSync('access_token', accessToken)
                Taro.setStorageSync('refresh_token', newRefreshToken)

                // 通知所有订阅者
                onTokenRefreshed(accessToken)

                console.log('[Network] Token 刷新成功')
                return accessToken
            } else {
                throw new Error(res.data.msg || '刷新 Token 失败')
            }
        } catch (error) {
            console.error('[Network] 刷新 Token 失败:', error)
            // 刷新失败，通知所有订阅者
            onTokenRefreshed(null)
            return null
        } finally {
            isRefreshing = false
        }
    }

    /**
     * 请求拦截器：自动添加 Authorization header
     */
    const requestInterceptor = (options: Taro.request.Option) => {
        // 公开接口列表（不需要 Token）
        const publicUrls = [
            '/api/auth/login',
            '/api/auth/refresh',
            '/api/auth/logout',
            '/api/auth/clean-expired',
            '/api/oil-price',
            '/api/location',
            '/api/wechat/login',
        ]

        // 检查是否为公开接口
        const isPublic = publicUrls.some(url => options.url?.startsWith(url))

        if (!isPublic) {
            const accessToken = getAccessToken()
            if (accessToken) {
                options.header = {
                    ...options.header,
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        }

        console.log('[Network] 请求:', {
            url: options.url,
            method: options.method,
            hasToken: !!options.header?.Authorization,
        })

        return options
    }

    /**
     * 响应拦截器：处理 401 错误，自动刷新 Token
     * 返回 Promise 以支持异步刷新
     */
    const responseInterceptor = async (
        response: Taro.request.SuccessCallbackResult<any>,
        options: Taro.request.Option,
    ): Promise<Taro.request.SuccessCallbackResult<any>> => {
        const { statusCode } = response

        // 处理 401 错误
        if (statusCode === 401) {
            console.log('[Network] 收到 401 响应，尝试刷新 Token')

            const newToken = await refreshAccessToken()

            if (newToken) {
                // Token 刷新成功，重试请求
                console.log('[Network] Token 刷新成功，重试请求')

                // 更新 header
                const retryOptions: Taro.request.Option = {
                    ...options,
                    header: {
                        ...options.header,
                        Authorization: `Bearer ${newToken}`,
                    },
                }

                // 重新发起请求
                const retryResponse = await Taro.request({
                    ...retryOptions,
                    url: createUrl(retryOptions.url),
                })

                return retryResponse
            } else {
                // Token 刷新失败，清除认证状态
                console.log('[Network] Token 刷新失败，清除认证状态')
                useAuthStore.getState().logout()
            }
        }

        return response
    }

    export const request = async (option: Taro.request.Option): Promise<Taro.request.SuccessCallbackResult<any>> => {
        const interceptedOption = requestInterceptor(option)

        const response = await Taro.request({
            ...interceptedOption,
            url: createUrl(interceptedOption.url),
        })

        // 响应拦截（返回 Promise）
        return await responseInterceptor(response, option)
    }

    export const uploadFile: typeof Taro.uploadFile = (option) => {
        const interceptedOption = requestInterceptor(option as any)

        return Taro.uploadFile({
            ...interceptedOption,
            url: createUrl(interceptedOption.url),
        } as any)
    }

    export const downloadFile: typeof Taro.downloadFile = (option) => {
        const interceptedOption = requestInterceptor(option as any)

        return Taro.downloadFile({
            ...interceptedOption,
            url: createUrl(interceptedOption.url),
        } as any)
    }
}
