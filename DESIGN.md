---
name: Cyrus Attoun — Software Record Shop
description: 'New Arrivals: a warm, tactile personal software collection.'
colors:
  pink: '#f4bad0'
  ink: '#3b1937'
  orange: '#ff763c'
  plum: '#462044'
  lemon: '#f3ee78'
  apricot: '#ffe6d0'
  rose: '#ca7292'
  cream: '#ffe1a7'
  selection: '#fff2ce'
  rule: '#71334f'
  rule-soft: '#a76985'
  rule-faint: '#c188a0'
typography:
  display:
    fontFamily: Bricolage, sans-serif
    fontSize: 72px
    fontWeight: 800
    lineHeight: 0.89
    letterSpacing: -2.8px
  headline:
    fontFamily: Bricolage, sans-serif
    fontSize: 36px
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: -.03em
  title:
    fontFamily: Bricolage, sans-serif
    fontSize: 24px
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: -.025em
  body:
    fontFamily: Archivo, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Archivo, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
rounded:
  status: 30px
  preview: 4px
spacing:
  sleeve-gap: 22px
  rail-gap: 38px
  page-x: 44px
  section: 54px
components:
  sleeve-orange:
    backgroundColor: '{colors.orange}'
    textColor: '{colors.ink}'
    padding: 25px 24px 0
  sleeve-plum:
    backgroundColor: '{colors.plum}'
    textColor: '{colors.cream}'
    padding: 23px 20px 0
  status:
    textColor: '{colors.ink}'
    rounded: '{rounded.status}'
    padding: 3px 8px
  catalogue-row:
    textColor: '{colors.ink}'
    padding: 23px 0
---

# Design System: Cyrus Attoun — Software Record Shop

## Overview

**Creative North Star: "Software Record Shop"**

A personal software record shop: warm pink ground, plum ink, expressive Bricolage lettering, and a varied wall of software sleeves. Real product screenshots and a contained mascot make each project tangible.

The system balances playful display with practical catalogue notes. Unequal widths, modest rotations, and soft shadows suggest objects being browsed; fine rules and calm Archivo prose keep the complete collection readable.

**Key Characteristics:**
- Pink ground and plum reading ink with individually colored sleeves.
- Self-hosted Bricolage display and Archivo reading type.
- Unequal, slightly rotated sleeves followed by open catalogue rows.
- Native links, visible keyboard focus, and reduced-motion support.

## Colors

Warm pink holds the collection together; orange, plum, lemon, apricot, and rose distinguish the sleeves.

### Primary
- **Shop pink:** the continuous page ground.
- **Plum ink:** reading copy, display lettering, focus rings, and the skip-link field.

### Secondary
- **Orange:** based sleeve.
- **Plum:** Hoardini sleeve, with cream lettering.
- **Lemon:** Zest sleeve.
- **Apricot:** Windowsill sleeve.
- **Rose:** BlabberStack sleeve.

### Neutral
- **Cream:** light lettering on the dark sleeve.
- **Selection cream:** selection text and the focused skip link.
- **Rule / soft rule / faint rule:** header and section divisions, browse dividers, and catalogue rows respectively.

**The Sleeve Color Rule.** Use the established colored fields to distinguish projects; keep long reading copy in plum ink on pink.

## Typography

**Display Font:** Bricolage, the locally registered Bricolage Grotesque family, with sans-serif fallback.
**Body Font:** Archivo, with sans-serif fallback.

Both variable fonts are self-hosted TTFs with swap; the declared ranges are 400–800 for Bricolage and 400–900 for Archivo. Tight, broad display letters contrast with compact, practical reading copy.

### Hierarchy
- **Display:** the frontmatter role introduces the collection. It becomes 60px below the tablet breakpoint and 66px on mobile; the heading retains deliberate line breaks.
- **Headline:** section headings use the frontmatter role, becoming 32px on mobile.
- **Title:** catalogue project titles use the frontmatter role. Sleeve names share a .95 line-height and −.035em tracking, with desktop sizes from 30px to 80px according to sleeve width.
- **Body:** the frontmatter role is the page default. Catalogue descriptions use 14px/1.7 with a 65ch measure; introductions use 15px/1.6 or 1.7.
- **Label:** header links use the recorded label role. Captions use 11px/1.5; status labels use 10px. The angled browsing note uses 25px/1.15 Bricolage at weight 500.

**The Two Voices Rule.** Bricolage names and introduces the work; Archivo explains it.

## Layout

The centered page caps at 1600px, with 28px top, 44px horizontal, and 25px bottom padding. The main composition has a 245px introduction rail, a 38px gap, and flexible content. The sleeve wall has three unequal columns (1.38:1:.89) and a 22px gap. At widths from 1500px, the rail grows to 270px and sleeve gaps to 28px. The rail is sticky at 28px only above 1100px.

At 1100px and below, page padding becomes 24px, the rail becomes 205px, and the main gap becomes 24px. The wall becomes two columns (1.3:1); its last column spans both and arranges two sleeves side by side. At 650px and below, page padding becomes 20px 23px, the rail enters normal flow, its note is hidden, and browse links wrap horizontally. The featured sleeve spans the content width, Hoardini and Zest share a 1.1:1 row, and the remaining sleeves stack.

Catalogue sections begin with a rule, 54px top margin, and 27px top padding. Their rows use .65:1.5 columns with a 30px gap and 23px vertical padding. On mobile, sections use 38px top margin and 24px top padding, and rows stack. Header social links remain visible; the footer changes from a flex row to stacked text.

## Elevation & Depth

Sleeves feel like soft physical objects. Their resting rotations range from −2 to +2 degrees, with staggered top margins; the note rotates −3 degrees. Native screenshot imagery remains inside the colored sleeves. Catalogue rows use rules and spacing rather than shadows.

### Shadow Vocabulary
- **Sleeve rest:** `0 8px 16px #5e243915`.
- **Sleeve hover:** `0 17px 24px #5e24392a`; the sleeve lifts 7px and straightens.

**The Soft Object Rule.** Use slight rotation and diffuse shadows for sleeves, while catalogue rows remain flat and ruled.

## Shapes

Sleeves are square-cornered rectangles, with overflow clipped where imagery meets their edge. Availability labels are thin outlined pills using the status radius. The lower utility screenshot uses the preview radius. Horizontal rules are 1px; they organize open areas without enclosing every entry.

## Components

### Software sleeves

Distinct colored objects, with project-specific proportions, type size, crop, and inset spacing. The orange and plum variants are recorded in frontmatter; lemon uses 23px padding, apricot uses 22px 18px 0, and rose uses 23px 18px. Titles and short descriptions sit above real screenshots where available. Linked sleeves are ordinary anchors; the Windowsill preview is a noninteractive section. The shared hover rule also applies to that preview.

Hover transitions use transform .45s cubic-bezier(.16,1,.3,1) and box-shadow .45s. Reduced motion disables transitions and smooth scrolling. No JavaScript is required.

### Status labels

“Coming soon” is a noninteractive, transparent pill with a 1px current-color border and compact padding. Catalogue labels explicitly use Archivo 400 at 10px/1.4.

### Catalogue rows

Open, ruled rows pair Bricolage project names with longer Archivo descriptions. Optional source links wrap with an 18px gap. Product previews preserve their native aspect ratio and cap at 490px wide.

### Navigation and links

The header combines a 24px Bricolage identity and compact social links. Browse links pair category names with inline stroked SVG arrows; the first is bold. Arrow icons are 14px, inherit ink color, and have a 1.6 stroke. Text links underline on hover with a 5px offset. Keyboard focus uses a 3px plum outline, normally offset 6px and 4px for social and catalogue links. The skip link moves into view on focus. Anchor scrolling accounts for a 28px top inset.

### Secondary index

A compact, wrapping row above the catalogue uses 19px Bricolage project links, 12px Archivo supporting text, a 24px gap, and a soft top rule. Mobile links become 18px and the gap becomes 16px.

## Do's and Don'ts

### Do:

- Do retain real product imagery and its provenance.
- Do preserve unequal sleeve proportions and readable responsive reflows.
- Do use native links with visible focus and reduced-motion support.
- Do keep availability labels informational and separate from project links.

### Don't:

- Don't replace the collection with identical framed cards.
- Don't use hard offset shadows in place of the built diffuse sleeve shadows.
- Don't turn status pills into controls or link unavailable private projects.
