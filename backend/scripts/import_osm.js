const mongoose = require('mongoose');
const axios = require('axios');
const opening_hours = require('opening_hours');
const dotenv = require('dotenv');
const Business = require('../models/Business');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/localhub';
const TARGET_CITY = process.env.TARGET_CITY || 'Surat';

function mapCategory(tags) {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const leisure = tags.leisure;

  if (amenity) {
    if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court'].includes(amenity)) return 'Food';
    if (['hospital', 'clinic', 'doctors', 'dentist', 'pharmacy'].includes(amenity)) return 'Healthcare';
    if (['school', 'college', 'university', 'kindergarten'].includes(amenity)) return 'Education';
    if (['cinema', 'theatre', 'arts_centre', 'nightclub'].includes(amenity)) return 'Entertainment';
    if (['bank', 'post_office', 'car_repair', 'car_wash', 'veterinary'].includes(amenity)) return 'Services';
  }
  
  if (shop) {
    if (['hairdresser', 'beauty', 'massage', 'spa', 'tattoo'].includes(shop)) return 'Beauty';
    if (['supermarket', 'convenience', 'bakery', 'butcher', 'clothes', 'shoes', 'mall'].includes(shop)) return 'Shopping';
    return 'Shopping'; // Default for other shops
  }

  if (leisure) {
    if (['fitness_centre', 'sports_centre', 'stadium', 'swimming_pool'].includes(leisure)) return 'Fitness';
  }

  return 'Services'; // Fallback
}

function parseHours(osmHoursString) {
  if (!osmHoursString) return null;
  try {
    const oh = new opening_hours(osmHoursString);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1); // Monday
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000); // Next Monday
    
    const intervals = oh.getOpenIntervals(from, to);
    
    // Convert intervals to our format: { monday: [{open: "09:00", close: "17:00"}], ... }
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const structuredHours = {};
    days.forEach(d => structuredHours[d] = []);

    intervals.forEach(interval => {
      const start = interval[0];
      const end = interval[1];
      const day = days[start.getDay()];
      
      const formatTime = (date) => {
        return date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
      };
      
      structuredHours[day].push({
        open: formatTime(start),
        close: formatTime(end)
      });
    });

    return structuredHours;
  } catch (error) {
    console.error(`Error parsing hours "${osmHoursString}":`, error.message);
    return null;
  }
}

function getFallbackImage(category) {
  // We'll use a local fallback SVG for each category
  // This satisfies the "designed category fallback" requirement.
  const cat = category.toLowerCase();
  return {
    url: `/images/categories/${cat}.svg`,
    source: 'placeholder',
    credit: 'LocalHub',
    license: 'Internal'
  };
}

async function importOSM() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log(`Fetching POIs for ${TARGET_CITY} from Overpass API...`);
    const query = `
      [out:json][timeout:25];
      area["name"="${TARGET_CITY}"]["boundary"="administrative"]->.searchArea;
      (
        node["name"]["amenity"~"restaurant|cafe|hospital|clinic|school|college|cinema"](area.searchArea);
        way["name"]["amenity"~"restaurant|cafe|hospital|clinic|school|college|cinema"](area.searchArea);
        node["name"]["shop"](area.searchArea);
        way["name"]["shop"](area.searchArea);
        node["name"]["leisure"~"fitness_centre|sports_centre"](area.searchArea);
        way["name"]["leisure"~"fitness_centre|sports_centre"](area.searchArea);
      );
      out center;
    `;

    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 
        'Content-Type': 'text/plain',
        'User-Agent': 'LocalHub/1.0 (local development)'
      }
    });

    const elements = response.data.elements.slice(0, 150);
    console.log(`Found ${elements.length} elements from OSM.`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const el of elements) {
      if (!el.tags || !el.tags.name) {
        skipped++;
        continue;
      }

      const sourceId = `osm_${el.type}_${el.id}`;
      const name = el.tags.name;
      const category = mapCategory(el.tags);
      
      let lat = el.lat;
      let lon = el.lon;
      if (el.type === 'way' && el.center) {
        lat = el.center.lat;
        lon = el.center.lon;
      }

      const addressParts = [];
      if (el.tags['addr:housenumber']) addressParts.push(el.tags['addr:housenumber']);
      if (el.tags['addr:street']) addressParts.push(el.tags['addr:street']);
      
      const area = el.tags['addr:suburb'] || '';
      const city = el.tags['addr:city'] || TARGET_CITY;
      
      const location = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${city}`;

      const phone = el.tags['phone'] || el.tags['contact:phone'] || '';
      const website = el.tags['website'] || el.tags['contact:website'] || '';
      const hoursText = el.tags['opening_hours'] || "Hours not listed";
      const structuredHours = parseHours(el.tags['opening_hours']);
      
      const images = [];
      images.push(getFallbackImage(category));

      const businessData = {
        name,
        category,
        description: `Located in ${city}${area ? ', ' + area : ''}.`,
        location,
        area,
        city,
        geo: {
          type: 'Point',
          coordinates: [lon, lat] // [lng, lat] for GeoJSON
        },
        phone,
        website,
        hours: structuredHours || {},
        hoursText,
        images,
        status: 'approved',
        source: 'osm',
        sourceId,
        lastSyncedAt: new Date()
      };

      // Upsert
      const existing = await Business.findOne({ sourceId });
      
      if (existing) {
        // Don't overwrite if manual edits exist. 
        // We can check if it was manually edited if `claimedBy` is set, or just skip updating fields that were changed.
        // For simplicity, if it's already there, just update lastSyncedAt.
        existing.lastSyncedAt = new Date();
        await existing.save();
        updated++;
      } else {
        await Business.create(businessData);
        added++;
      }
    }

    console.log(`Import Complete: ${added} added, ${updated} updated, ${skipped} skipped.`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importOSM();
