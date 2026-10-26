# SavazAI WebApps Platform

> **Enterprise Multi-Tenant Digital Atelier, High-Fidelity Cultural Archive, 3D WebGL Exhibition Corridor, and Museum Publishing System.**  
> *Architected, developed, and maintained by **Savazar**.*

---

## 1. Executive Platform Overview

The **SavazAI WebApps Platform** is an enterprise-grade digital publishing, archiving, and immersive presentation suite. While historically initiated to honor fine art and classical music traditions, the architecture is completely client-agnostic, white-label, and multi-tenant. It empowers fine art masters, traditional heritage artists, museum collections, cultural foundations, and gallery curators to curate, exhibit, preserve, and physically print museum-grade exhibition assets with total brand sovereignty.

### Core Architectural Pillars
- **3D WebGL Spatial Exhibition Salon Corridor**: Interactive, director-driven architectural gallery halls built with Three.js/R3F, featuring natural artwork aspect ratio preservation, directional gallery spotlighting, automatic multi-wall corridor partitioning, 7 procedural architectural environments (`modern-minimalist`, `imperial-palace`, `indian-atelier`, `residential-salon`, `heritage-villa`, `corporate-gallery`, `custom`), non-occluding 3D decor, damped cubic camera easing (`lerp(target, delta * 3.5)`), and 0.8m anti-collision frame spacing.
- **Physical Gallery Placard & Publishing Engine**: An isolated headless iframe print driver generating physical visiting-card ($3.5 \times 2\text{ in}$), museum-wall ($4 \times 2.5\text{ in}$), museum-large ($5 \times 3\text{ in}$), and museum-extra-large ($6 \times 3.5\text{ in}$) display placards with crop marks, vector QR provenance links, configurable clamp safety margins, granular per-field typography styling, unstyled currency price formatting, configurable thumbnail/QR placement, multi-row title flow, persistent side-by-side sticky live preview, fullscreen workspace mode, high-precision fullscreen preview studio decoupled via React Portal with Escape key restore handling, interactive up/down field reordering, strict top-aligned natural vertical stacking with eliminated mid-card gaps, universal master font family cascade across all text nodes and inputs, and full gang-run sheet preview.
- **Multi-Day Event RSVP & Dynamic Time Slot Engine**: Multi-day schedule persistence with configurable date selection requirements, multi-day guest checkboxes, time slot modes (`mandatory`, `optional`, `disabled`), dynamic slot interval duration (15m, 30m, 45m, 60m, 120m), slot capacity limits, and CRM lead attendance date/slot exports.
- **Visual Drag-and-Drop Page Builder & Component Studio**: Modular editorial layout engine supporting rich media blocks, interactive e-Catalogs, responsive sliders, and live contrast-aware typography.
- **Dynamic Multi-Modal Email & Notification Studio**: Inbound alert decoupling, automatic form discovery across dynamic page blocks, and a universal Tiptap WYSIWYG editor with dual-delivery logo resolution (CID inline MIME attachments + HTTPS fallback) and full audit telemetry.
- **Synesthetic Knowledge Graph & Semantic Vector Engine**: PostgreSQL 17 with `pgvector` powering multi-modal exploration across visual motifs, provenance tags, and audio-visual archives.
- **Mobile QR Scan Onboarding & Persistent Device Identity**: Physical gallery floor QR code placard scanning with dynamic iOS safe-area insets (`pb-[calc(1.5rem+env(safe-area-inset-bottom))]`, `max-h-[92dvh]`), mandatory WhatsApp/Phone collection (`*`), sticky mobile action footer, and local storage / cookie device recognition (`savazai_visitor_identity`) enabling frictionless subsequent scans and background telemetry logging without repeating modal gates.
- **Configurable Artwork QR Lead-Capture Gate & Mandatory Email Policy**: Fully customizable floor-guide modal managed via a dedicated "QR Scan Gate" tab in System Settings (`/admin/settings`). Curators can configure the eyebrow badge text, modal title, lead capture prompt with dynamic token interpolation (`{{artworkName}}` and `{artwork}` automatically resolving to the scanned artwork title), submit action button label, and a switchable "Skip & View" bypass. Enforces a strict mandatory email invariant (`EMAIL ADDRESS *` with RFC format regex client-side and server-side HTTP 400 rejection in `POST /api/leads/qr-scan`) across all QR scans regardless of whether CAPTCHA or Email OTP are enabled, coupled with a real-time live mobile preview card in the admin dashboard.
- **Dedicated QR Scans CRM & Multichannel Acquisition**: Inbound CRM lead segmentation across "All Inquiries", "Contact Messages", "Event RSVPs", and "QR Artwork Scans" with dedicated artwork title, visitor phone, device user-agent telemetry, and filter-aware CSV export.
- **Universal 1-Click Unsubscribe Pipeline & Suppression Engine**: Standardized branded email footer with authenticated AES-256-GCM encrypted tokens (`/unsubscribe?token=...`), database unsubscription persistence (`UnsubscribedContact`), and automated suppression of marketing/outbound emails.
- **GDPR Personal Data Erasure & Universal Privacy Policy Consent**: High-visibility "Erase Data (GDPR)" administrative hard deletion across CRM leads and users, public footer data removal request modal notifying `adminAlertEmail`, and universal mandatory `PrivacyConsentCheckbox` across all contact, RSVP, QR gate, and custom forms.
- **Exhibition Hall Placard Contrast & HTML Tag Stripping**: Semantic theme token buttons (`bg-primary text-primary-foreground`) preventing white-on-white button rendering across 3D salon walls and metadata drawers, paired with automated `stripHtmlTags(...)` sanitization eradicating raw `<p>`/`<span>` markup from displayed artwork descriptions.
- **Multi-Stage Prisma Client Inheritance & Fail-Fast Lifecycle**: Multi-stage Docker container architecture explicitly copying `/app/node_modules/.prisma` and `@prisma/client` from `builder` into `runner`, coupled with a fail-fast `docker-entrypoint.sh` executing legacy enum normalization SQL, non-interactive schema push (`--accept-data-loss`), and runtime client regeneration.
- **Configurable Lightweight CAPTCHA & Email OTP Verification Engine**: Per-form administrative security controls (`enableCaptcha`, `enableEmailOtp`) across all inbound intake touchpoints: Public Contact Form (`/contact`), Event Attendance RSVPs (`/events/[slug]`), Physical Artwork QR Placard Gates (`/artwork/[slug]?qr=true`), and Visual Page Builder Custom Dynamic Forms. Features a 100% accessible, tracker-free arithmetic CAPTCHA challenge signed with HMAC-SHA256 tokens and a 6-digit numeric Email OTP challenge with a 5-minute countdown timer and 3-attempt lockout.
- **Returning User Recognition & Frictionless Bypass Invariant**: Intelligent visitor recognition matching trimmed, case-insensitive email and name against previously verified CRM leads (`Lead.isEmailVerified = true`), granting authenticated returning patrons frictionless submission with zero latency and zero repetitive OTP barriers.
- **Universal Multi-Tenant Brand Resolution & Fail-Fast Real Email Delivery**: Complete decoupling of client branding across all email transporters, OTP dispatchers, system notifications, and metadata headers. Dynamically resolves active tenant attributes (`name`, `subtitle`, `logoUrl`, `fromEmail`, `adminAlertEmail`) from `SystemSetting` via `getTenantBranding()`, preventing broken logo images with inline CID MIME attachments. Enforces strict zero-exposure OTP security (code is never leaked over API responses or client state) paired with real SMTP inbound delivery, automated post-verification admin alert and patron receipt dispatches, and fail-fast HTTP 500 error propagation if mail transport is unconfigured or unavailable.
- **Dynamic Admin Login Portal Branding**: Full white-label branding controls in System Settings (General Tab) allowing operators to customize the Admin Login Title, Subtitle, and Logo/Emblem (`adminLoginTitle`, `adminLoginSubtitle`, `adminLoginLogoUrl`), dynamically hydrated at runtime without hardcoded strings.
- **Decoupled White-Label Infrastructure & Zero-Data-Loss Standards**: Unified container identifiers (`savazai_web_dev`, `savazai_postgres_dev`, `savazai_web`, `savazai_postgres`), strict Docker named volume pinning (`lalitakapilavai_postgres_dev_data` on port 5633, `${POSTGRES_VOLUME_NAME:-lalita_postgres_prod_data}` and `${MEDIA_VOLUME_NAME:-lalita_media_uploads}` on production VPS servers), dual database network aliases (`savazai_postgres` and `db`), and modular multi-tenant fixture packs (`TENANT_FIXTURE_PACK="generic"` vs `"lalita"`).
- **Brand Identity & Native Media Engine**: Full `.ico` and `.svg` bypass upload engine preserving multi-resolution favicons and scalable vector graphics, paired with zero-fallback conditional phone suppression and dynamic footer brand governance.
- **Flagship Product Tour Page (`/product`) & 100% WYSIWYG-Native Editorial Engine**: A completely redesigned, human-centric product tour page structured into 7 rhythmic editorial acts (split hero with live editable copy & dual action buttons, 4 persona pillars, 3 alternating 6/6 editorial feature plates, 2-column capabilities matrix, and a dedicated in-page platform inquiry intake form routing directly to `info@savazar.com`). Decoupled from monolithic hardcoded blocks in favor of standard Page Builder Tiptap AST nodes, allowing curators to edit every headline, eyebrow, metric, and bullet point inline via `/admin/pages/[id]/builder`. Zero duplicate headers, zero developer jargon, and completely decoupled from public main navigation menus.
- **Admin 401 Interception, Safe Deserialization & Zero-Data-Loss Architecture**: Centralized `adminFetch` client with automatic 401/403 session redirection to `/admin/login?redirect=<path>` and defensive `unwrapRecords` payload normalization across all administrative collections (pages, categories, artworks, catalogs, events, leads), eliminating blank screens and false empty states. Paired with strict non-destructive database governance and auto-segmenting event calendar visibility.

---

## 2. Technology Stack & Modern Architectural Standards

- **Core Framework**: Next.js 16+ App Router (`src/` directory layout, Turbopack, standalone production compilation).
- **UI Runtime**: React 19 (`react@19.2.8`, `react-dom@19.2.8`) with React Server Components (RSC), Suspense, and Server Actions.
- **Language**: TypeScript 5+ in strict mode (`noImplicitAny`, strict null checks).
- **Styling Engine**: Tailwind CSS v4 (`@tailwindcss/postcss`) with CSS theme variables — **No legacy tailwind.config.js**.
- **Component Primitives**: Shadcn UI primitives hardened with WCAG 2.2 AAA accessibility.
- **Rich Text Suite**: Universal Tiptap WYSIWYG Editor (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`) with one-click token insertion chips and accessible zero-state placeholders.
- **3D Spatial Graphics**: Three.js & React Three Fiber (R3F) for procedural architectural backdrops and cinematic camera paths.
- **Print Subsystem**: Isolated Headless Iframe Print Driver (`src/lib/print-isolated-html.ts`) ensuring 1:1 physical millimeter scaling without browser print UI bleed.
- **Database & Vector Storage**: PostgreSQL 17 with `pgvector` (`pgvector/pgvector:pg17`).
- **ORM**: Prisma ORM with `postgresqlExtensions` preview feature enabling `vector` and `uuid-ossp` extensions.
- **Authentication**: Better-Auth for private admin authentication, RBAC, and session management (public self-registration disabled).
- **Object Storage & Media Vault**: Universal multi-cloud storage driver supporting Local Disk, Cloudflare R2, AWS S3, Google Workspace (Drive file upload + Sheets lead sync), and Nextcloud (WebDAV + OCS Share API) with dynamic image watermarking (Sharp).
- **Email Delivery**: Nodemailer with SMTP/Gmail integration, dynamic token resolution, CID inline logo embedding, and automated audit logging.
- **Container Infrastructure**: Multi-stage Debian 12 Bookworm Slim (`node:22-bookworm-slim`) for full binary compatibility with Sharp (libvips) and native Prisma query engines.

---

## 3. High-Level Modular Architecture

```
SavazAI WebApps Platform
├── src/
│   ├── app/
│   │   ├── (public)/                 # Client-Facing Portal
│   │   │   ├── page.tsx              # Dynamic Homepage with Visual Blocks
│   │   │   ├── gallery/              # High-Res Artwork Archive & Lightbox
│   │   │   ├── artwork/[slug]/       # Dedicated Artwork Presentation & Inquiry
│   │   │   ├── catalogs/[slug]/      # Interactive Virtual e-Catalog Reader
│   │   │   ├── events/               # Exhibition & Concert Hub
│   │   │   ├── events/[slug]/        # Event Details & Dynamic RSVP Form
│   │   │   ├── blogs/                # Curatorial Essays & Blog Archive
│   │   │   ├── blogs/[slug]/         # Rich Typography Article Viewer
│   │   │   ├── commission/           # Bespoke Fine Art Commission Portal
│   │   │   ├── contact/              # Direct Inquiries & Atelier Contact Desk
│   │   │   ├── unsubscribe/          # 1-Click Secure Email Unsubscribe Handler
│   │   │   └── [slug]/               # Dynamic Page Builder Renderer
│   │   ├── admin/                    # Secured Multi-Tenant Admin Control Center
│   │   │   ├── (dashboard)/
│   │   │   │   ├── artworks/         # Artwork Catalog & Batch Placard Studio
│   │   │   │   ├── catalogs/         # e-Catalog Studio & Monograph Builder
│   │   │   │   ├── events/           # Exhibitions, Recitals & RSVP Manager
│   │   │   │   ├── pages/            # Page Builder Index
│   │   │   │   ├── pages/[id]/builder# Drag-and-Drop Visual Block Studio
│   │   │   │   ├── posts/            # Blog & Curatorial Essay Editor
│   │   │   │   ├── leads/            # Unified CRM Inquiries & Acquisition (QR Scans Tab)
│   │   │   │   ├── categories/       # Artistic Taxonomies & Traditions
│   │   │   │   ├── navigation/       # Header & Footer Navigation Builder
│   │   │   │   ├── users/            # Administrative RBAC & GDPR Erasure
│   │   │   │   └── settings/         # White-Label, Theme, SMTP & Mail Config
│   │   │   └── login/                # Better-Auth Protected Entrypoint
│   │   └── api/                      # Protected REST & Server Action Endpoints
│   │       ├── admin/                # Admin APIs (Artworks, Events, Forms, Mail)
│   │       ├── auth/[...all]/        # Better-Auth Session Handlers
│   │       ├── forms/submit/         # Decoupled Public Form Handler
│   │       ├── events/register/      # Public RSVP Registration Engine
│   │       ├── leads/qr-scan/        # Physical Gallery Floor QR Telemetry
│   │       ├── privacy/              # GDPR Erasure Request Dispatcher
│   │       ├── security/             # Stateless CAPTCHA & Email OTP Pipeline
│   │       └── media/[...path]/      # Watermarked Image Delivery Proxy
│   ├── components/
│   │   ├── admin/                    # Administration UI (Tiptap, Placard Studio)
│   │   ├── builder/                  # Visual Page Builder Inspector & Blocks
│   │   ├── public/                   # Public Experience Blocks & 3D Salon Wall
│   │   └── ui/                       # Accessible UI Primitives (CAPTCHA & OTP Dialog)
│   ├── lib/                          # Core Drivers (Security, Print, Email, Auth, Prisma)
│   └── types/                        # Enterprise TypeScript Specifications
├── prisma/
│   ├── schema.prisma                 # Declarative Schema (PostgreSQL 17 + pgvector)
│   └── seed.ts                       # Idempotent Provisioning Engine
├── docker-compose.yml                # Production Orchestration (Web + PostgreSQL 17)
├── docker-compose.dev.yml            # Multi-Container Development Stack
├── Dockerfile                        # Multi-Stage Debian 12 Production Build
└── docker-entrypoint.sh              # Zero-Touch Schema Sync & Seed Hook
```

---

## 4. Full Platform Feature & Engine Catalog

### A. Public Web Experiences
1. **Classical Hero Showcase & Visual Storytelling**:
   - Full-bleed media hero blocks with dynamic title, subtitle, and primary call-to-action buttons.
   - Interactive timeline blocks highlighting master artist lineages, exhibitions, and classical vocal performances.
2. **3D WebGL Spatial Exhibition Salon Corridor**:
   - Museum standard eye-level centerline hanging strictly aligned to $1.55\text{ m}$ (58–60 inches from floor) with an absolute minimum floor clearance of $0.98\text{ m}$ for any bottom-row frame (`Math.max(1.28, 0.98 + H/2)`).
   - **Dynamic Non-Overlapping Vertical Clearance & Balanced Horizontal Spacing**: Mathematically guaranteed $28\text{ cm}$ physical clearance between vertically stacked frames in multi-row salon walls (`getStackedY`) regardless of natural aspect ratios or heights, eradicating frame collisions. Stacked walls dynamically scale to $maxDim = 1.15\text{ m}$ and utilize generous horizontal column separation ($1.50\text{ m}$ for 2 columns, $1.20\text{ m}$ for 3 columns) symmetrically flanking the corridor centerline.
   - Natural artwork aspect ratio preservation (`naturalWidth / naturalHeight`), wrapping canvas, gilded fillets, and outer timber frames without cropping.
   - Symmetrical architectural framing with divider pilasters placed at every wall bay boundary ($w \cdot 20.0 \pm 10.0\text{ m}$) ensuring bilateral balance and identical outer margins.
   - Salon cluster positioning dynamically centering the total cluster span symmetrically around the wall midpoint ($X = wallCenterX$).
   - **Multi-Wall Zero-Bleed Corridor Framing**: $20.0\text{ m}$ spacing between walls combined with dynamic aspect-ratio-bounded overview camera distance ($\le 13.6\text{ m}$ visible span at rest) and dynamic distance-based bay mesh dissolving, mathematically eliminating adjacent wall backdrop bleed on all widescreen displays.
   - **Curatorial Multi-Artwork Layout Presets**: Tailored layout geometry for 1, 2, 3, 4, 5, 6, and 7+ artworks (Centerpiece, Flank Left/Right, Horizontal Lines, Stacked Vertical Columns, Pyramids, Inverted Pyramids, $2\times 2$ and $3\times 2$ Quads/Matrices, Classical Salon, and Centerpiece with Flanking Columns) with non-overlapping clearance guarantees.
   - **Fine Positioning Offsets**: Per-wall horizontal shift ($X \in [-2.5\text{ m}, +2.5\text{ m}]$), vertical elevation ($Y \in [-1.0\text{ m}, +1.0\text{ m}]$), and spacing spread multiplier ($0.6\times$ to $1.6\times$) to align artworks with room furniture, consoles, or architectural features.
   - **Interactive WYSIWYG Wall Curation Studio**: Live 2D Wall Schematic preview in the Page Builder Inspector rendering backdrop textures with miniature framed artwork plates positioned according to real-time layout and offset sliders, complete with slot reordering, artwork swapping dropdowns, layout selection with checkmark badges, unified Wall Frame Styles (Museum 24k Gold Leaf, Burmese Teak, Contemporary Black, Museum Glass, etc.), Cinematic Wall-to-Wall Camera Transitions (parabolic crane arc), and searchable in-situ Artwork Catalog modal for direct addition of artworks to any active wall.
   - Realistic PBR visitor furnishings: dark American walnut plinths, warm cognac tufted leather cushions (`0x8c4a24`, `roughness: 0.45`, `metalness: 0.15`), and cylindrical champagne brass legs ($z = 6.2\text{ m}$, height $0.32\text{ m}$), illuminated with warm visitor gallery fill lights, with dynamic visibility toggling (`decorGroup.visible = isOverview`) during artwork focus steps to guarantee zero foreground occlusion.
   - Cinematic damped camera transitions using `THREE.MathUtils.damp` for position and target `lookAt`, establishing an initial wide salon shot at `(0, 1.85, 9.4)` looking at `(0, 1.55, 0)` and executing smooth panoramic sweeps across adjacent gallery walls.
   - 7 Procedural architectural environments (Modern Minimalist, Imperial Palace, Indian Atelier, Residential Salon, Heritage Villa, Corporate Gallery, Custom).
   - Multi-wall corridor partitioning (`maxArtworksPerWall`) automatically dividing collections across navigable gallery walls.
   - **Multi-Wall Custom Image Backdrops & Pure Backdrop Mode**: Upload and assign custom backdrop images either uniformly across the entire salon corridor or uniquely per wall bay (`Wall 1`, `Wall 2`, ... `Wall N`) with high-resolution texture mapping, sRGB color fidelity, and pure backdrop rendering that suppresses procedural 3D floors, mouldings, pilasters, and decor while engaging neutral white lighting for 100% true-color presentation.
   - **Universal Media Gallery Canvas Backgrounds**: Custom image backgrounds for all display modes (Carousel, Snap Scroll, Curated Bento, Ken Burns, Soft Crossfade, Filmstrip Reel) with configurable scaling (`cover`, `contain`, `tile`, `blur`) and opacity controls.
   - Mobile-responsive layout cleanly hiding on-wall placards on mobile (`< 768px`) with floating provenance drawer rendered beneath the canvas.
3. **Archival Fine Art Gallery & High-Res Inspection**:
   - Filterable masonry artwork grid by traditional schools and categories.
   - Deep-zoom lightbox modal for inspecting fine brushstrokes and gold relief.
   - Protected image proxy applying dynamic watermarks and preventing raw asset theft.
4. **Interactive e-Catalog Digital Monographs**:
   - Virtual page-flip presentation simulating high-end physical exhibition catalogs.
   - Curatorial essays, high-resolution artwork plates, and provenance notes.
   - **Unrestricted Native Printing & PDF Saving**: Native browser printing (`Ctrl+P` / `Cmd+P`) and PDF saving unlocked without restrictive publication guards.
   - **Fluid Mobile Viewport Architecture**: On mobile viewports (`max-width: 767px`), pages expand to natural fluid height (`aspect-ratio: auto !important`), eradicating rigid aspect-ratio height collapse (~260px) and inner scrollboxes. Artwork plates stack into a single vertical column (`flex-col`) with centered images (`max-h: 48vh`) and naturally flowing curatorial metadata.
   - **High-Resolution PDF Engine Canvas**: Solid theme canvas (`#FAF7F2`) with `@media print` universal scrollbar suppression (`scrollbar-width: none !important; *::-webkit-scrollbar { display: none !important; }`) and `overflow: visible !important`, preventing dark/terracotta border bleed and eliminating trapped scrollbar containers.
   - **Clean Metadata Formatting**: Granular metadata hierarchy with automatic deduplication of redundant Category badges across plates.

5. **Cultural Events, Recitals & Multi-Day RSVP Hub**:
   - Multi-day exhibition calendars and daily schedule agendas with venue maps and dynamic hero earmark badges (`{event.earmarkText}`).
   - Configurable RSVP booking modal supporting multi-day date selections, configurable time slots (Mandatory / Optional / Disabled), flexible arrival windows, and automated confirmation emails.
6. **Curatorial Essays & Blog Archive**:
   - Editorial blog repository formatted with high-elegance typography.
   - Category filtering, author attribution, and reading-time estimations.
7. **Bespoke Commission Intake Portal**:
   - Dedicated commissioning flow with multi-tier budget selection and detailed project specifications.

---

### B. Admin Control Center (10 Core Operational Modules)

#### 1. Artwork Vault & Catalog Manager (`/admin/artworks`)
- Comprehensive metadata taxonomy: Title, Medium, Art Form / Category, Dimensions (inches & cm), Year, Pricing, and Curatorial Notes.
- High-resolution plate upload with automated Sharp WebP/AVIF conversions and dynamic watermarking.
- Excel bulk import/export with automated XLSX template generation.
- Integrated Museum Placard Print button for single and batch production.

#### 2. Museum Placard & e-Catalog Print Engine (`src/lib/print-isolated-html.ts`)
- **Exact Physical Dimensions**: Supports Standard Visiting Cards ($3.5 \times 2\text{ in}$ / $88.9 \times 50.8\text{ mm}$), Museum Wall Placards ($4 \times 2.5\text{ in}$ / $101.6 \times 63.5\text{ mm}$), Museum Large ($5 \times 3\text{ in}$ / $127 \times 76.2\text{ mm}$), and Museum Extra Large ($6 \times 3.5\text{ in}$ / $152.4 \times 88.9\text{ mm}$) in both Landscape and Portrait orientations.
- **Dedicated High-Precision Fullscreen Preview Studio**: Decoupled React Portal mounted directly to `document.body` (`fixed inset-0 z-[100]`), eliminating Chromium translate trapping bugs (`translate-x-[-50%] translate-y-[-50%]`), with interactive zoom ($50\%$ to $250\%$), gang-run sheet and single card inspection, stand clamp guides, and dedicated `Escape` key capture restoration.
- **Strict Natural Vertical Stacking & Eliminated Mid-Card Dead Gaps**: Top-aligned natural flex stacking (`justify-start gap-1` to `gap-1.5`) eliminating `justify-between` and `mt-auto` traps. When Curatorial Notes are absent or disabled, Dimensions, Year, and Valuation/Price pull up tightly beneath Medium & Materials in strict sequential order, leaving all remaining blank space at the bottom of the card.
- **Universal Master Font Family Cascade**: Strict global font inheritance across all active placard text nodes (Category/School, Artist, Title, Medium, Dimensions, Year, Price, Notes, QR label) and customizer inputs, supported by direct Google Web Fonts `<link>` loading in `layout.tsx`.
- **Isolated Iframe Print Driver**: Renders print layouts in a dedicated, headless `<iframe>`, eliminating modal background bleed and Chromium $0\times0\text{ px}$ blank page collapses.
- **e-Catalog Synchronous Image Decoding Barrier**: Normalizes all image markup to `loading="eager"` and `decoding="sync"`, executing `Promise.all(images.map(img => img.decode()))` before triggering print. A responsive loading indicator in `catalog-print-button.tsx` guarantees that plates 2+ render with 100% asset fidelity in browser PDF downloads.
- **Editorial Hierarchy**: Header -> Title -> Medium -> Dimensions -> Thumbnail/QR Provenance -> Year -> Curatorial Notes.
- **Stand Clamp Safety Margin & Dead Space Elimination**: Supports configurable base clamp margins (`none` 0mm, `minimal` 3mm, `standard` 7mm, `acrylic-clamp` 16mm) eliminating bottom whitespace while providing acrylic stand protection when needed.
- **Museum Large & Extra Large Formats**: Adds $5 \times 3\text{ in}$ and $6 \times 3.5\text{ in}$ print specifications with automatic scale balancing.
- **Granular Field Typography Studio**: Per-field typography overrides for font family, size (7pt–32pt), weight, style, underline, uppercase, and color.
- **Unstyled Currency Pricing**: Clean unadorned text metadata display paired with currency symbols (`₹`, `$`, `€`, `£`, `AED`, `S$`, etc.), eradicating forced background badge earmarks.
- **Configurable Media Placement**: Customizable thumbnail and QR code positioning (`top-right`, `bottom-right`, `inline`, `stacked`) preventing spatial crowding on long multi-row titles.
- **Cross-Module Availability**: Accessible from `/admin/artworks`, `/admin/catalogs/[id]`, and `/admin/events`.

#### 3. Visual Page Builder & Enterprise Landing Page Studio (`/admin/pages`)
- **Modular Visual Studio (`/admin/pages/[id]/builder`)**: Drag-and-drop 12-column layout builder supporting Hero Showcase, 3D Exhibition Salon Wall, Text Blocks, Image Blocks, Media Carousels, and Dynamic Form Blocks.
- **Deterministic DND Hydration Guard**: Implements static ID `<DndContext id="savazai-page-builder-sections-dnd">` and client mounting guard (`mounted`), completely preventing SSR/CSR `aria-describedby` hydration mismatches that previously de-synchronized React 19 synthetic event listeners.
- **Radix UI Sliders & Switches**: Media Gallery Inspector utilizes accessible `@radix-ui/react-slider` and `@radix-ui/react-switch` primitives for "Max Artworks Per Wall", "Overview Wall Dwell", "Artwork Focus Dwell", "Autoplay Tour", and "Display Metadata Card Below Wall", eliminating range drag trapping.
- **Sanitized Catalog Ingestion**: "Auto-Fill from Catalog & Asset Repository" strips UUID filenames and legacy devotional fallbacks, defaulting alt text strictly to empty `""` unless authored by user.
- **Enterprise Landing Page Studio**: One-click generation of industry landing pages across 7 curated archetypes:
  - *Professional*: Executive advisory hero, live metric ticker counters, split practice grid, consultation scheduler CTA.
  - *Portfolio*: Living digital atelier hero, curated masterwork exhibition strip, authenticated monograph badges.
  - *Restaurant*: Atmospheric fine dining banner, interactive menu matrix with dietary badges (Chef Signature, Vegan, Gluten-Free).
  - *Hospitality*: Luxury sanctuary hero, signature suite cards (area, occupancy, view), curated amenity icon strip.
  - *Healthcare*: Accredited clinic hero, clinical department specialty grid, physician practitioner cards.
  - *Corporate*: Modern SaaS glow hero, elevated feature grid, and expandable FAQ accordion.
  - *Blank*: Unconstrained responsive 12-column sandbox canvas.
- **Atomic Homepage Promotion & Demotion**: Dedicated `/api/admin/pages/[id]/promote` endpoint allows promoting any custom landing page to replace the root `/` homepage atomically, with instant single-click demotion restoring the default platform homepage.
- **Universal Form Block**: Standard 5-field inquiry scaffolding (Full Name, Email Address, Phone, Subject Line, Message) with CSRF protection and decoupled alert routing.

#### 4. Interactive e-Catalog Studio (`/admin/catalogs`)
- Digital monograph creator with cover design, curatorial essays, and multi-artwork curation.
- Drag-and-drop artwork ordering and display curation.
- Virtual flip-book preview and batch placard printing for featured collection items.

#### 5. Events & Concerts Studio (`/admin/events`)
- Exhibition, recital, and workshop management with multi-day daily schedules (`dailySchedules`) and structured RSVP configuration (`EventRsvpConfig`).
- Full administrative control over date selection requirement, multi-date attendance checkboxes, time-slot requirement (*Mandatory / Optional / Disabled*), slot duration intervals (15m, 30m, 45m, 60m, 120m), and slot capacities.
- Dynamic "Hero Earmark / Subtitle Badge" editor configuring public hero labels.
- Real-time RSVP attendee tracker with attendance date badges, arrival time slot tracking, and CSV roster export.

#### 6. Dynamic Mail Message Studio & Audit Telemetry (`/admin/settings` -> Mail Msg Config)
- **Decoupled Alert Routing**: Inbound submissions route to `systemSetting.adminAlertEmail`, never to administrative superadmin credentials.
- **Dynamic Form Discovery**: Automatically aggregates Core triggers (`contact`, `event_rsvp`, `custom_form`), Page Builder form blocks, and active Event registration forms.
- **Universal Tiptap WYSIWYG Editor**: Visual rich text editor for designing email notifications with clickable dynamic token chips (`{name}`, `{email}`, `{organization_name}`, `{subject}`, `{message}`, `{event_title}`, `{event_date}`).
- **Multi-Tenant Brand Generalization**: Email templates resolve `{organization_name}` dynamically from the active tenant's brand title, eliminating hardcoded artist presets.
- **Dual Delivery Logo Engine**: Employs CID inline multipart attachments (`cid:atelier-brand-logo`) for local media files alongside absolute HTTPS fallbacks, resolving broken images across Gmail, Outlook, and Apple Mail.
- **Immutable Audit Logging**: Logs every outbound dispatch to `EmailDispatchLog` with delivery statuses (`SENT`, `FAILED`), error telemetry, and CSV export.

#### 7. Unified CRM Leads & Acquisition Inbox (`/admin/leads`)
- Multichannel lead capture consolidating inquiries from artwork pages, commission requests, event RSVPs, and custom Page Builder forms.
- Status pipeline tracking (`NEW`, `IN_REVIEW`, `CONTACTED`, `ARCHIVED`).
- Custom JSON payload inspector capturing bespoke form fields.

#### 8. Curatorial Posts & Blog Publisher (`/admin/posts`)
- Universal Tiptap rich-text publishing environment for blog articles and monographs.
- Category tagging, feature image management, and slug optimization.

#### 9. White-Label Theme & System Studio (`/admin/settings`)
- **General Branding**: Dynamic atelier title, configurable Archive Subtitle / Brand Tagline (`SystemSetting.archiveSubtitle`), bio, contact email, optional phone suppression, and single-source-of-truth brand logo URL.
- **Configurable Archival Provenance & Copyright Box**: Dedicated controls for Notice Header (`copyrightNoticeHeader`) and Notice Content (`copyrightNoticeContent`) rendered across all public artwork detail views, with complete suppression if content is omitted.
- **Header Integration**: Dynamic subtitle rendering in public `Navbar` and mobile navigation drawer, cleanly suppressed when omitted without empty layout artifacts.
- **Theme Studio**: Live palette selector with the flagship **"Imperial Atelier"** preset, custom primary/accent hex picker, and strict binary theme preview.
- **Gmail / SMTP Configuration**: Dynamic SMTP host, port, credentials, and admin alert routing recipient.
- **Multi-Cloud Storage & Media Vault**:
  - *Cloudflare R2 / AWS S3*: Storage provider selection with clean placeholder guidance, endpoint, bucket name, access keys, and public CDN domain.
  - *Google Workspace Storage & Sheets Sync*: Dedicated admin tab configuring Client ID, Client Secret, Refresh Token, Root Drive Folder ID, and CRM Google Sheets ID with live connection testing.
  - *Nextcloud Storage (WebDAV)*: Dedicated admin tab configuring Server URL, WebDAV Username, App Password / Token, Root Storage Directory, and public share generation with live connection testing.

#### 10. Security, Better-Auth RBAC & User Administration (`/admin/users`)
- Role-Based Access Control (`SUPER_ADMIN`, `ADMIN`, `EDITOR`).
- Public registration strictly disabled (`disableSignUp: true`).
- Middleware session verification and brute-force protection.

#### 11. Dynamic Admin Overview & Metric Engine (`/admin` and `src/components/admin/dashboard-layout-manager.tsx`)
- **Generalized Enterprise Tiles**: Overview tiles standardized to neutral domain terminology: Catalog & Assets, Categories & Classifications, Events & Showcases, Inbound Inquiries & Leads, Digital e-Catalogs, Articles & Publications, System Health & Services, and Quick Operations.
- **Dynamic Metric Source Resolver**: The backend resolver (`/api/admin/overview/metrics` and `DashboardWidget.metricSource`) executes parallel count queries across database models (`count:artworks`, `count:categories`, `count:events`, `count:leads`, `count:event_rsvps`, `count:event_specific_rsvp`, `count:catalogs`, `count:pages`, `count:posts`).
- **Filtered Event Metrics**: Support for `count:event_specific_rsvp` with secondary event picker and dynamic count resolution.
- **Full Field Customization**: Every tile field (Title, Sub-label, Description, Icon, Target URL, Metric Source, and Manual Value) is interactively editable with live preview and reordering controls.
- **SSR Pre-Computation**: Server-rendered SSR aggregation ensures immediate, zero-flicker metric integer hydration upon page load.

#### 12. Form Security, Anti-Bot CAPTCHA & Email OTP Verification Engine
- **Per-Form Configurable Security Controls**: Administrative toggles for arithmetic CAPTCHA and 6-digit Email OTP challenges across the Public Contact Form, Event RSVPs, QR Placard Gates, and Page Builder custom forms.
- **Dedicated Public Settings API (`/api/settings/public`)**: Sanitized endpoint exposing brand metadata and `formSecurityConfig` with cache-control headers, enabling dynamic security alignment across dynamic client components and static page renders.
- **Frictionless Returning User Recognition**: Returning verified visitors are recognized via email and name matching against verified CRM leads, granting instant bypass with zero verification latency.
- **Universal Privacy Consent Enforcement**: Mandatory `PrivacyConsentCheckbox` across all inbound inquiry portals ensuring GDPR and privacy compliance before form dispatch.

#### 13. Resilient Session Guard, 401 Interception & Anti-Loop Architecture
- **Centralized Session Interception (`src/lib/admin-fetch.ts`)**: Automatic HTTP 401/403 session expiration capture with in-flight redirect locking (`isRedirectingToLogin`) and single login navigation.
- **Defensive Unwrapping (`unwrapRecords`)**: Multi-key defensive payload deserialization protecting admin listing views against API schema variations and accidental blank states.
- **Edge Anti-Bounce Protocol (`src/proxy.ts`)**: Eradicated blind edge redirects from `/admin/login` to `/admin`. Edge middleware unconditionally wipes stale session cookies on unauthenticated requests and 401 responses, preventing CPU-pegging redirect loops.
- **Mount-Only Dashboard Life Cycle**: Strict empty dependency arrays on administrative layout effects, preventing cascading fetch storms.

#### 14. Media Vault Asset Manager, Artwork Materials/Surface Split & Universal Embed Engine
- **Artwork Materials & Surface Schema Split**: Split legacy `medium` into **Materials Used** (`materials`) and **Surface / Support** (`surface`) across Prisma, Admin Artwork dialogs, Public Artwork pages, e-Catalog plates, and physical gallery placards with zero-data-loss backfill.
- **Consolidated System Admin Hubs**: Unified settings into **Storage & Media Vault** (Cloudflare R2/S3, Google Workspace, Nextcloud Hub, Manage Media Vault), **E-Mail Configuration** (SMTP/Gmail + Mail Notification Templates), and **App Personalization** (White-Label Branding, Theme Studio, QR Scan Gate, Watermark & Anti-Harvesting).
- **Manage Media Vault & Dependency Matrix (`/api/admin/media/vault`)**: Table/Grid asset manager displaying dimensions, file size, MIME type, and a real-time **Where Used** dependency matrix across Artworks, Catalogs, Categories, Pages, Events, Blogs, and Settings, with orphan filtering and permanent batch cleanup.
- **Expanded Social Channels & Custom Link Builder**: Built-in support for Instagram, YouTube, Facebook, Pinterest, LinkedIn, and TikTok, plus dynamic custom social links with selectable vector icons.
- **Universal Video Embed Transformer (`src/lib/video-embed-parser.ts`) & HTML Embed Block (`EMBED_HTML`)**: Automatically transforms raw YouTube (`watch?v=`, `youtu.be/`, `shorts/`), Vimeo, Facebook, and Instagram URLs into CSP-safe embed players or HTML5 `<video>`, alongside a new **`+ Embed / HTML`** Page Builder block with configurable aspect ratios (`16:9`, `4:3`, `1:1`, `auto`) and sandbox security toggles.

---

## 5. Quickstart & Local Development

### Prerequisites
- Node.js `v22.x`
- Docker & Docker Compose
- Git

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/Savazar01/savazai-webapps-platform.git
cd savazai-webapps-platform
cp .env.example .env
```

### Step 2: Launch Local Multi-Container Stack
Start PostgreSQL 17 with `pgvector` (port `5633`) and the Next.js development server (port `3060`):
```bash
docker compose -f docker-compose.dev.yml up -d
```

Verify database and `vector` extension status:
```bash
docker compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -d lalitakapilavai_dev -c "\dx"
```

### Step 3: Initialize Database & Run Idempotent Seed
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 4: Access Endpoints
- **Public Portal**: http://localhost:3060
- **Admin Control Center**: http://localhost:3060/admin
- **Admin Login**: http://localhost:3060/admin/login
  - Default Superadmin: Configured via `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` in `.env`.

---

## 6. Zero-Touch Coolify VPS Deployment

The platform is engineered for **100% zero-touch deployment** on any VPS running Coolify. On container boot, `docker-entrypoint.sh` automatically synchronizes PostgreSQL schemas (`prisma db push`) and provisions administrative credentials idempotently.

### Deployment Runbook

1. **Step 1: Create Resource in Coolify**
   - In Coolify, click **+ New** -> **Git Repository**.
   - URL: `https://github.com/Savazar01/savazai-webapps-platform` | Branch: `main`.
2. **Step 2: Set Build Pack**
   - Select **Docker Compose** (Coolify detects root `docker-compose.yml`).
3. **Step 3: Assign Domain & Traefik Routing**
   - Enter your production domain (e.g., `https://your-domain.com`).
   - Coolify connects the web container to the shared `coolify` reverse-proxy network.
4. **Step 4: Configure Environment Variables**
   - Supply `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_INITIAL_PASSWORD`.
5. **Step 5: Deploy**
   - Click **Deploy**. Coolify executes the multi-stage Debian 12 build, starts PostgreSQL 17 alongside the standalone Next.js server on port `3060`, runs database migrations, and exposes the application securely.

---

## 7. Production Environment Variables Template

```bash
# ==============================================================================
# SAVAZAI WEBAPPS PLATFORM — PRODUCTION ENVIRONMENT VARIABLES
# ==============================================================================

# Database Connection (PostgreSQL 17 + pgvector)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=generate_strong_password_here
POSTGRES_DB=savazai_webapps_prod

# Core Application Networking
NODE_ENV=production
PORT=3060
NEXT_PUBLIC_APP_URL=https://your-domain.com
COOLIFY_FQDN=your-domain.com

# Better-Auth Private Authentication
BETTER_AUTH_SECRET=generate_32_byte_hex_string
BETTER_AUTH_URL=https://your-domain.com
ADMIN_EMAIL=admin@your-domain.com
ADMIN_NAME=SavazAI Platform Admin
ADMIN_INITIAL_PASSWORD=YourStrongInitialAdminPassword2026!

# Cloudflare R2 / AWS S3 Media Storage Vault
STORAGE_PROVIDER=r2
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET_NAME=savazai-media-vault
S3_ACCESS_KEY_ID=your_r2_access_key_id
S3_SECRET_ACCESS_KEY=your_r2_secret_access_key
S3_PUBLIC_DOMAIN=https://media.your-domain.com
S3_REGION=auto

# Digital Asset Watermark Controls
WATERMARK_TEXT=© SavazAI WebApps | All Rights Reserved
WATERMARK_OPACITY=0.75
```

---

## 8. Architectural Documentation & Living Governance
- [`AGENTS.md`](./AGENTS.md): Autonomous agent operating instructions, quality gates, and architectural invariants.
- [`.skills/ui-ux-pro-max.md`](./.skills/ui-ux-pro-max.md): SavazAI WebApps Design System, "Imperial Atelier" tokens, and WCAG 2.2 AAA accessibility.
- [`.skills/graphify.md`](./.skills/graphify.md): Knowledge Graph First Invariant and semantic vector exploration.
- [`.skills/playwright.md`](./.skills/playwright.md): E2E automated test harness procedures across web and admin scopes.
- [`.skills/cloudflare-security.md`](./.skills/cloudflare-security.md): Edge WAF rules, CSP headers, and multi-tenant R2 media protection.
- [`.skills/better-auth-best-practices.md`](./.skills/better-auth-best-practices.md): Private admin RBAC and session security.
- [`.skills/shadcn.md`](./.skills/shadcn.md): Component elevation tokens and fine art framing rules.
- [`.skills/vercel-react-best-practices.md`](./.skills/vercel-react-best-practices.md): RSC boundaries, parallel data fetching, and strict binary theme hydration.
