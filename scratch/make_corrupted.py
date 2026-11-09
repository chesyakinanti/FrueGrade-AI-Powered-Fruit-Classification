import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import random

# Load a base image or create a distorted composition
base = Image.open('assets/img/orange.jpg').convert('RGB')
w, h = base.size

arr = np.array(base)

# 1. Add horizontal slice displacement / tearing
num_slices = 16
for _ in range(num_slices):
    y1 = random.randint(0, h - 30)
    slice_h = random.randint(8, 40)
    y2 = min(h, y1 + slice_h)
    shift = random.randint(-60, 60)
    arr[y1:y2] = np.roll(arr[y1:y2], shift, axis=1)

# 2. Add RGB channel shift (chromatic glitch)
r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]

r_shift = np.roll(r, 12, axis=1)
b_shift = np.roll(b, -14, axis=1)
arr[:, :, 0] = r_shift
arr[:, :, 2] = b_shift

# 3. Add digital noise & scanline bands
for y in range(0, h, 3):
    arr[y, :, :] = (arr[y, :, :] * 0.7).astype(np.uint8)

# 4. Add corrupted digital block artifacts (magenta / cyan / gray blocks)
for _ in range(8):
    bx = random.randint(0, w - 80)
    by = random.randint(0, h - 40)
    bw = random.randint(40, 140)
    bh = random.randint(10, 35)
    block_type = random.choice(['noise', 'invert', 'magenta', 'green', 'gray'])
    
    if block_type == 'noise':
        noise = np.random.randint(0, 255, (bh, bw, 3), dtype=np.uint8)
        arr[by:by+bh, bx:bx+bw] = noise
    elif block_type == 'invert':
        arr[by:by+bh, bx:bx+bw] = 255 - arr[by:by+bh, bx:bx+bw]
    elif block_type == 'magenta':
        arr[by:by+bh, bx:bx+bw, 0] = 220
        arr[by:by+bh, bx:bx+bw, 1] = 30
        arr[by:by+bh, bx:bx+bw, 2] = 180
    elif block_type == 'green':
        arr[by:by+bh, bx:bx+bw, 0] = 20
        arr[by:by+bh, bx:bx+bw, 1] = 220
        arr[by:by+bh, bx:bx+bw, 2] = 50
    elif block_type == 'gray':
        arr[by:by+bh, bx:bx+bw] = 120

# 5. Heavy motion blur / sensor smearing on a section
corrupted_img = Image.fromarray(arr)
# Add some blur
blurred = corrupted_img.filter(ImageFilter.GaussianBlur(radius=3))
# Blend partially
final_img = Image.blend(corrupted_img, blurred, 0.4)

final_img.save('scratch/preview_corrupted.jpg', quality=75)
print('Generated scratch/preview_corrupted.jpg successfully')
