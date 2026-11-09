# Implementation Plan — Supported Fruit Types Section & Classification Mapping

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated "Buah yang Dapat Dianalisis" (Supported Fruit Types) section to `index.html`, add a compact supported fruits notice to `upload.html`, and ensure full consistency with the 12-class dataset mapping across `config.js`, `api.js`, `result.js`, and `i18n.js`.

**Architecture:** 
- Frontend semantic section inserted between Hero Bento specs and `#how-it-works` on `index.html`.
- Responsive grid (2 cols on mobile, 2-3 on tablet, 3 cols on desktop) with modern frosted cards adhering to FruGrade design language.
- Centralized i18n dictionary in `i18n.js` powering all ID/EN toggles without hardcoded text.
- Unified 12-class technical model mappings (`Fresh/Rotten` × 6 fruits: Apple, Banana, Mango, Orange, Strawberry, Tomato).

**Tech Stack:** HTML5, Tailwind CSS, Vanilla JavaScript, GSAP / ScrollTrigger.

**Spec:** User request specifying 6 fruit types, 2 conditions, 12 classes, responsive rules, upload page notice, and ID/EN bilingual support.

## Global Constraints
- Do not rebuild frontend architecture or delete existing sections (Home, Upload, How It Works, Fruit Facts, Prediction Result).
- Do not modify backend CNN model, checkpoints, or output softmax index order.
- Maintain bilingual ID/EN toggle with zero missing keys.
- Preserve Demo Mode and full offline simulation functionality.
- Mobile grid must use 2 columns for compact, clean fruit cards.
- Desktop grid must use 3 columns × 2 rows.

## Review Focus
1. Section placement: Must sit cleanly below Hero specs and before `#how-it-works` without breaking ScrollSpy.
2. Responsiveness: On mobile (375px), 2 columns must fit with readable labels and non-distorted images.
3. i18n switching: Switching between ID and EN in navbar dynamically updates all 6 fruit cards, status chips, and upload notice.
4. Result page continuity: Results for all 6 fruits (Mango, Strawberry, Tomato, Apple, Banana, Orange) render with correct latin names and imagery.
5. HTML & CSS validation: 100% matched HTML tags and clean Tailwind build.

---

### Task 1: Internationalization Keys & Fruit Metadata
**Files:**
- Modify: `assets/js/i18n.js`
- Modify: `assets/js/config.js`
- Test: `scratch/test_verification.js`

- [ ] Add `fruits.badge`, `fruits.title`, `fruits.subtitle`, `fruits.freshBadge`, `fruits.rottenBadge`, and `upload.supportedNotice` in both ID and EN dictionaries in `assets/js/i18n.js`.
- [ ] Ensure all 6 fruits have explicit ID/EN names: Apple (Apel), Banana (Pisang), Mango (Mangga), Orange (Jeruk), Strawberry (Stroberi), Tomato (Tomat).
- [ ] Update `FG.config.fruits` in `assets/js/config.js` with accurate latin scientific names and image references (`assets/img/mango.jpg`, etc.).
- [ ] Run `node scratch/test_verification.js` to confirm 0 missing keys.

---

### Task 2: Fruit Photography Assets Verification
**Files:**
- Create/Verify: `assets/img/mango.jpg`, `assets/img/strawberry.jpg`, `assets/img/tomato.jpg`
- Modify: `assets/js/config.js`

- [ ] Verify image assets for all 6 fruits: `apple.jpg`, `banana.jpg`, `orange.jpg`, `mango.jpg`, `strawberry.jpg`, `tomato.jpg`.
- [ ] If subagent generation is complete, place the verified images in `assets/img/`.
- [ ] Ensure fallback SVG icon or hero image handles any missing asset gracefully without breaking layout.

---

### Task 3: Section "Buah yang Dapat Dianalisis" in `index.html`
**Files:**
- Modify: `index.html`
- Modify: `src/input.css` (if custom card styling needed)

- [ ] Construct `<section id="supported-fruits" class="relative py-16 sm:py-20 ...">` directly after the Hero section and before `<section id="how-it-works">`.
- [ ] Add Section Header with badge (`fruits.badge`), title (`fruits.title`), and subtitle (`fruits.subtitle`).
- [ ] Create responsive grid: `grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 sm:gap-5 lg:grid-cols-3 lg:gap-6`.
- [ ] Implement 6 fruit cards:
  - Apple (*Malus domestica*)
  - Banana (*Musa × paradisiaca*)
  - Mango (*Mangifera indica*)
  - Orange (*Citrus × sinensis*)
  - Strawberry (*Fragaria × ananassa*)
  - Tomato (*Solanum lycopersicum*)
- [ ] Each card includes:
  - Frosted card shell (`rounded-2xl bg-warm-white/95 border border-black/[0.05] shadow-soft hover:-translate-y-1 hover:shadow-card transition-all`).
  - Image frame (`aspect-[16/10]` or `h-32 sm:h-44`, `object-cover rounded-xl`).
  - Fruit title with `data-i18n` and scientific latin name.
  - Two condition badges: Segar/Fresh (green chip) and Busuk/Rotten (red chip).
- [ ] Add `data-reveal` attributes for smooth scroll reveal.

---

### Task 4: Compact Supported Fruits Notice on `upload.html`
**Files:**
- Modify: `upload.html`

- [ ] Below `h1` in `upload.html`, add a compact, elegant informational notice box:
  - Icon: `eco` / `info`.
  - Bilingual text bound to `data-i18n="upload.supportedNotice"`.
  - Clean frosted container that does not clutter the upload zone.

---

### Task 5: Result Consistency & Demo Mapping
**Files:**
- Modify: `assets/js/api.js`
- Modify: `assets/js/result.js`

- [ ] Verify that `FG.parseClass` and `api.js` mock predictions support all 6 fruits seamlessly.
- [ ] Verify that `result.js` populates the fruit image, latin name, and condition for all 6 fruits.

---

### Task 6: Build, Cache Busters & Visual Verification
**Files:**
- Modify: `index.html`, `upload.html`, `result.html` (bump `?v=10`)
- Run: `npm run build`
- Run: `scratch/test_verification.js`
- Run: `scratch/capture_screens.js`

- [ ] Bump cache busting strings to `?v=10` across all 3 HTML files.
- [ ] Compile Tailwind CSS with `npm run build`.
- [ ] Validate syntax with `node -c assets/js/*.js`.
- [ ] Run test verification script.
- [ ] Capture and visually review mobile (375px), tablet (768px), and desktop (1280px) screenshots.
