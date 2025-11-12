module.exports = {
  expo: {
    name: "Trampay",
    slug: "Trampay",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.talesjardim08.Trampay"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b4f12620-785e-434c-b074-5484a018a5cb"
      }
    },
    experiments: {
      tsconfigPaths: true,
      web: {
        corsOriginsAllowList: ["*"]
      }
    }
  }
};
