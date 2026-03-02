import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Network } from '@/network';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

interface UserInfo {
  id: string;
  openid: string;
  nickname: string;
  avatarUrl: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (openid: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  initializeAuth: () => void;
}

/**
 * Auth Store
 * 管理用户登录状态和 Token
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  userInfo: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * 初始化认证状态（从本地存储恢复）
   */
  initializeAuth: () => {
    try {
      const accessToken = Taro.getStorageSync(ACCESS_TOKEN_KEY) || null;
      const refreshToken = Taro.getStorageSync(REFRESH_TOKEN_KEY) || null;
      const userInfo = Taro.getStorageSync(USER_INFO_KEY) || null;

      set({
        accessToken,
        refreshToken,
        userInfo,
        isAuthenticated: !!accessToken && !!refreshToken,
      });

      console.log('[Auth] 认证状态已初始化');
    } catch (error) {
      console.error('[Auth] 初始化认证状态失败:', error);
    }
  },

  /**
   * 登录
   */
  login: async (openid: string) => {
    set({ isLoading: true });
    try {
      const res = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { openid },
      });

      if (res.statusCode === 200 && res.data.code === 200) {
        const { user, tokens } = res.data.data;

        // 保存到 Zustand
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userInfo: user,
          isAuthenticated: true,
          isLoading: false,
        });

        // 保存到本地存储
        Taro.setStorageSync(ACCESS_TOKEN_KEY, tokens.accessToken);
        Taro.setStorageSync(REFRESH_TOKEN_KEY, tokens.refreshToken);
        Taro.setStorageSync(USER_INFO_KEY, user);

        console.log('[Auth] 登录成功:', user.nickname);
      } else {
        throw new Error(res.data.msg || '登录失败');
      }
    } catch (error) {
      set({ isLoading: false });
      console.error('[Auth] 登录失败:', error);
      throw error;
    }
  },

  /**
   * 注销
   */
  logout: async () => {
    const { refreshToken } = get();

    try {
      if (refreshToken) {
        await Network.request({
          url: '/api/auth/logout',
          method: 'POST',
          data: { refreshToken },
        });
      }
    } catch (error) {
      console.error('[Auth] 注销请求失败:', error);
    } finally {
      // 清除本地状态
      set({
        accessToken: null,
        refreshToken: null,
        userInfo: null,
        isAuthenticated: false,
      });

      // 清除本地存储
      Taro.removeStorageSync(ACCESS_TOKEN_KEY);
      Taro.removeStorageSync(REFRESH_TOKEN_KEY);
      Taro.removeStorageSync(USER_INFO_KEY);

      console.log('[Auth] 已注销');
    }
  },

  /**
   * 刷新 Token
   */
  refreshTokens: async () => {
    const { refreshToken } = get();

    if (!refreshToken) {
      throw new Error('Refresh Token 不存在');
    }

    try {
      const res = await Network.request({
        url: '/api/auth/refresh',
        method: 'POST',
        data: { refreshToken },
      });

      if (res.statusCode === 200 && res.data.code === 200) {
        const tokens = res.data.data;

        // 更新 Zustand
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });

        // 更新本地存储
        Taro.setStorageSync(ACCESS_TOKEN_KEY, tokens.accessToken);
        Taro.setStorageSync(REFRESH_TOKEN_KEY, tokens.refreshToken);

        console.log('[Auth] Token 刷新成功');
      } else {
        throw new Error(res.data.msg || '刷新 Token 失败');
      }
    } catch (error) {
      console.error('[Auth] 刷新 Token 失败:', error);
      // 刷新失败，清除认证状态
      get().logout();
      throw error;
    }
  },
}));

/**
 * 获取当前 Access Token
 */
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().accessToken;
};

/**
 * 设置 Access Token（供拦截器使用）
 */
export const setAccessToken = (token: string | null) => {
  useAuthStore.setState({ accessToken: token });
};
