import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [farmer, setFarmer] = useState(null);

  // Website language
  const [language, setLanguage] = useState("en");

  const handleLogin = (farmerData) => {
    setFarmer(farmerData);
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