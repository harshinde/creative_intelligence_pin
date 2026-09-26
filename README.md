# Creative Intelligence Pin

A Chrome extension that analyzes any image you pin or paste and turns it
into a structured creative brief — color palette, composition, mood,
typography, and visual style — powered by Google's Gemini API.

This is an early **preview build** shared to gather feedback, not a
finished product. If you try it, I'd genuinely like to hear what's
useful, what's missing, and whether the output is actually helpful for
real design work.

## What it does

Hover over any image on any webpage, click **Analyze**, and within about
a minute you get a full breakdown:

- **Mood** — primary mood, secondary descriptors, energy, formality
- **Palette** — full color palette with hex codes, harmony, temperature,
  contrast, and accessibility notes
- **Composition** — layout archetype, focal point, symmetry, negative space
- **Visual style** — medium, aesthetic movement, design era, textures
- **Typography** — font classification, hierarchy, tone
- **Graphic elements** — icons, patterns, decorative devices

You can also paste an image directly into the extension (from Figma,
Photoshop, a screenshot, anywhere) or drag-and-drop a file — hovering a
webpage image isn't the only way in.

Every analysis can be copied as a clean summary (ready to paste into a
doc, a brief, or a moodboard tool) or as structured JSON — copy the whole
thing, or just the section you need.

## Why

Screenshotting a great design is easy. Explaining *what makes it work* —
the color logic, the type hierarchy, the compositional choices — is the
part that usually gets lost. This tries to capture that reasoning
alongside the image itself, so an inspiration library actually teaches
you something instead of just accumulating screenshots.

**Where this is headed**: the long-term idea is deeper integration with
visual moodboard tools like Adobe Firefly Boards, so a pinned image and
its creative analysis travel together into wherever you're actually
building a mood board or creative brief. That part is still a ways out —
right now this is just the analysis engine, and feedback on *that* is
what would help most before investing further in the integration side.

## Installing it (not yet on the Chrome Web Store)

This is a preview build you load manually:

1. **Get a free Gemini API key** at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Clone this repo and install dependencies**
   ```bash
   git clone https://github.com/harshinde/creative_intelligence_pin.git
   cd creative_intelligence_pin
   pnpm install
   ```
3. **Build the extension**
   ```bash
   cd extension
   pnpm build
   ```
4. **Load it in Chrome**
   - Go to `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** and select the `extension/dist` folder
5. **Add your API key** — click the extension icon, open Settings, paste
   in your Gemini API key
6. **Try it** — hover any image on a webpage and click Analyze, or open
   the side panel and paste/drop an image directly

## Giving feedback

Open an [issue on this repo](https://github.com/harshinde/creative_intelligence_pin/issues) —
bugs, confusing UX, analysis that felt off, or "I wish this did X" are
all useful. This is genuinely early, so blunt feedback is welcome.

## Privacy

Your Gemini API key is stored locally in your browser and used only to
talk directly to Google's Gemini API — there's no other server involved.
Full details: [Privacy Policy](https://harshinde.github.io/creative_intelligence_pin/).

## Tech stack

Chrome Extension (Manifest V3) · React + Vite via CRXJS · TypeScript ·
Google Gemini API · pnpm workspaces

---

*Built by [Harsha Ravi](https://github.com/harshinde). This is an
independent preview build, not an official Adobe product.*
