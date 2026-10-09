# 前进动画 V3：写实螺纹钢版

- `rebar_floor_texture_v3.png`：根据用户参考图整理出的无机器钢筋地面。
- `rebar_forward_v3.webp`：1280 × 720，150 帧，30 fps，约 5 秒循环。
- `rebar_forward_v3.gif`：720 × 405，150 帧，30 fps，约 5 秒循环。
- `rebar_forward_v3_preview.gif`：720 × 405，150 帧，轻量预览版。
- `rebar_forward_v3_preview.png`：静态预览。
- 运行 `node tools/make_forward_v3.cjs` 可重新生成动画。

保留 V2 的干净设备素材、轻微机身起伏和绿灯呼吸效果；地面替换为写实螺纹钢图片，并以地平线为锚点进行透视推进。

图像生成提示词：

Use case: precise-object-edit. Asset type: clean background plate for a 16:9 industrial machine animation. Input image: edit target and exact material reference. Primary request: remove the complete machine, its white rails, beige cylinder, logo, black background and all irregular white cutout remnants. Reconstruct a full-frame, empty perspective floor made only from the same realistic ribbed steel reinforcing bars seen in the lower half of the reference. Keep the convincing metallic texture: dark steel, bright curved highlights, deep grooves and dense raised helical ribs. Extend the rebar grid cleanly through the center where the machine was, with straight perspective lines converging toward a centered horizon. Scene/backdrop: clean pale-gray studio/industrial background above the horizon, softly lit, no wall details. Composition: landscape 16:9; horizon around 40% from the top; the foreground rebar grid fills the bottom 60%; moderately dense transverse bars matching the reference image. Constraints: no machine, no rails, no cylinder, no logos, no text, no people, no tools, no debris, no black background, no transparent holes. Preserve the reference rebar's photorealistic ribbed geometry and high-contrast metallic surface. Produce one clean background plate.
