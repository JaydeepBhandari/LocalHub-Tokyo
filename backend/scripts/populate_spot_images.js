const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Business = require('../models/Business');

// Specific iconic photos
const ICONIC_SPOT_IMAGES = {
  "Senso-ji": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
  "Sensō-ji": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
  "浅草寺": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
  "Meiji Jingu": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "明治神宮": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "Tokyo Skytree": "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000&auto=format&fit=crop",
  "東京スカイツリー": "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000&auto=format&fit=crop",
  "Tokyo Tower": "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=1000&auto=format&fit=crop",
  "東京タワー": "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=1000&auto=format&fit=crop",
  "Shibuya Crossing": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1000&auto=format&fit=crop",
  "渋谷スクランブル交差点": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1000&auto=format&fit=crop",
  "Shibuya Sky": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "Ghibli Museum": "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
  "三鷹の森ジブリ美術館": "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
  "teamLab Planets": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1000&auto=format&fit=crop",
  "Ueno Park": "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
  "上野恩賜公園": "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
  "Shinjuku Gyoen": "https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1000&auto=format&fit=crop",
  "新宿御苑": "https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1000&auto=format&fit=crop",
  "Golden Gai": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop",
  "Omoide Yokocho": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
  "Tsukiji Outer Market": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
  "Ameyoko": "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop",
  "Akihabara": "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop",
  "Tokyo National Museum": "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1000&auto=format&fit=crop",
  "Nezu Museum": "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=1000&auto=format&fit=crop",
  "Hamarikyu Gardens": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "Yoyogi Park": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
  "代々木公園": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
  "Kappabashi": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
  "Yanaka Ginza": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop",
  "Takeshita Street": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop",
  "Shimokitazawa": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop",
  "Nakameguro": "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=1000&auto=format&fit=crop",
  "Jimbocho": "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop"
};

// Rich varied collections per category (all high-res Unsplash photos of Tokyo/Japan)
const CATEGORY_POOLS = {
  "Food and Izakaya": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1000&auto=format&fit=crop"
  ],
  "Ramen and Street Food": [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=1000&auto=format&fit=crop"
  ],
  "Cafes and Kissaten": [
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=1000&auto=format&fit=crop"
  ],
  "Shrines and Temples": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1000&auto=format&fit=crop"
  ],
  "Parks and Gardens": [
    "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop"
  ],
  "Museums and Galleries": [
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1000&auto=format&fit=crop"
  ],
  "Shopping and Markets": [
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=1000&auto=format&fit=crop"
  ],
  "Nightlife and Bars": [
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000&auto=format&fit=crop"
  ],
  "Arcades and Entertainment": [
    "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1000&auto=format&fit=crop"
  ],
  "Sento and Onsen": [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1000&auto=format&fit=crop"
  ],
  "Books and Records": [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507842229453-769a68581079?q=80&w=1000&auto=format&fit=crop"
  ],
  "Landmarks and Views": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1000&auto=format&fit=crop"
  ],
  "Everyday Essentials": [
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop"
  ]
};

const DEFAULT_POOL = [
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=1000&auto=format&fit=crop"
];

function getPhotoForSpot(spot) {
  // Check iconic name match
  const name = spot.name || "";
  const nameJa = spot.nameJa || "";
  for (const [key, url] of Object.entries(ICONIC_SPOT_IMAGES)) {
    if (name.includes(key) || nameJa.includes(key)) {
      return url;
    }
  }

  // Pick from category pool deterministically using spot ID or name hash
  const pool = CATEGORY_POOLS[spot.category] || DEFAULT_POOL;
  let hash = 0;
  const str = spot._id ? spot._id.toString() : name;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

async function populateAllSpotImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for spots image population...");

    const spots = await Business.find({});
    console.log(`Found ${spots.length} total spots.`);

    let updatedCount = 0;
    const bulkOps = [];

    for (const spot of spots) {
      const hasRealImage = spot.images && spot.images.length > 0 && 
        spot.images[0].url && 
        !spot.images[0].url.includes("placeholder") &&
        spot.images[0].source !== "placeholder";

      // If missing image or has placeholder image, assign high-res photo
      if (!hasRealImage) {
        const photoUrl = getPhotoForSpot(spot);
        bulkOps.push({
          updateOne: {
            filter: { _id: spot._id },
            update: {
              $set: {
                images: [
                  {
                    url: photoUrl,
                    source: "unsplash",
                    credit: "Unsplash Tokyo",
                    isCover: true
                  }
                ]
              }
            }
          }
        });
        updatedCount++;
      }
    }

    if (bulkOps.length > 0) {
      console.log(`Executing bulk update for ${bulkOps.length} spots...`);
      await Business.bulkWrite(bulkOps);
    }

    console.log(`Successfully populated images for ${updatedCount} spots!`);
    process.exit(0);
  } catch (err) {
    console.error("Population error:", err);
    process.exit(1);
  }
}

populateAllSpotImages();
