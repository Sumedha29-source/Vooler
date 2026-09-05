import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [farmer, setFarmer] = useState(null);

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
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;