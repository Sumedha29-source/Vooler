import { useState } from "react";
import Login from "./components/Logintemp";
import Dashboard from "./components/Dashboardtemp";

function App() {
  const [farmer, setFarmer] = useState(null);
  const [language, setLanguage] = useState("en");

  const handleLogin = (farmerData) => {
    setFarmer(farmerData);

    if (farmerData.language) {
      setLanguage(farmerData.language);
    }
  };

  const handleLogout = () => {
    setFarmer(null);
  };

  return (
    <>
      {farmer ? (
        <Dashboard
          farmer={farmer}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        <Login
          onLogin={handleLogin}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </>
  );
}

export default App;