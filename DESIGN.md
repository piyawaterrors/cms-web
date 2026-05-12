---
name: Serene Management System
colors:
  surface: '#f8faf6'
  surface-dim: '#d8dbd7'
  surface-bright: '#f8faf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f1'
  surface-container: '#eceeeb'
  surface-container-high: '#e7e9e5'
  surface-container-highest: '#e1e3e0'
  on-surface: '#191c1b'
  on-surface-variant: '#404944'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#eff1ee'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#55615a'
  on-secondary: '#ffffff'
  secondary-container: '#d9e6dd'
  on-secondary-container: '#5b6760'
  tertiary: '#4f1f19'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b342d'
  on-tertiary-container: '#ea9e93'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#d9e6dd'
  secondary-fixed-dim: '#bdcac1'
  on-secondary-fixed: '#131e19'
  on-secondary-fixed-variant: '#3e4943'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#380d08'
  on-tertiary-fixed-variant: '#6e372f'
  background: '#f8faf6'
  on-background: '#191c1b'
  surface-variant: '#e1e3e0'
typography:
  h1:
    fontFamily: Noto Sans Thai
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Noto Sans Thai
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Noto Sans Thai
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Noto Sans Thai
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Noto Sans Thai
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Noto Sans Thai
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Noto Sans Thai
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container_max_width: 1440px
  sidebar_width: 280px
  gutter: 24px
  margin: 32px
  stack_sm: 12px
  stack_md: 24px
  stack_lg: 48px
---

## Brand & Style

The brand personality is **Professional, Solemn, and Empathetic**. As a Cemetery Management System, the interface must balance administrative efficiency with the sensitivity required for end-of-life services. The design style follows a **Modern Corporate** approach with a strong focus on **Minimalism** to ensure that data remains the priority and the user is never overwhelmed by visual noise.

The UI evokes a sense of peace and stability through high-quality white space, organic color tones, and a structured grid. Every interaction is designed to feel intentional and respectful, avoiding aggressive animations or loud visual cues.

## Colors

The palette is rooted in nature and tranquility. 
- **Deep Emerald (#064e3b)** is used for primary actions and key branding elements, grounding the interface in a sense of growth and endurance. 
- **Soft Sage (#f0fdf4)** acts as the primary background wash to reduce eye strain and differentiate content areas from the workspace. 
- **Slate Blue (#1e293b)** provides high-contrast legibility for typography and sidebar navigation.

Status indicators are used purposefully: **Emerald** for availability (life/nature), **Rose** for occupied plots (solemnity), **Amber** for pending administrative tasks, and **Gray** for historical or expired records.

## Typography

This design system utilizes **Noto Sans Thai** for all primary Thai text to ensure cross-platform consistency and modern legibility. The font scales are strictly governed to maintain a hierarchy that feels authoritative yet accessible. 

- **Headlines (ส่วนหัว):** Used for page titles and section headers, utilizing a heavier weight to anchor the page.
- **Body Text (เนื้อหา):** Optimized with a generous line height (1.6) to ensure that sensitive information—such as lineage records or contract details—is easily readable.
- **Data Labels (ฉลากข้อมูล):** Uses **Inter** for alphanumeric data to ensure maximum clarity in charts and ID numbers, while maintaining Noto Sans Thai for the descriptive labels.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for the main content area to maintain a tight, professional composition on large monitors, centered within the viewport. 

- **Sidebar:** A persistent left-hand navigation anchored in Slate Blue, providing clear access to "Dashboard" (แผงควบคุม), "Map" (ผังสุสาน), and "Records" (ทะเบียนรายชื่อ).
- **Grid:** A 12-column system with 24px gutters. Content cards should typically span 3, 4, 6, or 12 columns.
- **Rhythm:** Spacing follows an 8px base unit. Card internal padding is set to 24px (stack_md) to allow the content to "breathe," reflecting the respectful nature of the system.

## Elevation & Depth

To maintain a modern and professional feel, the system uses **Tonal Layers** combined with **Ambient Shadows**. 

- **Level 0 (Background):** Soft Sage Green (#f0fdf4), flat.
- **Level 1 (Cards/Work Area):** Pure White (#ffffff) with a very soft, diffused shadow (0px 4px 20px rgba(30, 41, 59, 0.05)). This separates the active task from the background without creating harsh edges.
- **Level 2 (Modals/Popovers):** Pure White with a more pronounced shadow and a 1px border in Slate Blue at 10% opacity. 

Depth is used to signify "focus," not just decoration. Interaction states (hover) on list items should result in a slight tonal shift to a darker shade of Sage rather than a shadow increase.

## Shapes

The shape language is **Soft**. UI elements utilize a 0.25rem (4px) base radius. This subtle rounding removes the clinical sharpness of 0px corners while maintaining a formal, structured appearance suitable for administrative work.

- **Primary Buttons:** 4px radius for a firm, button-like feel.
- **Cards and Containers:** 8px (rounded-lg) to provide a soft container for data groups.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

- **Buttons (ปุ่ม):** Primary buttons use Deep Emerald Green with white text. Ghost buttons use Slate Blue outlines for secondary actions.
- **Status Chips (สถานะ):** Compact badges with light background tints of their respective status color and dark foreground text (e.g., Light Green background with Deep Emerald text for "Available/ว่าง").
- **Data Tables (ตารางข้อมูล):** Clean, borderless rows with a subtle 1px bottom divider. Header text in Slate Blue, all caps, using the Label-caps typography style.
- **Plot Map (ผังสุสาน):** A specialized grid component where each cell represents a plot. Use the status colors to fill the cells, with a subtle hover effect that displays the "Occupant Name" (ชื่อผู้วายชนม์) in a tooltip.
- **Input Fields (ช่องกรอกข้อมูล):** Minimalist style with a 1px border. Focus states must use a 2px Deep Emerald Green ring. Labels should always be visible above the field in Thai.
- **Action Icons:** Professional, thin-line icons (2px stroke). Avoid "playful" or overly rounded iconography; prefer geometric clarity.