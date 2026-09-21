#!/usr/bin/env python3
"""
Chroma-Key Sticker Extractor & Slicer (ChromaKeySlicer)
======================================================
Extracts sticker-style icons from chroma-key green (#00FF00) sprite sheets
while 100% preserving all interior green elements (e.g. Android robots, mint
paint, status badges, vegetation) using Exterior Connected Components
(border-seeded flood fill) and surgical edge de-spill.

Key Features:
1. Exterior Connected Components: Seeds strictly from image cell borders.
   Guarantees that green pixels inside the sticker's outline are untouched.
2. 1px Exterior Dilation: Eliminates outer JPEG compression noise.
3. Boundary-Only De-spill: Removes green fringing ONLY from the outermost
   1-2px white die-cut keyline.
4. Smooth Alpha Matting: Anti-aliased boundary feathering.
5. Auto-Crop & WebP/PNG Export: Compact, retina-ready lightweight assets.
"""

import os
import sys
import argparse
from PIL import Image
import numpy as np
import scipy.ndimage as ndi


def remove_chroma_background(cell_rgb: np.ndarray) -> tuple[Image.Image, np.ndarray]:
    """
    Removes exterior chroma-key green background using Connected Components,
    preserving all enclosed interior green pixels with surgical edge de-spill.
    """
    ch, cw, _ = cell_rgb.shape
    cell = cell_rgb.copy()
    
    r = cell[:, :, 0].astype(float)
    g = cell[:, :, 1].astype(float)
    b = cell[:, :, 2].astype(float)
    
    # 1. Chroma-key green detection
    green_score = g - np.maximum(r, b)
    is_chroma = (g > 125) & (green_score > 30)
    
    # 2. Connected components starting ONLY from image cell borders (Exterior Flood Fill)
    labeled, num_features = ndi.label(is_chroma)
    border_mask = np.zeros((ch, cw), dtype=bool)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True
    
    border_labels = set(np.unique(labeled[border_mask]))
    border_labels.discard(0)
    
    # Exterior background pixels
    exterior_bg = np.isin(labeled, list(border_labels))
    
    # 3. Clean 1px outer expansion to eliminate JPEG compression artifacts
    exterior_clean = ndi.binary_dilation(exterior_bg, iterations=1)
    
    # 4. De-spill ONLY the outer 1-2px white fringe directly adjacent to exterior_clean
    fringe = ndi.binary_dilation(exterior_clean, iterations=2) & ~exterior_clean
    fringe_green = fringe & (cell[:, :, 1].astype(float) - np.maximum(cell[:, :, 0], cell[:, :, 2]) > 8)
    cell[fringe_green, 1] = np.maximum(cell[fringe_green, 0], cell[fringe_green, 2])
    
    # 5. Anti-aliased alpha matte
    alpha = np.where(exterior_clean, 0, 255).astype(np.uint8)
    alpha_float = ndi.gaussian_filter(alpha.astype(float), sigma=0.5)
    alpha_final = np.clip(alpha_float, 0, 255).astype(np.uint8)
    alpha_final[exterior_bg] = 0
    interior_solid = ~ndi.binary_dilation(exterior_clean, iterations=2)
    alpha_final[interior_solid] = 255
    
    rgba = np.dstack((cell, alpha_final))
    return Image.fromarray(rgba, mode="RGBA"), alpha_final


def crop_and_scale(cell_rgba: Image.Image, alpha_mask: np.ndarray, max_dim: int = 180, pad: int = 4) -> Image.Image:
    """
    Auto-crops image to visible bounding box with padding and scales to max_dim.
    """
    ch, cw = alpha_mask.shape
    non_empty = np.where(alpha_mask > 10)
    if len(non_empty[0]) == 0:
        return None
    
    ymin, ymax = non_empty[0].min(), non_empty[0].max()
    xmin, xmax = non_empty[1].min(), non_empty[1].max()
    
    ymin = max(0, ymin - pad)
    xmin = max(0, xmin - pad)
    ymax = min(ch, ymax + pad)
    xmax = min(cw, xmax + pad)
    
    cropped = cell_rgba.crop((xmin, ymin, xmax, ymax))
    scale = min(max_dim / cropped.width, max_dim / cropped.height, 1.0)
    target_w = max(1, int(cropped.width * scale))
    target_h = max(1, int(cropped.height * scale))
    
    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def slice_spritesheet(
    sheet_path: str,
    output_dir: str,
    rows: int = 3,
    cols: int = 4,
    names: list = None,
    max_dim: int = 180,
    out_format: str = "webp",
    quality: int = 92
):
    """
    Slices a sprite sheet into transparent icons using Connected Components.
    """
    if not os.path.exists(sheet_path):
        raise FileNotFoundError(f"Source spritesheet not found: {sheet_path}")
    
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(sheet_path).convert("RGB")
    arr = np.array(img)
    h, w, _ = arr.shape
    
    col_w = w / float(cols)
    row_h = h / float(rows)
    
    print(f"[*] Processing spritesheet: {sheet_path}")
    print(f"[*] Resolution: {w}x{h} ({cols} cols x {rows} rows)")
    print(f"[*] Output directory: {output_dir}")
    print(f"[*] Max dimension: {max_dim}px | Format: {out_format.upper()} (Quality {quality})")
    print("-" * 60)
    
    idx = 0
    saved_count = 0
    for r in range(rows):
        for c in range(cols):
            x1 = int(c * col_w)
            y1 = int(r * row_h)
            x2 = int((c + 1) * col_w)
            y2 = int((r + 1) * row_h)
            
            cell_rgb = arr[y1:y2, x1:x2]
            cell_rgba, alpha_mask = remove_chroma_background(cell_rgb)
            final_icon = crop_and_scale(cell_rgba, alpha_mask, max_dim=max_dim)
            
            if final_icon is None:
                print(f"[!] Warning: Cell (row={r}, col={c}) is empty. Skipped.")
                idx += 1
                continue
            
            # Determine output filename
            if names and idx < len(names):
                fname = names[idx]
                if not fname.lower().endswith(f".{out_format.lower()}"):
                    fname = f"{os.path.splitext(fname)[0]}.{out_format.lower()}"
            else:
                fname = f"icon_{r}_{c}.{out_format.lower()}"
            
            dest_path = os.path.join(output_dir, fname)
            if out_format.lower() == "webp":
                final_icon.save(dest_path, "WEBP", quality=quality, method=6)
            else:
                final_icon.save(dest_path, "PNG", optimize=True)
            
            file_size = os.path.getsize(dest_path)
            print(f"[+] Saved: {fname:24} -> {final_icon.width}x{final_icon.height}px ({file_size / 1024:.1f} KB)")
            idx += 1
            saved_count += 1
            
    print("-" * 60)
    print(f"[OK] Successfully sliced and optimized {saved_count} icons!")


def main():
    parser = argparse.ArgumentParser(
        description="Extract sticker-style UI icons from chroma-key green sprite sheets with 100% interior green preservation."
    )
    parser.add_argument("-i", "--input", required=True, help="Path to input spritesheet image (JPG, PNG)")
    parser.add_argument("-o", "--output", default="./output", help="Output directory path (default: ./output)")
    parser.add_argument("-r", "--rows", type=int, default=3, help="Number of rows in the grid (default: 3)")
    parser.add_argument("-c", "--cols", type=int, default=4, help="Number of columns in the grid (default: 4)")
    parser.add_argument("-n", "--names", nargs="*", help="List of output filenames in row-major order")
    parser.add_argument("-s", "--size", type=int, default=180, help="Max dimension in pixels (default: 180)")
    parser.add_argument("-f", "--format", choices=["webp", "png"], default="webp", help="Output format (default: webp)")
    parser.add_argument("-q", "--quality", type=int, default=92, help="WebP compression quality (default: 92)")
    
    args = parser.parse_args()
    slice_spritesheet(
        sheet_path=args.input,
        output_dir=args.output,
        rows=args.rows,
        cols=args.cols,
        names=args.names,
        max_dim=args.size,
        out_format=args.format,
        quality=args.quality
    )


if __name__ == "__main__":
    main()
