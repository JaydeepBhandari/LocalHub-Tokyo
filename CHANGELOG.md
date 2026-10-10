# Changelog

## [1.4.0] - Prototype Data Limiting
### Changed
- **Per-Category Spot Cap**: Added `MAX_PER_CATEGORY=12` limit in `import_tokyo.js` so each category gets ~10-15 spots max, keeping the prototype dataset small and manageable.
- **Seed Async Fix**: Fixed `seed.js` to properly `await` the `importTokyo()` function and exit cleanly after seeding completes.
- **Import Cleanup**: Added category breakdown logging at end of import for quick verification.

### Fixed
- **`.gitignore`**: Added `backend/scripts/.osm_cache/` to prevent cached OSM API responses from being committed.


## [1.1.0] - Phase 2 Redesign & Real Data Update
### Added
- **OpenStreetMap Import**: Added `npm run import:places` script that queries the Overpass API to seed real businesses and locations in Surat, Gujarat.
- **GeoSpatial Search**: Added `$near` and bounding box `$geoWithin` support to the backend API using MongoDB `2dsphere` indexes.
- **Split Map View**: Redesigned the main browse page (`Home.jsx`) to feature a responsive split view with a `react-leaflet` map on the right and a business list on the left. Hovering a card highlights the map marker.
- **Admin Dashboard Upgrade**: Added `recharts` for visual KPI tracking of categories. Redesigned the business table to show Data Quality flags (missing coordinates, missing images). Enhanced the editor drawer to support exact Latitude and Longitude editing.
- **Category Pattern Fallbacks**: Implemented `CategoryPattern.jsx` to render high-quality, color-coded SVG patterns for businesses missing real photos, ensuring 0 empty gray boxes.
- **Brand Identity**: Created a geometric pin logo (`logo-mark.svg`, `logo-full-dark.svg`, `logo-full-light.svg`) and a comprehensive `/docs/brand.md` guide outlining colors and typography.
- **Zod Validation**: Added robust `zod` schema validation to business POST endpoints.
- **Structured Hours**: Transitioned from simple string `openingTime`/`closingTime` to a rich `hours` JSON structure handling multiple intervals per day, with overnight support.

### Changed
- **Business Model**: Refactored Mongoose `Business.js` schema to include `geo.coordinates`, `images` array with metadata (source, credit), `hoursText`, and `viewCount`.
- **Search Architecture**: Expanded the `$text` index search and sort mechanisms to fallback to `textScore` sorting when a query is provided.
- **Business Detail Page**: Updated to show exact coordinates mapping links (Google Maps Directions) and a robust review form UI.

### Removed
- **Fabricated Seed Data**: Removed the `seed.js` script relying on fake Portland data in favor of the real OSM pipeline.

## [1.2.0] - Phase 3 Tokyo Pivot
### Added
- **Tokyo-Specific Fields**: Extended `Business` model to include `station`, `line`, and `paymentOptions`. Updated Business Detail and Admin Dashboard pages to manage these fields.
- **Events Model & UI**: Created `Event` model for local festivals and occurrences. Integrated events fetching to `Home.jsx` showing dates, bilingual title, description, and location in a new "Happening in Tokyo" section.
- **Settings Management**: Fixed broken Admin Dashboard routing for `SettingsTab` and implemented global config via `Setting` model (`siteTitle`, `allowSubmissions`).
- **Data Initialization**: Added `clear_db.js` to drop non-Tokyo data and `seed_tokyo.js` to seed iconic places (Senso-ji, Meiji Jingu) and festivals (Sanja Matsuri, Sumida River).

### Changed
- **Design Aesthetic**: Updated typography to Noto Sans JP. Overhauled colors (`index.css`) to use Tokyo themes (Torii Red, deep ink background). Forced default Dark Theme in `ThemeContext.jsx`.
- **Copy & Navigation**: Swapped all references from Surat/Portland to Tokyo. Updated footer links, logo references, and hero copy to match an editorial magazine style.
- **Leaflet Maps**: Updated map tile provider to unmetered OSM standard tiles instead of Carto to avoid `API KEY REQUIRED` issues.

### Removed
- All traces of dummy data from the Portland and Surat implementations.

## [1.3.0] - Phase 4 Final Polish (Edo Craft meets Modern Tokyo)
### Added
- **Database & Backend Hardening**: Added `docker-compose.yml` for local MongoDB setup. Updated `server.js` with `connectWithRetry` logic, graceful shutdown, and an `/api/health` endpoint. Added comprehensive missing Mongoose models (`Ward`, `Collection`, `Submission`, `AuditLog`, `Favorite`, `AnalyticsEvent`).
- **Idempotent Data Pipeline**: Fixed and expanded `import_tokyo.js` to properly rate-limit, cache results, and import 500+ spots across all 23 Tokyo wards using the Overpass API. Updated `seed_tokyo.js` to safely initialize foundational Settings and iconic Editor's Picks idempotently.
- **Image Auditing**: Created `audit_images.js` to iterate over MongoDB, execute HTTP HEAD requests on image URLs, identify broken links, and automatically strip out dead image URLs to trigger fallbacks.
- **Edo Craft Theme**: Implemented a comprehensive Japanese-inspired design system in `index.css`. Created CSS variables for traditional colors (Shuiro Vermilion, Kinari Washi, Aiiro Indigo). Added an SVG layered hero illustration featuring Mount Fuji and a Torii gate.
- **Advanced Map Features**: Configured MapLibre/Leaflet with `react-leaflet-cluster` for marker clustering. Re-enabled CARTO `voyager`/`dark_all` basemaps for English/Latin labels, matching the theme context. Designed custom torii/teardrop CSS markers with hover animations and detailed popups.
- **Robust Typography**: Migrated to a Google Fonts stack featuring `Shippori Mincho B1` for display, and `Inter`/`Noto Sans JP` for body copy, removing unreadable display fonts at small sizes.

### Changed
- **Card & Data Display**: Re-designed `BusinessCard` to use a shikishi square frame aesthetic, with a rotated 'hanko' style Featured badge. Removed fake "New" ratings and replaced with actual averages or "Unrated". Added robust `onError` image handlers to fallback gracefully to SVG patterns when CDNs fail.
- **Schema Indexes**: Updated the `Spot/Business` schema to include `nameJa`, `ward`, and `lastVerifiedAt` fields. Improved MongoDB indexing to include compound indexes on `ward` and `category`.
- **Map Provider Overhaul**: Replaced Leaflet and CARTO tiles with MapLibre GL JS and OpenFreeMap vector tiles (completely keyless). Integrated `use-supercluster` for high-performance marker clustering.
- **Wikipedia Image Pipeline**: Expanded `audit_images.js` to search English and Japanese Wikipedia for missing spot photos (e.g. Tokyo Skytree, Meiji Jingu), compress them to WebP using `sharp`, and serve them locally.
- **Global Theme Engine**: Introduced an `AppShell` component wrapping the entire React app. It injects a global Washi-paper SVG noise texture and a large faded calligraphy watermark (`街`) behind all routes for a deeply cohesive Edo-meets-Modern aesthetic.
