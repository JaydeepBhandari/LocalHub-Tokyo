const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: __dirname + "/.env" });

const User = require("./models/User");
const Event = require("./models/Event");
const Business = require("./models/Business");
const Setting = require("./models/Setting");

async function seedAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/localhub-tokyo");
    console.log("Connected to MongoDB");

    // Clear old events
    await Event.deleteMany({});
    
    // Create admin user
    let admin = await User.findOne({ email: "admin@localhub.com" });
    if (!admin) {
      admin = await User.create({
        name: "Admin",
        email: "admin@localhub.com",
        password: "admin123",
        role: "admin",
      });
      console.log("Created admin user: admin@localhub.com / admin123");
    } else {
      console.log("Admin user already exists.");
    }

    // Seed Settings
    await Setting.deleteMany({});
    await Setting.create({
      key: "global",
      value: {
        siteTitle: "LocalHub Tokyo",
        allowSubmissions: true,
        homepageEvents: {
          show: true,
          titleEn: "Happening in Tokyo",
          titleJa: "東京のイベント",
          subtitleEn: "Discover upcoming festivals, markets, and exhibitions.",
          subtitleJa: "お祭り、マーケット、展示会などのイベント情報をチェック",
          count: 3
        }
      }
    });
    console.log("Seeded settings.");

    // Seed Events
    const events = [
      {
        title: { en: "Tori-no-ichi (Rooster Fair)", ja: "酉の市" },
        category: "matsuri",
        description: "An annual open-air market held on the days of the Rooster in November to wish for good luck and business prosperity. Vibrant stalls sell elaborately decorated kumade (bamboo rakes).",
        startDate: new Date("2026-11-04T10:00:00Z"),
        endDate: new Date("2026-11-04T23:00:00Z"),
        venueName: "Otori Shrine",
        ward: "Taito",
        geo: { type: "Point", coordinates: [139.7916, 35.7222] },
        ticketInfo: "Free",
        officialUrl: "https://otorisama.or.jp/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Tori_no_ichi_%284561848529%29.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Sumida River Fireworks Festival", ja: "隅田川花火大会" },
        category: "matsuri",
        description: "One of Tokyo's oldest and most famous fireworks displays, held along the Sumida River. Thousands gather in yukata to watch the spectacular light show.",
        startDate: new Date("2027-07-24T19:00:00Z"),
        endDate: new Date("2027-07-24T20:30:00Z"),
        venueName: "Sumida River (Asakusa/Mukojima)",
        ward: "Sumida",
        geo: { type: "Point", coordinates: [139.8037, 35.7132] },
        ticketInfo: "Free",
        officialUrl: "https://www.sumidagawa-hanabi.com/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Sumidagawa_Fireworks_Festival_%289417855325%29.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Sanja Matsuri", ja: "三社祭" },
        category: "matsuri",
        description: "One of the three great Shinto festivals in Tokyo. Features over a hundred mikoshi (portable shrines) paraded through the streets of Asakusa.",
        startDate: new Date("2027-05-14T10:00:00Z"), // Approx 3rd weekend of May
        endDate: new Date("2027-05-16T18:00:00Z"),
        venueName: "Senso-ji Temple / Asakusa Shrine",
        ward: "Taito",
        geo: { type: "Point", coordinates: [139.7967, 35.7147] },
        ticketInfo: "Free",
        officialUrl: "https://www.asakusajinja.jp/sanjamatsuri/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Sanja_Matsuri%2C_Asakusa%2C_Tokyo.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Ueno Cherry Blossom Festival", ja: "上野桜まつり" },
        category: "seasonal",
        description: "Celebrate the arrival of spring under a canopy of blooming cherry blossoms in Ueno Park. Featuring food stalls, lanterns, and nighttime illuminations.",
        startDate: new Date("2027-03-20T09:00:00Z"),
        endDate: new Date("2027-04-05T21:00:00Z"),
        isDatesTBA: true,
        venueName: "Ueno Park",
        ward: "Taito",
        geo: { type: "Point", coordinates: [139.7741, 35.7140] },
        ticketInfo: "Free",
        officialUrl: "https://ueno.or.jp/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Cherry_blossoms_at_Ueno_Park_%28March_2014%29.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Tokyo Christmas Market", ja: "東京クリスマスマーケット" },
        category: "seasonal",
        description: "Experience a traditional European-style Christmas market in Tokyo. Enjoy hot wine, German food, and festive decorations around a large Christmas pyramid.",
        startDate: new Date("2026-11-23T11:00:00Z"),
        endDate: new Date("2026-12-25T21:30:00Z"),
        venueName: "Meiji Jingu Gaien",
        ward: "Shinjuku",
        geo: { type: "Point", coordinates: [139.7183, 35.6749] },
        ticketInfo: "Varies",
        officialUrl: "https://tokyochristmas.net/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/3/36/Roppongi_Hills_Christmas_Market_2015_%2823055490073%29.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Meiji Jingu Hatsumode", ja: "明治神宮初詣" },
        category: "seasonal",
        description: "Join millions of visitors making their first shrine visit of the year (Hatsumode) at Tokyo's grandest Shinto shrine.",
        startDate: new Date("2027-01-01T00:00:00Z"),
        endDate: new Date("2027-01-03T18:00:00Z"),
        venueName: "Meiji Jingu",
        ward: "Shibuya",
        geo: { type: "Point", coordinates: [139.6993, 35.6763] },
        ticketInfo: "Free",
        officialUrl: "https://www.meijijingu.or.jp/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/9/93/Meiji_jingu_crowd.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Zojo-ji Setsubun", ja: "増上寺節分追儺式" },
        category: "seasonal",
        description: "Bean-throwing ceremony to drive away evil spirits and welcome good fortune. Featuring celebrities and sumo wrestlers throwing beans to the crowd.",
        startDate: new Date("2027-02-03T12:00:00Z"),
        endDate: new Date("2027-02-03T14:00:00Z"),
        venueName: "Zojo-ji Temple",
        ward: "Minato",
        geo: { type: "Point", coordinates: [139.7483, 35.6573] },
        ticketInfo: "Free",
        officialUrl: "https://www.zojoji.or.jp/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/0/07/Setsubun_at_Zojoji_2015.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      },
      {
        title: { en: "Design Festa", ja: "デザインフェスタ" },
        category: "art",
        description: "Asia's largest international art event featuring thousands of independent artists, designers, and craftspeople showcasing their original work.",
        startDate: new Date("2026-11-14T11:00:00Z"),
        endDate: new Date("2026-11-15T19:00:00Z"),
        venueName: "Tokyo Big Sight",
        ward: "Koto",
        geo: { type: "Point", coordinates: [139.7932, 35.6298] },
        ticketInfo: "1000 JPY",
        officialUrl: "https://designfesta.com/",
        images: [{ url: "https://upload.wikimedia.org/wikipedia/commons/2/23/Tokyo_Big_Sight_20131102.jpg", credit: "Wikimedia Commons", isCover: true }],
        status: "published"
      }
    ];

    for (let ev of events) {
      await Event.create(ev);
    }
    console.log("Seeded " + events.length + " events.");

    // Run the spot importer
    console.log("Running spot import...");
    require("./scripts/import_tokyo")();
    // Wait, import_tokyo is async and calls process.exit(0). I should probably rewrite import_tokyo to export a function instead of calling itself.

  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedAll();
