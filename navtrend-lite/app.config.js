require('dotenv/config');

module.exports = {
  expo: {
    name: "MarketNews",
    slug: "marketnews-app",
    version: "2.0.3",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme: "com.marketrendnews.top",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.marketrendnews.top",
      buildNumber: "18",
      jsEngine: "hermes",
      // googleServicesFile: "./config/firebase/GoogleService-Info.plist", // 已移除 Firebase
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      }
    },
    android: {
      "versionCode": 18,
      package: "com.marketrendnews.app",
      // googleServicesFile: "./config/firebase/google-services.json", // 已移除 Firebase
      "edgeToEdgeEnabled": true,
      // 关键：启用键盘弹出时调整布局高度（adjustResize）
      softwareKeyboardLayoutMode: "resize",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0EA5E9"
      },
      // Android 15 兼容性配置
      "enableProguardInReleaseBuilds": true,
      "enableSeparateBuildPerCPUArchitecture": true,
      // 支持 16KB 页面大小
      "allowBackup": false,
      "enableKotlinNativeJavaFileGeneration": true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-tracking-transparency",
        {
          "userTrackingPermission": "This app would like to track your activity across other companies' apps and websites to provide personalized advertisements and analyze app performance. Your privacy choices can be changed at any time in Settings."
        }
      ],
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0EA5E9"
        }
      ],

      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "podfileProperties": {
              "use_modular_headers!": true
            }
          },
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0",
            "ndkVersion": "26.1.10909125",
            "proguardMinifyEnabled": true,
            "enableAapt2": true,
            // 新架构配置已移至根级别 newArchEnabled
            "enableHermes": true,
            "packagingOptions": {
              "pickFirst": [
                "**/libc++_shared.so",
                "**/libjsc.so"
              ],
              "merge": [
                "**/libjsc.so"
              ]
            },
            "splits": {
              "abi": {
                "enable": true,
                "reset": true,
                "include": ["arm64-v8a", "armeabi-v7a", "x86_64"],
                "universalApk": false
              }
            }
          }
        }
      ],
      [
        "react-native-edge-to-edge",
        {
          "android": {
            "parentTheme": "Material3",
            "enforceNavigationBarContrast": false
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      releaseDate: '2025-06-06', // app发布时间
      // EAS 项目配置
      eas: {
        projectId: "8bb0e198-d4af-486c-ae51-ae80e44b06f5"
      },

      // API 配置 - 开发环境使用本地服务器
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      environment: process.env.NODE_ENV || 'development',

      // HMAC API 认证密钥
      apiSecretKey: process.env.EXPO_PUBLIC_API_SECRET_KEY,

      // 应用认证配置
      appId: process.env.EXPO_PUBLIC_APP_ID || '12f9d9e3-cb58-41aa-a02f-8dc4bd6ab1af',

      // Clerk 认证配置 (测试用)
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_your_clerk_publishable_key_here',
    }
  }
}; 