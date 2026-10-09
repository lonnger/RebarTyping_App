# 前进动画（去除底部部件版）

- `machine_cutout_no_pin.png`：编辑后的透明设备素材。
- `rebar_forward_no_pin.webp`：960 × 600，20 fps，6 秒无限循环。
- `rebar_forward_no_pin.gif`：720 × 450，20 fps，6 秒无限循环。
- 运行 `node tools/make_forward_no_pin.cjs` 可重新生成动画。

使用内置 image_gen 编辑用户提供的 PNG；保留原始文件。钢筋网使用代码生成的透视几何，不是原图中的钢筋照片。动画包含向前行驶的地面相对运动和轻微机身起伏。

最终图片编辑提示词：

Use case: precise-object-edit. Edit target: supplied frontal industrial robot cutout. Remove the black oval component near the bottom center of the white cabinet and seamlessly fill that area with matching white/silver cabinet shading. Remove the thin vertical metal screw/tool pin protruding downward at the center beneath the cabinet. Preserve everything else: exact proportions, cabinet, front panel and its small corner fasteners, logo 河狸, green indicator, top black knob, beige lateral cylinder and both long white base rails. Clean isolated complete assembly with genuinely transparent background, clean antialiased edges and transparent gaps between rails. No ground, no backdrop, no added shadows or objects. Output PNG with real alpha, retain original frontal composition and full assembly.
