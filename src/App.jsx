import { useState } from "react";

import Login from "./components/Logintemp";
import Dashboard from "./components/Dashboardtemp";

import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  // ========================================
  // FARMER
  // ========================================

  const [farmer, setFarmer] = useState(null);

  // Website language
  const [language, setLanguage] = useState("en");

  // ========================================
  // ADMIN
  // ========================================

  // farmer
  // admin-login
  // admin-dashboard
  const [page, setPage] = useState("farmer");

  // Admin key is stored only after
  // successful verification
  const [adminKey, setAdminKey] = useState(null);

  // ========================================
  // FARMER LOGIN
  // ========================================

  const handleLogin = (farmerData) => {
    setFarmer(farmerData);

    // Automatically use farmer's preferred language
    if (farmerData.language) {
      setLanguage(farmerData.language);
    }
  };

  // ========================================
  // FARMER LOGOUT
  // ========================================

  const handleLogout = () => {
    setFarmer(null);
    setPage("farmer");
  };

  // ========================================
  // OPEN ADMIN LOGIN
  // ========================================

  const openAdminPortal = () => {
    setPage("admin-login");
  };

  // ========================================
  // ADMIN LOGIN SUCCESS
  // ========================================

  const handleAdminLogin = (key) => {
    setAdminKey(key);
    setPage("admin-dashboard");
  };

  // ========================================
  // ADMIN LOGOUT
  // ========================================

  const handleAdminLogout = () => {
    setAdminKey(null);
    setPage("farmer");
  };

  // ========================================
  // BACK TO FARMER LOGIN
  // ========================================

  const backToFarmerLogin = () => {
    setAdminKey(null);
    setPage("farmer");
  };

  // ========================================
  // FARMER DASHBOARD
  // ========================================

  if (farmer) {
    return (
      <Dashboard
        farmer={farmer}
        onLogout={handleLogout}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ========================================
  // ADMIN LOGIN PAGE
  // ========================================

  if (page === "admin-login") {
    return (
      <AdminLogin
        onAdminLogin={handleAdminLogin}
        onBack={backToFarmerLogin}
      />
    );
  }

  // ========================================
  // ADMIN DASHBOARD
  // ========================================

  if (
    page === "admin-dashboard" &&
    adminKey
  ) {
    return (
      <AdminDashboard
        adminKey={adminKey}
        onAdminLogout={handleAdminLogout}
      />
    );
  }

  // ========================================
  // NORMAL FARMER LOGIN PAGE
  // ========================================

  return (
    <>
      <Login
        onLogin={handleLogin}
        language={language}
        setLanguage={setLanguage}
      />

      {/* ADMIN PORTAL BUTTON */}

      <button
        type="button"
        onClick={openAdminPortal}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          padding: "10px 18px",
          borderRadius: "8px",
          border: "1px solid #dfe7e3",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        🔐 Admin Portal
      </button>
    </>
  );
}

export default App;