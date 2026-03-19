# 开发文档

## 项目简介

本项目是一个基于 Expo 和 React Native 的钢筋绑扎机器人控制应用。项目已经过 Expo Eject，包含了完整的原生 Android 和 iOS 代码，可以直接使用原生构建工具进行开发和构建。

**项目名称**: 钢筋绑扎机器人dev  
**包名**: com.tyings.appdev  
**技术栈**: 
- Expo SDK 53
- React Native 0.79.5
- TypeScript
- NativeWind (TailwindCSS)
- Zustand (状态管理)
- React Native Paper (UI 组件库)

## 环境要求

### 基础环境
- **Node.js**: >= 18 (推荐 v22.17.1+)
- **包管理器**: npm 或 yarn (项目使用 yarn)
- **操作系统**: macOS (推荐) 或 Linux / Windows

### Android 开发环境

#### 1. 安装 Java Development Kit (JDK)
- 推荐 JDK 17 或更高版本
- macOS 安装方式：
  ```bash
  # 使用 Homebrew
  brew install openjdk@17
  ```

#### 2. 安装 Android Studio
- 下载并安装 [Android Studio](https://developer.android.com/studio)
- 打开 Android Studio，进入 **Tools → SDK Manager**
- 安装以下组件：
  - **Android SDK Platform** (API Level 33 或更高)
  - **Android SDK Build-Tools**
  - **Android SDK Command-line Tools**
  - **Android Emulator**
  - **Intel x86 Emulator Accelerator (HAXM)** (如使用 Intel CPU)

#### 3. 配置 Android SDK 环境变量

**macOS / Linux** (`~/.zshrc` 或 `~/.bashrc`):
```bash
# Android SDK 路径（根据实际安装位置调整）
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Windows** (环境变量设置):
- 新建系统变量 `ANDROID_HOME`，值为 Android SDK 路径
- 在 `Path` 中添加：
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\emulator`
  - `%ANDROID_HOME%\tools`
  - `%ANDROID_HOME%\tools\bin`

#### 4. Gradle 版本
**重要**: 项目使用 **Gradle 8.13**，版本已配置在 `android/gradle/wrapper/gradle-wrapper.properties` 中，无需手动安装。


## 项目安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd steelBar-Binding
```

### 2. 安装依赖
```bash
# 使用 yarn (推荐，项目已配置 yarn.lock)
yarn install

# 或使用 npm
npm install
```

### 3. iOS 依赖安装 (仅 macOS)
```bash
cd ios
pod install
cd ..
```

## 开发模式

### Android 开发

#### 方式一：使用 Android 模拟器

1. **启动 Android 模拟器**
   ```bash
   # 查看可用的模拟器列表
   emulator -list-avds
   
   # 启动模拟器（替换 <模拟器名称> 为实际名称）
   emulator -avd <模拟器名称>
   ```

   或通过 Android Studio 的 AVD Manager 启动

2. **运行开发模式**
   ```bash
   npm run android
   ```
   
   这个命令会：
   - 启动 Metro bundler
   - 编译 Android 项目
   - 安装应用到模拟器/设备
   - 启动应用

#### 方式二：使用真实 Android 设备

1. **启用 USB 调试**
   - 设置 → 关于手机 → 连续点击版本号 7 次
   - 返回设置 → 开发者选项 → 启用 USB 调试

2. **连接设备并验证**
   ```bash
   adb devices
   ```
   应该能看到你的设备列表

3. **运行开发模式**
   ```bash
   npm run android
   ```

### iOS 开发 (仅 macOS)

```bash
npm run ios
```

或使用 Xcode:
1. 打开 `ios/dev.xcworkspace`
2. 选择目标设备和 scheme
3. 点击 Run 按钮

### 启动开发服务器

如果需要单独启动 Metro bundler：
```bash
npm start
```

或清除缓存启动：
```bash
npm start -- --clear
```

## 构建 Release 包

### Android Release 构建

#### 1. 生成签名密钥 (仅首次)
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release-key.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. 配置签名信息

编辑 `android/app/build.gradle`，配置 `signingConfigs`:
```gradle
signingConfigs {
    release {
        storeFile file('release-key.keystore')
        storePassword 'your-store-password'
        keyAlias 'release-key'
        keyPassword 'your-key-password'
    }
}
```

并修改 `buildTypes.release`:
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... 其他配置
    }
}
```

#### 3. 构建 APK
```bash
cd android
./gradlew assembleRelease
```

生成的 APK 位于: `android/app/build/outputs/apk/release/app-release.apk`

#### 4. 构建 AAB (用于 Google Play)
```bash
cd android
./gradlew bundleRelease
```

生成的 AAB 位于: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS Release 构建 (仅 macOS)

1. 打开 `ios/dev.xcworkspace`
2. 在 Xcode 中选择 Product → Scheme → Edit Scheme
3. 选择 Run，将 Build Configuration 设置为 Release
4. Product → Archive
5. 按照向导进行分发

## 常用命令

```bash
# 开发模式
npm run android          # 在 Android 上运行
npm run ios              # 在 iOS 上运行 (仅 macOS)
npm start                # 启动 Metro bundler

# 代码质量
npm run lint             # 代码检查
npm run format           # 代码格式化

# 构建相关
cd android && ./gradlew clean        # 清理 Android 构建缓存
cd android && ./gradlew assembleDebug    # 构建 Debug APK
cd android && ./gradlew assembleRelease  # 构建 Release APK

# 缓存清理
npm start -- --clear     # 清除 Metro 缓存
cd android && ./gradlew clean  # 清除 Gradle 缓存
```

## 项目结构

```
├── app/                    # Expo Router 页面路由
│   ├── (root)/            # 根路由组
│   │   ├── (home)/        # 主页路由组
│   │   ├── (login)/       # 登录页面
│   │   └── (setting)/     # 设置页面
│   └── +not-found.tsx     # 404 页面
├── android/               # Android 原生代码
│   ├── app/              # Android 应用模块
│   ├── build.gradle      # 根级 Gradle 配置
│   └── gradle/           # Gradle wrapper (Gradle 8.13)
├── ios/                  # iOS 原生代码
├── components/           # 可复用组件
│   ├── bootstrap/        # 启动相关
│   ├── control-*/        # 控制相关组件
│   └── ...
├── constants/            # 常量定义
├── hooks/               # 自定义 Hooks
├── store/               # Zustand 状态管理
├── utils/               # 工具函数
├── types/               # TypeScript 类型定义
├── assets/              # 静态资源
└── model/               # 数据模型
```

## 配置文件说明

| 文件 | 说明 |
|------|------|
| `app.json` | Expo 应用配置（名称、版本、权限等） |
| `package.json` | 项目依赖和脚本 |
| `android/build.gradle` | Android 项目级构建配置 |
| `android/app/build.gradle` | Android 应用级构建配置 |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle 版本配置 (8.13) |
| `babel.config.js` | Babel 转译配置 |
| `metro.config.js` | Metro bundler 配置 |
| `tailwind.config.js` | TailwindCSS 样式配置 |
| `tsconfig.json` | TypeScript 编译配置 |

## 常见问题排查

### 1. Metro bundler 启动失败
```bash
# 清除缓存重新启动
npm start -- --clear

# 删除 node_modules 重新安装
rm -rf node_modules
yarn install
```

### 2. Android 构建失败

**Gradle 构建失败**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**依赖问题**:
```bash
cd android
./gradlew clean
rm -rf .gradle build app/build
cd ..
```

**JDK 版本问题**:
- 确保使用 JDK 17 或更高版本
- 检查 `JAVA_HOME` 环境变量

### 3. 模拟器/设备连接问题

**模拟器无法启动**:
```bash
# 重启 adb 服务
adb kill-server
adb start-server

# 检查设备连接
adb devices
```

**真机无法识别**:
- 确保已启用 USB 调试
- 检查 USB 连接线和端口
- 尝试更换 USB 端口或数据线
- macOS: 检查是否有系统提示允许 USB 调试

### 4. 依赖安装问题

**yarn 安装失败**:
```bash
# 清除 yarn 缓存
yarn cache clean

# 删除 lock 文件重新安装（谨慎使用）
rm yarn.lock
yarn install
```

**iOS CocoaPods 安装失败**:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### 5. Gradle 版本问题

如果遇到 Gradle 版本相关错误：
- 确认 `android/gradle/wrapper/gradle-wrapper.properties` 中版本为 `8.13`
- 如需更新，修改 `distributionUrl` 后运行 `./gradlew wrapper`

### 6. 端口占用

Metro bundler 默认使用 8081 端口，如果被占用：
```bash
# 查找占用进程
lsof -i :8081  # macOS/Linux
netstat -ano | findstr :8081  # Windows

# 杀死进程后重新启动
npm start
```

## 开发建议

1. **使用 TypeScript**: 项目已配置 TypeScript，建议充分利用类型检查
2. **代码规范**: 运行 `npm run lint` 和 `npm run format` 保持代码一致性
3. **版本控制**: 不要提交 `node_modules`、`build`、`.gradle` 等构建产物
4. **调试工具**: 
   - React Native Debugger
   - Flipper (Meta 官方调试工具)
   - Chrome DevTools (用于调试 JS 代码)

## 相关资源

- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- [Android 开发者指南](https://developer.android.com/guide)
- [Gradle 文档](https://docs.gradle.org/)

---

**注意**: 本项目已 Eject，不再支持 Expo Go。所有原生模块的修改都需要重新构建应用。

如有问题，请查看项目 Issues 或联系项目维护者。
