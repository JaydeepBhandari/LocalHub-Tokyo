const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });
const Event = require("../models/Event");

const eventUpdates = [
  {
    enTitle: "Tori-no-ichi (Rooster Fair)",
    imageUrl: "https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Sumida River Fireworks Festival",
    imageUrl: "https://images.unsplash.com/photo-1533230308146-4a29798767c7?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Sanja Matsuri",
    imageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Ueno Cherry Blossom Festival",
    imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Tokyo Christmas Market",
    imageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Meiji Jingu Hatsumode",
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Zojo-ji Setsubun",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop"
  },
  {
    enTitle: "Design Festa",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop"
  }
];

async function updateEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Events update...");

    for (const update of eventUpdates) {
      const res = await Event.updateOne(
        { "title.en": { $regex: new RegExp(update.enTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } },
        {
          $set: {
            images: [
              {
                url: update.imageUrl,
                credit: "Unsplash",
                isCover: true
              }
            ]
          }
        }
      );
      console.log(`Updated "${update.enTitle}":`, res.modifiedCount > 0 ? "Success" : "Already updated or not found");
    }

    console.log("All events updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Update error:", err);
    process.exit(1);
  }
}

updateEvents();
