import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { injectH5Styles } from '@/utils/h5-styles';
import { enableWxDebugIfNeeded } from '@/utils/wx-debug';
import '@/app.css';

// 检测是否为微信小程序环境
const isWeapp = typeof wx !== 'undefined' && wx.cloud;

export default ({ children }: PropsWithChildren<any>) => {
  useLaunch(() => {
    enableWxDebugIfNeeded();
    injectH5Styles();

    // 初始化云开发环境（仅在微信小程序环境）
    if (isWeapp) {
      console.log('📦 初始化云开发环境');
      wx.cloud.init({
        env: process.env.TARO_APP_CLOUD_ENV_ID || undefined, // 云环境ID
        traceUser: true
      });
    }
  });

  return children;
};
