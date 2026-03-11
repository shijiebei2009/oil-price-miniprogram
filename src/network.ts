import Taro from '@tarojs/taro'

// 环境变量
let PROJECT_DOMAIN = ''

// 初始化域名配置
const initProjectDomain = () => {
    if (PROJECT_DOMAIN) return PROJECT_DOMAIN

    const env = Taro.getEnv()
    const envString = String(env)
    console.log('[Network] 当前平台:', env, '(', envString, ')')

    // 微信小程序环境
    if (env === Taro.ENV_TYPE.WEAPP) {
        // 尝试从全局获取
        if (typeof (globalThis as any).PROJECT_DOMAIN === 'string') {
            PROJECT_DOMAIN = (globalThis as any).PROJECT_DOMAIN
            console.log('[Network] 使用全局域名:', PROJECT_DOMAIN)
        } else {
            // 开发环境使用本地服务器
            PROJECT_DOMAIN = 'http://localhost:3000'
            console.log('[Network] 使用默认开发域名:', PROJECT_DOMAIN)
        }
    } 
    // H5 环境：使用相对路径（由 Vite 代理到后端）
    else if (envString === 'h5' || envString === 'H5' || envString === 'web') {
        PROJECT_DOMAIN = ''
        console.log('[Network] H5 环境使用相对路径')
    } 
    // 其他环境
    else {
        PROJECT_DOMAIN = 'http://localhost:3000'
        console.log('[Network] 使用默认域名:', PROJECT_DOMAIN)
    }

    return PROJECT_DOMAIN
}

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 */
export namespace Network {
    const createUrl = (url: string): string => {
        // 如果已经是完整 URL，直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }

        const domain = initProjectDomain()

        // H5 环境使用相对路径，其他环境拼接域名
        if (!domain) {
            return url
        }

        return `${domain}${url}`
    }

    /**
     * 请求拦截器：添加日志
     */
    const requestInterceptor = (options: Taro.request.Option) => {
        const fullUrl = createUrl(options.url)
        console.log('[Network] 📤 请求发起:', {
            url: fullUrl,
            method: options.method || 'GET',
            header: options.header,
            data: options.data,
            platform: Taro.getEnv()
        })
        return options
    }

    /**
     * 响应拦截器：添加日志和错误处理
     */
    const responseInterceptor = (response: any, originalUrl: string) => {
        console.log('[Network] 📥 响应接收:', {
            url: originalUrl,
            statusCode: response.statusCode,
            data: response.data,
            platform: Taro.getEnv()
        })

        // 错误处理
        if (response.statusCode !== 200) {
            console.error('[Network] ❌ 请求失败:', {
                url: originalUrl,
                statusCode: response.statusCode,
                data: response.data
            })
            throw new Error(`请求失败: ${response.statusCode}`)
        }

        return response
    }

    export const request = async (option: Taro.request.Option): Promise<any> => {
        try {
            const interceptedOption = requestInterceptor(option)
            const fullUrl = createUrl(interceptedOption.url)

            const response = await Taro.request({
                ...interceptedOption,
                url: fullUrl,
            })

            return responseInterceptor(response, fullUrl)
        } catch (error) {
            console.error('[Network] ❌ 请求异常:', {
                url: option.url,
                error: error,
                platform: Taro.getEnv(),
                errorMsg: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }

    export const uploadFile = (option: Taro.uploadFile.Option): Promise<any> => {
        try {
            const fullUrl = createUrl(option.url)
            console.log('[Network] 📤 上传文件:', {
                url: fullUrl,
                filePath: option.filePath,
                name: option.name,
            })

            return Taro.uploadFile({
                ...option,
                url: fullUrl,
            })
        } catch (error) {
            console.error('[Network] ❌ 上传失败:', error)
            throw error
        }
    }

    export const downloadFile = (option: Taro.downloadFile.Option): Promise<any> => {
        try {
            const fullUrl = createUrl(option.url)
            console.log('[Network] 📥 下载文件:', {
                url: fullUrl,
            })

            return Taro.downloadFile({
                ...option,
                url: fullUrl,
            })
        } catch (error) {
            console.error('[Network] ❌ 下载失败:', error)
            throw error
        }
    }
}
