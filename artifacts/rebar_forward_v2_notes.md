# 前进动画 V2

- `machine_cutout_clean_v2.png`：清理后的透明设备素材。
- `rebar_forward_v2.webp`：1280 × 720，24 fps，5 秒无缝循环。
- `rebar_forward_v2.gif`：1280 × 720，24 fps，5 秒无缝循环。
- `rebar_forward_v2_preview.png`：静态预览图。
- 运行 `node tools/make_forward_v2.cjs` 可以重新生成动画。

动画包含透视钢筋地面、向前运动、机身轻微起伏、左右微动、接触阴影和绿灯呼吸效果。图像编辑使用内置 imagegen；动画场景由项目内脚本生成。

最终图像编辑提示词：

Use case: precise-object-edit. Asset type: transparent product cutout for an industrial-machine motion graphic. Input image: edit target. Primary request: cleanly remove every unwanted component at the bottom of the central cabinet: remove the black oval piece on the lower front face; remove the thin vertical metal screw/pin projecting downward; remove the two small black feet/rollers visible along the cabinet's lower edge. Reconstruct the cabinet face and lower edge with matching white-silver metal shading, and leave the area beneath the cabinet transparent. Preserve exactly: frontal viewpoint, proportions, main cabinet, top black knob, green lamp, front handle, outlined access panel and its four corner screws, the 河狸 logo and colors, beige horizontal cylinder, white support rails, and the long white bottom crossbar. Background: genuine transparency with clean antialiased edges and transparent gaps. Constraints: change only the listed bottom components; do not redraw, stylize, crop, enlarge, add hardware, add shadows, change the logo/text, or alter the machine geometry. Keep the full assembly centered at the original scale. Output one transparent PNG.
