import API_URL from "../api";
import { useEffect, useState } from "react";
import BusinessCard from "../components/BusinessCard";

const API = `${API_URL}/api/businesses`;

function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load businesses");
        }
        return response.json();
      })
      .then(setBusinesses)
      .catch(() => setError("Could not connect to the server."));
  }, []);

  const categories = [
    "All",
    ...new Set(businesses.map((business) => business.category))
  ];

  const filteredBusinesses = businesses.filter((business) => {
    const matchesName = business.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || business.category === category;

    return matchesName && matchesCategory;
  });

  return (
    <main className="container">
      <section className="hero">
        <p className="eyebrow">YOUR NEIGHBOURHOOD, CONNECTED</p>
        <h1>Discover your local community</h1>
        <p>
          Find nearby businesses and services in one convenient place.
        </p>
      </section>

      <section className="directory">
        <h2>Explore local businesses</h2>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by business name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="business-grid">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business._id} business={business} />
          ))}
        </div>

        {!error && filteredBusinesses.length === 0 && (
          <p className="empty-message">
            No businesses found. Add a listing from the Admin page.
          </p>
        )}
      </section>
    </main>
  );
}

export default Home;