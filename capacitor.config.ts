import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhadharatransport.app',
  appName: 'Bhadhara Transport',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
