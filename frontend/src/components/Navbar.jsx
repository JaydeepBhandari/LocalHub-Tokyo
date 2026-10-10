
function Navbar({ page, setPage }) {
  return (
    <nav className="navbar">
      <h2>LocalHub</h2>

      <div className="nav-links">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          Home
        </button>

        <button
          className={page === "admin" ? "active" : ""}
          onClick={() => setPage("admin")}
        >
          Admin
        </button>
      </div>
    </nav>
  );
}

export default Navbar;