import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.karan.pennywise',
  appName: 'PennyWise',
  webDir: 'public',
  server: {
    url: 'https://penny-wise-finance.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
