# Foodie Filter Recipes

## Detailed presets translated into FFmpeg-style recipes

### 1. Tasty Clean

- Bright and clear
- Warmer whites and stronger structure
- Good default for most food clips

Targets:

- brightness: mild lift
- contrast: medium-high lift
- saturation: medium lift
- warmth: warm highlights and mids
- sharpness: medium

```bash
ffmpeg -y -i /Users/aiden/Riff-FE/public/sample-2.mp4 -vf "eq=brightness=0.018:contrast=1.18:saturation=1.18:gamma=1.02,colorbalance=rs=0.035:gs=0.012:bs=-0.03:rm=0.025:gm=0.008:bm=-0.018,curves=r='0/0.02 0.45/0.54 1/0.99':g='0/0.01 0.50/0.53 1/0.98':b='0/0.05 0.52/0.48 1/0.92',unsharp=5:5:0.45:5:5:0.0" -c:a copy /Users/aiden/Riff-FE/out/sample-2-tasty-clean.mp4
```

### 2. Dessert Soft

- Softer contrast
- Creamy and gentle
- Better for cake, pastry, coffee, whipped textures

Targets:

- brightness: small lift
- contrast: mild lift
- saturation: mild lift
- warmth: soft warm cast
- sharpness: low

```bash
ffmpeg -y -i /Users/aiden/Riff-FE/public/sample-2.mp4 -vf "eq=brightness=0.012:contrast=1.10:saturation=1.09:gamma=1.01,colorbalance=rs=0.022:gs=0.008:bs=-0.018:rm=0.015:gm=0.004:bm=-0.010,curves=r='0/0.03 0.45/0.51 1/0.98':g='0/0.02 0.50/0.50 1/0.99':b='0/0.06 0.55/0.52 1/0.94',gblur=sigma=0.15,unsharp=3:3:0.18:3:3:0.0" -c:a copy /Users/aiden/Riff-FE/out/sample-2-dessert-soft.mp4
```

### 3. Meat Pop

- Stronger contrast and texture
- Richer reds and browns
- Better for grill, steak, burger, pan-seared food

Targets:

- brightness: almost flat
- contrast: high
- saturation: medium-high
- warmth: stronger warm push
- sharpness: high

```bash
ffmpeg -y -i /Users/aiden/Riff-FE/public/sample-2.mp4 -vf "eq=brightness=0.004:contrast=1.24:saturation=1.24:gamma=1.03,colorbalance=rs=0.05:gs=0.015:bs=-0.045:rm=0.03:gm=0.008:bm=-0.02,curves=r='0/0.01 0.40/0.56 1/1':g='0/0.00 0.50/0.52 1/0.98':b='0/0.07 0.52/0.46 1/0.88',unsharp=5:5:0.7:5:5:0.0" -c:a copy /Users/aiden/Riff-FE/out/sample-2-meat-pop.mp4
```

## Practical notes

- These are intentionally stronger than the earlier test presets
- If a result looks fake, reduce saturation first
- If the image looks crunchy, reduce `unsharp`
- If the footage already has warm light, reduce `colorbalance`

## Comparison workflow

1. Render the three outputs
2. Grab the same frame from each result
3. Compare side by side
4. Use the winning recipe as the base preset and weaken it by 10 to 20 percent for production
