import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neurorhythm.app',
  appName: 'Neurorhythm',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
      google: {
        webClientId: "28101636727-f27qth1jdj71ap68hkd6jo48s9nkipo7.apps.googleusercontent.com",
      },
    },
  },
};

export default config;