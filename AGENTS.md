<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Operational Context & Architecture: SavazAI WebApps Platform
Repository: https://github.com/Savazar01/savazai-webapps-platform

## 1. Platform Vision & Multi-Tenant Atelier Architecture
- **Platform**: SavazAI WebApps (Engineered & Owned by Savazar).
- **Domain Scope**: Enterprise Multi-Tenant Digital Atelier, High-Fidelity Cultural Archive, 3D WebGL Exhibition Corridor, and Museum Publishing System.
- **Client & Domain Agnostic**:
  - The core platform engine is completely decoupled from any single artist, institution, or client identity.
  - Client branding (Name, Title, Subtitle, Bio, Disciplines, Domain Links, and Logos) is managed dynamically via database configuration (`SystemSetting`, `WhiteLabelConfig`, `ThemeConfig`).
  - Capable of servicing fine art masters, traditional heritage artists, museum collections, cultural performance archives, and private collector galleries.
- **Core Mission**:
  To deliver a museum-grade digital presentation engine that combines high-resolution artwork cataloging, physical gallery print automation (labels/placards), 3D spatial exhibition walkthroughs, synesthetic knowledge graph retrieval, and event/commission engagement workflows.

---

## 2. Technology Stack & Architectural Standards
All code in this repository strictly adheres to modern, bleeding-edge production standards:

- **Framework**: Next.js 16+ App Router (`src/` directory architecture, Turbopack, standalone container output).
- **UI Runtime**: React 19 (`react@19.2.8`, `react-dom@19.2.8`) with React Server Components (RSC), Suspense, and Server Actions.
- **Language**: TypeScript 5+ in strict mode (`noImplicitAny`, strict null checks).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with CSS theme variables — **No legacy tailwind.config.js**.
- **Component System**: Shadcn UI with high-elegance classical tokens and WCAG AAA compliance.
- **Rich Text Engine**: Universal Tiptap WYSIWYG Editor (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`) for Page Builder blocks, blogs, curatorial essays, and email templates.
- **3D Spatial Exhibition Engine**: Three.js & React Three Fiber (R3F) for architectural salon walls, procedural lighting rigs, and director-driven camera tours.
- **Print & Publishing Driver**: Isolated Headless Iframe Print Driver (`src/lib/print-isolated-html.ts`) for physical visiting-card ($3.5 \times 2\text{ in}$) and museum-wall ($4 \times 2.5\text{ in}$) placards.
- **Database & Vector Engine**: PostgreSQL 17 with `pgvector` (`pgvector/pgvector:pg17`) running semantic embeddings for multi-modal art and audio exploration.
- **ORM**: Prisma ORM with `postgresqlExtensions` preview feature enabling `vector` and `uuid-ossp` extensions.
- **Authentication**: Better-Auth for administrative RBAC, session tokens, and route protection.
- **Object Storage & Media Vault**: Cloudflare R2 / AWS S3 with signed upload URLs, private origin protection, and local `/media/` fallback.
- **Image Processing**: Sharp for dynamic watermarking, WebP/AVIF conversions, and automated metadata extraction.
- **Email & Notification Engine**: Nodemailer with SMTP/Gmail integration, dynamic token resolution, CID inline logo delivery, and automated audit logging.
- **Knowledge Graph**: Graphify architectural node-link mapping linking architectural modules, database schemas, and curatorial entities.
- **Container Runtime**: Debian 12 Bookworm Slim (`node:22-bookworm-slim`) multi-stage build across all stages (`base`, `deps`, `builder`, `runner`).

---

## 3. Universal Autonomous Agent Lifecycle & Quality Gates
Every autonomous agent, developer, and contributor must strictly follow this execution protocol. **When this section is cited, all steps below must be executed in order without exception:**

### Step 0: Knowledge Graph First Invariant (Mandatory Pre-Task Inspection)
Before designing solutions or editing any codebase files:
- **Inspect the Knowledge Graph**: Autonomous agents and developers MUST inspect the active graph at `graphify-out/` (specifically `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`) or run `graphify query "<topic>"` to understand architectural boundaries, component hierarchies, and database relationships.
- **Prevent Regressions**: Never modify a shared driver, route handler, or schema without verifying its downstream dependents in the knowledge graph first.

### Step 1: Local-First Validation (Zero Remote Regressions)
Prior to committing or pushing any code, run the complete validation chain:
```bash
# 1. Regenerate database client
npx prisma generate

# 2. Strict static type check (0 errors required)
npx tsc --noEmit

# 3. Code formatting and linting (0 errors required)
npm run lint

# 4. Standalone production compilation test (ensures no dynamic prerender crashes)
npm run build
```

### Step 2: Container Environment Validation
Ensure the local multi-container development environment is running and healthy:
```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml restart web-dev
```
Verify localhost accessibility at http://localhost:3060.

### Step 3: Knowledge Graph Synchronization (Mandatory Post-Workflow Sync)
Whenever files, routes, components, or Prisma schemas are added, modified, or deleted:
```bash
graphify update .
```
This guarantees that the knowledge graph permanently mirrors the current AST matrix, clusters community modules, and eliminates knowledge drift for future agent invocations.

### Step 4: Persistent DevPlans Archiving Rule
All user prompts, implementation plans, and walkthrough logs MUST be persistently archived inside a single local directory: `DevPlans/`.
- **Prompts**: `YYYY-MM-DD_HH-mm-ss_[PROMPT]_<topic-slug>.md`
- **Implementation Plans**: `YYYY-MM-DD_HH-mm-ss_[PLAN]_<topic-slug>.md`
- **Walkthroughs**: `YYYY-MM-DD_HH-mm-ss_[WALKTHROUGH]_<topic-slug>.md`
- **Confidentiality**: `DevPlans/` is strictly ignored in `.gitignore` (`/DevPlans/`). It must NEVER be committed or pushed to Git.

### Step 5: Git Commit & Remote Deployment Pipeline
Once all validation gates pass:
```bash
git add .
git commit -m "<type>(<scope>): concise, imperative summary of changes"
git push origin main
```
GitHub pushes to `main` trigger automated builds on the remote VPS managed via **Coolify**, building the multi-stage `Dockerfile` and deploying the standalone Next.js container alongside PostgreSQL 17.

---

## 4. Living Document Governance Invariant
**`AGENTS.md` and `README.md` are living architectural manifests.**
1. **Mandatory Documentation Sync**: Whenever any agent or developer:
   - Adds or updates a component, service, visual block, or public/admin route.
   - Installs, updates, or removes an npm library or third-party dependency.
   - Extends the Prisma database schema or modifies environment configurations.
   - Creates, modifies, or deprecates a `.skills/` manual.
   **BOTH `AGENTS.md` AND `README.md` MUST be reviewed and updated concurrently in the exact same pull request or commit.**
2. **Preventing Knowledge Decay**: Outdated architectural notes, superseded components, or deprecated workflow steps must be removed from `README.md` and `AGENTS.md` immediately.
3. **No Drift Between Docs and Code**: All descriptions of components, port numbers, environment variables, and print/WebGL capabilities in `README.md` must accurately reflect the codebase at all times.

---

## 5. Enterprise Skill Manuals (`.skills/`)
All code generation and architectural modifications must adhere to the specialized manuals in `.skills/`:
- [`.skills/graphify.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/graphify.md): Codebase & Cultural Knowledge Graph extraction with pgvector cosine similarity.
- [`.skills/ui-ux-pro-max.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/ui-ux-pro-max.md): 99 UX guidelines, luxury cultural portfolio tokens, and WCAG 2.2 AAA accessibility.
- [`.skills/vercel-react-best-practices.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/vercel-react-best-practices.md): Strict RSC boundaries, parallel data fetching, zero-FOUC theme hydration, and re-render prevention.
- [`.skills/better-auth-best-practices.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/better-auth-best-practices.md): Private admin authentication with PostgreSQL adapter, `disableSignUp: true`, and middleware route guards.
- [`.skills/shadcn.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/shadcn.md): Design tokens and component elevation rules for classical and contemporary fine art.
- [`.skills/cloudflare-security.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/cloudflare-security.md): Cloudflare WAF hardening, rate limits, CSP headers, and R2 media policies.
- [`.skills/playwright.md`](file:///c:/Users/AVASA/Downloads/OpenC/lalitakapilavai/.skills/playwright.md): E2E multi-browser test harness specifications.

---

## 6. Architectural Invariants & Specialized Core Engines

### A. Physical Placard Print Engine (Isolated Iframe Driver)
- **Problem Avoidance**: Never print modal dialogs in-situ via `window.print()`. Radix portals and Tailwind `fixed`/`overflow-hidden` classes collapse Chromium print engines into $0\times0\text{ px}$ blank pages or cause background dashboard bleed.
- **Standard Driver (`src/lib/print-isolated-html.ts`)**:
  - Always write rendered placards into a dedicated, unstyled headless `<iframe>` and invoke `iframe.contentWindow.print()`.
  - Enforce explicit physical dimensions:
    - **Visiting Card (Landscape)**: $88.9\text{ mm} \times 50.8\text{ mm}$ ($3.5 \times 2\text{ in}$).
    - **Visiting Card (Portrait)**: $50.8\text{ mm} \times 88.9\text{ mm}$ ($2 \times 3.5\text{ in}$).
    - **Museum Placard (Landscape)**: $101.6\text{ mm} \times 63.5\text{ mm}$ ($4 \times 2.5\text{ in}$).
    - **Museum Placard (Portrait)**: $63.5\text{ mm} \times 101.6\text{ mm}$ ($2.5 \times 4\text{ in}$).
    - **Museum Large (Landscape)**: $127.0\text{ mm} \times 76.2\text{ mm}$ ($5 \times 3\text{ in}$).
    - **Museum Large (Portrait)**: $76.2\text{ mm} \times 127.0\text{ mm}$ ($3 \times 5\text{ in}$).
    - **Museum Extra Large (Landscape)**: $152.4\text{ mm} \times 88.9\text{ mm}$ ($6 \times 3.5\text{ in}$).
    - **Museum Extra Large (Portrait)**: $88.9\text{ mm} \times 152.4\text{ mm}$ ($3.5 \times 6\text{ in}$).
  - All cards enforce `page-break-inside: avoid !important; break-inside: avoid !important;`.
  - **Configurable Stand Clamp Safety Margin & Dead Space Elimination**:
    - Replaced rigid 18mm void with configurable clamp margin: `none` ($0\text{ mm}$ - full canvas utilization), `minimal` ($3\text{ mm}$), `standard` ($7\text{ mm}$), and `acrylic-clamp` ($16\text{ mm}$).
  - **Granular Per-Field Typography & Styling Engine**:
    - Every active placard field (Title, Medium & Materials, Dimensions, Year Created, Valuation/Price, Category/School, Artist Credit, QR Code, Thumbnail, Notes) supports independent font family (`cinzel`, `cormorant`, `playfair`, `georgia`, `inter`), font size scale (7pt to 32pt), bold/italic/underline/uppercase styling, and custom text color.
  - **Unstyled Price & Currency Formatting**:
    - Eliminates rigid background earmarks/badges; prices render as clean fine-art metadata paired with localized currency symbols (`₹`, `$`, `€`, `£`, `AED`, `S$`, etc.) or optional curatorial badge styling.
  - **Configurable Thumbnail & QR Code Positioning & Flow**:
    - Supports `top-right`, `bottom-right`, `inline`, and `stacked` right-panel media placement, eliminating spatial crowding and permitting multi-row title wrapping without clipping or metadata drop-off.
  - **Two-Column Master Workspace & Persistent Sticky Live Preview**:
    - The placard customizer features a master 2-column atelier layout:
      - **Left Pane (`lg:col-span-7`)**: Dedicated scrollable studio for field typography, global color palettes, media geometry, and individual card metadata overrides.
      - **Right Pane (`lg:col-span-5 sticky top-0`)**: Persistent Live Real-Time Card Preview anchored in place, updating instantly on every keystroke with zoom controls ($50\%$ to $175\%$), card stepper, and stand clamp guides.
    - **Fullscreen Mode**: 1-click toggle expanding the studio to the full browser viewport (`w-screen h-screen`) for distraction-free physical layout inspection.
  - **Restored Interactive Field Reordering**:
    - Interactive Up/Down sequence buttons directly reorder fields (`header`, `title`, `medium`, `dimensions`, `year`, `price`, `visual_cluster`, `notes`) across both portrait and landscape layouts with 1-click reset to museum standards.
  - **Eliminated Mid-Card Dead Gaps & Strict Natural Vertical Stacking**:
    - Removed `justify-between` and `mt-auto` from card containers, establishing a top-aligned flex stack (`justify-start gap-1` to `gap-1.5`).
    - Implemented `renderOrderedFields` which renders fields in exact priority order, pairs adjacent `dimensions` and `year` into a clean single line, skips empty or unchecked curatorial notes with zero reserved height, and pulls subsequent fields (`dimensions`, `year`, `price`) up tightly beneath `medium`.
    - Any unused card canvas resides strictly at the bottom of the card, completely eradicating internal dead voids.
  - **Universal Master Font Family Cascade**:
    - All text nodes (Category/School, Artist, Title, Medium, Dimensions, Year, Price, Notes, QR label, and customizer inputs) strictly inherit the active Master Font Family (`styling.fontFamily`: Cinzel, Cormorant Garamond, Playfair Display, Inter, Georgia) via `getResolvedFieldStyle`.
    - Integrated Google Web Fonts `<link>` preconnects in `layout.tsx` to ensure immediate real-time rendering in browser previews without fallback glitches.
  - **Dedicated Live Interactive Preview Studio & Fullscreen Inspect Engine**:
    - High-precision interactive WYSIWYG studio (`PlacardLivePreviewModal`) decoupled from Radix dialog hierarchies and rendered via a dedicated React Portal directly to `document.body` (`fixed inset-0 z-[100]`), eliminating Chromium translate trapping bugs (`translate-x-[-50%] translate-y-[-50%]`).
    - Features physical millimeter scale, zoom controls ($50\%$ to $250\%$), single-card inspection, full gang-run sheet preview, stand clamp guides, and dedicated top-level `Escape` key capture listeners with sticky "✕ Exit Fullscreen (Esc)" controls.
- **e-Catalog Synchronous Preloader & Asynchronous Decoding Barrier**:
  - In `src/lib/print-isolated-html.ts`, normalize all HTML images to force `loading="eager"` and `decoding="sync"`.
  - The driver awaits `Promise.all(images.map(img => img.decode().catch(...)))` followed by a safety buffer before invoking `iframe.contentWindow.print()`.
  - In `src/components/public/catalog-print-button.tsx`, an in-situ decoding preloader displays a responsive progress indicator while decoding offscreen plates, completely eliminating blank image omissions on plates 2+ in browser PDF exports.
- **Unrestricted Native Catalog Printing & High-Resolution PDF Canvas**:
  - Eradicated `.public-catalog-print-guard` modal, unlocking native browser printing (`Ctrl+P` / `Cmd+P`) and PDF saving across all digital monographs.
  - Universal print scrollbar suppression: `@media print { * { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; } }`.
  - Container expansion: `.catalog-frame`, `.cover-page`, `.plate-page`, and `.plate-details-col` enforce `overflow: visible !important` and `print:overflow-visible`, completely eliminating trapped scrollbar containers in exported PDF covers and plates.
  - Theme canvas color fidelity: `.catalog-frame` enforces solid `#FAF7F2` background with `backdrop-filter: none !important` during print, preventing outer dark or terracotta red cover borders from bleeding through translucent cards as a pinkish tint.
  - Metadata deduplication: Category badges are cleanly suppressed when Category is already displayed in the plate top header, dedicating subtitles to creation year and custom notes.
- **e-Catalog Fluid Mobile Viewport & Inner Scrollbar Eradication Invariant**:
  - On mobile screens (`max-width: 767px`), all e-catalog pages (`.catalog-page`, `.cover-page`, `.plate-page`, `.essay-page`, `.editorial-page`, `.end-page`, `.catalog-matrix-page-wrapper`) enforce `aspect-ratio: auto !important`, `height: auto !important`, and `overflow: visible !important`.
  - Eradicates rigid desktop aspect ratio height collapse (~260px) and eliminates trapped inner scrollbars (`overflow-y: auto`) on `.catalog-frame`, `.plate-details-col`, `.plate-body-flow`, `.magazine-col`, and `.catalog-matrix-cell`.
  - Multi-column artwork plates (`plate-body-grid`) automatically stack into a single vertical column (`flex-direction: column !important`) with centered artwork image (`max-height: 48vh`) and natural vertical flow of curatorial notes, title, medium, dimensions, and descriptions.
  - Desktop view ($\ge 768\text{px}$) and Chromium PDF print engine (`@media print`) remain 100% untouched and preserved.

### B. 3D WebGL Exhibition Salon Wall Engine & Gallery Background Architecture
- **Aspect Ratio Preservation**:
  - NEVER force artworks into uniform square aspect ratios (`aspect-square` or $1:1$).
  - Calculate Three.js frame, gold fillet, matting, and canvas plane dimensions dynamically from the image's intrinsic ratio (`naturalWidth / naturalHeight`).
  - The outer frame wraps around the artwork's natural proportions without squishing or cropping.
- **Multi-Wall Automatic Partitioning**:
  - Use `maxArtworksPerWall` (default: 4, range: 2–8).
  - When hung artworks exceed this threshold, the engine automatically partitions the collection into sequential corridor walls (Wall 1, Wall 2, etc.), preventing visual crowding.
- **Multi-Wall Custom Image Backdrops & Pure Backdrop Mode**:
  - In `ExhibitionWallBlock`, the back wall geometry is partitioned into modular bay meshes (`w = 0` to `numWalls - 1`) aligned with architectural divider pilasters.
  - Supports `wallBackgroundMode: "uniform" | "per-wall"`:
    - `"uniform"`: All salon corridor bays share a single texture (`wallCustomBackgroundUrl`), mapped via dynamic aspect-ratio cover UVs.
    - `"per_wall"`: Each bay (`wallCustomBackgrounds[w]`) receives an independent high-resolution texture map with independent sRGB color space rendering and dedicated upload input pipeline.
  - **Pure Backdrop Mode (Procedural Element Suppression)**:
    - When `isCustomBackdrop` is active (custom wall URL, per-wall configuration, or custom cultural environment), the engine suppresses all procedural 3D elements (`floorMesh.visible = false`, `crownMesh.visible = false`, `skirtingMesh.visible = false`, `pilasters.visible = false`, `decorGroup.visible = false`).
    - Eliminates duplicate CSS `backgroundImage` on the container, rendering the image cleanly through Three.js WebGL with `roughness: 0.35`, `metalness: 0.0`, `color: 0xffffff`, and `bumpMap: null`.
    - Switches ambient and spotlight illumination to clean, neutral white (`0xffffff`, ambient $1.0$, spotlight $7.0$), eliminating unwanted color tinting or dimming from cultural environment presets.
    - Artworks maintain museum-standard eye-level centerline hanging ($1.55\text{ m}$) with balanced, proportional horizontal spacing centered at `wallCenterX`.
  - Wall bays seamlessly fallback to procedurally illuminated plaster walls when no custom texture is specified.
- **Dynamic Non-Overlapping Vertical Clearance & Balanced Horizontal Spacing Invariant**:
  - In `ExhibitionWallBlock` (`computePlacements`), vertically stacked artworks in multi-row layouts (e.g. 4+ artworks across 2 rows) dynamically compute non-overlapping frame positions via `getStackedY`:
    $$\text{centerDist} = \frac{h_{\text{top}}}{2} + \text{VERTICAL\_GAP} + \frac{h_{\text{bottom}}}{2} \quad (\text{where } \text{VERTICAL\_GAP} = 0.28\text{ m})$$
    $$y_{\text{top}} = 1.55 + \frac{\text{centerDist}}{2}, \quad y_{\text{bottom}} = 1.55 - \frac{\text{centerDist}}{2}$$
  - Mathematically guarantees that the physical clearance between the bottom edge of the top frame and the top edge of the bottom frame is strictly $0.28\text{ m}$ regardless of the individual aspect ratios or dimensions of the artworks, completely eliminating frame overlapping.
  - Multi-row walls ($count \ge 4$) scale artwork frames to $maxDim = 1.15\text{ m}$ so stacked artworks fit with museum elegance within standard wall heights.
  - Horizontal column gaps are expanded to generous spacing ($1.50\text{ m}$ for 2-column configurations, $1.20\text{ m}$ for 3-column configurations) symmetrically flanking the wall centerline ($14\text{ m}$ bay).
- **Multi-Wall Zero-Bleed Corridor Framing & Dynamic Distance Calculation**:
  - `WALL_SPACING` is set to $20.0\text{ m}$ between adjacent corridor walls.
  - To prevent visible bleeding of adjacent walls into widescreen camera frames, overview camera distance is dynamically calculated:
    $$\text{overviewZ} = \min\left(\frac{13.6}{2 \cdot \tan(\text{vFov}/2) \cdot \text{aspect}}, 8.2\right)$$
    This bounds the visible wall width at rest to strictly $\le 13.6\text{ m}$, leaving neighboring bays starting at $\pm 10.0\text{ m}$ completely offscreen.
  - In `animate()`, non-active wall bay meshes modulate opacity based on camera distance ($\text{distToCam} > 14\text{ m} \implies \text{opacity} = 0$), guaranteeing zero edge bleeding even during wide camera glides.
- **Curatorial Multi-Artwork Layout Presets & Positioning Offsets**:
  - `ExhibitionWallBlock` supports custom per-wall layout presets tailored to the artwork count $N$:
    - **1 Artwork**: Centerpiece ($0, 1.55$), Flank Left ($-1.8, 1.55$), Flank Right ($+1.8, 1.55$).
    - **2 Artworks**: Horizontal Line (side-by-side at $1.55\text{ m}$ eye-level); Vertical Column (stacked with $0.28\text{ m}$ clearance via `getStackedY`).
    - **3 Artworks**: Horizontal Line of 3; Vertical Column of 3; Pyramid (1 top, 2 bottom); Inverted Pyramid (2 top, 1 bottom).
    - **4 Artworks**: Balanced $2\times 2$ Quad Grid; Horizontal Line of 4; Pyramid 1-over-3; Inverted 3-over-1; Classical Salon Quad.
    - **5 Artworks**: Centerpiece flanked by 2 stacked columns; Staggered 2-over-3; Staggered 3-over-2; Horizontal Line of 5.
    - **6 Artworks**: Wide Grid ($3\times 2$); High-Ceiling Grid ($2\times 3$); Horizontal Line of 6.
  - **Independent Wall Curation & Artwork Allocation**:
    - Each exhibition corridor wall is fully decoupled with independent artwork assignments, layout presets, fine positioning offsets, and vertical clearances.
    - Upfront "Default Artworks per Wall" configuration slider with `[-]` and `[+]` discrete steppers partitions collections cleanly before individual wall curation.
  - **Curatorial Wall Frame Styles**:
    - Supports per-wall unified framing styles (`frameStyle`): `Museum 24k Gold Leaf`, `Burmese Teak Wood`, `Contemporary Gallery Black`, `Museum Glass & Acrylic Float` (with reflective specular glaze), `Antique Rosewood`, `Scandinavian Light Oak`, `Minimalist White Float`, and `Curated Mix`.
    - Automatically wraps all artworks assigned to that wall in identical museum materials, bevels, fillets, and matting dimensions.
  - **Cinematic Wall-to-Wall Camera Transitions**:
    - Supports `cameraTransitionStyle`: `"cinematic-arc"`, `"pan-zoom"`, `"dolly"`, and `"crossfade"`.
    - `"cinematic-arc"` executes a Hollywood crane shot with parabolic $Z$-pullback ($\Delta Z = +2.2\text{ m}$ mid-flight) and subtle Steadicam elevation lift, delivering velvety smooth wall traversal without velocity spikes or visual clipping.
  - **Fine Positioning Offsets & Row Clearance**:
    - Supports per-wall horizontal shift ($X \in [-2.5\text{ m}, +2.5\text{ m}]$), vertical elevation ($Y \in [-1.0\text{ m}, +1.0\text{ m}]$), spacing spread multiplier ($0.6\times$ to $1.6\times$), and a dedicated **Vertical Row Clearance Gap** slider ($0.20\text{ m}$ to $0.90\text{ m}$, default $0.48\text{ m}$) with discrete step buttons and 1-click resets.
    - Vertical gap calculation includes actual outer frame and matting thickness ($0.16\text{ m}$), eliminating frame collisions in Pyramid, Inverted Pyramid, and multi-row grids.
  - **Searchable Artwork Catalog Modal**:
    - In `MediaGalleryInspector`, "+ Search Artwork Catalog" opens an in-situ modal to query the permanent museum archive by title, medium, dimensions, tags, or category, allowing 1-click addition of artworks to any active wall.
- **WYSIWYG Wall Curation Studio**:
  - In `MediaGalleryInspector`, an interactive 2D Wall Schematic preview renders the active wall's backdrop with miniature framed artworks positioned at their exact calculated coordinates in real time.
  - Allows selecting layout presets with visual checkmark badges, adjusting fine positioning sliders with steppers and 1-click resets, reordering slots with `<` and `>`, swapping artworks via dropdowns, and adding or removing walls.
- **Universal Media Gallery Canvas Background Engine**:
  - All Media Gallery presentation options (Carousel, Snap Scroll, Curated Bento, Ken Burns, Soft Crossfade, Filmstrip Reel) support custom backdrop images via `canvasBgImageUrl`, `canvasBgMode` (`"cover" | "contain" | "tile" | "blur"`), and `canvasBgOpacity` (0–100%).
  - Integrated with local `/media/` mount on localhost:3060 and remote cloud storage (S3/R2) via direct upload or Media Vault picker.
- **Zero Overlay Invariant**:
  - Never overlay dark administrative cards, badges, or thumbnail strips across the 3D viewing canvas.
  - On desktop, mount the metadata placard as a physical white plaque on the wall to the right of the artwork.
  - On mobile (< 768px), hide the on-wall placard completely (`hidden md:flex`) and center the artwork cleanly.

### C. Universal Email Notification & Form Dispatch Engine
- **Decoupled Alert Routing**: Inbound form submissions route to `systemSetting.adminAlertEmail`, never to console super-admin credentials.
- **Dynamic Form Discovery**: `/api/admin/forms/discover` dynamically aggregates core triggers (`contact`, `event_rsvp`, `custom_form`), Page Builder form blocks, and active Event registration forms.
- **Universal Tenant Brand Resolver (`getTenantBranding()`)**:
  - Outbound email dispatch across all transports (inquiry auto-responders, admin alerts, test pings, and OTP verifications) dynamically resolves `name`, `subtitle`, `logoUrl`, `fromEmail`, and `displayName` from `prisma.systemSetting`.
  - Zero hardcoded client names, emails, or artist titles are permitted in email templates, transporters, or fallbacks.
- **Dual Delivery Logo Engine (CID + HTTPS)**:
  - Email branding uses the single source of truth: `SystemSetting.logoUrl` from the "General" settings tab.
  - Embed local disk images as inline MIME attachments (`cid:atelier-brand-logo`) to guarantee instant rendering in Gmail, Outlook, and Apple Mail without broken image icons.
  - Remote cloud storage images resolve via `getAbsoluteAssetUrl()` with fully qualified HTTPS URLs.
- **Fail-Fast Real OTP Delivery & Zero-Leak Invariant**:
  - Outbound OTP verification dispatch strictly fails fast on transmission failure, returning HTTP 500 with descriptive error details instead of a false HTTP 200 `challengeSent: true`.
  - Zero exposure of OTP verification codes: The 6-digit numeric OTP is NEVER returned in API responses, client payloads, or network requests under any environment (`devCode` is strictly eradicated). `<FormOtpDialog />` input is initialized completely empty, enforcing real retrieval from the user's email inbox.
  - Transporter Integrity: Outbound OTP emails strictly require an active SMTP transporter (`emailConfig.isEnabled: true` or valid SMTP credentials in database). If unconfigured or failed, the system fails fast and records `FAILED` in `EmailDispatchLog`.
  - Post-verification submission automatically dispatches both Admin Alert Email (to `adminAlertEmail`) and Patron Confirmation Receipt (to visitor's email) via `sendAtelierEmail()`.
  - SMTP envelope sender aligns with authenticated credentials while maintaining `replyTo` for administrative routing.
- **Audit Logging**: Persist every outbound message in `EmailDispatchLog` with delivery statuses (`SENT`, `FAILED`), error captures, and CSV export capabilities.

### D. Strict Binary Theme & Contrast Invariant
- **Binary Modes Only**: Strictly `"dark"` and `"light"`. `enableSystem` is permanently `false`.
- **Zero Inverted Surfaces**: Never hardcode dark backgrounds without a `dark:` prefix. Light mode surfaces must resolve to `bg-card` (`#FFFFFF`) with visible `#CBD5E1` borders.
- **Class-Based Dark Engine**: `src/app/globals.css` must always maintain `@custom-variant dark (&:where(.dark, .dark *));` so OS dark preferences do not leak into Light mode.
- **Placard Contrast Lock**: Physical museum placards and on-screen exhibition placards rendered beneath or beside 3D WebGL Exhibition Walls must maintain invariant high-contrast dark text (`#111827`, `#374151`) on pure white paper (`#FFFFFF`, `[color-scheme:light]`), regardless of website dark/light mode toggles.

### E. Multi-Tenant Brand Identity & Asset Engine (.ico Favicon & Conditional Phone)
- **Dynamic Brand Notice**: The public footer never hardcodes copyright notices or watermark fallbacks; it renders dynamic `footerConfig.copyrightNotice` exclusively.
- **Configurable Archival Provenance & Copyright Notice Box**:
  - `SystemSetting.copyrightNoticeHeader` and `SystemSetting.copyrightNoticeContent` provide dedicated fields in Admin Settings -> General to configure the copyright & provenance card on public artwork detail pages (`/artwork/[slug]`).
  - **Zero-Ghost Invariant**: If both fields (or content) are left empty or blank by administrators, the entire archival provenance & copyright box is completely suppressed on public artwork pages without rendering empty outlines, borders, or default fallback strings.
- **Conditional Contact Phone Suppression**: Whenever Studio / Contact Phone is blank, empty, or null in System Settings, the UI completely suppresses the phone row (both icon and text) across public footers and headers without displaying default placeholder phone numbers.
- **Native Favicon & Vector Engine**: Media upload pipeline provides dedicated direct passthrough bypass for `.ico` (`image/x-icon`, `image/vnd.microsoft.icon`) and `.svg` (`image/svg+xml`), preventing Sharp rasterization or WebP degradation of multi-resolution icons and scalable vector graphics.

### F. Dynamic Archive Subtitle & Idempotent Non-Destructive Tenant Deployment
- **Configurable Archive Subtitle**:
  - `SystemSetting.archiveSubtitle` provides a dedicated field in Admin Settings -> General ("Archive Subtitle / Brand Tagline") rendered directly beneath the brand title in `Navbar`.
  - If omitted or empty, the subtitle element is cleanly suppressed without rendering empty layout rows or falling back to hardcoded text.
- **Storage Credentials Neutrality**:
  - Storage credential inputs (S3/R2 access keys, secret keys, bucket names) strictly display neutral placeholder formats (e.g. `placeholder="e.g. AKIAIOSFODNN7EXAMPLE"`) and must never be pre-populated or defaulted with administrative email addresses.
- **Strict Seeder Non-Destructive Invariant**:
  - `prisma/seed.ts` enforces that if an `existingSettings` record is detected, it logs `🛡️ Existing SystemSetting detected. Skipping configuration overwrite to protect client data.` and skips all configuration mutations.
  - Across container deployments and restarts, active tenant configuration, custom page blocks, menu items, and soft-deleted entities (`isDeleted: true`) are strictly preserved and never overwritten or resurrected.

### G. Universal Contact Form & Generalized Multi-Tenant Email Templates
- **Universal Form Structure**: Standard contact form blocks render 5 universal inquiry fields: Full Name, Email Address, Phone Number (optional), Subject Line, and Message. Specialized or artist-specific presets ("Artwork Acquisition", "Commission Work") are eradicated in favor of open-ended subject fields.
- **Dynamic Organization Token Resolution**: System notification and auto-responder email templates resolve `{organization_name}` dynamically from `SystemSetting.siteName` (with graceful fallback to platform branding). Zero artist-specific strings are hardcoded in seeder presets or defaults.
- **Unified Lead Ingestion**: Form submissions routed through `/api/forms/submit` map generic inquiries cleanly to the `contact` trigger template and CRM Lead pipeline, delivering alerts to `adminAlertEmail` with encrypted transmission notices.

### H. Dynamic Admin Dashboard Metric Calculation Engine
- **Decoupled Overview Tiles**: Dashboard overview cards are decoupled from single-client or single-medium terminology. All default tiles adhere to enterprise taxonomy: Catalog & Assets, Categories & Classifications, Events & Showcases, Inbound Inquiries & Leads, Digital e-Catalogs, Articles & Publications, System Health & Services, and Quick Operations.
- **Dynamic Metric Source Resolver**: The backend resolver (`/api/admin/overview/metrics` and `DashboardWidget.metricSource`) aggregates live counts across PostgreSQL tables (`count:artworks`, `count:categories`, `count:events`, `count:leads`, `count:event_rsvps`, `count:event_specific_rsvp`, `count:catalogs`, `count:pages`, `count:posts`) with zero-latency parallel queries.
- **Specific Event Filtering**: When `count:event_specific_rsvp` is selected, `metricFilterId` scopes registrations dynamically to the specified scheduled event.
- **SSR Pre-Computation**: `src/app/admin/(dashboard)/page.tsx` executes parallel count queries on the server, guaranteeing that initial renders and full page reloads display live metrics without client-side pop-in or hydration lag.

### I. Multi-Cloud Storage Architecture (Google Workspace & Nextcloud WebDAV)
- **Universal Provider Dispatch**: Object storage supports `LOCAL`, `S3`, `R2`, `GOOGLE_DRIVE`, and `NEXTCLOUD` with transparent failover and zero-downtime reconfiguration.
- **Google Workspace Storage & Sheets Sync**:
  - `src/lib/storage/google-drive-driver.ts`: Implements OAuth2 token refresh, multipart asset upload, public thumbnail link generation (`lh3.googleusercontent.com/d/`), and Google Sheets lead append integration for CRM synchronization.
- **Nextcloud WebDAV & OCS Share Engine**:
  - `src/lib/storage/nextcloud-driver.ts`: Executes HTTP PUT uploads with recursive `MKCOL` directory provisioning, authenticated via App Passwords or Basic Auth, and provisions public read-only shares via the Nextcloud OCS Share API (`/ocs/v2.php/apps/files_sharing/api/v1/shares`).
- **Dynamic Driver Caching & Test Validation**:
  - Dedicated test connection endpoint at `/api/admin/settings/test-storage` allows verifying credentials prior to saving. `clearStorageCache()` guarantees that administrative config updates take effect immediately without requiring process restarts.

### J. Dynamic Enterprise Landing Page Studio & Atomic Homepage Promotion
- **Decoupled Sandbox Invariant**: Creating or editing landing pages never mutates or overwrites the active homepage (`isHomepage: false` by default).
- **7 Industry Archetype Blueprints**:
  - `PROFESSIONAL`: Executive hero, metric ticker counters, split practice areas grid, institutional CTA.
  - `PORTFOLIO`: Living atelier hero, horizontal exhibition strip, authenticated monograph tags, 24K gold foil badges.
  - `RESTAURANT`: Atmospheric banner, multi-category dining matrix, dietary pill chips (Chef Signature, Gluten-Free, Vegan).
  - `HOSPITALITY`: Luxury retreat hero, signature suite cards (area, occupancy, view), curated amenity icon strip.
  - `HEALTHCARE`: NABH/ISO accredited clinic hero, department specialty grid, physician practitioner cards.
  - `CORPORATE`: SaaS glow hero with hover elevation grids, SLA performance cards, and expandable FAQ accordion.
  - `BLANK`: 12-column unconstrained canvas ready for custom visual builder blocks.
- **Atomic Homepage Promotion & Demotion**:
  - Backend route `/api/admin/pages/[id]/promote` executes atomic Prisma transactions: sets `isHomepage: false` across all pages, then marks the target page `isHomepage: true`.
  - Demotion (`DELETE`) cleanly unsets `isHomepage`, restoring the default curated homepage fallback instantly.
- **Root URL Priority Engine**:
  - `src/app/page.tsx` queries `where: { OR: [{ isHomepage: true }, { slug: "home" }, { slug: "index" }] }` with `orderBy: [{ isHomepage: "desc" }, { updatedAt: "desc" }]`, prioritizing promoted landing pages with zero hydration lag.

### K. SavazAI Multi-Tenant Brand Neutrality Invariant
- **Total Decoupling from Single-Tenant Data**: The codebase, seeders, administration forms, input placeholders, and system defaults must never contain hardcoded client-specific names, domains, or administrative emails (e.g. `admin@lalitakapilavai.com`, `lalitakapilavai.com`).
- **Standardized Neutral Formats**:
  - Placeholders must strictly utilize generic, industry-standard examples: `yourdomain.com`, `admin@yourdomain.com`, `https://cloud.yourdomain.com`, `1234567890-abc.apps.googleusercontent.com`, `GOCSPX-xxxxxxxxxxxxxxxx`, `AKIAIOSFODNN7EXAMPLE`.
- **Browser Autofill & Credential Guard**:
  - Administrative configuration inputs (OAuth client IDs, usernames, passwords, API tokens) must declare explicit non-credential field names (`name="..."`, `id="..."`), `autoComplete="off"` or `autoComplete="new-password"`, and password manager ignore tags (`data-1p-ignore="true"`, `data-lpignore="true"`).
  - This guarantees that Chromium or browser password managers never involuntarily inject the currently logged-in administrator's email or credentials into cloud storage or configuration input fields.
- **Dynamic Configuration Invariant**: All branding, identities, domains, emails, and archive titles must resolve at runtime through database configuration (`SystemSetting`, `WhiteLabelConfig`, `ThemeConfig`). Zero client data shall be baked into code artifacts.

### L. Multi-Day Event RSVP Interval Engine & Dynamic Attendance Tracking
- **Configurable RSVP Settings**:
  - `EventRsvpConfig` provides full administrative control over:
    - `requireDateSelection` (boolean)
    - `allowMultipleDates` (boolean, enabling multi-day selection via interactive day cards/checkboxes)
    - `timeSlotRequirement` (`"mandatory"` | `"optional"` | `"disabled"`)
    - `slotIntervalMinutes` (15, 30, 45, 60, 120 minutes or custom)
    - `slotCapacity` (optional integer limit per slot).
  - Public booking `/events/[slug]` dynamically calculates time slots per selected day using its specific `startTime` and `endTime`.
  - For optional slot modes, a clean "Anytime / Flexible Arrival" option is provided.
  - Submissions to `/api/events/register` persist `selectedDates` and `selectedSlot` into CRM Lead custom fields and registration models.
  - CRM Leads table, details dialog, and CSV export display attendance dates and time slot badges.

### M. 3D WebGL Exhibition Salon Wall Studio & Realistic Environments
- **Museum Standard Hanging Heights & Elevation**:
  - Center-line eye level strictly enforced at $y = 1.55\text{ m}$ (58–60 inches from floor) across single-row, grid, and salon layouts.
  - Absolute minimum floor clearance of $0.98\text{ m}$ enforced for bottom-tier frames via dynamic clamping (`Math.max(1.28, 0.98 + H / 2)`), preventing artworks from visually colliding with baseboards.
  - Multi-tier layouts preserve a minimum $0.32\text{ m}$ vertical clearance gap between rows and $0.85\text{ m}$ horizontal clearance between adjacent outer frames.
  - Exact Bilateral Centering: Salon layouts dynamically calculate combined cluster bounding boxes (`totalSpan`) to guarantee that left and right outer margins to the wall boundaries are mathematically identical.
- **7 Procedural Architectural Environments & PBR Furnishings**:
  - `modern-minimalist`, `imperial-palace`, `indian-atelier`, `residential-salon`, `heritage-villa`, `corporate-gallery`, and `custom`.
  - Symmetrical Architectural Framing: Gilded capital pilasters are positioned at every wall bay boundary ($w \cdot 14.0 - 7.0\text{ m}$ through $(numWalls - 1) \cdot 14.0 + 7.0\text{ m}$), ensuring Wall 0 and all bays are framed with bilateral balance.
  - Foreground visitor benches are crafted with realistic PBR materials: dark American walnut plinths, warm cognac tufted leather cushions (`0x8c4a24`, `roughness: 0.45`, `metalness: 0.15`), and cylindrical champagne brass legs ($z = 6.2\text{ m}$, total height $0.32\text{ m}$), illuminated by warm gallery fill lights at $z = 7.5\text{ m}$.
  - Dynamic Occlusion Guard: `decorGroup.visible` is dynamically set to `isOverview` in the animation loop, automatically hiding foreground furniture during artwork focus steps so paintings are never occluded.
- **Cinematic Damped Camera Transitions**:
  - Camera transitions use frame-rate independent `THREE.MathUtils.damp` for both camera position and target `lookAt`, starting from a wide salon establishing shot at `(0, 1.85, 9.4)` looking at `(0, 1.55, 0)` without snapping.
  - Wall transitions execute smooth panoramic camera sweeps, establishing the new wall overview before focusing on its first artwork.
- **Responsive High-Contrast Presentation**:
  - Bottom metadata placard is locked to high-contrast dark slate (`bg-slate-900 text-white`) in Light Mode, preventing black-on-black button clashes.
  - On viewports < 768px, a floating mobile provenance drawer provides full metadata and navigation controls.

### N. Placard Customizer Live Data Sync & Currency Overrides
- **Live Price Synchronization**:
  - Modal opening triggers automatic background synchronization from the artworks database (`/api/admin/artworks`), populating fallback valuation maps.
  - Card-level overrides allow editing titles, medium, dimensions, year, price, and currency (INR, USD, EUR, GBP, AED, SGD).
  - "Save Placard Customizations" persists overrides locally and synchronizes updates directly to the PostgreSQL database via `PUT /api/admin/artworks/[id]`.

### O. Enterprise Page Builder Studio & Sanitized Ingestion
- **Deterministic DND Hydration Guard**:
  - Page Builder declares deterministic static ID `<DndContext id="savazai-page-builder-sections-dnd">` and client mounting guard (`mounted`), completely preventing SSR/CSR `aria-describedby` hydration mismatches that previously de-synchronized React 19 synthetic event listeners.
- **Radix UI Sliders & Switches**:
  - Inspector controls use accessible `@radix-ui/react-slider` and `@radix-ui/react-switch` primitives for "Max Artworks Per Wall" ($1–8$), "Overview Wall Dwell" ($2–15\text{s}$), "Artwork Focus Dwell" ($2–15\text{s}$), "Autoplay Tour", and "Display Metadata Card Below Wall".
  - Pointer events and dragging interactions are isolated to prevent modal drag-trapping or z-index event occlusion.
- **Sanitized Alt Text & Metadata Ingestion**:
  - Ingestion routines and "Auto-Fill from Catalog & Asset Repository" force `alt: ""` unless explicitly authored by the user.
  - Raw UUID filenames (e.g. `e09874c5-4fed-4176...`) and legacy single-artist or devotional captions are strictly stripped on catalog enrichment.

### P. Exhibition Hall Placard Contrast & HTML Sanitization Invariant
- **Theme-Driven Button Contrast**:
  - The "Details" / "View Details" button across both floating 3D canvas overlay cards and bottom metadata drawers must strictly inherit semantic Theme Studio tokens: `bg-primary text-primary-foreground hover:bg-primary/90`.
  - Inverted or hardcoded white-on-white text/background buttons are strictly forbidden to ensure WCAG 2.2 AA compliance across all light and dark themes.
- **HTML Sanitization Pipeline (`stripHtmlTags`)**:
  - All rendered artwork descriptions, curatorial notes, and placards must pass through `stripHtmlTags(...)` before display.
  - Raw HTML markup, unescaped tags (`<p>`, `<span>`, `style="..."`), non-breaking spaces (`&nbsp;`), and HTML entities are stripped to prevent raw markup leakage into presentation placards.

### Q. Mobile QR Scan Onboarding, Safe-Area & Persistent Device Identity
- **Mobile Viewport Safe-Area Padding**:
  - Physical QR placard scan intake modals and gates must enforce dynamic viewport heights and iOS home indicator insets: `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` with `max-h-[92dvh] sm:max-h-[85dvh]` and `overflow-y-auto`.
  - Primary action buttons must be placed inside sticky action footers (`sticky bottom-0 bg-card/95 backdrop-blur-sm`), ensuring full visibility above mobile browser toolbars on iPhone Safari and Android Chrome.
- **Configurable Artwork QR Lead-Capture Gate in System Settings**:
  - Configurable via a dedicated **QR Scan Gate** tab in `/admin/settings` (`value="qr-scan"`):
    - **Eyebrow / Badge Text**: Customizable badge text alongside the QR emblem (default: `EXHIBITION FLOOR GUIDE`).
    - **Modal Header Title**: Customizable modal title (default: `Welcome to the Exhibition`).
    - **Lead Capture Prompt Template**: Dynamic template string supporting `{{artworkName}}` and `{artwork}` placeholders (default: `Enter your details to explore details of the Artwork "{{artworkName}}".`), resolving dynamically per scanned artwork.
    - **Action Button Label**: Customizable CTA button label (default: `Unlock Masterwork Details`).
    - **Allow 'Skip & View' Link**: Switch toggle controlling whether visitors can bypass intake without submitting contact details.
  - Features a real-time **Live Mobile Dialog Preview** displaying interactive token interpolation and layout changes directly in the admin workspace.
- **Strict Mandatory Email Invariant for CRM Leads**:
  - Email Address is ALWAYS required (`EMAIL ADDRESS *`, `required: true`, RFC 5322 regex validation) on all physical QR intake gates.
  - The `(OPTIONAL)` suffix is eradicated.
  - Server-side validation in `POST /api/leads/qr-scan` rejects non-background submissions without a valid email with `400 Bad Request`, strictly enforced even if CAPTCHA challenge or Email OTP are toggled OFF in System Settings.
- **Mandatory Phone / WhatsApp**:
  - WhatsApp / Phone Number is marked required (`*`, `required: true`) across physical gallery floor QR scan gates to ensure valid patron outreach and acquisition telemetry.
- **Frictionless Subsequent Scans via Device Recognition**:
  - Visitor identity (`visitor_uuid`, name, phone, email) is persisted locally in `localStorage` under `savazai_visitor_identity` and an auxiliary 30-day cookie (`SameSite=Lax`).
  - When a visitor scans additional artwork QR placards during the same gallery visit, `getStoredVisitorIdentity()` recognizes the device, automatically bypasses the registration barrier, and silently dispatches scan telemetry to `POST /api/leads/qr-scan`.

### R. Dedicated QR Scans & CRM Lead Administration Pipeline
- **Lead Source Classification**:
  - Inbound inquiries are typed via `LeadSource`: `CONTACT_FORM`, `EVENT_RSVP`, `QR_SCAN`, `CUSTOM_FORM`.
  - Scans from physical gallery QR cards persist the associated `artworkId`, `artworkTitle`, and client device user-agent string (`deviceInfo`).
- **Segmented Admin Leads View**:
  - `/admin/leads` provides segmented channel tab filters: "All Inquiries", "Contact Messages", "Event RSVPs", and "QR Artwork Scans".
  - The dedicated QR view renders specialized columns: Visitor Details (Name & Phone / WhatsApp), Artwork Scanned (with direct link to masterwork), Device & Environment, Status, and Scanned At timestamp.
  - CSV export respects the active channel filter and includes comprehensive QR scan telemetry.

### S. Universal 1-Click Unsubscribe Pipeline & Promotional Suppression
- **Authenticated Secure Tokens**:
  - Unsubscribe tokens are generated using AES-256-GCM encryption (`encryptEmailToken(email)`) with authentication tags and IV prefixes, preventing tampering or forged unsubscriptions.
- **Standardized Branded Email Footer**:
  - All outbound transactional, auto-responder, RSVP confirmation, and broadcast emails append a standardized legal footer containing a 1-click unsubscribe link (`/unsubscribe?token=...`).
- **Outbound Mailer Suppression**:
  - Unsubscribed email addresses are recorded in the `UnsubscribedContact` table.
  - `sendAtelierEmail(...)` verifies recipient status via `isEmailUnsubscribed(...)` and suppresses all outbound marketing/automated emails to unsubscribed addresses.

### T. GDPR Personal Data Erasure & Universal Privacy Consent Invariant
- **Administrative GDPR Data Erasure**:
  - Both `/admin/leads` and `/admin/users` provide explicit "Erase Data (GDPR)" actions with high-visibility warnings.
  - Deletion permanently removes the contact record, inquiry history, QR interaction logs, and associated telemetry in full compliance with GDPR Article 17 ("Right to Erasure").
- **Public Footer Data Removal Trigger**:
  - The public footer includes a "Privacy / Do Not Sell / Data Removal" action in its legal links strip.
  - Clicking this triggers `PrivacyModalTrigger`, presenting a modal allowing users to request personal data erasure or unsubscribe immediately, automatically notifying `SystemSetting.adminAlertEmail`.
- **Universal Privacy Policy Consent Checkbox**:
  - All customer-facing intake forms (Contact Page, Event RSVP, Physical QR Placard Gate, Dynamic Page Builder Forms) must render `PrivacyConsentCheckbox` (`src/components/ui/privacy-consent-checkbox.tsx`).
  - Users must explicitly check "I have read and agree to the Privacy Policy" (with a direct link to `/privacy`) before form submission is enabled. Client-side and server-side validation strictly block submissions without consent.

### U. Multi-Stage Container Prisma Client Inheritance & Fail-Fast Lifecycle Invariant
- **Multi-Stage Prisma Client Inheritance**:
  - In `Dockerfile`, the production `runner` stage must explicitly copy `/app/node_modules/.prisma` and `/app/node_modules/@prisma/client` from the `builder` stage immediately *after* the `deps` `node_modules` layer.
  - This prevents `deps` (created before `prisma generate`) from overwriting the compiled query engine with uninitialized stub placeholders (`throw new Error('@prisma/client did not initialize yet')`).
  - The runtime user (`nextjs:nodejs`) must have write permissions to `/app/node_modules/.prisma` for container self-generation.
- **Fail-Fast Entrypoint Schema Push & Client Synchronization**:
  - `docker-entrypoint.sh` executes a pre-migration raw SQL block via `prisma db execute --stdin` to normalize legacy `leads.source` scalar values to `'CONTACT_FORM'` before schema push.
  - `prisma db push` strictly includes `--accept-data-loss` with fail-fast exit (`exit 1` on error) to prevent non-interactive container aborts during enum conversions.
  - Container entrypoint executes runtime `prisma generate` immediately following the push, ensuring the schema and runtime client are synchronized before launching `exec node server.js`.

### V. Form Security, Lightweight CAPTCHA & Email OTP Verification Engine
- **Stateless HMAC-SHA256 Arithmetic CAPTCHA Engine**:
  - Dynamic mathematical challenges ($a + b$) signed with HMAC-SHA256 tokens (`src/lib/security/captcha-validator.ts`) utilizing `BETTER_AUTH_SECRET`, a 10-minute expiry barrier, and timing-safe equality verification (`crypto.timingSafeEqual`).
  - Zero third-party tracker scripts or cookies required, ensuring strict WCAG 2.2 AAA accessibility and client privacy.
- **6-Digit Numeric Email OTP Verification Pipeline**:
  - Outbound numeric OTP tokens (`src/lib/security/visitor-verification.ts`) with a 5-minute expiry barrier, cryptographically hashed into `FormVerificationToken` (`codeHash`), enforcing a 3-attempt lockout ceiling.
  - Dispatched via branded atelier transactional email templates with dynamic brand organization resolution.
- **Returning User Recognition & Frictionless Bypass Invariant**:
  - When a visitor returns to submit an inquiry, RSVP, or QR floor scan:
  - If their trimmed, case-insensitive email AND name match an existing verified lead (`Lead.isEmailVerified = true`), the OTP challenge is automatically bypassed with zero latency and zero friction.
- **Per-Form Configurable Administrative Toggles**:
  - Independent toggles (`enableCaptcha: boolean`, `enableEmailOtp: boolean`) across all 4 application intake channels:
    - **Public Contact Form** (`/contact`, `/api/forms/submit` via `SystemSetting.formSecurityConfig.contactForm`).
    - **Event Attendance RSVPs** (`/events/[slug]`, `/api/events/register` via `Event.rsvpConfig`).
    - **Physical Artwork QR Placard Gates** (`/artwork/[slug]?qr=true`, `/api/leads/qr-scan` via `SystemSetting.formSecurityConfig.qrScanGate`).
    - **Visual Page Builder Custom Dynamic Forms** (`DynamicFormBlock` via `formConfig`).
- **CRM Verification Telemetry & Verification Badges**:
  - Inbound submissions record `isEmailVerified: boolean`, `verifiedAt: DateTime?`, and `lastVerifiedIp: string?` directly on `Lead`.
  - Admin Leads CRM (`/admin/leads`) displays emerald "OTP Verified" status badges in table views, provides an Email Security Verification inspector card, and exports verification timestamps in CSV reports.

### W. Public Settings API, Dynamic Form Security Propagation & Targeted Cache Revalidation
- **Public Settings Endpoint (`src/app/api/settings/public/route.ts`)**:
  - Unauthenticated, sanitized endpoint returning public brand identity metadata (`siteName`, `archiveSubtitle`, `contactEmail`, `contactPhone`, `logoUrl`, `faviconUrl`) and active `formSecurityConfig` (`contactForm`, `qrScanGate`).
  - Employs cache headers (`s-maxage=10, stale-while-revalidate=59`) ensuring rapid client updates without exposing private storage credentials or database configurations.
- **Universal Form Block Security Propagation**:
  - `ContactPage` (`src/app/(public)/contact/page.tsx`), `DynamicPageSections` (`src/components/public/dynamic-page-sections.tsx`), and `TiptapRenderer` (`src/components/public/tiptap-renderer.tsx`) pass active `enableCaptcha` and `enableEmailOtp` flags directly into `<DynamicFormBlock>`.
  - In `DynamicFormBlock` (`src/components/public/blocks/dynamic-form-block.tsx`), if security flags are not supplied via props or block JSON, a dynamic client fallback automatically fetches `/api/settings/public` on mount, ensuring that Page Builder blocks and custom embeds dynamically align with admin security toggles.
- **Targeted Cache Revalidation**:
  - `PUT /api/admin/settings` explicitly invalidates cache for `/contact`, `/(public)/contact`, `/api/settings/public`, `/artwork/[slug]`, and `/events/[slug]`, guaranteeing instant propagation of configuration mutations across all public intake portals.

### X. Flagship Platform Product Tour Page (/product) & 100% WYSIWYG Editorial Engine
- **100% Inline WYSIWYG Editing Architecture**:
  - Eliminated monolithic, non-editable block components in favor of standard Page Builder column structures populated with native Tiptap ProseMirror AST nodes (`heading`, `paragraph`, `bulletList`, `textStyle`, `marks`).
  - Curators and administrators can click directly on any eyebrow, title, description, or bullet point on the Page Builder canvas (`/admin/pages/[id]/builder`) to edit text live with Tiptap formatting tools.
- **7 Human-Centric Editorial Rhythmic Acts**:
  1. **Act 1: Split Hero**: 7-column left panel featuring bold editorial title, outcomes-driven subheadline, and consecutive grouped action buttons (`[Start Platform Tour]` linking to `#personas` & `[Request Atelier Access]` linking to `#inquiry`); 5-column right panel displaying an atelier glass teaser card with live metric statistics. Section title is set to null, eliminating duplicate/double header rendering.
  2. **Act 2: 4 Persona Pillars**: 3-column balanced cards with gold eyebrow badges, warm borders, and clear outcome-focused benefits tailored to: Independent Masters, Fine Art Galleries, Biennale & Festival Directors, and Art Academies & Students.
  3. **Act 3: 3 Alternating 6/6 Editorial Plates**:
     - Plate 1: Physical Print & Publishing Placards & Catalogs (1-click print-ready visiting cards and museum placards).
     - Plate 2: 3D Spatial Salon Walkthroughs (True-to-life gallery lighting, spatial corridors, natural aspect ratios).
     - Plate 3: Exhibition RSVPs & Visitor Operations (Multi-day bookings, dynamic intervals, instant QR floor check-in).
  4. **Act 4: 2-Column Capabilities Matrix**: Curatorial Freedom (visual page builder, taxonomies, navigation) and Enterprise Infrastructure (sovereign storage, AEO/Schema.org, zero-spam bot protection, binary themes).
  5. **Act 5: Dedicated In-Page Platform Inquiry Form**: Center-aligned dynamic form block (`FORM_BLOCK`) embedded directly at the bottom with recipient routing set to `info@savazar.com`, collecting inquiries without redirecting to client contact forms.
- **Navigation Isolation Invariant**:
  - `/product` is permanently decoupled from the public Main Navigation Menu tree. It operates as an independent, shareable tour portal accessible via direct link (`/product`) or optional footer links.
- **Grouped Button Rendering**:
  - `src/components/public/tiptap-renderer.tsx` automatically aggregates consecutive `BUTTON` blocks in a column into a flex wrap button group (`pt-2 flex flex-wrap items-center gap-3`), rendering dual action buttons cleanly side-by-side.
- **Decoupled Inbound Dispatch Recipient Override**:
  - `/api/forms/submit` accepts `recipientEmails` and `recipientOverride` parameters from dynamic form blocks, dispatching leads to targeted administrative addresses (e.g. `info@savazar.com`) while preserving fallback to `SystemSetting.adminAlertEmail`.
- **Idempotent Non-Destructive Seeding**:
  - `src/lib/seeds/seed-product-page.ts` cleanly recreates the 7 sections for `slug: "product"` while maintaining non-destructive database safety for all other site pages.

### Y. Administrative 401/403 Interception, Safe Deserialization & Zero-Data-Loss Architecture
- **Automatic Session Expiration & 401 Interception (`adminFetch`)**:
  - All administrative dashboard pages (`/admin/pages`, `/admin/categories`, `/admin/artworks`, `/admin/catalogs`, `/admin/events`, `/admin/leads`, `/admin/layout`) must invoke API endpoints using `adminFetch<T>()` from `src/lib/admin-fetch.ts`.
  - When an HTTP 401 or 403 occurs (due to expired session cookie or unauthenticated request), `adminFetch` immediately captures `window.location.pathname + window.location.search` and redirects to `/admin/login?redirect=<path>`, preventing silent client-side error swallowing into empty arrays `[]`.
  - Stale state is evicted, throwing `AdminSessionExpiredError` to prevent misleading "No records found" empty state cards.
- **Defensive Payload Deserialization (`unwrapRecords`)**:
  - API responses must be deserialized via `unwrapRecords<T>(data, fallbackKeys)`.
  - Supports direct arrays as well as envelope wrappers (`items`, `pages`, `artworks`, `categories`, `catalogs`, `events`, `leads`, `posts`), preventing non-array payloads or API envelope changes from causing blank screens.
- **Zero-Data-Loss Invariant**:
  - Under no circumstances shall database reset scripts, destructive prisma migrations (`db push --force-reset`), or mock seed resets be executed on production or staging databases.
  - Seeder scripts must verify existing database records before writing, preserving user modifications.
- **Intelligent Schedule Tab Segmentation**:
  - In `/admin/events`, if `upcomingEvents.length === 0` but curated retrospectives exist, the view automatically defaults to `"all"` so active past events are immediately visible on screen with accurate count badges.

### Z. Anti-Loop Invariant, Session Edge Guard & CPU Protection Protocol
- **Strict Anti-Bounce Invariant on `/admin/login`**:
  - In `src/proxy.ts`, the edge middleware must NEVER automatically bounce or redirect incoming requests to `/admin/login` back to `/admin` based solely on client cookie existence. Because Better-Auth cookies may expire in the database while lingering in the browser, blind edge redirects create an infinite ping-pong redirect loop between `/admin/login` and `/admin` consuming 100%+ CPU.
  - Whenever an incoming request to `/admin/login` includes `?redirect=...` or lacks an active session, `proxy.ts` must explicitly clear all session cookies (`Set-Cookie: better-auth.session_token=; Max-Age=0`) and allow the login form to render with HTTP 200.
- **Client-Side In-Flight Redirect Lock (`isRedirectingToLogin`)**:
  - In `src/lib/admin-fetch.ts`, the redirect trigger on HTTP 401/403 must enforce an in-flight guard (`!isRedirectingToLogin`) and verify `!window.location.pathname.startsWith("/admin/login")` before setting `window.location.href`. Multiple parallel requests must never fire competing redirect events.
- **Rigid Mount-Only Dependency Arrays in Dashboard Layouts**:
  - In `src/app/admin/(dashboard)/layout.tsx`, all data fetching effects must use rigid, empty dependency arrays `[]` (mount-only) or strictly memoized primitives.
  - Catch blocks handling `AdminSessionExpiredError` must return immediately without attempting re-renders or background retries.
- **Server-Driven Stale Cookie Eviction**:
  - When administrative route handlers (`/api/admin/*`) return HTTP 401 Unauthorized, they must explicitly delete `better-auth.session_token`, `__Secure-better-auth.session_token`, and `better-auth.session_data` in the response headers, breaking browser cookie persistence.

### AA. Artwork Metadata Split (`materials` & `surface`), Media Vault Asset Manager, Admin Hub Consolidation, Dynamic Social Platforms & Universal Video/Embed Blocks
- **Non-Destructive Artwork Schema Split (`materials` + `surface`)**:
  - In `prisma/schema.prisma`, `Artwork` includes `materials String?` (e.g. *Natural pigments, shell gold, semi-precious stones*) and `surface String?` (e.g. *Wasli paper, teakwood plank, silk, khadi cloth*), while retaining `medium String?` for backward compatibility.
  - All existing `medium` values are backfilled into `materials` via `prisma/migrations/20261026_artwork_materials_surface_split/migration.sql` with zero data loss.
  - Public detail views (`/artwork/[slug]`), e-Catalog readers (`/catalogs/[slug]`), physical placards (`src/components/admin/artwork-placard-sheet.tsx`), and CSV/Excel import/export routes render `materials` (falling back to `medium`) and `surface` cleanly without undefined placeholders.
- **Consolidated System Admin Navigation Hubs (`src/app/admin/(dashboard)/settings/page.tsx`)**:
  - **Storage & Media Vault**: Unified main tab with 4 responsive sub-tabs:
    1. *Cloudflare R2 / S3 Storage*
    2. *Google Workspace*
    3. *Nextcloud Hub*
    4. *Manage Media Vault* (`<MediaVaultManager />`)
  - **E-Mail Configuration**: Unified main tab with 2 responsive sub-tabs:
    1. *SMTP & Gmail Provider Settings*
    2. *Mail Notification Templates* (`<MailConfigStudio />`)
  - **App Personalization**: Unified main tab with 4 responsive sub-tabs:
    1. *White-Label Branding*
    2. *Theme Studio*
    3. *QR Scan Gate*
    4. *Watermark & Anti-Harvesting*
- **Media Vault Asset Manager & Orphan Detection (`src/app/api/admin/media/vault/route.ts` & `src/components/admin/media-vault-manager.tsx`)**:
  - Scans storage assets (`/public/media`, `/public/documents`), extracts image dimensions via `sharp`, and builds a complete **"Where Used" Dependency Matrix** across `Artwork`, `ECatalog`, `ArtCategory`, `Page` (`PageSection`, `SubSection`), `Event`, `BlogPost`, and `SystemSetting`.
  - Provides **"Show Unlinked / Inactive Assets Only"** orphan filtering, one-click orphan batch selection, and **"Delete Permanently from Storage"** with confirmation modal.
- **Expanded Social Platforms & Custom Link Selector (`src/components/public/social-icon.tsx` & `src/components/public/footer.tsx`)**:
  - `SystemSetting` supports built-in `linkedinUrl`, `tiktokUrl`, `pinterestUrl`, `instagramUrl`, `facebookUrl`, `youtubeUrl`, plus a flexible `customSocialLinks` JSON array (`[{ label, url, icon }]`) with 20 selectable vector icons and `rel="noopener noreferrer" target="_blank"`.
- **Universal Video Embed Parser (`src/lib/video-embed-parser.ts` & `src/components/public/builder/video-block.tsx`)**:
  - Automatically transforms standard watch/post URLs (YouTube `watch?v=`, `youtu.be/`, `shorts/`, Vimeo, Facebook Videos, Instagram Posts/Reels) into valid embed URLs (`youtube-nocookie.com/embed/ID`, `player.vimeo.com/video/ID`, etc.) or native HTML5 `<video controls playsInline />`, eliminating `X-Frame-Options: SAMEORIGIN` / "This Content is blocked" iframe errors.
- **Page Builder Embed Code / Source HTML Block (`src/components/public/builder/embed-block.tsx`)**:
  - Added `+ Embed / HTML` (`EMBED_HTML`) block to the Page Builder Row toolbar (`builder-client.tsx` and `page-matrix-studio.tsx`) with aspect ratio controls (`16:9`, `9:16`, `1:1`, `4:5`, `4:3`, `auto`) and security sandboxing toggles (`sandboxed` iframe vs `unconstrained` trusted script execution for Stripe, Razorpay, Calendly, Spotify, or social embeds).

### AB. Universal Social Sharing Engine, Client-Side WebP Image Optimizer, Visitor Telemetry Analytics with Excel Export & Vertical Video / Embed Parameter Studio
- **Universal Social & Native Sharing Engine (`src/components/public/social-share-bar.tsx`)**:
  - Multi-tier share controls: Global toggle (`SystemSetting.enableSocialShare` in `Admin -> Settings -> General`), Footer toggle (`SystemSetting.showFooterShare` in `Admin -> Settings -> Footer`), and Per-Page override (`Page.allowShare` in Page Builder top header bar).
  - Invokes native `navigator.share` on mobile viewports and provides a curated share popover/bar on desktop supporting WhatsApp, Facebook, X/Twitter, LinkedIn, Pinterest, Email, and 1-click Copy Link with Sonner toast confirmation.
  - Integrated across Public Pages (`/[slug]` & `/`), Dynamic Sections (`DynamicPageSections`), Artworks (`/artwork/[slug]`), Events (`/events/[slug]`), e-Catalogs (`/catalogs/[slug]`), Photo Gallery lightboxes (`MediaGalleryBlock`), and the global `Footer`.
- **Client-Side WebP Image Optimization Pipeline (`src/lib/client-image-optimizer.ts`)**:
  - Intercepts local file uploads across non-artwork modules (`UniversalMediaDialog`, `MediaGalleryInspector`, `EventFormModal`, `AdminPostsPage`, `VisualPageBuilder`, `PageMatrixStudio`, and `MediaVaultManager`).
  - When a raster image (JPEG/PNG/BMP) exceeds `1 MB` or `2000px` dimension, renders an interactive comparison modal (**"Large Image Detected: Convert to High-Efficiency WebP?"**) displaying original vs WebP size (`canvas.toBlob("image/webp", 0.85)`), percentage reduction, preview thumbnail, and **"Convert & Upload WebP"** vs **"Keep Original"** options.
  - **Strict Artwork Master Exclusion**: Artwork uploads (`src/app/admin/(dashboard)/artworks/page.tsx` and `UniversalMediaDialog` when `isArtwork: true`) completely bypass WebP compression prompts to preserve uncompressed high-resolution archival masters.
- **Privacy-First Visitor Telemetry, Geographic Heatmap & Excel Export (`VisitorSession` & `PageVisit`)**:
  - Lightweight client tracker (`src/lib/analytics-tracker.ts` mounted in `src/app/layout.tsx`) sets a stateless `svz_vid` cookie and dispatches non-blocking route view and dwell duration (`dwellMs`) beacons to `POST /api/telemetry/visit`.
  - Captures device form factor (`Desktop`, `Mobile`, `Tablet`), browser, OS, privacy-hashed IP, and approximate geolocation (`Country`, `Region`, `City` via proxy headers with IANA timezone fallback).
  - Admin Overview Dashboard (`src/app/admin/(dashboard)/page.tsx`) renders `<VisitorAnalyticsPanel />` featuring KPI cards, Top Visited Routes, Device & Browser Matrix, Geographical Distribution, a filterable Visitor Session History table, and **"Download Analytics (.xlsx)"** (`GET /api/admin/analytics/export` powered by `exceljs`).
- **Expanded Video / Embed Aspect Ratios, Letterbox Backdrop Filler & Visual Parameter Inspector (`src/lib/video-embed-parser.ts`)**:
  - Expanded aspect ratios across `VideoBlock` and `EmbedBlock`: `16:9` (Widescreen), `9:16` (YouTube Shorts, Instagram Reels, TikTok, Facebook Reels), `1:1` (Square Social Feed), `4:5` (Instagram Portrait), `4:3` (Classic TV), and `auto` (Unconstrained).
  - Added horizontal alignment (`left`, `center`, `right`) and configurable letterbox stage filler (`transparent`, `blurred` ambient backdrop, or `solid` custom color picker) for vertical/portrait videos.
  - Added **Visual Parameter Inspector** in both `VIDEO` and `EMBED_HTML` Page Builder widgets (`extractEmbedParameters` & `applyEmbedParameters`), exposing interactive checkboxes for `Autoplay`, `Loop`, `Mute`, `Player Controls`, `Modest Branding`, and `Show Captions` that automatically update embed URLs without manual source code editing.





