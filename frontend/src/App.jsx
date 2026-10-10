
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  return (
    <>
      <Navbar page={page} setPage={setPage} />

      {page === "home" ? <Home /> : <Admin />}

      <footer className="footer">
        <p>© 2026 LocalHub | Local Community Hub & Directory</p>
      </footer>
    </>
  );
}

export default App;