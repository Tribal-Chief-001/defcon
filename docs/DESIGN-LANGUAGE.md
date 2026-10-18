# Design language

Source: spec section 4 (approved 2026-10-18). A classified technical dossier redesigned by a very good agency in 2026: brutalist but premium, information-dense but breathing. Typography is the UI; 1px borders instead of shadows; motion is physical, never playful.

## Tokens (`src/styles/tokens.css`, enforced by `tests/design/`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#000000` | True black (AMOLED). Decision D-005 overrides the earlier `#050507`. |
| `--bg-soft` | `#0A0A0D` | Soft surface |
| `--text` / `-muted` / `-faint` | `#EDEDE9` / `.5` / `.25` alpha | Bone white, never pure white |
| `--border` / `--border-strong` | `rgba(255,255,255,.08)` / `.15` | 1px borders |
| `--lime` | `#D6FF57` | Primary: action, active, selection |
| `--orange` | `#FF4D00` | Alert, severity |
| `--cyan` | `#00FFF0` | Data, coordinates |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | The only easing |

At most two accents on one screen.

## Type

Syne 700/800 (display: tight, `line-height` about .85, outline variant for background words), Space Grotesk 300/400/600 (body), JetBrains Mono 400/700 (labels, data, numbers; uppercase, wide tracking, always above the content they label). Self-hosted through `@fontsource`. Never centre long text.

## Rules

- No `box-shadow`, no gradient text, no stock icon packs, no emoji in UI (guard test: `tests/design/forbidden.test.ts`).
- Radius 24-28 px cards, 100 px pills. Glass = translucent + backdrop blur + 1px border.
- The globe and its light are the only light sources (the earlier "orbs" idea is dropped).
- Missing data is shown as a redaction bar and says "unavailable"; every field shows source and date.
- `prefers-reduced-motion` disables the boot and auto-rotation; sound is off by default.

## UI polish (Plan 7)

Owner feedback on the live site: the default scrollbar clashed, the type and top bar were thin, the desktop layout felt empty. Fixes, in the same language:

- **Type scale** (`tokens.css`): mono labels 11.5 px (nothing below 11 px anywhere, a test enforces it), data 13 px, body 14 px, titles 30 px (Syne 800), hero numerals 52 px (Space Grotesk 600).
- **Scrollbar:** a hairline pill (10 px hit area, about 4 px visible, 28 % bone, 60 % on hover, lime while dragged, no arrows, no shadow). Chrome 121+ ignores `::-webkit-scrollbar` on elements that set `scrollbar-width`/`scrollbar-color`, so those standard properties are wrapped in `@supports not selector(::-webkit-scrollbar)` and only Firefox uses them.
- **Top bar:** 68 px glass bar, Syne wordmark, centred live numbers from the recent snapshot only (events with their real window in days, human-coded share with a note on where UCDP data ends, countries reported: "--" when unavailable, never 0 for missing; shown from 1200 px), freshness pill on the right, the pulse line on its edge.
- **Rails** (1100 px and wider): Hotspots (left, hidden while a dossier is open) and Latest (right, hidden while an event card is open; with a dossier open only from 1500 px). Real data only, a footnote says coverage is uneven, "live view only" during time travel. Rows are buttons.
- **HUD frame:** four hairline corner ticks and the long-promised faint outline DEFCON word behind the interface; hidden on phones.

## Brand mark

A hairline "D" that is also a radar scope: two faint range rings, a lime sweep line from the stem and a lime ping dot. Three colours only (black, bone, lime). The favicon is the same drawing with bolder strokes on a rounded black tile. The wordmark stays Syne 800 in the top bar; the share image (`public/og.png`) pairs mark and wordmark with the tagline "Real-time world conflict monitor".

## War room (Plans 8 to 10)

The popup became a **dashboard docked beside the globe**: a 46 vw (max 720 px) glass panel on the right at 1100 px and wider, a bottom sheet over 62% of a narrow screen, never a modal (no backdrop, no focus trap, Esc closes, the globe stays interactive and moves aside, the rails, scrubber and legend step out of the way).

- **Overview:** a Space Grotesk hero numeral (count-up) with a three-arc ring (30, 90, 365 days) and the three windows with ranges; the by-kind bar (lime state-based, bone non-state, orange one-sided); the **stream chart** of weekly deaths stacked by kind from a zero baseline with the timeline's events as dots and stems (events after the data end in a shaded "after UCDP data" band); **bubbles** whose area is the deaths in 365 days (orange outline when rising); the **league** (range whisker low-high with the best tick, sparkline, trend word, events, last event: the text equivalent of the bubbles); countries; newest key events; newest news reports (auto-coded); latest human-coded events.
- **Conflict view:** a Syne title, kinds, trend and provisional share, three window cards with range whiskers, deaths per week with that conflict's own events, countries with a share bar and the share of deaths that could be placed on the map, the **editorial timeline** (a 28 px Syne day, a hairline spine with a status node, title, attributed summary, linked sources, "Show on the map"; hovering a card pulses its pin on the globe, a click on the chart marks and scrolls to its card).
- **On the globe:** every conflict with deaths in the last 90 days has a double sonar ring at its death-weighted centroid (orange when rising, bone otherwise, size from log deaths) and the top six carry a mono name and their 90-day deaths; ordinary event dots recede to 45%. The selected conflict gets a lime halo, a hairline zone ring, a lime additive glow on its top 40 death cells (the shape of the front) and diamond pins for its timeline events (bone confirmed, muted reported, orange disputed, lime and pulsing on hover). The camera flies to it and stays. The lowest quality tier draws halos only; reduced motion keeps rings static and numerals immediate.
- **Charts** are hand-rolled SVG in the hairline language (`src/viz`): 1 px strokes, no shadows, bone with lime and orange only, every chart with a text alternative, status never by colour alone. Honesty is part of the design: windows and units on every chart, ranges as whiskers, protest deaths named as not counted, news reports tagged "auto-coded, not verified", the timeline's limits and omissions shown.

## Text colours (Plan 6)

`--text` #EDEDE9, `--text-muted` 68 % and `--text-faint` 55 % of it on true black: all reach WCAG AA (4.5:1), checked by `tests/a11y/contrast.test.ts`. The earlier 50 % / 25 % values did not (faint was 1.9:1) and carried real field labels.

## Signature features as built (Plan 4)

- **Arcs:** cyan solid to formal allies, orange dashed to active disputes, lifted off the surface, drawn in over 400 ms.
- **Reticle:** thin cyan ring and four ticks, a mono readout (`28.61N 77.21E // EVENT 12 KM`) with a dark text halo; the system cursor is hidden over the globe for fine pointers only.
- **Pulse border:** a 1 px baseline with a travelling blip; colour lime to orange only for a comparable tension index.
- **Grain:** bone speckle that warms to orange where events are dense; still under reduced motion.
- **Letterbox:** two black bars (12 vh) sliding in with the house easing, cyan mono caption typed at 30 characters a second.
- **Declassify:** 3 px muted bars under card values that shrink with age; text is always readable.
- **Terminator:** bone 0.5 opacity great circle, no fill.

## Chosen direction

"Hairline Sonar": hairline globe, sonar ripples, dashed arcs; plus the time scrubber and fading heat scars from "Long Exposure" and a faint outline "DEFCON" word from "Lightfall". The eight signature interactions are in the spec (section 5); Plan 1 delivers the Sonar Boot.
