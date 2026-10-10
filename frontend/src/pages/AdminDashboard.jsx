import { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, Store, Users, Settings, LogOut, 
  Plus, Search, Edit2, Trash2, X, Upload, Star, Activity 
} from "lucide-react";
import toast from "react-hot-toast";
import api, { API_URL } from "../api";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CATEGORIES = ["Food and Izakaya", "Cafes and Kissaten", "Ramen and Street Food", "Shrines and Temples", "Parks and Gardens", "Museums and Galleries", "Shopping and Markets", "Nightlife and Bars", "Arcades and Entertainment", "Sento and Onsen", "Books and Records", "Everyday Essentials"];

function SettingsTab() {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return data.data;
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newData) => {
      const { data } = await api.post("/settings", newData);
      return data;
    },
    onSuccess: () => {
      toast.success("Settings saved successfully!");
    },
    onError: () => toast.error("Failed to save settings")
  });

  const [form, setForm] = useState({ siteTitle: "LocalHub", allowSubmissions: true });

  // Update form when data loads
  useMemo(() => {
    if (settingsData) {
      setForm(prev => ({ ...prev, ...settingsData }));
    }
  }, [settingsData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings.mutate(form);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <>
      <h1>Settings</h1>
      <p className="admin-subtitle">Manage global platform configurations.</p>
      
      <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: 600, marginTop: 24, background: 'var(--color-surface)', padding: 24, borderRadius: 12, border: '1px solid var(--color-border)' }}>
        <div className="form-group">
          <label>Site Title</label>
          <input 
            className="form-input"
            name="siteTitle" 
            value={form.siteTitle || ""} 
            onChange={e => setForm({...form, siteTitle: e.target.value})} 
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <input 
            type="checkbox" 
            checked={form.allowSubmissions} 
            onChange={e => setForm({...form, allowSubmissions: e.target.checked})} 
          />
          Allow public business submissions
        </label>
        
        <button type="submit" className="btn-primary" style={{ marginTop: 24 }} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </>
  );
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const initialFormState = {
    name: "", category: "", description: "", location: "", area: "", city: "", 
    phone: "", website: "", priceLevel: 2, lat: "", lng: "", hoursText: "",
    tags: "", isFeatured: false, isVerified: false, status: "approved"
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: statsData } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const { data } = await api.get("/businesses/stats");
      return data.data;
    }
  });

  const { data: businessesData, isLoading } = useQuery({
    queryKey: ["adminBusinesses", searchTerm],
    queryFn: async () => {
      const { data } = await api.get(`/businesses?limit=100&search=${searchTerm}`);
      return data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const { data } = await api.post("/businesses", newData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Business added successfully!");
      queryClient.invalidateQueries(["adminBusinesses"]);
      queryClient.invalidateQueries(["adminStats"]);
      closeModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to add business")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }) => {
      const { data } = await api.put(`/businesses/${id}`, updateData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Business updated successfully!");
      queryClient.invalidateQueries(["adminBusinesses"]);
      closeModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to update business")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/businesses/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Business deleted");
      queryClient.invalidateQueries(["adminBusinesses"]);
      queryClient.invalidateQueries(["adminStats"]);
      setIsConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to delete business")
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openModalForCreate = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (business) => {
    setFormData({
      name: business.name,
      category: business.category,
      description: business.description,
      location: business.location,
      area: business.area || "",
      city: business.city || "",
      phone: business.phone,
      website: business.website || "",
      priceLevel: business.priceLevel || 2,
      lat: business.geo?.coordinates?.[1] || "",
      lng: business.geo?.coordinates?.[0] || "",
      hoursText: business.hoursText || "",
      tags: business.tags ? business.tags.join(", ") : "",
      isFeatured: business.isFeatured,
      isVerified: business.isVerified,
      status: business.status
    });
    setEditingId(business._id);
    setImageFile(null);
    setImagePreview(
      business.images && business.images.length > 0 
      ? (business.images[0].url.startsWith('http') ? business.images[0].url : `${API_URL}${business.images[0].url}`)
      : null
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setFormData(initialFormState);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
    }, 300);
  };

  const confirmDelete = (business) => {
    setItemToDelete(business);
    setIsConfirmOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });
    if (imageFile) {
      data.append("image", imageFile);
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, updateData: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const chartData = useMemo(() => {
    if (!statsData?.categories) return [];
    return statsData.categories.map(c => ({ name: c._id, count: c.count }));
  }, [statsData]);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar-logo">
          <span className="logo-dot"></span> LocalHub
        </Link>
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            className={`admin-nav-item ${activeTab === "businesses" ? "active" : ""}`}
            onClick={() => setActiveTab("businesses")}
          >
            <Store size={18} /> Businesses
          </button>
          <button 
            className={`admin-nav-item ${activeTab === "moderation" ? "active" : ""}`}
            onClick={() => setActiveTab("moderation")}
          >
            <Users size={18} /> Moderation
          </button>
          <button 
            className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} /> Settings
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user?.name?.charAt(0)}</div>
            <div>
              <div className="admin-user-name">{user?.name}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {activeTab === "dashboard" && (
          <>
            <h1>Dashboard Overview</h1>
            <p className="admin-subtitle">Welcome back, {user?.name}. Here's what's happening today.</p>

            {statsData && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-icon blue"><Store size={20} /></div>
                  <div className="stat-card-value">{statsData.total}</div>
                  <div className="stat-card-label">Total Spots</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon green"><Star size={20} /></div>
                  <div className="stat-card-value">{statsData.avgRating.toFixed(1)}</div>
                  <div className="stat-card-label">Platform Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon orange"><Activity size={20} /></div>
                  <div className="stat-card-value">{statsData.categories?.length || 0}</div>
                  <div className="stat-card-label">Categories Active</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon yellow"><LayoutDashboard size={20} /></div>
                  <div className="stat-card-value">{statsData.featured}</div>
                  <div className="stat-card-label">Featured Spots</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 48 }}>
              <div>
                <h3 style={{ marginBottom: 16 }}>Places by Category</h3>
                <div style={{ height: 300, background: 'var(--color-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--color-surface-alt)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-primary-hover)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 style={{ marginBottom: 16 }}>Recent Imports/Edits</h3>
                <div className="admin-table-wrap" style={{ border: '1px solid var(--color-border)', margin: 0 }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Place</th>
                        <th>Status</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px' }}>Loading...</td></tr>
                      ) : businessesData?.slice(0, 6).map(business => (
                        <tr key={business._id}>
                          <td style={{ fontWeight: 500 }}>{business.name}</td>
                          <td>
                            <span className={`card-status-badge ${business.status === 'approved' ? 'open' : 'closed'}`} style={{ position: 'static' }}>
                              {business.status}
                            </span>
                          </td>
                          <td>{business.source || 'manual'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "businesses" && (
          <>
            <h1>Manage Spots</h1>
            <p className="admin-subtitle">Add, edit, or moderate community locations.</p>

            <div className="admin-table-header">
              <div className="admin-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name, area, or category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={openModalForCreate}>
                <Plus size={18} /> Add Spot
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Location Details</th>
                    <th>Quality</th>
                    <th>Source</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading...</td></tr>
                  ) : businessesData?.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>No places found</td></tr>
                  ) : businessesData?.map(business => {
                    const hasGeo = business.geo && business.geo.coordinates[0] !== 0;
                    const hasCover = business.images && business.images.length > 0 && business.images[0].source !== 'placeholder';
                    
                    return (
                    <tr key={business._id}>
                      <td>
                        <div className="table-business-name">{business.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {business.category} {business.isFeatured && ' • FEATURED'}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {business.location}
                        </div>
                        <div style={{ fontSize: 11, color: hasGeo ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {hasGeo ? '📍 Geocoded' : '⚠️ Missing Coordinates'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!hasCover && <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>NO IMAGE</span>}
                          {business.hoursText === 'Hours not listed' && <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>NO HOURS</span>}
                          {hasCover && business.hoursText !== 'Hours not listed' && <span style={{ background: '#D1FAE5', color: '#047857', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>COMPLETE</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                           {business.source}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" onClick={() => openModalForEdit(business)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-danger" onClick={() => confirmDelete(business)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === "moderation" && (
          <>
            <h1>Moderation</h1>
            <p className="admin-subtitle">Review pending submissions and flagged content.</p>
            <div className="empty-state" style={{ marginTop: 40, border: '1px dashed var(--color-border)', borderRadius: 12 }}>
              <Users size={48} color="var(--color-text-muted)" />
              <h3 style={{ marginTop: 16 }}>No pending items</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>You're all caught up on moderation tasks.</p>
            </div>
          </>
        )}

        {activeTab === "settings" && (
          <SettingsTab />
        )}
      </main>

      {/* Editor Drawer / Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} style={{ alignItems: 'flex-start', padding: '40px 0', overflowY: 'auto' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 10, borderBottom: '1px solid var(--color-border)', margin: '-24px -24px 24px -24px', padding: '24px' }}>
              <h2>{editingId ? "Edit Place Details" : "Add New Place"}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>Basic Info</h3>
              <div className="modal-form-row">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="form-input" required>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows="3" />
              </div>

              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 24, marginBottom: 12 }}>Location & Geo</h3>
              <div className="modal-form-row">
                <div className="form-group">
                  <label>Street Address *</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>City / Ward</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
              
              <div className="modal-form-row">
                <div className="form-group">
                  <label>Nearest Station</label>
                  <input name="station" value={formData.station} onChange={handleInputChange} className="form-input" placeholder="e.g. Shibuya" />
                </div>
                <div className="form-group">
                  <label>Transit Line</label>
                  <input name="line" value={formData.line} onChange={handleInputChange} className="form-input" placeholder="e.g. JR Yamanote Line" />
                </div>
              </div>
              
              <div className="modal-form-row">
                <div className="form-group">
                  <label>Latitude (e.g. 21.1702)</label>
                  <input name="lat" value={formData.lat} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Longitude (e.g. 72.8311)</label>
                  <input name="lng" value={formData.lng} onChange={handleInputChange} className="form-input" />
                </div>
              </div>

              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 24, marginBottom: 12 }}>Contact & Hours</h3>
              <div className="modal-form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Hours Text</label>
                  <input name="hoursText" value={formData.hoursText} onChange={handleInputChange} className="form-input" placeholder="e.g. Mon-Fri: 9am - 5pm" />
                </div>
              </div>

              <div className="form-group">
                <label>Cover Photo (Local Upload)</label>
                <div 
                  style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" style={{ maxHeight: 200, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                      <Upload size={32} style={{ marginBottom: 8 }} />
                      <p>Click to upload a new cover photo</p>
                      <span style={{ fontSize: '0.75rem' }}>Overrides current image. JPG, PNG or WEBP.</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} />
                  Featured (Pin to top)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" name="isVerified" checked={formData.isVerified} onChange={handleInputChange} />
                  Verified Badge
                </label>
              </div>

              <div style={{ position: 'sticky', bottom: -24, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', margin: '24px -24px -24px -24px', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingId ? "Save Changes" : "Create Place")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="modal-close" onClick={() => setIsConfirmOpen(false)}><X size={20} /></button>
            </div>
            <p className="confirm-modal-text">
              Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? This action cannot be undone and will also remove all associated reviews.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn-secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={() => deleteMutation.mutate(itemToDelete?._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Business"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
