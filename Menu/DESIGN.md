---
name: Heritage & Gold
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5a413d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#8e706c'
  outline-variant: '#e2bfb9'
  surface-tint: '#b22b1d'
  primary: '#570000'
  on-primary: '#ffffff'
  primary-container: '#800000'
  on-primary-container: '#ff8371'
  inverse-primary: '#ffb4a8'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#272626'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d3c3c'
  on-tertiary-container: '#a8a6a6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8f0f07'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system captures the essence of premium Bengali dining by blending deep cultural roots with contemporary luxury. The aesthetic is **Sophisticated / Modern-Traditional**, emphasizing a "Heritage Luxe" feel. It targets a discerning audience seeking authenticity without compromising on a high-end, polished digital experience.

The visual language relies on heavy whitespace to frame rich, high-contrast imagery and purposeful golden accents. The emotional response should be one of warmth, reliability, and exclusivity—evoking the feeling of a private dining room in a historic mansion. The layout is clean and rhythmic, allowing the food photography and typography to act as the primary decorative elements.

## Colors

The palette is anchored by **Deep Maroon**, representing the passion and richness of Bengali spices and heritage. **Elegant Gold** is used sparingly for highlights, borders, and interactive states to signify premium quality.

- **Primary (Maroon):** Used for key brand elements, active states, and high-impact backgrounds.
- **Secondary (Gold):** Reserved for accents, icons, and subtle "gold-leaf" divider lines.
- **Surface (White/Cream):** The primary canvas is #FFFFFF for a crisp, modern feel, though #FCF9F2 may be used for subtle section differentiation to add warmth.
- **Text (Off-Black):** Primary content uses a soft black (#1A1A1A) to maintain high legibility while appearing more sophisticated than pure black.

## Typography

The typographic strategy balances **Tradition** (Libre Caslon Text) and **Modernity** (Hanken Grotesk). 

1. **Display & Headlines:** Use the Serif font for all titles. This evokes the literary and historical weight of Bengali culture. Large titles should use tighter letter spacing for a "magazine" feel.
2. **Body & UI:** Use the Sans-Serif font for descriptions, menus, and functional elements. It provides a clean, neutral counterpoint to the decorative headings.
3. **Labels:** Small labels, such as prices or category tags, should be uppercase with slightly increased tracking to enhance the premium feel.

## Layout & Spacing

The design system utilizes a **Fixed Grid** for desktop (12 columns) and a **Fluid Grid** for mobile (4 columns). 

- **Generous Breathing Room:** Avoid clutter. Use large padding (64px - 128px) between major sections to emphasize exclusivity.
- **Asymmetry:** Occasionally break the grid with overlapping images or offset text blocks to create a more bespoke, editorial look.
- **Mobile Reflow:** On mobile, margins reduce to 16px, and multi-column menu layouts collapse into a single-column list with large, touch-friendly image cards.

## Elevation & Depth

This design system avoids heavy drop shadows, opting for **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Depth is created by placing white "cards" on top of very light grey or cream backgrounds. 
- **Borders:** Use thin (1px) borders in either #EEEEEE or #D4AF37 (Gold) to define containers.
- **Shadows:** If shadows are necessary for functional clarity (e.g., a floating booking button), use a very soft, high-diffusion shadow with a hint of maroon tint: `rgba(128, 0, 0, 0.05)`.
- **Photography:** Deep, dramatic lighting in food photos provides the natural depth and texture of the interface.

## Shapes

The design system employs **Sharp (0px)** corners to convey architectural stability and a classic, high-end feel. 

- **Buttons:** Rectangular with no radius.
- **Images:** Strict 0px corners, often using "Portrait" aspect ratios (3:4) to feel like traditional photography.
- **Decorative Elements:** Thin vertical lines and rectangular frames are used to guide the eye and compartmentalize information without the "playfulness" of rounded corners.

## Components

- **Buttons:** Primary buttons are solid Maroon (#800000) with White uppercase text. Secondary buttons are Ghost-style with a Gold (#D4AF37) border.
- **Menu Items:** Use a list format with the dish name in the Serif headline-sm font and the price in the Sans-serif label-md font, separated by a subtle Gold dotted line.
- **Input Fields:** Minimalist design with only a bottom-border in Maroon. Labels should float above the field in small caps.
- **Cards:** Used for featured dishes or "Experiences." Cards should have no borders or shadows; they rely on full-bleed imagery with typography placed either directly below or in a white overlay.
- **Gold Dividers:** Use a 1px tall Gold line with a small diamond or brand icon in the center to separate major narrative sections.
- **Booking Widget:** A persistent, clean bar at the bottom of the mobile screen or top-right on desktop, utilizing the Gold accent color to drive conversions.