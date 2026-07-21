# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** GG LoL Cup
**Generated:** 2026-07-08 17:23:55
**Category:** General

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary/Gold | `#F5B041` | `--primary-gold` |
| Secondary Background | `#121216` | `--bg-secondary` |
| Background | `#0A0A0C` | `--bg-primary` |
| Tertiary Background | `#1A1A22` | `--bg-tertiary` |
| Text Primary | `#FFFFFF` | `--text-primary` |
| Text Secondary | `#E2E8F0` | `--text-secondary` |
| Text Muted | `#94A3B8` | `--text-muted` |

**Color Notes:** Dark Esports Theme (Deep Black + Championship Gold & White text)

### Typography

- **Heading Font:** Russo One
- **Body Font:** Chakra Petch
- **Mood:** Professional + High-contrast Esports

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button (Championship Gold) */
.btn-primary {
  background: var(--primary-gold);
  color: #000000;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--primary-gold-bright);
  box-shadow: var(--shadow-gold-glow);
  transform: translateY(-1px);
}

/* Secondary / Outline Button */
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-dark);
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: var(--border-gold);
  color: var(--primary-gold);
}
```

### Cards

```css
.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-card);
  transition: all 200ms ease;
}

.card:hover {
  border-color: var(--border-gold);
  box-shadow: var(--shadow-gold-glow);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 12px 16px;
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--primary-gold);
  outline: none;
  box-shadow: 0 0 0 2px rgba(245, 176, 65, 0.2);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(10, 10, 12, 0.85);
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-gold);
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Dark Esports Design

**Keywords:** Esports HUD, championship gold, dark mode, high-contrast, neon glows, glassmorphism, responsive, typography-focused

**Best For:** Tournament portals, gaming dashboards, high-impact branding

**Key Effects:** Glowing borders, subtle hover lifts, clean transitions (150-200ms ease), esports themed SVGs

### Page Pattern

**Pattern Name:** Hero + Features + CTA

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive animation

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
