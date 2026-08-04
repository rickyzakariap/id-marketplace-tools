# Design

## UI Style
Light minimal theme (user preference)
- Background: #fafafa
- Cards: #fff with 1px solid #e5e5e5
- Text: #1a1a1a primary, #666 secondary
- Accent: #4a9 (muted green)
- Font: Inter for text, monospace for numbers/data

## Layout
- Header: title + dark/light toggle
- Left column: Product group selector + listing form
- Right column: Consistency report with diff view
- Mobile: single column stack

## Key Components
1. Product group cards (collapsible)
2. Consistency score per field (green=match, red=mismatch)
3. Diff view showing values per marketplace
4. Quick-edit buttons to sync values across marketplaces

## Responsive
- @media(max-width:768px): grid collapses, padding reduces