import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pennywise.app',
  appName: 'PennyWise',
  webDir: 'out',
  plugins: {
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
