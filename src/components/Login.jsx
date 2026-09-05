import { useState } from "react";

function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name.trim() === "" || phone.trim() === "") {
      alert("Please enter your name and mobile number");
      return;
    }

    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    onLogin({
      name,
      phone,
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="brand-section">
          <div className="logo-icon">❄</div>

          <h1>VOOLER</h1>

          <p className="brand-description">
            Smart Cold Storage Monitoring System
          </p>

          <div className="feature-list">
            <p>🌡 Real-time Temperature Monitoring</p>
            <p>💧 Humidity Monitoring</p>
            <p>⚡ Power Failure Alerts</p>
            <p>🔔 Smart Storage Warnings</p>
          </div>
        </div>

        <div className="login-section">

          <h2>Farmer Login</h2>

          <p className="login-description">
            Login using your registered details
          </p>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Farmer Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Registered Mobile Number</label>

              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                maxLength="10"
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>

            <button className="login-button" type="submit">
              Login to Dashboard
            </button>

          </form>

          <div className="language-selector">
            <span>Language:</span>

            <button type="button">বাংলা</button>
            <button type="button">English</button>
            <button type="button">हिन्दी</button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;