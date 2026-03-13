import { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import { injectH5Styles } from '@/utils/h5-styles';
import { enableWxDebugIfNeeded } from '@/utils/wx-debug';
import '@/app.css';

// 检测是否为微信小程序环境
const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP && typeof wx !== 'undefined';

export default ({ children }: PropsWithChildren<any>) => {
  useLaunch(() => {
    enableWxDebugIfNeeded();
    injectH5Styles();

    // 初始化云开发环境（仅在微信小程序环境）
    if (isWeapp) {
      console.log('📦 初始化云开发环境');
      wx.cloud.init({
        env: 'cloud1-0gvykhvqe6c6a995', // 云环境ID
        traceUser: true
      });
    }

    // 在 H5 环境中，覆盖 window.fetch 以处理浏览器扩展干扰
    if (typeof window !== 'undefined' && window.fetch && !isWeapp) {
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        try {
          // 尝试使用原始 fetch
          return await originalFetch(...args);
        } catch (error) {
          // 检查是否是浏览器扩展相关的错误
          const isBrowserExtensionError = 
            error instanceof Error && 
            (error.message.includes('chrome-extension') || 
             error.message.includes('Failed to fetch') ||
             error.stack?.includes('chrome-extension'));
          
          if (isBrowserExtensionError) {
            console.warn('[Fetch] 检测到浏览器扩展干扰，尝试重新请求');
            
            // 等待一小段时间后重试
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              // 重试一次
              return await originalFetch(...args);
            } catch (retryError) {
              console.error('[Fetch] 重试失败:', retryError);
              
              // 获取 URL 字符串
              let urlStr = '';
              if (typeof args[0] === 'string') {
                urlStr = args[0];
              } else if (args[0] instanceof URL) {
                urlStr = args[0].href;
              } else {
                urlStr = args[0]?.toString() || '';
              }
              
              // 返回一个模拟的失败 Response
              return {
                ok: false,
                status: 0,
                statusText: 'Network Error',
                url: urlStr,
                headers: new Headers(),
                redirected: false,
                type: 'basic' as ResponseType,
                clone: function() { return this; },
                body: null,
                bodyUsed: false,
                text: async () => Promise.resolve(JSON.stringify({
                  code: 0,
                  msg: '网络请求失败，可能受浏览器扩展干扰',
                  data: null
                })),
                json: async () => Promise.resolve({
                  code: 0,
                  msg: '网络请求失败，可能受浏览器扩展干扰',
                  data: null
                }),
                arrayBuffer: async () => Promise.resolve(new ArrayBuffer(0)),
                blob: async () => Promise.resolve(new Blob()),
                formData: async () => Promise.resolve(new FormData())
              } as Response;
            }
          }
          
          // 其他错误直接抛出
          throw error;
        }
      };
      
      console.log('✅ window.fetch 已覆盖，已添加浏览器扩展错误处理');
    }

    // 全局错误处理器 - 捕获未处理的 Promise 拒绝
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[Global] 未处理的 Promise 拒绝:', event.reason);
        
        // 检查是否是浏览器扩展相关的错误
        const reason = event.reason;
        const isBrowserExtensionError = 
          reason instanceof Error && 
          (reason.message.includes('chrome-extension') || 
           reason.message.includes('Failed to fetch') ||
           reason.stack?.includes('chrome-extension'));
        
        if (isBrowserExtensionError) {
          console.warn('[Global] 检测到浏览器扩展干扰，已自动处理');
          // 阻止错误继续传播
          event.preventDefault();
          return;
        }
        
        // 其他错误也阻止传播，避免页面崩溃
        event.preventDefault();
      });

      console.log('✅ 全局错误处理器已注册');
    }
  });

  return children;
};
