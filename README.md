# SteelBar-Binding

一个基于 Expo 和 React Native 的钢筋绑扎机器人控制应用。

## 项目概述

本项目是一个用于控制钢筋绑扎机器人的移动应用，支持机器人状态监控、参数设置、错误处理等功能。

## 技术栈

- **Expo SDK 53**
- **React Native 0.79.2**
- **TypeScript**
- **Zustand** (状态管理)
- **NativeWind** (样式)
- **React Native Paper** (UI组件)

## 环境要求

- Node.js >= 18
- npm 或 yarn
- Expo CLI
- Android Studio (用于Android调试)
- Xcode (用于iOS调试，仅macOS)

## 快速开始

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 个人建议开发环境
node: v22.17.1 (npm v10.9.2)

```

### 2. 启动开发服务器

```bash
# 启动 Expo 开发服务器
npm start
# 或
yarn start
```

### 3. 在设备上运行

由于项目使用了原生模块，需要使用开发构建：

```bash
# 安装 EAS CLI
npm install -g @expo/eas-cli

# 登录 Expo 账户
eas login

# 创建开发构建
eas build --profile development --platform android
```

## Android 调试

### 前置条件

1. **安装 Android Studio**
   - 下载并安装 [Android Studio](https://developer.android.com/studio)
   - 确保安装了 Android SDK 和模拟器

2. **配置环境变量**
   ```bash
   # 添加到 ~/.bashrc 或 ~/.zshrc
   export ANDROID_HOME=$HOME/Library/Android/sdk  // 这个具体得看自己电脑配置java sdk的位置
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### 调试步骤

#### 方法一：使用 Android 模拟器

1. **启动 Android Studio**
2. **创建虚拟设备**
   - 打开 AVD Manager
   - 创建新的虚拟设备 (推荐 Pixel 系列)
   - 选择 API 级别 (推荐 API 30+)

3. **启动模拟器**
   ```bash
   # 列出可用的模拟器
   emulator -list-avds
   
   # 启动指定模拟器
   emulator -avd <模拟器名称>
   ```

4. **运行应用**
   ```bash
   # 预构建原生代码
   npx expo prebuild
   
   # 在 Android 上运行
   npx expo run:android
   ```

#### 方法二：使用真实设备

1. **启用开发者选项**
   - 设置 → 关于手机 → 连续点击版本号7次
   - 返回设置 → 开发者选项 → 启用USB调试

2. **连接设备**
   ```bash
   # 检查设备连接
   adb devices
   ```

3. **运行应用**
   ```bash
   # 预构建原生代码
   npx expo prebuild
   
   # 在连接的设备上运行
   npx expo run:android
   ```

### 调试工具

#### React Native Debugger
```bash
# 安装 React Native Debugger
brew install --cask react-native-debugger

# 或从官网下载
# https://github.com/jhen0409/react-native-debugger
```

#### Flipper (Meta 官方调试工具)
```bash
# 安装 Flipper
brew install --cask flipper

# 或从官网下载
# https://fbflipper.com/
```

## 常用命令

```bash
# 启动开发服务器
npm start

# 清除缓存启动
npm start -- --clear

# 在 Android 上运行
npm run android

# 在 iOS 上运行 (仅 macOS)
npm run ios

# 预构建原生代码
npm run prebuild

# 代码检查和格式化
npm run lint
npm run format

# 构建生产版本
eas build --platform android
eas build --platform ios

# 构建本地版本
eas build --platform android --local 
```

## 项目结构

```
├── app/                    # 应用页面 (Expo Router)
├── components/            # 可复用组件
│   ├── bootstrap/        # 启动相关组件
│   └── activity-indicator-global/  # 全局加载指示器
├── constants/            # 常量定义
├── hooks/               # 自定义 Hooks
├── store/               # Zustand 状态管理
├── utils/               # 工具函数
├── types/               # TypeScript 类型定义
├── assets/              # 静态资源
└── model/               # 数据模型
```

## 配置文件说明

- `app.json` - Expo 应用配置
- `eas.json` - EAS Build 配置
- `babel.config.js` - Babel 配置
- `metro.config.js` - Metro 打包器配置
- `tailwind.config.js` - TailwindCSS 配置

## 故障排除

### 常见问题

1. **Metro 缓存问题**
   ```bash
   npx expo start --clear
   ```

2. **Android 构建失败**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

3. **依赖冲突**
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **模拟器连接问题**
   ```bash
   adb kill-server
   adb start-server
   ```

### 重新生成原生代码

如果遇到原生代码相关问题，可以重新生成：

```bash
# 删除原生文件夹 (如果存在)
rm -rf android ios

# 重新生成
npx expo prebuild

# 重新运行
npx expo run:android
```

## 部署

### 开发构建
```bash
# Android 开发构建
eas build --profile development --platform android

# iOS 开发构建 (仅 macOS)
eas build --profile development --platform ios
```

### 生产构建
```bash
# Android 生产构建
eas build --profile production --platform android

# iOS 生产构建 (仅 macOS)
eas build --profile production --platform ios
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请创建 Issue 或联系项目维护者