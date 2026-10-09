# 前进动画 V5：写实钢筋无缝循环版

- `rebar_forward_v5.webp`：1280 × 720，150 帧，30 fps，5 秒循环。
- `rebar_forward_v5.gif`：720 × 405，150 帧，每帧 20 ms，约 3 秒循环。
- `rebar_backward_v5.webp`：写实钢筋向后运动，1280 × 720。
- `rebar_backward_v5.gif`：写实钢筋向后运动预览，720 × 405，约 3 秒循环。
- `rebar_forward_v5_preview.png`：静态预览图。
- 运行 `node tools/make_forward_v5.cjs` 可重新生成。

V5 继续使用 `rebar_floor_texture_v3.png` 的写实钢筋材质。运动采用透视深度位移，近处移动快、远处移动慢。每格钢筋纹理在自己的透视边界内循环，首尾使用同一组像素，不做透明叠加，因此没有衔接重影。机器中心保持对准中央纵向钢筋。运行脚本时增加参数 `backward` 可生成向后版本。
