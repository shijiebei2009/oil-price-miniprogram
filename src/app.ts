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
  });

  return children;
};
