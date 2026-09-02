import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ControlBar } from '@/components/control-bar';
import { DangerousStatus } from '@/components/dangerous-status';
import { DataInspect } from '@/components/data-inspect';
import { ErrorData } from '@/components/error-data';
import { Header } from '@/components/header';
import { LockedStatus } from '@/components/locked-status';
import { StatusBox } from '@/components/status-box';
import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const Home = () => {
  const { robotStatus } = useStore((state) => state);
  const { width, height, scale, isCompact } = useHomeLayoutScale();
  const { page, header, left, center, right } = HOME_LAYOUT;
  const scaled = (value: number) => scaleHomeValue(value, scale);
  const headerHeight = scaled(header.estimatedHeight);
  const availablePanelHeight = height - headerHeight;
  const scaledMinWidth = scaled(page.minWidth);
  const layoutWidth = Math.max(width, scaledMinWidth);
  const horizontalPadding =
    width >= page.horizontalPadding.largeBreakpoint
      ? scaled(page.horizontalPadding.large)
      : width >= page.horizontalPadding.mediumBreakpoint
        ? scaled(page.horizontalPadding.medium)
        : scaled(page.horizontalPadding.small);
  const verticalPadding =
    height >= page.verticalPadding.largeBreakpoint
      ? scaled(page.verticalPadding.large)
      : height >= page.verticalPadding.mediumBreakpoint
        ? scaled(page.verticalPadding.medium)
        : scaled(page.verticalPadding.small);
  const leftPanelHeight = clamp(
    Math.round(availablePanelHeight * left.heightRatio),
    scaled(left.minHeight),
    scaled(left.maxHeight)
  );
  const normalRightPanelHeight = clamp(
    Math.round(availablePanelHeight * right.heightRatio),
    scaled(right.minHeight),
    scaled(right.maxHeight)
  );
  const isSkipBindingMode =
    robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO &&
    robotStatus.currentBindingMode === ROBOT_WORK_MODE.SKIP_BINDING;
  const isFullBindingMode =
    robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO &&
    robotStatus.currentBindingMode === ROBOT_WORK_MODE.FULL_BINDING;
  const skipBindingPanelHeight = Math.min(
    normalRightPanelHeight + scaled(right.skipBindingExtraHeight),
    scaled(right.skipBindingMaxHeight)
  );
  const fullBindingPanelHeight = Math.min(
    normalRightPanelHeight + scaled(right.fullBindingExtraHeight),
    scaled(right.fullBindingMaxHeight)
  );
  const rightPanelHeight = isSkipBindingMode
    ? Math.max(skipBindingPanelHeight, isCompact ? scaled(right.compactSkipBindingMinHeight) : 0)
    : isFullBindingMode
      ? Math.max(fullBindingPanelHeight, isCompact ? scaled(right.compactFullBindingMinHeight) : 0)
      : normalRightPanelHeight;
  const centerImageSize = Math.floor(
    Math.max(
      scaled(center.image.minSize),
      Math.min(
        width / center.image.widthDivisor,
        (height - scaled(center.image.reservedHeight)) / center.image.heightDivisor,
        scaled(center.image.maxSize)
      )
    )
  );
  const estimatedCenterHeight = centerImageSize * 2 + scaled(center.image.bottomSpacing + 48);
  // 左侧和中间始终以普通模式的主体高度定位，避免右侧扩展时被重新居中而下移。
  const baseContentHeight = Math.max(
    leftPanelHeight,
    normalRightPanelHeight,
    estimatedCenterHeight
  );
  // 右侧卡片保持普通模式时的顶部位置，只在满扎/跳扎时向下扩展。
  const normalRightTopOffset = Math.max(0, (baseContentHeight - normalRightPanelHeight) / 2);
  const rightColumnHeight = normalRightTopOffset + rightPanelHeight;
  const bodyHeight = Math.max(baseContentHeight, rightColumnHeight) + verticalPadding * 2;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView
        horizontal
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
        showsHorizontalScrollIndicator={width < scaledMinWidth}>
        <ScrollView
          style={{ flex: 1, width: layoutWidth }}
          bounces={false}
          nestedScrollEnabled
          showsVerticalScrollIndicator>
          <View style={{ width: layoutWidth }}>
            <Header />
            {robotStatus.robotDangerStatus ? <DangerousStatus /> : null}
            {robotStatus.robotLockedStatus ? <LockedStatus /> : null}

            <View
              className="w-full flex-row"
              style={{
                height: bodyHeight,
                alignItems: 'flex-start',
                paddingHorizontal: horizontalPadding,
                paddingVertical: verticalPadding,
              }}>
              <View
                style={{
                  width: left.width,
                  height: baseContentHeight,
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    alignSelf: 'center',
                    justifyContent: 'center',
                    width: left.innerWidth,
                    height: leftPanelHeight,
                    gap: scaled(left.cardGap),
                    transform: [
                      { translateX: scaled(left.offsetX) },
                      { translateY: scaled(left.offsetY) },
                    ],
                  }}>
                  <ErrorData />
                  <DataInspect />
                </View>
              </View>

              <View
                style={{
                  width: center.width,
                  height: baseContentHeight,
                  justifyContent: 'center',
                  transform: [
                    { translateX: scaled(center.offsetX) },
                    { translateY: scaled(center.offsetY) },
                  ],
                }}>
                <StatusBox />
              </View>

              <View
                style={{
                  width: right.width,
                  height: rightColumnHeight,
                  justifyContent: 'flex-end',
                }}>
                <View
                  style={{
                    alignSelf: 'center',
                    justifyContent: 'center',
                    width: right.innerWidth,
                    height: rightPanelHeight,
                    transform: [
                      { translateX: scaled(right.offsetX) },
                      { translateY: scaled(right.offsetY) },
                    ],
                  }}>
                  <ControlBar />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Home;
