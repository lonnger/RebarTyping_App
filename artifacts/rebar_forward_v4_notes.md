# 前进动画 V4：连续循环版

- `rebar_forward_v4.webp`：1280 × 720，150 帧，30 fps，5 秒无缝循环。
- `rebar_forward_v4.gif`：720 × 405，150 帧，30 fps，5 秒预览版。
- `rebar_backward_v4.webp`：规则钢筋向后运动，1280 × 720。
- `rebar_backward_v4.gif`：规则钢筋向后运动预览，720 × 405。
- `rebar_forward_v4_preview.png`：静态预览图。
- 运行 `node tools/make_forward_v4.cjs` 可重新生成动画。

V4 不再放大整张钢筋图片，也不在循环点交叉淡化。横向钢筋位置和每根纵向钢筋的螺纹都以一个完整间距为周期推进；第 150 帧之后直接衔接第 1 帧，循环点速度与普通相邻帧一致。设备中心继续对准中央纵向钢筋。

运行脚本时增加参数 `backward` 可生成向后版本。
