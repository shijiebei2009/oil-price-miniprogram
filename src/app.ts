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
