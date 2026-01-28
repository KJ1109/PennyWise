import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pennywise.app',
  appName: 'PennyWise',
  webDir: 'public',
  server: {
    url: 'https://penny-wise-finance.vercel.app',
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
