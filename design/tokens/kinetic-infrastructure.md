---
name: Kinetic Infrastructure
colors:
  surface: '#f5fbf7'
  surface-dim: '#d5dbd8'
  surface-bright: '#f5fbf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff5f1'
  surface-container: '#e9efeb'
  surface-container-high: '#e3eae6'
  surface-container-highest: '#dee4e0'
  on-surface: '#171d1b'
  on-surface-variant: '#3d4945'
  inverse-surface: '#2b322f'
  inverse-on-surface: '#ecf2ee'
  outline: '#6d7a75'
  outline-variant: '#bccac4'
  surface-tint: '#006b59'
  primary: '#006b59'
  on-primary: '#ffffff'
  primary-container: '#00a48a'
  on-primary-container: '#003128'
  inverse-primary: '#5ddbbe'
  secondary: '#3b665b'
  on-secondary: '#ffffff'
  secondary-container: '#bbe9db'
  on-secondary-container: '#406b5f'
  tertiary: '#9b4330'
  on-tertiary: '#ffffff'
  tertiary-container: '#db745d'
  on-tertiary-container: '#551003'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7cf8da'
  primary-fixed-dim: '#5ddbbe'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#beecde'
  secondary-fixed-dim: '#a2d0c2'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#234e44'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a4'
  on-tertiary-fixed: '#3d0600'
  on-tertiary-fixed-variant: '#7d2c1b'
  background: '#f5fbf7'
  on-background: '#171d1b'
  surface-variant: '#dee4e0'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  mono:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is rooted in the "Technical Precision" movement, blending the utilitarian clarity of developer tools with the refined elegance of premium productivity software. It prioritizes a calm, systematic user experience that feels exceptionally fast and reliable.

The aesthetic is characterized by high-density information layouts paired with generous structural whitespace. It avoids visual noise, focusing instead on sharp alignment, micro-interactions, and a "paper-white" clarity. The emotional goal is to provide a sense of absolute control and stability for developers building mission-critical email infrastructure.

## Colors
This design system utilizes a high-contrast functional palette. The primary teal is used sparingly for action intent and success states, maintaining a professional "infrastructure" feel. 

For the dashboard and landing page, the "Surface" color is the primary workspace, while "Background" provides a soft structural contrast for the interface shell. Label pastels should be used with 700-weight text of the same hue to ensure WCAG accessibility while maintaining a soft, organized appearance for categorization and tagging.

## Typography
The typography strategy leverages **Geist** for structural elements and headlines to convey a technical, engineered feel, while **Inter** handles long-form body text for maximum legibility. 

Headlines should remain compact; do not use excessive tracking. For code snippets, API keys, and logs—crucial for an email infrastructure product—use a monospaced variant of Geist. Line heights are kept tight to maintain the "SaaS dashboard" density without sacrificing readability.

## Layout & Spacing
The layout follows a strict 8px grid system. For the SaaS dashboard, a "Side-Nav Fixed" model is preferred, where the sidebar remains 240px and the content area expands fluidly. 

Landing pages should utilize a 12-column grid with a max-width of 1280px. Use "2xl" and "3xl" spacing for section vertical padding to create the "premium" breathability associated with high-end developer tools. Intramodular spacing (within cards or lists) should stay within the "xs" to "md" range to maintain a sense of information density and technical utility.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-contrast outlines** rather than heavy shadows. 

1. **Level 0 (Background):** `#F0F2F5` – The base canvas.
2. **Level 1 (Surface):** `#FFFFFF` – Cards, main content areas, and navigation bars. Use a 1px solid border of `#E5E7EB`.
3. **Level 2 (Popovers/Modals):** `#FFFFFF` – Floating elements use a subtle, diffused shadow: `0px 4px 12px rgba(0, 0, 0, 0.05)`.

Avoid any inner shadows or heavy blurs. The goal is to make the UI feel flat but physically layered, similar to sheets of paper stacked with precision.

## Shapes
This design system uses a "Soft" shape language. Standard UI elements (Inputs, Buttons, Cards) utilize a **4px (0.25rem)** corner radius to maintain a professional, slightly sharp appearance. Large containers or featured sections on the landing page may use **8px (0.5rem)** to feel more approachable, but never exceed this. Pill shapes are reserved exclusively for status indicators and chips.

## Components
- **Buttons:** Primary buttons use `#00A48A` with white text. No gradients. Secondary buttons use a white fill with a `#E5E7EB` border. Transitions should be an immediate 150ms ease-out.
- **Inputs:** Use a 1px border. On focus, the border changes to `#00A48A` with a subtle 2px outer glow of the same color at 10% opacity.
- **Chips/Labels:** Use the pastel palette. Text should be 2-3 shades darker than the background for legibility.
- **Cards:** White background, 1px `#E5E7EB` border, no shadow. Hover states on interactive cards should lift slightly with the Level 2 shadow defined in Elevation.
- **Data Tables:** Use `body-sm` for row content. Headers should be `label-sm` in all-caps with `#6B7280` coloring.
- **Code Blocks:** Dark mode by default using `dark_surface_hex` to differentiate from the rest of the light UI, even in the light mode theme.