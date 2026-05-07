# Event Canvas Templates

Static template artwork served as public assets and referenced from
`app/src/components/product-configs/event-canvas/templates/index.ts`.

## Structure

Each occasion has its own folder. For every template declared in
`templates/index.ts` you need two files:

- `<slug>.jpg` — full-resolution background (3:4, 1500×2000 by default)
- `<slug>-thumb.jpg` — small thumbnail used in the gallery (~600×800)

Example for the `birthday-classic-gold` template:

```
birthday/
  classic-gold.jpg
  classic-gold-thumb.jpg
```

## Adding a new template

1. Drop the two image files into the matching occasion folder.
2. Add a `EventCanvasTemplate` entry to
   `app/src/components/product-configs/event-canvas/templates/index.ts`
   pointing at the new asset paths.
3. Coordinates and sizes inside `editableTexts` and `photoSlots` are in
   template canvas pixels (relative to `canvasWidth` × `canvasHeight`).

## Aspect ratio

All templates are 3:4 portrait so they line up with every entry in
`POSTER_SIZES` (18×24, 24×36, 30×40, 36×48). If you ever ship a different
ratio, also update `POSTER_SIZES` so customers don't hit a dead end at the
size step.
