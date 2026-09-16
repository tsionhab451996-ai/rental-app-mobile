from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent / 'assets' / 'images'
root.mkdir(parents=True, exist_ok=True)

for name in [
    'icon.png',
    'splash-icon.png',
    'favicon.png',
    'android-icon-foreground.png',
    'android-icon-background.png',
    'android-icon-monochrome.png',
]:
    target = root / name
    if target.exists():
        target.unlink()


def make_logo(size: int, bg_color, fg_color, accent_color, accent2_color, outline_color=None):
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    m = size // 8
    cx = size // 2
    cy = size // 2

    sm = size // 16
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle((sm + 3, sm + 3, size - sm + 3, size - sm + 3), radius=size // 5, fill=(0, 0, 0, 30))
    img = Image.alpha_composite(img, shadow)

    draw.rounded_rectangle(
        (sm, sm, size - sm, size - sm),
        radius=size // 5,
        fill=bg_color,
        outline=outline_color or fg_color,
        width=max(2, size // 50),
    )

    roof = [
        (cx, m + size // 12),
        (size - m - size // 14, cy - size // 14),
        (m + size // 14, cy - size // 14),
    ]
    draw.polygon(roof, fill=accent_color)

    draw.rounded_rectangle(
        (m + size // 12, cy - size // 14, size - m - size // 12, cy + size // 3),
        radius=size // 20,
        fill=accent2_color,
    )

    draw.rounded_rectangle(
        (cx - size // 20, cy - size // 30, cx + size // 20, cy + size // 3),
        radius=size // 28,
        fill=fg_color,
    )

    door_shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    dsd = ImageDraw.Draw(door_shadow)
    dsd.rounded_rectangle(
        (cx - size // 20 + 2, cy - size // 30 + 2, cx + size // 20 + 2, cy + size // 3 + 2),
        radius=size // 28,
        fill=(0, 0, 0, 40),
    )
    img = Image.alpha_composite(img, door_shadow)

    win_left = (
        m + size // 7,
        cy - size // 12,
        cx - size // 10,
        cy + size // 14,
    )
    draw.rectangle(win_left, fill=fg_color)

    win_right = (
        cx + size // 10,
        cy - size // 12,
        size - m - size // 7,
        cy + size // 14,
    )
    draw.rectangle(win_right, fill=fg_color)

    for win in [win_left, win_right]:
        cross_x = (win[0] + win[2]) // 2
        draw.line([(cross_x, win[1]), (cross_x, win[3])], fill=accent_color, width=max(1, size // 80))
        cross_y = (win[1] + win[3]) // 2
        draw.line([(win[0], cross_y), (win[2], cross_y)], fill=accent_color, width=max(1, size // 80))

    return img


icon = make_logo(
    1024,
    (255, 255, 255, 255),
    (30, 64, 175, 255),
    (16, 185, 129, 255),
    (219, 234, 254, 255),
    outline_color=(191, 219, 254, 255),
)
icon.save(root / 'icon.png')

splash = make_logo(
    1024,
    (255, 255, 255, 255),
    (30, 64, 175, 255),
    (16, 185, 129, 255),
    (219, 234, 254, 255),
    outline_color=(191, 219, 254, 255),
)
splash.save(root / 'splash-icon.png')

favicon = make_logo(
    256,
    (255, 255, 255, 255),
    (30, 64, 175, 255),
    (16, 185, 129, 255),
    (219, 234, 254, 255),
    outline_color=(191, 219, 254, 255),
)
favicon.save(root / 'favicon.png')

android_fg = make_logo(
    1024,
    (0, 0, 0, 0),
    (255, 255, 255, 255),
    (255, 255, 255, 255),
    (0, 0, 0, 0),
    outline_color=None,
)
android_fg.save(root / 'android-icon-foreground.png')

Image.new('RGBA', (1024, 1024), (30, 64, 175, 255)).save(root / 'android-icon-background.png')

mono = make_logo(
    1024,
    (0, 0, 0, 0),
    (0, 0, 0, 255),
    (0, 0, 0, 255),
    (0, 0, 0, 0),
    outline_color=None,
)
mono.save(root / 'android-icon-monochrome.png')

print('Created logo assets at', root)
