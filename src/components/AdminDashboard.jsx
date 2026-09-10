import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function AdminDashboard({
  adminKey,
  onLogout,
}) {
  // =====================================================
  // FORM STATE
  // =====================================================

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [simNumber, setSimNumber] =
    useState("");

  const [language, setLanguage] =
    useState("en");

  const [farmers, setFarmers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =====================================================
  // FETCH FARMERS
  // =====================================================

  const fetchFarmers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/farmers`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch farmers"
        );
      }

      setFarmers(
        data.farmers || []
      );
    } catch (err) {
      console.error(
        "Fetch farmers error:",
        err
      );

      setError(
        err.message
      );
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  // =====================================================
  // REGISTER FARMER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !name.trim() ||
      !phone.trim() ||
      !simNumber.trim()
    ) {
      setError(
        "Please fill in all required fields."
      );

      return;
    }

    try {
      setLoading(true);

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

          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            simNumber:
              simNumber.trim(),
            language,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to register farmer"
        );

        return;
      }

      setMessage(
        "Farmer registered successfully."
      );

      // Clear form
      setName("");
      setPhone("");
      setSimNumber("");
      setLanguage("en");

      // Refresh table
      await fetchFarmers();
    } catch (err) {
      console.error(
        "Register farmer error:",
        err
      );

      setError(
        "Unable to contact VOOLER server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =====================================
          NAVBAR
      ===================================== */}

      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          ❄ VOOLER Admin
        </div>

        <div className="dashboard-nav-right">

          <button
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      <main className="dashboard-main">

        {/* =====================================
            PAGE HEADER
        ===================================== */}

        <section className="dashboard-header">

          <div>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Register farmers and
              manage VOOLER access.
            </p>

          </div>

        </section>

        {/* =====================================
            SINGLE DEVICE INFORMATION
        ===================================== */}

        <section className="storage-status-card safe">

          <p className="status-title">
            ASSIGNED VOOLER DEVICE
          </p>

          <h2>
            📦 CS001
          </h2>

          <p>
            All farmers are connected
            to the same prototype
            storage unit.
          </p>

          <p>
            Device Key:{" "}
            <strong>
              vooler-device-001
            </strong>
          </p>

        </section>

        {/* =====================================
            REGISTER FARMER
        ===================================== */}

        <section className="history-section">

          <div className="section-heading">

            <h2>
              👨‍🌾 Register Farmer
            </h2>

            <span>
              New farmer
            </span>

          </div>

          <form
            onSubmit={
              handleRegister
            }
          >

            {/* NAME */}

            <div className="form-group">

              <label>
                Farmer Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Enter farmer name"
              />

            </div>

            {/* PHONE */}

            <div className="form-group">

              <label>
                Farmer Mobile Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                maxLength={10}
                placeholder="10-digit mobile number"
              />

            </div>

            {/* SIM NUMBER */}

            <div className="form-group">

              <label>
                SIM800L Number
              </label>

              <input
                type="text"
                value={simNumber}
                onChange={(e) =>
                  setSimNumber(
                    e.target.value
                  )
                }
                maxLength={10}
                placeholder="10-digit SIM number"
              />

            </div>

            {/* LANGUAGE */}

            <div className="form-group">

              <label>
                Preferred Language
              </label>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value
                  )
                }
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

            {/* INFO */}

            <div className="alert-safe">

              📦 Storage ID{" "}
              <strong>
                CS001
              </strong>{" "}
              and device key are
              assigned automatically.

            </div>

            {/* ERROR */}

            {error && (

              <div className="alert-danger">

                ❌ {error}

              </div>

            )}

            {/* SUCCESS */}

            {message && (

              <div className="alert-safe">

                ✅ {message}

              </div>

            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
              style={{
                marginTop:
                  "18px",
              }}
            >

              {loading
                ? "Registering..."
                : "Register Farmer"}

            </button>

          </form>

        </section>

        {/* =====================================
            REGISTERED FARMERS
        ===================================== */}

        <section className="history-section">

          <div className="section-heading">

            <h2>
              👥 Registered Farmers
            </h2>

            <span>
              {farmers.length} total
            </span>

          </div>

          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Mobile
                  </th>

                  <th>
                    SIM Number
                  </th>

                  <th>
                    Storage
                  </th>

                  <th>
                    Language
                  </th>

                </tr>

              </thead>

              <tbody>

                {farmers.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      style={{
                        textAlign:
                          "center",
                      }}
                    >
                      No farmers registered.
                    </td>

                  </tr>

                ) : (

                  farmers.map(
                    (farmer) => (

                      <tr
                        key={
                          farmer._id
                        }
                      >

                        <td>
                          {farmer.name}
                        </td>

                        <td>
                          {farmer.phone}
                        </td>

                        <td>
                          {
                            farmer.simNumber
                          }
                        </td>

                        <td>
                          {
                            farmer.storageId
                          }
                        </td>

                        <td>
                          {
                            farmer.language
                          }
                        </td>

                      </tr>

                    )
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