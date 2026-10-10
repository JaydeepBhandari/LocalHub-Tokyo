const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const Business = require('../models/Business');
require('dotenv').config({ path: '../.env' });

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function searchWikipediaImage(nameEn, nameJa) {
  try {
    const titles = encodeURIComponent(`${nameJa}|${nameEn}`);
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${titles}&piprop=original&pilicense=any&format=json`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'LocalHub-Tokyo/1.0' } });
    const pages = res.data.query?.pages;
    if (pages) {
      for (const pageId of Object.keys(pages)) {
        if (pages[pageId].original && pages[pageId].original.source) {
          const src = pages[pageId].original.source;
          if (!src.toLowerCase().endsWith('.svg')) return src; // ignore SVGs for now
        }
      }
    }
    
    // Try Japanese wikipedia
    const urlJa = `https://ja.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${titles}&piprop=original&pilicense=any&format=json`;
    const resJa = await axios.get(urlJa, { headers: { 'User-Agent': 'LocalHub-Tokyo/1.0' } });
    const pagesJa = resJa.data.query?.pages;
    if (pagesJa) {
      for (const pageId of Object.keys(pagesJa)) {
        if (pagesJa[pageId].original && pagesJa[pageId].original.source) {
          const src = pagesJa[pageId].original.source;
          if (!src.toLowerCase().endsWith('.svg')) return src;
        }
      }
    }
  } catch (err) {
    console.error("Wikipedia API error", err.message);
  }
  return null;
}

async function downloadAndProcessImage(url, spotId) {
  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'LocalHub-Tokyo/1.0' }
    });
    const buffer = Buffer.from(response.data, 'binary');
    
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
    const filename = `${spotId}_${hash}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);
      
    return `/uploads/${filename}`;
  } catch (err) {
    console.error(`Failed to process image ${url}`, err.message);
    return null;
  }
}

async function auditImages() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localhub-tokyo');
  console.log("Connected to DB.");

  const targets = [
    "Tokyo Skytree",
    "Meiji Jingu",
    "Senso-ji",
    "Ghibli Museum"
  ];

  const businesses = await Business.find({ 
    $or: [
      { name: { $in: targets } },
      { nameJa: { $in: ["東京スカイツリー", "明治神宮", "浅草寺", "三鷹の森ジブリ美術館"] } }
    ]
  });

  console.log(`Found ${businesses.length} iconic spots to fix.`);

  for (const b of businesses) {
    console.log(`Processing: ${b.name} (${b.nameJa})`);
    
    // Fix names for wikipedia query
    let queryEn = b.name;
    if (b.name === "Meiji Jingu") queryEn = "Meiji Shrine";
    if (b.name === "Senso-ji") queryEn = "Sensō-ji";
    
    let queryJa = b.nameJa;
    if (!queryJa) {
      if (b.name === "Meiji Jingu") queryJa = "明治神宮";
      if (b.name === "Tokyo Skytree") queryJa = "東京スカイツリー";
      if (b.name === "Ghibli Museum") queryJa = "三鷹の森ジブリ美術館";
    }

    const imgUrl = await searchWikipediaImage(queryEn, queryJa || queryEn);
    if (imgUrl) {
      console.log(`  Found Wikipedia image: ${imgUrl}`);
      const localPath = await downloadAndProcessImage(imgUrl, b._id.toString());
      if (localPath) {
        b.images = [{
          url: localPath,
          source: 'wikimedia',
          isCover: true,
          credit: 'Wikimedia Commons'
        }];
        await b.save();
        console.log(`  Saved verified image for ${b.name}`);
      }
    } else {
      console.log(`  No Wikipedia image found for ${b.name}`);
      b.images = [{
        url: '/placeholder.webp',
        source: 'placeholder',
        isCover: true
      }];
      await b.save();
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("Done.");
  process.exit(0);
}

auditImages();
