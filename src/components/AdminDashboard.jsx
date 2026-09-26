import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://vooler.onrender.com";


function AdminDashboard({
  adminKey,
  onAdminLogout,
}) {

  // =====================================================
  // FARMER LIST
  // =====================================================

  const [farmers, setFarmers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // SELECTED FARMER
  // =====================================================

  const [
    selectedFarmer,
    setSelectedFarmer,
  ] = useState(null);

  const [
    activeFarmerTab,
    setActiveFarmerTab,
  ] = useState("details");


  // =====================================================
  // DEVICE CONDITION
  // =====================================================

  const [
    deviceData,
    setDeviceData,
  ] = useState(null);

  const [
    deviceLoading,
    setDeviceLoading,
  ] = useState(false);

  const [
    deviceError,
    setDeviceError,
  ] = useState("");


  // =====================================================
  // REGISTRATION PAGE
  // =====================================================

  const [
    showRegistration,
    setShowRegistration,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    simNumber,
    setSimNumber,
  ] = useState("");

  const [
    language,
    setLanguage,
  ] = useState("en");

  const [
    devicePin,
    setDevicePin,
  ] = useState("");

  const [
    registerLoading,
    setRegisterLoading,
  ] = useState(false);

  const [
    registerMessage,
    setRegisterMessage,
  ] = useState("");

  const [
    registerError,
    setRegisterError,
  ] = useState("");


  // =====================================================
  // FETCH FARMERS
  // =====================================================

  const fetchFarmers =
    async () => {

      try {

        setLoading(true);
        setError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/farmers`,
            {
              headers: {
                "x-admin-key":
                  adminKey,
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

      }
      catch (err) {

        console.error(
          "Fetch farmers error:",
          err
        );


        setError(
          err.message
        );

      }
      finally {

        setLoading(false);

      }

    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchFarmers();

  }, [adminKey]);


  // =====================================================
  // FETCH DEVICE CONDITION
  // =====================================================

  const fetchDeviceCondition =
    async (storageId) => {

      try {

        setDeviceLoading(true);
        setDeviceError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/dashboard/${storageId}`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to load device condition"
          );

        }


        setDeviceData(data);

      }
      catch (err) {

        console.error(
          "Device condition error:",
          err
        );


        setDeviceError(
          err.message
        );


        setDeviceData(null);

      }
      finally {

        setDeviceLoading(false);

      }

    };


  // =====================================================
  // FARMER CLICK
  // =====================================================

  const handleFarmerClick =
    (farmer) => {

      setSelectedFarmer(
        farmer
      );

      setActiveFarmerTab(
        "details"
      );

      setDeviceData(null);

      setDeviceError("");


      fetchDeviceCondition(
        farmer.storageId
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  // =====================================================
  // BACK TO FARMER LIST
  // =====================================================

  const handleBackToFarmers =
    () => {

      setSelectedFarmer(null);

      setActiveFarmerTab(
        "details"
      );

      setDeviceData(null);

      setDeviceError("");


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  // =====================================================
  // OPEN REGISTRATION
  // =====================================================

  const handleRegisterFarmer =
    () => {

      setShowRegistration(
        true
      );

      setRegisterMessage("");
      setRegisterError("");


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  // =====================================================
  // CLOSE REGISTRATION
  // =====================================================

  const handleBackFromRegistration =
    () => {

      setShowRegistration(
        false
      );

      setRegisterMessage("");
      setRegisterError("");


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  // =====================================================
  // REGISTER FARMER
  // =====================================================

  const handleRegistrationSubmit =
    async (e) => {

      e.preventDefault();


      setRegisterMessage("");
      setRegisterError("");


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !name.trim() ||
        !phone.trim() ||
        !simNumber.trim() ||
        !devicePin.trim()
      ) {

        setRegisterError(
          "Please fill in all required fields."
        );

        return;

      }


      // =================================================
      // PHONE VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          phone.trim()
        )
      ) {

        setRegisterError(
          "Farmer mobile number must contain exactly 10 digits."
        );

        return;

      }


      // =================================================
      // SIM NUMBER VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          simNumber.trim()
        )
      ) {

        setRegisterError(
          "SIM800L number must contain exactly 10 digits."
        );

        return;

      }


      // =================================================
      // PIN VALIDATION
      // =================================================

      if (
        !/^\d{4}$/.test(
          devicePin.trim()
        )
      ) {

        setRegisterError(
          "Device PIN must contain exactly 4 digits."
        );

        return;

      }


      // =================================================
      // SEND TO BACKEND
      // =================================================

      try {

        setRegisterLoading(
          true
        );


        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/register`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-admin-key":
                  adminKey,
              },

              body:
                JSON.stringify({
                  name:
                    name.trim(),

                  phone:
                    phone.trim(),

                  simNumber:
                    simNumber.trim(),

                  language,

                  devicePin:
                    devicePin.trim(),
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          setRegisterError(
            data.message ||
            "Unable to register farmer"
          );

          return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        setRegisterMessage(
          "Farmer registered successfully."
        );


        // Clear form

        setName("");

        setPhone("");

        setSimNumber("");

        setLanguage("en");

        setDevicePin("");


        // Refresh farmer list

        await fetchFarmers();

      }
      catch (err) {

        console.error(
          "Register farmer error:",
          err
        );


        setRegisterError(
          "Unable to contact VOOLER server."
        );

      }
      finally {

        setRegisterLoading(
          false
        );

      }

    };


  // =====================================================
  // LANGUAGE DISPLAY
  // =====================================================

  const getLanguageName =
    (value) => {

      switch (value) {

        case "bn":
          return "বাংলা";

        case "hi":
          return "हिन्दी";

        case "as":
          return "অসমীয়া";

        default:
          return "English";

      }

    };


  // =====================================================
  // LOCATION DISPLAY
  // =====================================================

  const getLocation =
    (farmer) => {

      if (
        farmer.location
          ?.placeName
      ) {

        return farmer
          .location
          .placeName;

      }


      if (
        farmer.location
          ?.latitude != null &&
        farmer.location
          ?.longitude != null
      ) {

        return (
          `${farmer.location.latitude}, ` +
          `${farmer.location.longitude}`
        );

      }


      return "Not configured";

    };


  // =====================================================
  // SHARED STYLES
  // =====================================================

  const detailCardStyle = {
    background:
      "#ffffff",

    border:
      "1px solid #e3ece9",

    borderRadius:
      "14px",

    padding:
      "18px",
  };


  const labelStyle = {
    margin:
      "0 0 7px",

    fontSize:
      "12px",

    fontWeight:
      "700",

    letterSpacing:
      "0.4px",

    opacity:
      0.58,

    textTransform:
      "uppercase",
  };


  const valueStyle = {
    margin:
      0,

    fontSize:
      "17px",

    fontWeight:
      "700",
  };


  // =====================================================
  // REGISTRATION PAGE
  // =====================================================

  if (showRegistration) {

    return (

      <div className="dashboard-page">

        <nav className="dashboard-navbar">

          <div className="dashboard-logo">
            ❄ VOOLER Admin
          </div>


          <div className="dashboard-nav-right">

            <button
              type="button"
              onClick={
                onAdminLogout
              }
            >
              Logout
            </button>

          </div>

        </nav>


        <main className="dashboard-main">

          <button
            type="button"
            onClick={
              handleBackFromRegistration
            }
            style={{
              border:
                "none",

              background:
                "transparent",

              cursor:
                "pointer",

              padding:
                "4px 0",

              marginBottom:
                "16px",

              fontWeight:
                700,

              color:
                "#087f72",
            }}
          >
            ← Back to Farmers
          </button>


          <section className="dashboard-header">

            <div>

              <h1>
                Register New Farmer
              </h1>

              <p>
                Add a farmer and assign access to the VOOLER prototype storage.
              </p>

            </div>

          </section>


          <section
            className="history-section"
            style={{
              maxWidth:
                "760px",
            }}
          >

            <div className="section-heading">

              <div>

                <h2>
                  👨‍🌾 Farmer Registration
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",

                    opacity:
                      0.65,

                    fontSize:
                      "14px",
                  }}
                >
                  Storage CS001 is assigned automatically for the current prototype.
                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleRegistrationSubmit
              }
              style={{
                marginTop:
                  "20px",
              }}
            >

              {/* FARMER NAME */}

              <div className="form-group">

                <label>
                  Farmer Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={
                    (e) =>
                      setName(
                        e.target.value
                      )
                  }
                  placeholder="Enter farmer name"
                />

              </div>


              {/* MOBILE NUMBER */}

              <div className="form-group">

                <label>
                  Farmer Mobile Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={phone}
                  onChange={
                    (e) =>
                      setPhone(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            10
                          )
                      )
                  }
                  placeholder="10-digit mobile number"
                />

              </div>


              {/* SIM800L NUMBER */}

              <div className="form-group">

                <label>
                  SIM800L Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    simNumber
                  }
                  onChange={
                    (e) =>
                      setSimNumber(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            10
                          )
                      )
                  }
                  placeholder="10-digit SIM number"
                />

              </div>


              {/* LANGUAGE */}

              <div className="form-group">

                <label>
                  Preferred Language
                </label>

                <select
                  value={
                    language
                  }
                  onChange={
                    (e) =>
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


              {/* DEVICE PIN */}

              <div className="form-group">

                <label>
                  4-Digit Device PIN
                </label>

                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={
                    devicePin
                  }
                  onChange={
                    (e) =>
                      setDevicePin(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            4
                          )
                      )
                  }
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                />


                <p
                  style={{
                    margin:
                      "7px 0 0",

                    fontSize:
                      "13px",

                    opacity:
                      0.65,
                  }}
                >
                  This PIN will later be used by the farmer on the physical VOOLER door keypad.
                </p>

              </div>


              {/* STORAGE */}

              <div className="alert-safe">

                📦 Assigned Storage:{" "}

                <strong>
                  CS001
                </strong>

              </div>


              {/* ERROR */}

              {registerError && (

                <div className="alert-danger">

                  ❌ {registerError}

                </div>

              )}


              {/* SUCCESS */}

              {registerMessage && (

                <div className="alert-safe">

                  ✅ {registerMessage}

                </div>

              )}


              {/* SUBMIT */}

              <button
                type="submit"
                className="login-button"
                disabled={
                  registerLoading
                }
                style={{
                  marginTop:
                    "18px",
                }}
              >

                {
                  registerLoading
                    ? "Registering..."
                    : "Register Farmer"
                }

              </button>

            </form>

          </section>

        </main>

      </div>

    );

  }


  // =====================================================
  // SELECTED FARMER MANAGEMENT VIEW
  // =====================================================

  if (selectedFarmer) {

    return (

      <div className="dashboard-page">

        <nav className="dashboard-navbar">

          <div className="dashboard-logo">
            ❄ VOOLER Admin
          </div>


          <div className="dashboard-nav-right">

            <button
              type="button"
              onClick={
                onAdminLogout
              }
            >
              Logout
            </button>

          </div>

        </nav>


        <main className="dashboard-main">

          <button
            type="button"
            onClick={
              handleBackToFarmers
            }
            style={{
              border:
                "none",

              background:
                "transparent",

              cursor:
                "pointer",

              padding:
                "4px 0",

              marginBottom:
                "16px",

              fontWeight:
                700,

              color:
                "#087f72",
            }}
          >
            ← Back to Farmers
          </button>


          <section className="dashboard-header">

            <div>

              <h1>
                👨‍🌾 {selectedFarmer.name}
              </h1>

              <p>
                Storage{" "}
                {
                  selectedFarmer.storageId
                }
              </p>

            </div>

          </section>


          {/* TABS */}

          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              flexWrap:
                "wrap",

              marginBottom:
                "22px",
            }}
          >

            <button
              type="button"
              onClick={
                () =>
                  setActiveFarmerTab(
                    "details"
                  )
              }
            >
              👤 Farmer Details
            </button>


            <button
              type="button"
              onClick={
                () =>
                  setActiveFarmerTab(
                    "device"
                  )
              }
            >
              📡 Device Condition
            </button>


            <button
              type="button"
              onClick={
                () =>
                  setActiveFarmerTab(
                    "entry"
                  )
              }
            >
              🚪 Entry Log
            </button>

          </div>


          <section className="history-section">

            {/* ========================================= */}
            {/* FARMER DETAILS */}
            {/* ========================================= */}

            {
              activeFarmerTab ===
                "details" && (

                <div>

                  <div className="section-heading">

                    <div>

                      <h2>
                        👤 Farmer Details
                      </h2>

                      <p
                        style={{
                          margin:
                            "5px 0 0",

                          opacity:
                            0.65,

                          fontSize:
                            "14px",
                        }}
                      >
                        Registration and storage information.
                      </p>

                    </div>

                  </div>


                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",

                      gap:
                        "14px",

                      marginTop:
                        "20px",
                    }}
                  >

                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Farmer Name
                      </p>

                      <p style={valueStyle}>
                        {
                          selectedFarmer.name
                        }
                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Mobile Number
                      </p>

                      <p style={valueStyle}>
                        {
                          selectedFarmer.phone
                        }
                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        SIM800L Number
                      </p>

                      <p style={valueStyle}>
                        {
                          selectedFarmer.simNumber
                        }
                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Preferred Language
                      </p>

                      <p style={valueStyle}>

                        {
                          getLanguageName(
                            selectedFarmer.language
                          )
                        }

                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Storage ID
                      </p>

                      <p style={valueStyle}>
                        {
                          selectedFarmer.storageId
                        }
                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Storage Location
                      </p>

                      <p style={valueStyle}>

                        {
                          getLocation(
                            selectedFarmer
                          )
                        }

                      </p>

                    </div>


                    <div style={detailCardStyle}>

                      <p style={labelStyle}>
                        Registration Date
                      </p>

                      <p style={valueStyle}>

                        {
                          selectedFarmer.createdAt
                            ? new Date(
                                selectedFarmer.createdAt
                              ).toLocaleString()
                            : "Not available"
                        }

                      </p>

                    </div>

                  </div>

                </div>

              )
            }


            {/* ========================================= */}
            {/* DEVICE CONDITION */}
            {/* ========================================= */}

            {
              activeFarmerTab ===
                "device" && (

                <div>

                  <div
                    className="section-heading"
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap:
                        "14px",

                      alignItems:
                        "flex-start",
                    }}
                  >

                    <div>

                      <h2>
                        📡 Device Condition
                      </h2>

                      <p
                        style={{
                          margin:
                            "5px 0 0",

                          opacity:
                            0.65,

                          fontSize:
                            "14px",
                        }}
                      >
                        Latest condition of storage{" "}
                        {
                          selectedFarmer.storageId
                        }.
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={
                        () =>
                          fetchDeviceCondition(
                            selectedFarmer.storageId
                          )
                      }
                      disabled={
                        deviceLoading
                      }
                    >

                      {
                        deviceLoading
                          ? "Refreshing..."
                          : "↻ Refresh"
                      }

                    </button>

                  </div>


                  {
                    deviceError && (

                      <div
                        className="alert-danger"
                        style={{
                          marginTop:
                            "18px",
                        }}
                      >
                        ❌ {deviceError}
                      </div>

                    )
                  }


                  {
                    deviceLoading &&
                    !deviceData
                      ? (

                        <div
                          style={{
                            padding:
                              "35px 20px",

                            textAlign:
                              "center",

                            opacity:
                              0.7,
                          }}
                        >
                          Loading device condition...
                        </div>

                      )

                      : deviceData &&
                        deviceData.latest
                        ? (

                          <>

                            <div
                              style={{
                                display:
                                  "grid",

                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(190px, 1fr))",

                                gap:
                                  "14px",

                                marginTop:
                                  "20px",
                              }}
                            >

                              {/* ONLINE */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Device Status
                                </p>

                                <p
                                  style={{
                                    ...valueStyle,

                                    color:
                                      deviceData.latest.online
                                        ? "#087f72"
                                        : "#b42318",
                                  }}
                                >

                                  {
                                    deviceData.latest.online
                                      ? "● ONLINE"
                                      : "● OFFLINE"
                                  }

                                </p>

                              </div>


                              {/* POWER */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Power
                                </p>

                                <p
                                  style={{
                                    ...valueStyle,

                                    color:
                                      deviceData.latest.power
                                        ? "#087f72"
                                        : "#b42318",
                                  }}
                                >

                                  {
                                    deviceData.latest.power
                                      ? "ON"
                                      : "OFF"
                                  }

                                </p>

                              </div>


                              {/* HUMIDITY */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Humidity
                                </p>

                                <p style={valueStyle}>

                                  {
                                    deviceData.latest.humidity ??
                                    "----"
                                  }%

                                </p>

                              </div>


                              {/* EMERGENCY */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Emergency Shutdown
                                </p>

                                <p
                                  style={{
                                    ...valueStyle,

                                    color:
                                      deviceData.controls
                                        ?.emergencyShutdown
                                        ? "#b42318"
                                        : "#087f72",
                                  }}
                                >

                                  {
                                    deviceData.controls
                                      ?.emergencyShutdown
                                      ? "ACTIVE"
                                      : "OFF"
                                  }

                                </p>

                              </div>

                            </div>


                            {/* CHAMBERS */}

                            <div
                              style={{
                                display:
                                  "grid",

                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(260px, 1fr))",

                                gap:
                                  "14px",

                                marginTop:
                                  "14px",
                              }}
                            >

                              {/* CHAMBER 1 */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Chamber 1
                                </p>


                                <div
                                  style={{
                                    display:
                                      "flex",

                                    justifyContent:
                                      "space-between",

                                    gap:
                                      "16px",

                                    marginTop:
                                      "10px",
                                  }}
                                >

                                  <div>

                                    <p
                                      style={{
                                        margin:
                                          "0 0 4px",

                                        fontSize:
                                          "12px",

                                        opacity:
                                          0.6,
                                      }}
                                    >
                                      CURRENT
                                    </p>

                                    <strong
                                      style={{
                                        fontSize:
                                          "24px",
                                      }}
                                    >

                                      {
                                        deviceData.latest
                                          .chamber1Temperature ??
                                        "----"
                                      }

                                      {
                                        deviceData.latest
                                          .chamber1Temperature != null
                                          ? "°C"
                                          : ""
                                      }

                                    </strong>

                                  </div>


                                  <div>

                                    <p
                                      style={{
                                        margin:
                                          "0 0 4px",

                                        fontSize:
                                          "12px",

                                        opacity:
                                          0.6,
                                      }}
                                    >
                                      SET
                                    </p>

                                    <strong
                                      style={{
                                        fontSize:
                                          "24px",
                                      }}
                                    >

                                      {
                                        deviceData.latest
                                          .chamber1SetTemperature ??
                                        "----"
                                      }

                                      {
                                        deviceData.latest
                                          .chamber1SetTemperature != null
                                          ? "°C"
                                          : ""
                                      }

                                    </strong>

                                  </div>

                                </div>

                              </div>


                              {/* CHAMBER 2 */}

                              <div style={detailCardStyle}>

                                <p style={labelStyle}>
                                  Chamber 2
                                </p>


                                <div
                                  style={{
                                    display:
                                      "flex",

                                    justifyContent:
                                      "space-between",

                                    gap:
                                      "16px",

                                    marginTop:
                                      "10px",
                                  }}
                                >

                                  <div>

                                    <p
                                      style={{
                                        margin:
                                          "0 0 4px",

                                        fontSize:
                                          "12px",

                                        opacity:
                                          0.6,
                                      }}
                                    >
                                      CURRENT
                                    </p>

                                    <strong
                                      style={{
                                        fontSize:
                                          "24px",
                                      }}
                                    >

                                      {
                                        deviceData.latest
                                          .chamber2Temperature ??
                                        "----"
                                      }

                                      {
                                        deviceData.latest
                                          .chamber2Temperature != null
                                          ? "°C"
                                          : ""
                                      }

                                    </strong>

                                  </div>


                                  <div>

                                    <p
                                      style={{
                                        margin:
                                          "0 0 4px",

                                        fontSize:
                                          "12px",

                                        opacity:
                                          0.6,
                                      }}
                                    >
                                      SET
                                    </p>

                                    <strong
                                      style={{
                                        fontSize:
                                          "24px",
                                      }}
                                    >

                                      {
                                        deviceData.latest
                                          .chamber2SetTemperature ??
                                        "----"
                                      }

                                      {
                                        deviceData.latest
                                          .chamber2SetTemperature != null
                                          ? "°C"
                                          : ""
                                      }

                                    </strong>

                                  </div>

                                </div>

                              </div>

                            </div>


                            {/* LAST UPDATE */}

                            <div
                              style={{
                                ...detailCardStyle,

                                marginTop:
                                  "14px",
                              }}
                            >

                              <p style={labelStyle}>
                                Last Data Received
                              </p>

                              <p style={valueStyle}>

                                {
                                  deviceData.latest.timestamp
                                    ? new Date(
                                        deviceData.latest.timestamp
                                      ).toLocaleString()
                                    : "Not available"
                                }

                              </p>

                            </div>


                            {/* OFFLINE WARNING */}

                            {
                              !deviceData.latest.online && (

                                <div
                                  className="alert-danger"
                                  style={{
                                    marginTop:
                                      "14px",
                                  }}
                                >
                                  ⚠️ This storage is currently offline.
                                  Values shown above are the most recent
                                  stored reading and may not represent the
                                  current physical condition.
                                </div>

                              )
                            }

                          </>

                        )

                        : (

                          <div
                            style={{
                              marginTop:
                                "20px",

                              padding:
                                "34px 20px",

                              textAlign:
                                "center",

                              border:
                                "1px dashed #ccd8d5",

                              borderRadius:
                                "14px",

                              opacity:
                                0.72,
                            }}
                          >
                            No sensor readings are available for this storage yet.
                          </div>

                        )
                  }

                </div>

              )
            }


            {/* ========================================= */}
            {/* ENTRY LOG */}
            {/* ========================================= */}

            {
              activeFarmerTab ===
                "entry" && (

                <div>

                  <div className="section-heading">

                    <div>

                      <h2>
                        🚪 Entry Log
                      </h2>

                      <p
                        style={{
                          margin:
                            "5px 0 0",

                          opacity:
                            0.65,

                          fontSize:
                            "14px",
                        }}
                      >
                        Physical VOOLER access history.
                      </p>

                    </div>

                  </div>


                  <div
                    style={{
                      marginTop:
                        "20px",

                      padding:
                        "40px 20px",

                      textAlign:
                        "center",

                      border:
                        "1px dashed #ccd8d5",

                      borderRadius:
                        "14px",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "34px",

                        marginBottom:
                          "10px",
                      }}
                    >
                      🚪
                    </div>


                    <h3>
                      No entry records available
                    </h3>


                    <p
                      style={{
                        opacity:
                          0.65,

                        maxWidth:
                          "520px",

                        margin:
                          "8px auto 0",
                      }}
                    >
                      Entry records will appear here after the
                      VOOLER keypad and RTC access system is
                      connected to the backend.
                    </p>

                  </div>

                </div>

              )
            }

          </section>

        </main>

      </div>

    );

  }


  // =====================================================
  // MAIN ADMIN DASHBOARD
  // =====================================================

  return (

    <div className="dashboard-page">

      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          ❄ VOOLER Admin
        </div>


        <div className="dashboard-nav-right">

          <button
            type="button"
            onClick={
              onAdminLogout
            }
          >
            Logout
          </button>

        </div>

      </nav>


      <main className="dashboard-main">

        <section className="dashboard-header">

          <div>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Manage registered farmers and their assigned VOOLER storage.
            </p>

          </div>

        </section>


        {/* SUMMARY */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",

            gap:
              "14px",

            marginBottom:
              "24px",
          }}
        >

          <div style={detailCardStyle}>

            <p style={labelStyle}>
              Registered Farmers
            </p>

            <p
              style={{
                ...valueStyle,

                fontSize:
                  "28px",
              }}
            >
              {farmers.length}
            </p>

          </div>


          <div style={detailCardStyle}>

            <p style={labelStyle}>
              Prototype Storage
            </p>

            <p
              style={{
                ...valueStyle,

                fontSize:
                  "28px",
              }}
            >
              CS001
            </p>

          </div>

        </div>


        {/* ERROR */}

        {
          error && (

            <div className="alert-danger">

              ❌ {error}

            </div>

          )
        }


        {/* FARMERS */}

        <section className="history-section">

          <div className="section-heading">

            <div>

              <h2>
                👨‍🌾 Registered Farmers
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",

                  opacity:
                    0.65,

                  fontSize:
                    "14px",
                }}
              >
                Select a farmer to manage their account and storage information.
              </p>

            </div>

          </div>


          {
            loading
              ? (

                <div
                  style={{
                    padding:
                      "30px",

                    textAlign:
                      "center",
                  }}
                >
                  Loading farmers...
                </div>

              )

              : (

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(230px, 1fr))",

                    gap:
                      "14px",

                    marginTop:
                      "20px",
                  }}
                >

                  {
                    farmers.map(
                      (farmer) => (

                        <button
                          key={
                            farmer._id ||
                            farmer.id
                          }
                          type="button"
                          onClick={
                            () =>
                              handleFarmerClick(
                                farmer
                              )
                          }
                          style={{
                            ...detailCardStyle,

                            textAlign:
                              "left",

                            cursor:
                              "pointer",

                            width:
                              "100%",

                            fontFamily:
                              "inherit",
                          }}
                        >

                          <div
                            style={{
                              fontSize:
                                "28px",

                              marginBottom:
                                "10px",
                            }}
                          >
                            👨‍🌾
                          </div>


                          <p
                            style={{
                              ...valueStyle,

                              marginBottom:
                                "8px",
                            }}
                          >
                            {farmer.name}
                          </p>


                          <p
                            style={{
                              margin:
                                "3px 0",

                              opacity:
                                0.65,

                              fontSize:
                                "14px",
                            }}
                          >
                            📱 {farmer.phone}
                          </p>


                          <p
                            style={{
                              margin:
                                "3px 0",

                              opacity:
                                0.65,

                              fontSize:
                                "14px",
                            }}
                          >
                            📦 Storage{" "}
                            {
                              farmer.storageId
                            }
                          </p>

                        </button>

                      )
                    )
                  }


                  {/* REGISTER NEW FARMER */}

                  <button
                    type="button"
                    onClick={
                      handleRegisterFarmer
                    }
                    style={{
                      minHeight:
                        "160px",

                      border:
                        "2px dashed #87bdb5",

                      borderRadius:
                        "14px",

                      background:
                        "#f8fffd",

                      cursor:
                        "pointer",

                      color:
                        "#087f72",

                      fontSize:
                        "17px",

                      fontWeight:
                        "700",

                      fontFamily:
                        "inherit",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "32px",

                        marginBottom:
                          "8px",
                      }}
                    >
                      ＋
                    </div>

                    Register New Farmer

                  </button>

                </div>

              )
          }

        </section>

      </main>

    </div>

  );

}


export default AdminDashboard;