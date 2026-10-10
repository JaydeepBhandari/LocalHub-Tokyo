import API_URL from "../api";
import { useEffect, useState } from "react";

const API = `${API_URL}/api/businesses`;

const emptyForm = {
  name: "",
  category: "",
  description: "",
  location: "",
  phone: "",
  rating: "0",
  openingTime: "",
  closingTime: ""
};

function Admin() {
  const [businesses, setBusinesses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBusinesses() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Could not load businesses");
      }

      const data = await response.json();
      setBusinesses(data);
      setError("");
    } catch {
      setError("Could not connect to the server.");
    }
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files[0];
    setImageFile(file || null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const data = new FormData();

    data.append("name", form.name);
    data.append("category", form.category);
    data.append("description", form.description);

    // The backend model and routes use "address".
    data.append("address", form.location);
    data.append("phone", form.phone);
    data.append("rating", form.rating);
    data.append("openingTime", form.openingTime);
    data.append("closingTime", form.closingTime);

    if (imageFile) {
      data.append("image", imageFile);
    }

    const url = editingId ? `${API}/${editingId}` : API;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Operation failed");
      }

      setMessage(
        editingId ? "Business updated." : "Business added."
      );

      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);

      // Clear the file input.
      event.target.reset();

      await loadBusinesses();
    } catch (err) {
      setError(err.message || "Could not save business.");
    }
  }

  function handleEdit(business) {
    setForm({
      name: business.name || "",
      category: business.category || "",
      description: business.description || "",
      location: business.location || business.address || "",
      phone: business.phone || "",
      rating: String(business.rating ?? 0),
      openingTime: business.openingTime || "",
      closingTime: business.closingTime || ""
    });

    setImageFile(null);
    setEditingId(business._id);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this business?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Delete failed");
      }

      if (editingId === id) {
        cancelEdit();
      }

      setMessage("Business deleted.");
      await loadBusinesses();
    } catch (err) {
      setError(err.message || "Could not delete business.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setMessage("");
    setError("");
  }

  return (
    <main className="container admin-page">
      <h1>Admin Dashboard</h1>
      <p>Manage local business listings.</p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Business" : "Add Business"}</h2>

        <label>Business Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Shopping">Shopping</option>
          <option value="Services">Services</option>
        </select>

        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows="3"
        />

        <label>Location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          required
        />

        <label>Phone</label>
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <label>Business Rating (out of 5)</label>
        <input
          type="number"
          name="rating"
          min="0"
          max="5"
          step="0.1"
          value={form.rating}
          onChange={handleChange}
          required
        />

        <label>Opening Time</label>
        <input
          type="time"
          name="openingTime"
          value={form.openingTime}
          onChange={handleChange}
          required
        />

        <label>Closing Time</label>
        <input
          type="time"
          name="closingTime"
          value={form.closingTime}
          onChange={handleChange}
          required
        />

        <label>Business Image</label>
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageChange}
        />

        {editingId && (
          <p>Select a new image only if you want to replace the existing one.</p>
        )}

        <button type="submit" className="primary-button">
          {editingId ? "Update Business" : "Add Business"}
        </button>

        {editingId && (
          <button type="button" onClick={cancelEdit}>
            Cancel Edit
          </button>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <section className="manage-list">
        <h2>Existing Businesses ({businesses.length})</h2>

        {businesses.map((business) => (
          <div className="manage-row" key={business._id}>
            <div>
              <strong>{business.name}</strong>
              <p>
                {business.category} ·{" "}
                {business.location || business.address}
              </p>
              <p>⭐ {business.rating ?? 0}/5</p>
              <p>
                {business.openingTime || "No opening time"} –{" "}
                {business.closingTime || "No closing time"}
              </p>
            </div>

            <div className="row-actions">
              <button
                type="button"
                onClick={() => handleEdit(business)}
              >
                Edit
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(business._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Admin;