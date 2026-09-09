import { useState } from "react";
import { API_BASE_URL } from "../config";

function AdminLogin({ onAdminLogin, onBack }) {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!adminKey.trim()) {
      setError("Please enter the admin access key.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/verify`,
        {
          method: "POST",
          headers: {
            "x-admin-key": adminKey.trim(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid admin key");
        return;
      }

      onAdminLogin(adminKey.trim());
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        "Unable to connect to VOOLER server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="brand-section">
          <div className="logo-icon">❄</div>

          <h1>VOOLER</h1>

          <p className="brand-description">
            Administration Portal
          </p>

          <div className="feature-list">
            <p>👨‍🌾 Register Farmers</p>
            <p>📦 Assign Storage Units</p>
            <p>📡 Map SIM800L Devices</p>
            <p>🔐 Protected Admin Access</p>
          </div>
        </div>

        <div className="login-section">

          <h2>Admin Login</h2>

          <p className="login-description">
            Enter the VOOLER administrator access key
          </p>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Admin Access Key</label>

              <input
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) =>
                  setAdminKey(e.target.value)
                }
              />
            </div>

            {error && (
              <div className="alert-danger">
                🔒 {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Checking..."
                : "Enter Admin Portal"}
            </button>

          </form>

          <button
            type="button"
            onClick={onBack}
            style={{
              marginTop: "15px",
              width: "100%",
            }}
          >
            ← Back to Farmer Login
          </button>

        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
