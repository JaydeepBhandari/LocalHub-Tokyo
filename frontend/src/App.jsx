import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import BusinessDetail from "./pages/BusinessDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetail from "./pages/EventDetail";
import EventsList from "./pages/EventsList";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell({ children }) {
  const { theme } = useTheme();
  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="global-texture"></div>
      <div className="global-watermark">街</div>
      {children}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                },
              }}
            />
            <AppShell>
              <Routes>
                <Route
                  path="/admin/login"
                  element={<AdminLogin />}
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <>
                      <Navbar />
                      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/events" element={<EventsList />} />
                          <Route path="/events/:idOrSlug" element={<EventDetail />} />
                          <Route
                            path="/business/:idOrSlug"
                            element={<BusinessDetail />}
                          />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  }
                />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;