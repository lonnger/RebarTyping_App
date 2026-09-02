/**
 * 首页布局调节区。
 *
 * 大多数位置和尺寸都可以只在这里修改：
 * - width / innerWidth / cardWidth / buttonWidth 使用百分比字符串。
 * - offsetX：正数向右，负数向左。
 * - offsetY：正数向下，负数向上。
 * - heightRatio：占“屏幕高度减去顶部估算高度”的比例。
 * - 三栏 width 相加最好保持 100%。
 * - 除百分比和比例外，其余尺寸单位均为 React Native 的 dp（逻辑像素）。
 * - 修改后保存即可热更新；如果某个比例没有明显效果，请检查 min/max 是否限制了它。
 */
export const HOME_LAYOUT = {
  // 页面整体和不同屏幕尺寸下的响应式留白。
  page: {
    // 设计时的参考画布；实际窗口小于它时，固定尺寸会按比例缩小。
    referenceWidth: 1280,
    referenceHeight: 800,
    // 全局缩放上下限：0.7 表示小屏最多缩到设计尺寸的 70%。
    minScale: 0.7,
    maxScale: 1,
    // 宽高同时低于紧凑断点时，再乘 compactScaleMultiplier，专门适配约 960×600dp 小平板。
    compactWidthBreakpoint: 1100,
    compactHeightBreakpoint: 700,
    compactScaleMultiplier: 0.93,
    // 页面允许的最小宽度；设备宽度小于该值时启用横向滚动。
    minWidth: 900,

    horizontalPadding: {
      // 主体三栏左右留白：分别用于小、中、大宽度设备。
      small: 16,
      medium: 24,
      large: 40,
      // 宽度达到这些断点后，切换到 medium / large 留白。
      mediumBreakpoint: 1100,
      largeBreakpoint: 1400,
    },

    verticalPadding: {
      // 主体三栏上下留白：分别用于低、中、高屏幕。
      small: 12,
      medium: 20,
      large: 32,
      // 高度达到这些断点后，切换到 medium / large 留白。
      mediumBreakpoint: 700,
      largeBreakpoint: 900,
    },
  },

  // 顶部：左侧 Logo，右侧软急停、锁屏、WiFi、设置和电量。
  header: {
    // 顶部区域的估算高度，用于计算左右面板的相对高度，不会直接锁死 Header 高度。
    estimatedHeight: 100,
    // 在系统安全区下方额外增加的顶部距离。
    safeAreaExtraTop: 20,
    // 顶部区域左右两边的内边距。
    horizontalPadding: 24,
    // 顶部区域整体位移：X 正数向右，Y 正数向下。
    offsetX: 0,
    offsetY: 5,

    logo: {
      // 左上角 Logo 的显示宽高。
      width: 408,
      height: 54,
      // 只移动 Logo 和其下方提示，不影响右侧按钮组。
      offsetX: 0,
      offsetY: 0,
    },

    controls: {
      // 软急停、锁屏、WiFi、设置、电量之间的距离。
      gap: 8,
      // 右侧按钮行距离 Header 顶部的额外距离。
      rowTopPadding: 6,
      // WiFi 和设置胶囊按钮的横向/纵向内部留白。
      pillHorizontalPadding: 26,
      pillVerticalPadding: 10,
      // 只移动右侧整组按钮，X 正数向右，Y 正数向下。
      offsetX: 0,
      offsetY: 0,
    },
  },

  // 左侧：故障监控和数据监控。
  left: {
    // 左栏占主体总宽度的比例；left + center + right 最好等于 100%。
    width: '37%' as const,
    // 两张卡片外层容器占左栏的宽度。
    innerWidth: '95%' as const,
    // 每张监控卡片占外层容器的宽度，改成 100% 可完全撑满。
    cardWidth: '91.666667%' as const,
    // 首选高度 =（屏幕高度 - header.estimatedHeight）× heightRatio。
    heightRatio: 0.45,
    // 首选高度最终会被限制在 minHeight 和 maxHeight 之间。
    minHeight: 540,
    maxHeight: 680,
    // 故障监控与数据监控两张卡片之间的距离。
    cardGap: 16,
    // 两张卡片的高度权重；1:1 等高，1.2:0.8 表示约 60%:40%。
    errorCardFlex: 0.9,
    dataCardFlex: 1.1,
    // 左侧两张卡片整体位移，X 正数向右，Y 正数向下。
    offsetX: 0,
    offsetY: -20,
  },

  // 中间：两张机器人图片和参数设置按钮。
  center: {
    // 中间栏占主体总宽度的比例。
    width: '26%' as const,
    // 中间图片和参数按钮整体位移，X 正数向右，Y 正数向下。
    offsetX: 0,
    offsetY: -10,

    image: {
      // 单张机器人图片允许的最小和最大边长。
      minSize: 140,
      maxSize: 360,
      // 宽度候选值 = 屏幕宽度 / widthDivisor；除数越小，图片越大。
      widthDivisor: 4.8,
      // 高度候选值 =（屏幕高度 - reservedHeight）/ heightDivisor。
      reservedHeight: 220,
      // 除数越小，按高度计算出的图片越大。
      heightDivisor: 2.25,
      // 第二张图片下方到参数设置按钮的距离。
      bottomSpacing: 20,
    },

    // 参数设置按钮占中间栏的宽度。
    buttonWidth: '80%' as const,
  },

  // 右侧：机器人操作。
  right: {
    // 右栏占主体总宽度的比例。
    width: '37%' as const,
    // 机器人操作卡片占右栏的宽度。
    innerWidth: '95%' as const,
    // 普通模式首选高度的计算比例，算法与 left.heightRatio 相同。
    heightRatio: 0.45,
    // 普通模式操作卡片高度的最小值和最大值。
    minHeight: 500,
    maxHeight: 680,
    // 自动满扎模式高度 = 普通高度 + fullBindingExtraHeight。
    fullBindingExtraHeight: 10,
    // 自动满扎模式扩大后的高度不会超过该值。
    fullBindingMaxHeight: 510,
    // 约 960×600dp 小平板上，满扎卡片使用的紧凑模式最小设计高度（仍会乘全局 scale）。
    compactFullBindingMinHeight: 570,
    // 自动跳扎模式高度 = 普通高度 + skipBindingExtraHeight。
    skipBindingExtraHeight: 60,
    // 自动跳扎模式扩大后的高度不会超过该值。
    skipBindingMaxHeight: 560,
    // 约 960×600dp 小平板上，跳扎卡片使用的紧凑模式最小设计高度（仍会乘全局 scale）。
    compactSkipBindingMinHeight: 620,
    // 右侧操作卡片整体位移，X 正数向右，Y 正数向下。
    offsetX: 0,
    offsetY: -30,

    // 操作卡片内部内容的左右、顶部和底部留白。
    contentPaddingHorizontal: 22,
    contentPaddingTop: 8,
    contentPaddingBottom: 20,

    // “锁止 / 手动 / 自动”和自动模式下第二排模式选择。
    modeSelector: {
      // 第一排模式按钮距离标题的距离。
      marginTop: 16,
      // 整个模式选择区域与下方方向控制区的距离。
      marginBottom: 40,
      // 自动模式出现第二排选项时，两排按钮之间的距离。
      rowGap: 20,
      // 模式按钮中文字的字号。
      labelFontSize: 11,
    },

    // 方向控制区域预留的最小高度；增大可给方向键留出更多空间。
    controlAreaMinHeight: 200,

    // 操作内容与底部“剪断丝线/触发变轨”等按钮之间的留白。
    operationContentBottomSpacing: 12,
    // 底部功能按钮的下边缘到机器人操作框底边的固定距离（dp，不参与全局缩放）。
    // 外框随满扎/跳扎增高或缩短时，按钮会始终跟随底边移动并保持该距离。
    extraButtonsBottomSpacing: 16,

    // 自动模式：开始/停止按钮、四个方向键和中心方向图片。
    automaticDirection: {
      // 仅满扎模式生效：四个方向键和中央图片整体向下移动的距离。
      fullBindingDirectionOffsetY: 6,
      // 自动方向控制整体距离上方模式选择器的距离；增大即整体向下。
      containerMarginTop: 74,
      // 上下左右四个方向箭头图片的边长。
      arrowSize: 55,
      // 箭头图片外围的可点击留白；增大可扩大触摸区域。
      arrowTouchPadding: 8,
      // 上下箭头向中心外展开的距离；越大，上下距离越远。
      verticalArrowOffset: 30,
      // 左右箭头向中心外展开的距离；越大，左右距离越远。
      horizontalArrowOffset: 30,
      // 上下两个箭头布局槽之间、左右两个箭头布局槽之间的间距。
      verticalGap: 40,
      horizontalGap: 40,
      // 中央 direction_tags 图片的边长。
      centerImageSize: 100,
      // 中央图片相对容器底部的位置；负数会向下移，正数会向上移。
      centerImageBottomOffset: -8,
      // 用来撑开自动方向控制布局的透明占位尺寸。
      invisibleCenterSize: 80,
      // 开始/停止按钮纵向位置；负数越小（如 -110）越靠上。
      startStopVerticalOffset: -90,
      // 开始和停止按钮向左右两边展开的距离；越大越靠外。
      startStopHorizontalOffset: 50,
      // 开始与停止两个按钮布局槽之间的距离。
      startStopGap: 40,
      // 开始/停止按钮文字大小。
      startStopFontSize: 16,
      // 跳扎数量选择区域与方向控制区域之间的距离。
      skipBindingMarginTop: 80,
    },

    // 手动模式：四个方向键和中心方向图片。
    manualDirection: {
      // 手动方向控制整体容器的宽高。
      containerWidth: 150,
      containerHeight: 190,
      // 手动方向控制整体距离上方模式选择器的距离；增大即向下。
      containerMarginTop: 35,
      // 上下左右四个方向箭头图片的边长。
      arrowSize: 60,
      // 箭头图片外围的可点击留白。
      arrowTouchPadding: 15,
      // 上下箭头、左右箭头分别向中心外展开的距离。
      verticalArrowOffset: 32,
      horizontalArrowOffset: 40,
      // 上下/左右两个箭头布局槽之间的间距。
      verticalGap: 40,
      horizontalGap: 40,
      // 手动模式中央 direction_tags 图片的边长。
      centerImageSize: 130,
    },

    // 底部功能按钮（剪断丝线、触发变轨、下降等）之间的距离。
    extraButtonsGap: 15,
    // 底部功能按钮行占操作框内部可用宽度的比例。
    extraButtonsRowWidth: '92%' as const,
    // 底部功能按钮文字大小；小屏会随全局比例缩小，但最低保持 10。
    extraButtonsFontSize: 11,
    // 功能按钮内容的左右内边距；设小一些可保证 8 英寸平板上两个按钮并排。
    extraButtonContentPaddingHorizontal: 0,
  },
} as const;
