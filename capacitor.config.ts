// capacitor.config.ts — Mobile wrapper config for future Capacitor deployment
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pharmatrack.pro',
  appName: 'PharmaTrack Pro',
  webDir: 'dist/pharma-frontend/browser',
  server: {
    // For development: point to local dev server
    // url: 'http://192.168.1.100:4200',
    // cleartext: true,

    // For production builds: remove server block entirely to use bundled assets
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0c1117',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0c1117',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
  android: {
    minWebViewVersion: 60,
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
};

export default config;

/*
 * ── Capacitor Setup Instructions ─────────────────────────────────────────
 *
 * 1. Install Capacitor in the frontend directory:
 *    npm install @capacitor/core @capacitor/cli
 *    npm install @capacitor/android @capacitor/ios   (optional, per platform)
 *    npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
 *
 * 2. Initialize Capacitor (one-time):
 *    npx cap init "PharmaTrack Pro" "com.pharmatrack.pro" --web-dir dist/pharma-frontend/browser
 *
 * 3. Build Angular for production:
 *    npm run build:prod
 *
 * 4. Add platforms:
 *    npx cap add android
 *    npx cap add ios
 *
 * 5. Sync web assets to native:
 *    npx cap sync
 *
 * 6. Open in native IDE:
 *    npx cap open android    → opens Android Studio
 *    npx cap open ios        → opens Xcode
 *
 * ── API URL for Mobile ────────────────────────────────────────────────────
 * Update src/environments/environment.prod.ts with your deployed API URL.
 * The Angular HttpClient calls will reach your backend over HTTPS.
 *
 * ── Architecture is already mobile-ready because: ────────────────────────
 * ✓ Standalone components (no NgModules to wire)
 * ✓ Mobile-first CSS with safe-area-inset support
 * ✓ No window-specific APIs without guards
 * ✓ HttpClient (not fetch) — works in Capacitor WebView
 * ✓ Router hash strategy can be enabled for WebView if needed
 */
