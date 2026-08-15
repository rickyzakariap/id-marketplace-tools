# Design - ID Marketplace Tools

## Design Philosophy

**Simple. Fast. Practical.**

Non-technical sellers butuh tools yang:
- Gak perlu install ribet
- Hasil langsung kelihatan
- Bahasa Indonesia
- Mobile-friendly (banyak seller pake HP)

## UI/UX Principles

1. **Zero Learning Curve** - Tool harus self-explanatory
2. **Instant Feedback** - Hasil dalam < 2 detik
3. **Visual Hierarchy** - Info penting paling gede
4. **Error Prevention** - Validasi input sebelum submit
5. **Export Everything** - User bisa download hasil

## Color Palette

```css
/* Primary */
--primary: #10b981;        /* Emerald green - trust, money */
--primary-dark: #059669;
--primary-light: #34d399;

/* Secondary */
--secondary: #3b82f6;      /* Blue - professional */
--secondary-dark: #2563eb;

/* Neutral */
--bg: #fafafa;             /* Light background */
--surface: #ffffff;
--text: #1f2937;
--text-muted: #6b7280;
--border: #e5e7eb;

/* Status */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

## Typography

```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

## Component Library

### Buttons
```css
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
```

### Cards
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
```

### Tables
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: var(--bg);
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
}

.table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.table tr:hover {
  background: var(--bg);
}
```

### Forms
```css
.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
```

## Layout Patterns

### CLI Output
```
┌─────────────────────────────────────────────────────────┐
│  ID Marketplace Tools - Bulk Fee Calculator v1.0.0      │
├─────────────────────────────────────────────────────────┤
│  Loaded 8 products from data/sample.csv                 │
│                                                         │
│  Product                   Price  Marketplace  Net      │
│  ─────────────────────────────────────────────────────  │
│  Kemeja Flanel Pria       185000  Shopee       169500   │
│  Kemeja Flanel Pria       185000  Tokopedia    171000   │
│  ...                                                      │
│                                                         │
│  Results saved to results.csv                           │
└─────────────────────────────────────────────────────────┘
```

### Web Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] ID Marketplace Tools        [Menu ▼]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Total Fee   │  │ Net Profit  │  │ Best MP     │    │
│  │ Rp 45.000   │  │ Rp 140.000  │  │ Tokopedia   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Fee Comparison Chart                           │   │
│  │  [Bar chart: Shopee vs Tokopedia vs Lazada]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Product Details Table                          │   │
│  │  [Sortable table with all products]             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Download CSV]  [Share Link]                           │
└─────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) {
  /* Tablet */
}

@media (min-width: 768px) {
  /* Small desktop */
}

@media (min-width: 1024px) {
  /* Desktop */
}
```

## Marketplace Branding

Setiap marketplace punya warna sendiri buat comparison:

| Marketplace | Color | Hex |
|-------------|-------|-----|
| Shopee | Orange | #ee4d2d |
| Tokopedia | Green | #00aa5b |
| Bukalapak | Red | #e31837 |
| Lazada | Blue | #0f146d |
| Blibli | Blue | #0073c8 |
| TikTok Shop | Black | #000000 |

## Icons

Pake Lucide Icons (open source, consistent):
- `Download` - Export
- `Upload` - Import
- `TrendingUp` - Profit
- `TrendingDown` - Loss
- `Check` - Success
- `X` - Error
- `Info` - Info

## Accessibility

- Contrast ratio minimum 4.5:1
- Focus indicators visible
- Keyboard navigation support
- ARIA labels untuk screen readers
- Font size minimum 14px