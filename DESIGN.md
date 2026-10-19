# DESIGN.md

Visual contract for every tool in this repo. Read this before writing or restyling any UI.

Derived from the design language of https://bencho.dev (tokens and motion principles only,
no assets, logos or markup are copied).

The rule that matters most: **depth comes from alpha, not from borders or shadows.**
Surfaces are black at low opacity over white. A card is a wash, not a box with an outline.

---

## 1. Tokens

Declare these on `:root` (light) and override under `html[data-theme="dark"]`.
Every tool copies this block verbatim; do not invent new colors.

```css
:root {
  color-scheme: light;

  --bg: #ffffff;
  --surface: #f7f7f6;
  --surface-2: #f1f1f0;
  --surface-3: #ecebe7;
  --elev: #ffffff;

  --ink: #17181a;
  --ink-2: #3c3b37;
  --ink-3: #5c5b56;
  --ink-4: #6f6e68;
  --ink-5: #85847e;

  --wash: rgba(23, 24, 26, 0.06);
  --wash-hover: rgba(23, 24, 26, 0.09);
  --rule: rgba(23, 24, 26, 0.16);
  --line: rgba(23, 24, 26, 0.08);

  --signal: #2231dd;
  --ember: #b8431c;
  --ok: #15803d;
  --on-slab: #ffffff;
  --slab: var(--ink);

  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

html[data-theme="dark"] {
  color-scheme: dark;

  --bg: #000000;
  --surface: #0f0f0f;
  --surface-2: #181818;
  --surface-3: #202020;
  --elev: #202020;

  --ink: #ffffff;
  --ink-2: #b4b4b4;
  --ink-3: #9a9a9a;
  --ink-4: #828282;
  --ink-5: #6b6b6b;

  --wash: rgba(255, 255, 255, 0.06);
  --wash-hover: rgba(255, 255, 255, 0.1);
  --rule: rgba(255, 255, 255, 0.14);
  --line: rgba(255, 255, 255, 0.08);

  --signal: #3aa9ff;
  --ember: #ff7a4d;
  --ok: #34d17a;
  --on-slab: #000000;
  --slab: var(--ink);
}
```

`--slab` is the inverted surface: a filled black pill/block in light mode, white in dark.
The active chip, the primary button and the verdict banner all use `--slab`.

## 2. Typography

Load from Google Fonts, with a system fallback so the tool still reads well offline:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&family=Inter:wght@300..700&display=swap" rel="stylesheet">
```

```css
--font-head: "Google Sans", var(--font-ui);
--font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

| Role | Size | Line height | Weight | Tracking |
|---|---|---|---|---|
| Page title | 46px | 1.06 | 500 | -0.02em |
| Section title | 17px | 1.25 | 500 | -0.02em |
| Body / lede | 16px | 1.55 | 400 | normal |
| UI / button / chip | 14px | 1.2 | 500 | normal |
| Label / meta | 13px | 1.4 | 400 | normal |
| Caption | 12.5px | 1.6 | 400 | normal |

**Headings are weight 500, never 600 or 700.** The heading face is Google Sans; everything
else is Inter. Numbers in results use `--font-mono` with `font-variant-numeric: tabular-nums`.

## 3. Shape

| Element | Radius |
|---|---|
| Card / panel | 28px |
| Control slab, group container | 20px |
| Input, small control | 12px |
| Pill (chip, button, nav) | 999px |
| Mark / logo tile | 6px |

Nothing gets a 2px or 4px radius. If it is interactive and small, it is a pill; if it is a
container, it is 20 or 28.

## 4. Depth (the core rule)

- A card is `background: var(--wash)` - no border, no shadow.
- A raised element on a wash gets `background: var(--elev)` plus `box-shadow: var(--shadow)`.
- Hover on an interactive row/pill: `background: var(--wash-hover)`.
- Dividers: `1px solid var(--line)`.
- Focus ring: `outline: none; box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px rgba(var(--ink-rgb), 0.35)`.

Forbidden: `border: 1px solid #e5e5e5` as the main separator, shadows with more than two
layers, colored gradients, glows, `#4a9`-style green accents. Verdict colors come only from
`--ok`, `--ember`, `--signal`.

Optional per-card tint (subtle, monochrome, at most 8% alpha):

```css
background:
  radial-gradient(58% 52% at 18% 24%, rgba(var(--ink-rgb), 0.085), transparent 62%),
  radial-gradient(66% 50% at 54% 88%, rgba(var(--ink-rgb), 0.075), transparent 64%),
  var(--wash);
```

## 5. Motion

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* entrance, larger moves */
--ease-pop: cubic-bezier(0.3, 1.12, 0.4, 1);  /* hover springs, icon scale */
```

- Entrance: `animation: rise .62s var(--ease-out) both;` stagger `60ms` per element via
  `animation-delay`. Keep total under ~500ms.
- Hover: transform/opacity transitions `120–160ms`; icon `scale(1.04)` with `--ease-pop`.
- Press: `scale(0.96)` (pills and buttons), `scale(0.98)` for large blocks.
- Reveal of results: same rise, stagger 60–70ms per row.

```css
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
```

**Always honor reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: 1ms !important; }
}
```

## 6. Theme toggle

Theme lives on `<html data-theme="light|dark">`. Default follows the OS. Include this inline
script in `<head>` so there is no flash before first paint:

```html
<script>
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

The toggle button (36px, pill, top right) switches the attribute and writes `localStorage.theme`.

## 7. Components

- **Chip row** - horizontal scroll, `gap: 8px`, pill chips. Inactive: `color: var(--ink-3)`,
  transparent background. Active: `background: var(--slab); color: var(--on-slab)`.
- **Primary button** - full width pill, `background: var(--slab); color: var(--on-slab)`,
  40–44px tall, press `scale(0.96)`.
- **Input** - `background: var(--wash); border: 0; border-radius: 12px; padding: 8px 10px`,
  focus ring as defined above.
- **Verdict banner** - slab-tinted card, left accent via `border-left: 3px solid` using
  `--ok` / `--ember` / `--signal`; the accent is the only color.
- **Table** - no outer border, row separators `1px solid var(--line)`, numeric cells right
  aligned and monospaced, header text `--ink-4` at 12px weight 500.

## 8. Copy rules

- User-facing text is Bahasa Indonesia. Code identifiers and comments are English.
- No em dash (U+2014) anywhere in user-facing text; use a hyphen or rewrite.
- Numbers: `Rp 1.250` and `24%` (Indonesian formatting).

## 9. Checklist before shipping a tool

- [ ] Token block copied verbatim, no custom colors
- [ ] Card radius 28, pill radius 999, no stray small radii
- [ ] Headings at weight 500 with the Google Sans face
- [ ] Depth from `--wash`, not borders or heavy shadows
- [ ] Entrance stagger present; reduced motion honored
- [ ] Theme toggle works and persists; no flash on load
- [ ] Focus visible on every interactive element
- [ ] No em dash in user-facing text
