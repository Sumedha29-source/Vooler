import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function AdminDashboard({
  adminKey,
  onAdminLogout,
}) {
  const [farmers, setFarmers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    simNumber: "",
    storageId: "",
    language: "en",
    deviceKey: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFarmers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/farmers`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load farmers"
        );
        return;
      }

      setFarmers(data.farmers || []);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server."
      );
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-admin-key":
              adminKey,
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Registration failed"
        );

        return;
      }

      setMessage(
        "Farmer registered successfully."
      );

      setForm({
        name: "",
        phone: "",
        simNumber: "",
        storageId: "",
        language: "en",
        deviceKey: "",
      });

      loadFarmers();

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to server."
      );
    }
  };

  return (
    <div className="dashboard-page">

      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          ❄ VOOLER ADMIN
        </div>

        <button
          onClick={onAdminLogout}
        >
          Logout
        </button>

      </nav>

      <main className="dashboard-main">

        <section className="dashboard-header">

          <div>
            <h1>
              Admin Portal
            </h1>

            <p>
              Register farmers and assign
              VOOLER cold-storage units.
            </p>
          </div>

        </section>

        <section className="chart-card">

          <h2>
            👨‍🌾 Register New Farmer
          </h2>

          <form
            onSubmit={handleSubmit}
          >

            <div className="form-group">
              <label>
                Farmer Name
              </label>

              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter farmer name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Farmer Mobile Number
              </label>

              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label>
                SIM800L Number
              </label>

              <input
                name="simNumber"
                type="tel"
                value={form.simNumber}
                onChange={handleChange}
                placeholder="SIM number inside device"
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Storage ID
              </label>

              <input
                name="storageId"
                type="text"
                value={form.storageId}
                onChange={handleChange}
                placeholder="Example: CS002"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Preferred Language
              </label>

              <select
                name="language"
                value={form.language}
                onChange={handleChange}
              >
                <option value="en">
                  English
                </option>

                <option value="bn">
                  বাংলা
                </option>

                <option value="hi">
                  हिन्दी
                </option>

                <option value="as">
                  অসমীয়া
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Device Key
              </label>

              <input
                name="deviceKey"
                type="text"
                value={form.deviceKey}
                onChange={handleChange}
                placeholder="Example: vooler-device-002"
                required
              />
            </div>

            {message && (
              <div className="alert-safe">
                ✅ {message}
              </div>
            )}

            {error && (
              <div className="alert-danger">
                ❌ {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
            >
              Register Farmer
            </button>

          </form>

        </section>

        <section
          className="history-section"
          style={{
            marginTop: "25px",
          }}
        >

          <div className="section-heading">

            <h2>
              📋 Registered Farmers
            </h2>

            <span>
              {farmers.length} farmers
            </span>

          </div>

          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Storage ID</th>
                  <th>SIM800L</th>
                  <th>Language</th>
                </tr>
              </thead>

              <tbody>

                {farmers.map(
                  (farmer) => (

                    <tr key={farmer._id}>

                      <td>
                        {farmer.name}
                      </td>

                      <td>
                        {farmer.phone}
                      </td>

                      <td>
                        {farmer.storageId}
                      </td>

                      <td>
                        {farmer.simNumber}
                      </td>

                      <td>
                        {farmer.language}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;