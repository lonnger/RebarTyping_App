import { useWindowDimensions } from 'react-native';

import { HOME_LAYOUT } from '@/constants/home-layout';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** 根据当前窗口相对 1280×800 参考画布计算首页统一缩放比例。 */
export const useHomeLayoutScale = () => {
  const { width, height } = useWindowDimensions();
  const { page } = HOME_LAYOUT;
  const baseScale = Math.min(width / page.referenceWidth, height / page.referenceHeight);
  const isCompact = width < page.compactWidthBreakpoint && height < page.compactHeightBreakpoint;
  const scale = clamp(
    baseScale * (isCompact ? page.compactScaleMultiplier : 1),
    page.minScale,
    page.maxScale
  );

  return { scale, width, height, isCompact };
};

/** 缩放 dp 尺寸，并取整避免小数像素造成轻微模糊。 */
export const scaleHomeValue = (value: number, scale: number) => Math.round(value * scale);
