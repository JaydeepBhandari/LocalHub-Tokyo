# LocalHub Tokyo

LocalHub Tokyo is a community spot discovery platform that allows users to find, review, and explore local businesses, shrines, parks, and events across all 23 wards of Tokyo. This repository contains both the Node.js/Express backend API and the React/Vite frontend application, designed with a distinct "Edo Craft meets Modern Tokyo" aesthetic.

## Features
- **Modern UI/UX**: Custom Japanese design system (Sumi ink, Washi paper, Torii red), dark/light themes, responsive layouts, and map micro-interactions.
- **Robust API**: Express.js REST API with JWT authentication, MongoDB geospatial queries (`$near`, `$geoWithin`), and error handling.
- **Dynamic Maps**: Integrated MapLibre GL JS mapping using keyless OpenFreeMap vector tiles with English-enforced labels and programmatic Tokyo-themed restyling.
- **Admin Dashboard**: Comprehensive management interface for curating spots and configuring system settings.
- **Real Tokyo Data Pipeline**: Utilities to scrape, import, and sync hundreds of real spots directly from the OpenStreetMap Overpass API and Wikipedia.

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Running locally via Docker or a cloud URI)

## Setup Instructions

### 1. Database Setup (Docker)
You can start a local MongoDB instance using the provided `docker-compose.yml`:
```bash
docker-compose up -d
```
This spins up MongoDB on `mongodb://127.0.0.1:27017/localhub-tokyo`.

### 2. Backend Setup
```bash
cd backend
npm install
```

Ensure your `backend/.env` file is set up:
```env
MONGO_URI=mongodb://127.0.0.1:27017/localhub-tokyo
PORT=5000
JWT_SECRET=localhub_jwt_secret_key_2026_change_in_production
NODE_ENV=development
```
*(Optional API Keys)*: `MAPTILER_KEY`, `MAPILLARY_TOKEN`, `GOOGLE_PLACES_API_KEY`. The app functions flawlessly without them.

**Populate the Database**:
```bash
npm run import:tokyo    # Imports 500+ real spots via OSM
node scripts/seed_tokyo.js  # Seeds Editor's Picks & initial settings
node scripts/audit_images.js # Fetches real verified photos from Wikimedia
```

**Start the Server**:
```bash
npm start
```
The API will run at `http://localhost:5000/api/v1`.

### 3. Frontend Setup
```bash
cd frontend
npm install
```

**Start the Dev Server**:
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

## Architecture & Integrations

### Map Provider
The map uses **MapLibre GL JS** combined with `react-map-gl`.
- Base tiles are sourced from **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`), which requires **no API keys**. 
- Japanese labels are coalesced to English dynamically at runtime for accessibility.
- Map markers are custom HTML divs, clustered using `use-supercluster`.

### Image Pipeline
We emphasize authentic representation over generic placeholders.
1. `audit_images.js` identifies spots in the DB and queries the Wikipedia API.
2. Verified Wikimedia Commons images are downloaded, compressed to WebP via `sharp`, and saved locally.
3. Any spot lacking an image triggers a themed SVG `CategoryPattern` fallback instead of a broken graphic.

## Admin Login
To log into the management dashboard, run the backend `seed_tokyo.js` script to generate the default admin account:
- **Email**: admin@localhub.com
- **Password**: admin123
