---
name: Cyrus Attoun
description: Independent software exhibition poster
colors:
  blue: "#244bdd"
  blue-dark: "#1937ad"
  yellow: "#f4ff81"
  white: "#fff"
  paper: "#f7f8fc"
  pale: "#e7ecff"
  ink: "#17214a"
  muted: "#515d7e"
  line: "#c9d1e6"
  poster-line: "#6984eb"
  poster-copy: "#e5eaff"
  identity-secondary: "#dce3ff"
  manifesto-muted: "#5a6b9c"
typography:
  display:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "clamp(3.5rem, 7.1vw, 6rem)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4.3vw, 3.8rem)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  command:
    fontFamily: "ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  status: "4px"
  control: "5px"
  calendar: "6px"
  image: "8px"
spacing:
  compact: "12px"
  control: "20px"
  mobile-gutter: "24px"
  tablet-gutter: "36px"
  desktop-gutter: "56px"
  wide-gap: "80px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.blue-dark}"
  status:
    backgroundColor: "{colors.pale}"
    textColor: "{colors.blue-dark}"
    rounded: "{rounded.status}"
    padding: "5px 8px"
  command:
    backgroundColor: "{colors.pale}"
    textColor: "{colors.blue-dark}"
    rounded: "{rounded.control}"
    padding: "16px"
    typography: "{typography.command}"
---

# Design System: Cyrus Attoun

## Overview

**Creative North Star: "Independent Software Exhibition Poster"**

An independent software exhibition poster: confident cobalt fields, sharp yellow emphasis, oversized Bricolage lettering, and an openly spaced collection of real work. The page alternates saturated statements with near-white and pale-blue reading surfaces.

The built system is editorial and flat. Actual product screenshots and a project mascot supply visual evidence; typography, rules, and unequal columns organize the collection without enclosing every project in a card.

**Key Characteristics:**

- Saturated cobalt fields with selective yellow emphasis.
- One self-hosted variable family for display and reading.
- Open project layouts, real screenshots, and fine horizontal rules.
- Brief, optional motion with native anchor navigation.

## Colors

Cobalt is the dominant identity field, balanced by cool reading surfaces and a deliberately sharp yellow accent. The frontmatter records source CSS values.

### Primary

- **Cobalt** (`blue`): hero, experiments band, links, and primary action.
- **Deep cobalt** (`blue-dark`): primary action hover, status labels, and command text.

### Secondary

- **Sharp yellow** (`yellow`): KEEP lettering, the experiment action, skip-link surface, and selected text.

### Neutral

- **Near-white paper** (`paper`) and **white** (`white`): page surface and reversed text.
- **Pale blue** (`pale`): local-AI field and small utility surfaces.
- **Blue-black ink** (`ink`) and **slate copy** (`muted`): primary and secondary reading text.
- **Cool rule** (`line`): separators on light fields; **poster rule** (`poster-line`): separators on cobalt.
- **Poster copy** (`poster-copy`), **identity secondary** (`identity-secondary`), and **manifesto muted** (`manifesto-muted`): softer text within their specific dark-field or typographic contexts.

**The Yellow Emphasis Rule.** Reserve sharp yellow for the hero emphasis, selected links on cobalt, selection, and the skip link.

## Typography

**Display Font:** Bricolage Grotesque, registered locally as Bricolage, with Arial and sans-serif fallback.
**Body Font:** The same self-hosted variable family, loaded from `dist/assets/bricolage.ttf` with swap and a declared weight range of 400–800.
**Label/Mono Font:** System monospace for the command example only.

**Character:** Broad, slightly eccentric lettering carries the poster's conviction. Tight headline tracking and balanced wrapping contrast with relaxed prose.

### Hierarchy

- **Display:** the frontmatter display role; the hero uses deliberate line breaks. At the mobile breakpoint it changes to `clamp(2.8rem, 9.3vw, 4.7rem)`; the smallest breakpoint fixes it at 42px.
- **Headline:** the frontmatter headline role; mobile section headings use 39px and the smallest breakpoint uses 35px.
- **Title:** project titles use the recorded title role, with contextual desktop sizes of 42px, 35px, 30px, 27px, and 22px. Mobile major titles use 34px.
- **Body:** the recorded body role; introductory and section-description copy uses 19px with 1.6 line-height, stepping to 17px on mobile. Supporting research text uses 16px. Reading measures vary from 42ch to 68ch by context.
- **Label:** navigation and text actions use 15px; metadata and utility links generally use 14px. Status labels use 11px, weight 500, and 1.3 line-height (10px on mobile).

**The Single Voice Rule.** Use Bricolage for both headlines and prose; use monospace only for the command example.

## Layout

A centered container caps at 1280px including its horizontal padding. Gutters step from 56px to 36px at 1000px, 24px at 700px, and 18px at 360px. Sections use generous 78–90px vertical intervals on desktop and typically 54px on mobile.

The collection alternates full-width color fields and open content on paper. Section introductions use a 1.2:1 grid; the featured project uses .72:1; paired desktop tools use 1.15:1; the local-AI feature uses 1:.9. Research uses two equal columns, builder rows use three columns, and smaller experiments use three columns. These grids become single-flow layouts at 700px. At 1000px builder rows become two columns before stacking.

The hero's introduction and action sit side by side on desktop, then stack. Its named project links form a three-way horizontal strip and wrap naturally on mobile. The top navigation remains visible, with its in-page work link hidden on mobile. The first product image follows the opening collection heading.

## Elevation & Depth

No box shadows are present. Background fields, thin rules, screenshot scale, and one overlapping monitoring screenshot establish depth. The inset screenshot has a paper-colored border; screenshots retain their own native product UI.

**The Flat Collection Rule.** Organize projects with whitespace, background fields, and dividing rules rather than shadows.

## Shapes

The dominant form is an open rectangular field with straight horizontal divisions. Small radii soften utility surfaces and screenshots: status, control, calendar, and image roles are recorded in frontmatter. Screenshots clip at their rounded edges. There are no pill containers. The favicon is a separate rounded identity mark, rather than a component-radius precedent.

## Components

### Buttons

The primary action is compact and confident: cobalt with white text, a matching thin border, a control radius, and the recorded padding. It uses 15px type at weight 550 with a 20px gap to its outlined arrow. Hover deepens the blue; eligible motion uses a 180ms ease-out background transition. All links receive a 3px current-color focus outline offset by 5px.

### Status labels

“Coming soon” is an informational inline label, not a filter or control. It uses pale blue, deep cobalt, compact padding, and the status radius. The label preserves normal capitalization and has no icon.

### Project containers and imagery

Projects are open articles rather than framed cards. Linked titles and real screenshots lead; supporting text and source links follow. Product imagery fills its available width at its native aspect ratio. The featured screenshot gently scales to 1.012 on hover, over 400ms, only when motion is permitted. The desktop-utility pair permits an overlapping screenshot and mascot rather than forcing identical image boxes.

### Navigation

The identity and external links share a flex row above a fine poster-colored rule. Navigation links gain an underline on hover. Named hero destinations use equal-width desktop anchors with yellow hover text and a wrapping mobile layout. Arrow icons are inline stroked SVG, not font glyphs; most are 21px, with 16px navigation arrows on mobile.

### Command and typographic manifesto

The command example is a compact monospace block on pale blue with the control radius. The browser manifesto is stacked Bricolage text, with muted first lines and cobalt emphasis on the concluding line. It uses a fluid desktop size and 42px on mobile.

### Motion and access

KEEP letters settle once from a 14px drop and −7-degree rotation over 800ms, staggered by 60ms, using `cubic-bezier(.16,1,.3,1)`. JavaScript removes the finished animation. The animation and hover transitions are gated by `prefers-reduced-motion: no-preference`; reduced motion also disables smooth scrolling. The skip link becomes visible on focus. Navigation works without JavaScript.

## Do's and Don'ts

### Do:

- Do retain real project imagery with its provenance.
- Do keep project titles and calls to action as ordinary accessible links.
- Do preserve the one-time letter-settle motion and reduced-motion support.
- Do use unequal desktop columns where content warrants them and stack them for narrow screens.

### Don't:

- Don't add shadows to the flat collection.
- Don't turn every project into an identical bordered card.
- Don't use the yellow emphasis as a general reading-text color on light surfaces.
