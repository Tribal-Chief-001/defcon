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

## Chosen direction

"Hairline Sonar": hairline globe, sonar ripples, dashed arcs; plus the time scrubber and fading heat scars from "Long Exposure" and a faint outline "DEFCON" word from "Lightfall". The eight signature interactions are in the spec (section 5); Plan 1 delivers the Sonar Boot.
