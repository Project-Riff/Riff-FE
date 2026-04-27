# FFmpeg Filter Guide

## Foodie shorts filters worth knowing

### 1. `eq`

- Controls brightness, contrast, saturation, and gamma
- Best first filter when the image just needs a gentle lift

```bash
ffmpeg -h filter=eq
```

### 2. `curves`

- Lets you shape tonal contrast more precisely
- Good for making cafe footage feel softer or slightly filmic

```bash
ffmpeg -h filter=curves
```

### 3. `colorbalance`

- Pushes warmth or coolness into shadows, mids, and highlights
- Useful when food looks too blue, gray, or flat

```bash
ffmpeg -h filter=colorbalance
```

### 4. `hue`

- Adjusts hue angle and saturation
- Good for quick color shifts or testing how strong a tone should feel

```bash
ffmpeg -h filter=hue
```

### 5. `lut3d`

- Applies a LUT file such as `.cube`
- Best when you want one reusable branded look

```bash
ffmpeg -h filter=lut3d
```

### 6. `unsharp`

- Adds perceived sharpness
- Good for dessert texture, crumbs, fruit detail, and cream edges

```bash
ffmpeg -h filter=unsharp
```

### 7. `gblur`

- Applies Gaussian blur
- Useful for softening harsh digital footage or making things feel dreamy

```bash
ffmpeg -h filter=gblur
```

### 8. `crop`

- Crops the frame
- Useful before adding graphics when composition needs to feel tighter

```bash
ffmpeg -h filter=crop
```

### 9. `scale`

- Resizes video
- Useful when normalizing clips before the rest of the pipeline

```bash
ffmpeg -h filter=scale
```

### 10. `fps`

- Changes output frame rate
- Good when you want a consistent render target for shorts

```bash
ffmpeg -h filter=fps
```

## How to inspect filters

### List all available filters

```bash
ffmpeg -filters
```

### Inspect one filter in detail

```bash
ffmpeg -h filter=eq
ffmpeg -h filter=curves
ffmpeg -h filter=colorbalance
```

## Common combinations

### Gentle foodie lift

```bash
-vf "eq=contrast=1.04:saturation=1.08:brightness=0.01,colorbalance=rs=0.02:gs=0.01:bs=-0.01"
```

### Clean cafe tone

```bash
-vf "eq=contrast=1.03:saturation=1.05:brightness=0.015,curves=r='0/0.02 0.45/0.50 1/0.98':g='0/0.01 0.50/0.50 1/0.99':b='0/0.04 0.55/0.52 1/0.96'"
```

### Sharper dessert detail

```bash
-vf "eq=saturation=1.08,unsharp=3:3:0.25:3:3:0.0"
```

## Practical rule

- Start with `eq`
- Add `colorbalance` or `curves`
- Add `unsharp` only a little
- Use `lut3d` only when you want a consistent house look
