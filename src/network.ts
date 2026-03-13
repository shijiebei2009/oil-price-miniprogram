import Taro from '@tarojs/taro'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
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
     * 请求拦截器：添加日志
     */
    const requestInterceptor = (options: Taro.request.Option) => {
        console.log('[Network] 请求:', {
            url: options.url,
            method: options.method,
            header: options.header,
        })
        return options
    }

    export const request = async (option: Taro.request.Option): Promise<any> => {
        const interceptedOption = requestInterceptor(option)

        const response = await Taro.request({
            ...interceptedOption,
            url: createUrl(interceptedOption.url),
        })

        return response
    }

    export const uploadFile = (option: Taro.uploadFile.Option): Promise<any> => {
        console.log('[Network] 上传文件:', {
            url: option.url,
            filePath: option.filePath,
            name: option.name,
        })

        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
        })
    }

    export const downloadFile = (option: Taro.downloadFile.Option): Promise<any> => {
        console.log('[Network] 下载文件:', {
            url: option.url,
        })

        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
        })
    }
}
