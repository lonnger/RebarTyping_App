from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


SOURCE = Path(r"C:\Users\1\AppData\Local\Temp\codex-clipboard-6be9a2ff-1b7c-41b3-be83-8e4ef6763c1e.png")
OUTPUT = Path(r"E:\HKCRC\SoftWare\RebarTyping_App\artifacts")


def scaled_about(img: Image.Image, scale: float, anchor: tuple[float, float]) -> Image.Image:
    ax, ay = anchor
    matrix = (
        1.0 / scale,
        0.0,
        ax - ax / scale,
        0.0,
        1.0 / scale,
        ay - ay / scale,
    )
    return img.transform(img.size, Image.Transform.AFFINE, matrix, Image.Resampling.BICUBIC)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    base = Image.open(SOURCE).convert("RGBA")
    width, height = base.size

    # Soft gradient: only the steel-mesh floor receives the perspective push.
    # Everything above the floor stays pixel-for-pixel identical to the source.
    ground_mask = Image.new("L", base.size, 0)
    mask_pixels = np.zeros((height, width), dtype=np.uint8)
    start_y, full_y = int(height * 0.575), int(height * 0.80)
    for y in range(start_y, height):
        t = min(1.0, max(0.0, (y - start_y) / (full_y - start_y)))
        t = t * t * (3.0 - 2.0 * t)
        mask_pixels[y, :] = int(255 * t)
    ground_mask = Image.fromarray(mask_pixels, mode="L").filter(ImageFilter.GaussianBlur(5))

    # Protect the machine, the pale cylindrical side rods, and the lower carriage.
    # For the rods/carriage we use a brightness-qualified mask, avoiding a broad
    # rectangular patch that would freeze parts of the steel mesh underneath.
    machine_mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(machine_mask)
    draw.polygon(
        [
            (616, 227), (646, 227), (648, 173), (855, 173), (858, 226),
            (895, 228), (895, 691), (620, 691), (620, 264), (616, 264),
        ],
        fill=255,
    )

    rgb = np.asarray(base.convert("RGB"), dtype=np.int16)
    luminance = (rgb[:, :, 0] * 3 + rgb[:, :, 1] * 6 + rgb[:, :, 2]) // 10
    detail = np.zeros((height, width), dtype=np.uint8)

    # Beige/white side cylinders behind the cabinet.
    rod_region = np.zeros((height, width), dtype=bool)
    rod_region[570:684, 402:1092] = True
    warm_or_light = (luminance > 126) & (rgb[:, :, 0] >= rgb[:, :, 2] - 5)
    detail[rod_region & warm_or_light] = 255

    # White horizontal carriage and its small end supports.
    rail_region = np.zeros((height, width), dtype=bool)
    rail_region[660:752, 300:1200] = True
    rail_material = (luminance > 112) & (np.max(rgb, axis=2) - np.min(rgb, axis=2) < 58)
    detail[rail_region & rail_material] = 255

    detail_mask = Image.fromarray(detail, mode="L").filter(ImageFilter.MaxFilter(7))
    machine_mask = Image.fromarray(
        np.maximum(np.asarray(machine_mask), np.asarray(detail_mask)).astype(np.uint8),
        mode="L",
    ).filter(ImageFilter.GaussianBlur(1.2))

    fps = 16
    seconds = 4.5
    count = int(fps * seconds)
    frames = []

    for index in range(count):
        t = index / (count - 1)
        ease = t * t * (3.0 - 2.0 * t)

        # A slow, accelerating perspective push gives the impression of travel.
        ground = scaled_about(base, 1.0 + 0.115 * ease, (width * 0.50, height * 0.54))
        frame = Image.composite(ground, base, ground_mask)

        # Restore protected machine parts exactly from the source. No added glow,
        # particles, background elements, or chassis displacement.
        frame = Image.composite(base, frame, machine_mask)

        # Slight contrast lift compensates for GIF/WebP compression.
        frame = ImageEnhance.Contrast(frame.convert("RGB")).enhance(1.025)
        frames.append(frame)

    # High-quality animated WebP.
    webp_frames = [f.resize((1200, 750), Image.Resampling.LANCZOS) for f in frames]
    webp_path = OUTPUT / "rebar_machine_forward_refined.webp"
    webp_frames[0].save(
        webp_path,
        save_all=True,
        append_images=webp_frames[1:],
        duration=round(1000 / fps),
        loop=0,
        quality=86,
        method=6,
    )

    # Smaller universal preview GIF.
    gif_frames = [f.resize((750, 469), Image.Resampling.LANCZOS) for f in frames]
    gif_path = OUTPUT / "rebar_machine_forward_refined.gif"
    gif_frames[0].save(
        gif_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=round(1000 / fps),
        loop=0,
        disposal=2,
        optimize=False,
    )

    poster = frames[count // 2].resize((1200, 750), Image.Resampling.LANCZOS)
    poster.save(OUTPUT / "rebar_machine_forward_refined_preview.png", optimize=True)

    print(webp_path)
    print(gif_path)


if __name__ == "__main__":
    main()
