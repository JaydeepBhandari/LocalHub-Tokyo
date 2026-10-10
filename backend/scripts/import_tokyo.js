const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Business = require('../models/Business');
require('dotenv').config({ path: '../.env' });

const TOKYO_WARDS = [
  "Chiyoda", "Chuo", "Minato", "Shinjuku", "Bunkyo", "Taito", "Sumida", 
  "Koto", "Shinagawa", "Meguro", "Ota", "Setagaya", "Shibuya", "Nakano", 
  "Suginami", "Toshima", "Kita", "Arakawa", "Itabashi", "Nerima", 
  "Adachi", "Katsushika", "Edogawa"
];

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_DIR = path.join(__dirname, '.osm_cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWardData(ward) {
  const cachePath = path.join(CACHE_DIR, `${ward}.json`);
  if (fs.existsSync(cachePath)) {
    console.log(`Using cached data for ${ward}`);
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  }

  const query = `
    [out:json][timeout:60];
    area["name:en"="${ward}"]["admin_level"="7"]->.searchArea;
    (
      node["amenity"~"restaurant|cafe|bar|pub|fast_food|nightclub|public_bath"](area.searchArea);
      node["shop"~"convenience|supermarket|books|laundry|mall"](area.searchArea);
      node["tourism"~"museum|gallery|theme_park|viewpoint"](area.searchArea);
      node["leisure"~"park|garden|amusement_arcade"](area.searchArea);
      node["historic"~"shrine|temple"](area.searchArea);
      node["man_made"~"tower|observatory"](area.searchArea);
    );
    out center;
  `;
  
  try {
    const response = await axios.post(OVERPASS_URL, query, {
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'LocalHub-Tokyo/1.0' }
    });
    const elements = response.data.elements || [];
    fs.writeFileSync(cachePath, JSON.stringify(elements));
    return elements;
  } catch (error) {
    console.error(`Error fetching data for ${ward}:`, error.message);
    return [];
  }
}

function mapOsmTagsToCategory(tags) {
  if (tags.tourism === 'viewpoint' || tags.man_made === 'tower' || tags.man_made === 'observatory') return 'Landmarks and Views';
  if (tags.amenity === 'cafe') return 'Cafes and Kissaten';
  if (tags.amenity === 'bar' || tags.amenity === 'pub' || tags.amenity === 'nightclub') return 'Nightlife and Bars';
  if (tags.amenity === 'restaurant' && tags.cuisine === 'ramen') return 'Ramen and Street Food';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'Food and Izakaya';
  if (tags.historic === 'shrine' || tags.historic === 'temple') return 'Shrines and Temples';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'Parks and Gardens';
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'Museums and Galleries';
  if (tags.shop && (tags.shop === 'convenience' || tags.shop === 'supermarket' || tags.shop === 'laundry')) return 'Everyday Essentials';
  if (tags.shop === 'books') return 'Books and Records';
  if (tags.shop) return 'Shopping and Markets';
  if (tags.leisure === 'amusement_arcade') return 'Arcades and Entertainment';
  if (tags.amenity === 'public_bath') return 'Sento and Onsen';
  
  return 'Food and Izakaya';
}

async function importTokyo() {
  console.log("Starting Spot Import...");
  // Connect if not connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localhub-tokyo');
  }
  
  const MAX_SPOTS = parseInt(process.env.MAX_SPOTS || '80', 10);
  let totalImported = 0;
  
  // Iconic list (must have)
  const iconicNames = ["Senso-ji", "Meiji Jingu", "Ghibli Museum", "Tokyo Skytree", "Tokyo Tower", "Shibuya Crossing", "Shibuya Sky", "teamLab Planets", "Ueno Park", "Tokyo National Museum", "Nezu Museum", "Yoyogi Park", "Shinjuku Gyoen", "Golden Gai", "Omoide Yokocho", "Tsukiji Outer Market", "Ameyoko", "Akihabara", "Kappabashi", "Yanaka Ginza", "Takeshita Street", "Shimokitazawa", "Nakameguro", "Koenji", "Jimbocho", "Hamarikyu Gardens", "Mori Art Museum", "Hokusai Museum"];
  
  const normalizeName = (n) => n.toLowerCase().replace(/[^\w]/g, '');

  const seenNames = new Set();
  const existingSpots = await Business.find({});
  for (const s of existingSpots) {
    seenNames.add(normalizeName(s.name));
    if (s.nameJa) seenNames.add(normalizeName(s.nameJa));
  }
  
  for (const ward of TOKYO_WARDS) {
    if (totalImported >= MAX_SPOTS) break;
    
    console.log(`Fetching data for ${ward} ward...`);
    let elements = await fetchWardData(ward);
    
    elements = elements.filter(el => el.tags && (el.tags.name || el.tags['name:en']));
    
    // Sort so iconic spots come first
    elements.sort((a, b) => {
      const aName = a.tags['name:en'] || a.tags.name || '';
      const bName = b.tags['name:en'] || b.tags.name || '';
      const aIconic = iconicNames.some(i => aName.includes(i)) ? 1 : 0;
      const bIconic = iconicNames.some(i => bName.includes(i)) ? 1 : 0;
      return bIconic - aIconic;
    });

    let wardSpots = 0;
    
    for (const el of elements) {
      if (totalImported >= MAX_SPOTS) break;
      if (wardSpots >= 6 && !iconicNames.some(i => (el.tags['name:en'] || el.tags.name || '').includes(i))) continue;
      
      const category = mapOsmTagsToCategory(el.tags);
      let nameEn = el.tags['name:en'] || el.tags.name;
      let nameJa = el.tags['name:ja'] || (el.tags['name:en'] ? el.tags.name : '');
      
      const normNameEn = normalizeName(nameEn);
      const normNameJa = normalizeName(nameJa);
      
      if (seenNames.has(normNameEn) || (normNameJa && seenNames.has(normNameJa))) {
        continue; // duplicate
      }
      
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      
      if (!lat || !lon) continue;
      
      // Proximity check (simple bounding box around 50m: roughly 0.0005 deg)
      const nearby = await Business.findOne({
        "geo.coordinates": {
          $near: {
            $geometry: { type: "Point", coordinates: [lon, lat] },
            $maxDistance: 50
          }
        },
        category
      });
      if (nearby) continue;

      const newBusiness = {
        name: nameEn,
        nameJa: nameJa,
        category,
        ward: ward,
        description: el.tags.description || el.tags['description:en'] || '',
        location: el.tags['addr:street'] || el.tags['addr:full'] || ward,
        area: el.tags['addr:neighbourhood'] || '',
        city: "Tokyo",
        geo: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        phone: el.tags.phone || '',
        website: el.tags.website || el.tags['contact:website'] || '',
        hoursText: el.tags.opening_hours || "Hours not listed",
        tags: [ward.toLowerCase()],
        status: "approved",
        source: "osm",
        sourceId: `osm-${el.type}-${el.id}`
      };
      
      try {
        await Business.findOneAndUpdate(
          { sourceId: newBusiness.sourceId },
          newBusiness,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        seenNames.add(normNameEn);
        if (normNameJa) seenNames.add(normNameJa);
        totalImported++;
        wardSpots++;
      } catch (err) {
        // Skip duplicate
      }
    }
    
    // Respect rate limits for missing cache
    await delay(300);
  }
  
  console.log(`Done! Imported/Updated ${totalImported} spots in Tokyo.`);
}

module.exports = importTokyo;
if (require.main === module) {
  importTokyo().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
