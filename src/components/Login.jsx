import { useState } from "react";
import { translations } from "../translations";

function Login({
  onLogin,
  language,
  setLanguage,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const t = translations[language];

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (name.trim() === "" || phone.trim() === "") {
    alert("Please enter your name and mobile number");
    return;
  }

  if (phone.length !== 10) {
    alert("Please enter a valid 10-digit mobile number");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    onLogin(data.farmer);
  } catch (error) {
    console.error("Login error:", error);

    alert(
      "Unable to connect to VOOLER server."
    );
  }
};

  return (
    <div className="login-page">

      <div className="login-container">

        {/* LEFT SIDE */}

        <div className="brand-section">

          <div className="logo-icon">
            ❄
          </div>

          <h1>
            VOOLER
          </h1>

          <p className="brand-description">
            {t.brandDescription}
          </p>

          <div className="feature-list">

            <p>
              🌡 {t.tempMonitoring}
            </p>

            <p>
              💧 {t.humidityMonitoring}
            </p>

            <p>
              ⚡ {t.powerAlerts}
            </p>

            <p>
              🔔 {t.smartWarnings}
            </p>

          </div>

        </div>


        {/* LOGIN SIDE */}

        <div className="login-section">

          <h2>
            {t.farmerLogin}
          </h2>

          <p className="login-description">
            {t.loginDescription}
          </p>


          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                {t.farmerName}
              </label>

              <input
                type="text"
                placeholder={t.enterName}
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                {t.registeredMobile}
              </label>

              <input
                type="tel"
                placeholder={t.enterMobile}
                value={phone}
                maxLength="10"
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(/\D/g, "")
                  )
                }
              />

            </div>


            <button
              className="login-button"
              type="submit"
            >
              {t.loginDashboard}
            </button>

          </form>


          <div className="language-selector">

            <span>
              {t.language}:
            </span>

            <button
              type="button"
              onClick={() => setLanguage("bn")}
            >
              বাংলা
            </button>

            <button
              type="button"
              onClick={() => setLanguage("en")}
            >
              English
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;