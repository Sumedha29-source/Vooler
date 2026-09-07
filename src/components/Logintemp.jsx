import { useState } from "react";
import { translations } from "../translations";
import { API_BASE_URL } from "../config";

function Login({
  onLogin,
  language,
  setLanguage,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] =
    useState(false);

  const t = translations[language];

  // ================================
  // LOGIN
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      name.trim() === "" ||
      phone.trim() === ""
    ) {
      alert(
        language === "bn"
          ? "আপনার নাম এবং মোবাইল নম্বর লিখুন"
          : language === "hi"
          ? "अपना नाम और मोबाइल नंबर दर्ज करें"
          : language === "as"
          ? "আপোনাৰ নাম আৰু মোবাইল নম্বৰ লিখক"
          : "Please enter your name and mobile number"
      );

      return;
    }

    if (phone.length !== 10) {
      alert(
        language === "bn"
          ? "সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন"
          : language === "hi"
          ? "सही 10 अंकों का मोबाइल नंबर दर्ज करें"
          : language === "as"
          ? "সঠিক ১০ সংখ্যাৰ মোবাইল নম্বৰ লিখক"
          : "Please enter a valid 10-digit mobile number"
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Login failed"
        );

        return;
      }

      onLogin(
        data.farmer
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      alert(
        language === "bn"
          ? "VOOLER সার্ভারের সাথে সংযোগ করা যাচ্ছে না।"
          : language === "hi"
          ? "VOOLER सर्वर से कनेक्ट नहीं हो पा रहा है।"
          : language === "as"
          ? "VOOLER ছাৰ্ভাৰৰ সৈতে সংযোগ কৰিব পৰা নাই।"
          : "Unable to connect to VOOLER server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* ================================
            BRAND SECTION
        ================================ */}

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

        {/* ================================
            LOGIN SECTION
        ================================ */}

        <div className="login-section">

          <h2>
            {t.farmerLogin}
          </h2>

          <p className="login-description">
            {t.loginDescription}
          </p>

          <form
            onSubmit={handleSubmit}
          >

            {/* FARMER NAME */}

            <div className="form-group">

              <label>
                {t.farmerName}
              </label>

              <input
                type="text"
                placeholder={t.enterName}
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
              />

            </div>

            {/* MOBILE NUMBER */}

            <div className="form-group">

              <label>
                {t.registeredMobile}
              </label>

              <input
                type="tel"
                placeholder={
                  t.enterMobile
                }
                value={phone}
                maxLength="10"
                inputMode="numeric"
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />

            </div>

            {/* LOGIN BUTTON */}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >

              {loading
                ? language === "bn"
                  ? "লগইন হচ্ছে..."
                  : language === "hi"
                  ? "लॉगिन हो रहा है..."
                  : language === "as"
                  ? "লগইন হৈ আছে..."
                  : "Logging in..."
                : t.loginDashboard}

            </button>

          </form>

          {/* ================================
              LANGUAGE SELECTOR
          ================================ */}

          <div className="language-selector">

            <span>
              {t.language}:
            </span>

            <button
              type="button"
              onClick={() =>
                setLanguage("bn")
              }
            >
              বাংলা
            </button>

            <button
              type="button"
              onClick={() =>
                setLanguage("en")
              }
            >
              English
            </button>

            <button
              type="button"
              onClick={() =>
                setLanguage("hi")
              }
            >
              हिन्दी
            </button>

            <button
              type="button"
              onClick={() =>
                setLanguage("as")
              }
            >
              অসমীয়া
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;