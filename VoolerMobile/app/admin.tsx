import { useCallback, useEffect, useState } from "react";



import {



  Alert,



  Pressable,



  RefreshControl,



  ScrollView,



  View,



} from "react-native";



import { router } from "expo-router";







import { Input } from "@/components/ui/input";



import { Text } from "@/components/ui/text";







const API_BASE_URL = "https://vooler.onrender.com";







// =====================================================



// TYPES



// =====================================================







type Farmer = {



  id?: string;



  _id?: string;



  name?: string;



  phone?: string;



  simNumber?: string;



  language?: string;



  storageId?: string;



  createdAt?: string;



  hasDevicePin?: boolean;







  location?: {



    placeName?: string;



    city?: string;



    state?: string;



    latitude?: number;



    longitude?: number;



  };



};







type DashboardReading = {



  chamber1Temperature?: number;



  chamber2Temperature?: number;



  chamber1SetTemperature?: number;



  chamber2SetTemperature?: number;



  humidity?: number;



  power?: boolean;



  online?: boolean;



  timestamp?: string;



  createdAt?: string;



};







type DeviceCondition = {



  success?: boolean;



  storageId?: string;



  latest?: DashboardReading | null;







  controls?: {



    emergencyShutdown?: boolean;



    requestedBy?: string | null;



    requestedAt?: string | null;



  };



};







type AdminPage = "login" | "dashboard" | "farmer" | "register";



type FarmerTab = "details" | "device" | "entry";



type EntryLog = {

  _id?: string; storageId?: string; timestamp?: string;

  eventType?: "DOOR_ENTRY" | "DOOR_CLOSED" | string; createdAt?: string;

};







// =====================================================



// HELPERS



// =====================================================







const getFarmerId = (farmer?: Farmer | null) => {



  return farmer?.id || farmer?._id || "";



};







const getInitials = (name?: string) => {



  if (!name) return "F";







  const parts = name.trim().split(/\s+/);







  if (parts.length === 1) {



    return parts[0].charAt(0).toUpperCase();



  }







  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();



};







const getLanguageName = (code?: string) => {



  switch (code) {



    case "en":



      return "English";



    case "bn":



      return "বাংলা";



    case "hi":



      return "हिन्दी";



    case "as":



      return "অসমীয়া";



    default:



      return code || "--";



  }



};







const formatDateTime = (value?: string) => {



  if (!value) return "--";







  const date = new Date(value);







  if (Number.isNaN(date.getTime())) return "--";







  return date.toLocaleString();



};







const formatRegistrationDate = (value?: string) => {



  if (!value) return "--";







  const date = new Date(value);







  if (Number.isNaN(date.getTime())) return "--";







  return date.toLocaleDateString(undefined, {



    day: "numeric",



    month: "short",



    year: "numeric",



  });



};







const getLocationText = (farmer?: Farmer | null) => {



  if (!farmer?.location) {



    return "Not configured";



  }







  if (farmer.location.placeName) {



    return farmer.location.placeName;



  }







  const parts = [



    farmer.location.city,



    farmer.location.state,



  ].filter(Boolean);







  if (parts.length > 0) {



    return parts.join(", ");



  }







  if (



    typeof farmer.location.latitude === "number" &&



    typeof farmer.location.longitude === "number"



  ) {



    return `${farmer.location.latitude}, ${farmer.location.longitude}`;



  }







  return "Not configured";



};







// =====================================================



// REUSABLE UI



// =====================================================







function BackButton({



  label,



  onPress,



}: {



  label: string;



  onPress: () => void;



}) {



  return (



    <Pressable



      onPress={onPress}



      className="mb-5 flex-row items-center"



    >



      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-teal-50">



        <Text className="text-xl font-bold text-teal-700">‹</Text>



      </View>







      <Text className="font-bold text-teal-700">



        {label}



      </Text>



    </Pressable>



  );



}







function SectionHeading({



  icon,



  title,



  subtitle,



}: {



  icon: string;



  title: string;



  subtitle?: string;



}) {



  return (



    <View className="mb-4 flex-row items-center">



      <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">



        <Text className="text-xl">{icon}</Text>



      </View>







      <View className="flex-1">



        <Text className="text-xl font-bold text-slate-900">



          {title}



        </Text>







        {subtitle ? (



          <Text className="mt-1 text-sm text-slate-500">



            {subtitle}



          </Text>



        ) : null}



      </View>



    </View>



  );



}







function StatusBadge({



  label,



  type = "neutral",



}: {



  label: string;



  type?: "good" | "danger" | "warning" | "info" | "neutral";



}) {



  const box = {



    good: "bg-emerald-100 border-emerald-200",



    danger: "bg-red-100 border-red-200",



    warning: "bg-amber-100 border-amber-200",



    info: "bg-sky-100 border-sky-200",



    neutral: "bg-slate-100 border-slate-200",



  };







  const text = {



    good: "text-emerald-700",



    danger: "text-red-700",



    warning: "text-amber-700",



    info: "text-sky-700",



    neutral: "text-slate-600",



  };







  return (



    <View



      className={`rounded-full border px-3 py-1.5 ${box[type]}`}



    >



      <Text className={`text-xs font-bold ${text[type]}`}>



        {label}



      </Text>



    </View>



  );



}







function InfoRow({



  icon,



  label,



  value,



  last = false,



}: {



  icon: string;



  label: string;



  value: string;



  last?: boolean;



}) {



  return (



    <View



      className={`flex-row py-4 ${



        last ? "" : "border-b border-slate-100"



      }`}



    >



      <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-50">



        <Text className="text-lg">{icon}</Text>



      </View>







      <View className="flex-1">



        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">



          {label}



        </Text>







        <Text className="mt-1 text-base font-semibold text-slate-900">



          {value}



        </Text>



      </View>



    </View>



  );



}







function DeviceTile({



  icon,



  label,



  value,



  type = "neutral",



}: {



  icon: string;



  label: string;



  value: string;



  type?: "good" | "danger" | "warning" | "info" | "neutral";



}) {



  const backgrounds = {



    good: "bg-emerald-50 border-emerald-100",



    danger: "bg-red-50 border-red-100",



    warning: "bg-amber-50 border-amber-100",



    info: "bg-sky-50 border-sky-100",



    neutral: "bg-white border-slate-200",



  };







  const values = {



    good: "text-emerald-700",



    danger: "text-red-700",



    warning: "text-amber-700",



    info: "text-sky-700",



    neutral: "text-slate-900",



  };







  return (



    <View



      className={`mb-3 w-[48.5%] rounded-3xl border p-4 ${backgrounds[type]}`}



    >



      <Text className="text-2xl">{icon}</Text>







      <Text className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">



        {label}



      </Text>







      <Text className={`mt-1 text-xl font-bold ${values[type]}`}>



        {value}



      </Text>



    </View>



  );



}







function TemperatureBox({



  label,



  value,



  accent = "teal",



}: {



  label: string;



  value?: number;



  accent?: "teal" | "blue";



}) {



  return (



    <View className="flex-1 rounded-2xl bg-slate-50 p-4">



      <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">



        {label}



      </Text>







      <Text



        className={`mt-2 text-3xl font-extrabold ${



          accent === "blue"



            ? "text-sky-600"



            : "text-teal-700"



        }`}



      >



        {typeof value === "number"



          ? `${value.toFixed(1)}°C`



          : "-- °C"}



      </Text>



    </View>



  );



}







// =====================================================



// MAIN ADMIN



// =====================================================







export default function AdminScreen() {



  // ADMIN



  const [adminKey, setAdminKey] = useState("");



  const [adminVerified, setAdminVerified] = useState(false);



  const [verifying, setVerifying] = useState(false);



  const [page, setPage] = useState<AdminPage>("login");



  const [error, setError] = useState("");







  // FARMERS



  const [farmers, setFarmers] = useState<Farmer[]>([]);



  const [farmersLoading, setFarmersLoading] = useState(false);



  const [selectedFarmer, setSelectedFarmer] =



    useState<Farmer | null>(null);







  const [activeFarmerTab, setActiveFarmerTab] =



    useState<FarmerTab>("details");







  // DEVICE



  const [deviceCondition, setDeviceCondition] =



    useState<DeviceCondition | null>(null);







  const [deviceLoading, setDeviceLoading] = useState(false);



  const [deviceError, setDeviceError] = useState("");



  // ENTRY LOGS

  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);

  const [entryLogsLoading, setEntryLogsLoading] = useState(false);

  const [entryLogsError, setEntryLogsError] = useState("");

  // EDIT FARMER
  const [editingFarmer, setEditingFarmer] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSimNumber, setEditSimNumber] = useState("");
  const [editLanguage, setEditLanguage] = useState("en");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");







  // REGISTER



  const [name, setName] = useState("");



  const [phone, setPhone] = useState("");



  const [simNumber, setSimNumber] = useState("");



  const [language, setLanguage] = useState("en");



  const [devicePin, setDevicePin] = useState("");



  const [registering, setRegistering] = useState(false);







  // =====================================================



  // VERIFY ADMIN



  // =====================================================







  const verifyAdmin = async () => {



    if (!adminKey.trim()) {



      setError("Please enter the admin key.");



      return;



    }







    try {



      setVerifying(true);



      setError("");







      const response = await fetch(



        `${API_BASE_URL}/api/admin/verify`,



        {



          method: "POST",



          headers: {



            "Content-Type": "application/json",



            "x-admin-key": adminKey.trim(),



          },



        }



      );







      const data = await response.json();







      if (!response.ok) {



        throw new Error(



          data.message || "Admin verification failed."



        );



      }







      setAdminVerified(true);



      setPage("dashboard");



    } catch (err: any) {



      setAdminVerified(false);







      setError(



        err?.message || "Unable to verify admin key."



      );



    } finally {



      setVerifying(false);



    }



  };







  // =====================================================



  // FETCH FARMERS



  // =====================================================







  const fetchFarmers = useCallback(async () => {



    if (!adminVerified || !adminKey.trim()) return;







    try {



      setFarmersLoading(true);



      setError("");







      const response = await fetch(



        `${API_BASE_URL}/api/admin/farmers`,



        {



          headers: {



            "x-admin-key": adminKey.trim(),



          },



        }



      );







      const data = await response.json();







      if (!response.ok) {



        throw new Error(



          data.message || "Unable to load farmers."



        );



      }







      if (Array.isArray(data)) {



        setFarmers(data);



      } else if (Array.isArray(data.farmers)) {



        setFarmers(data.farmers);



      } else {



        setFarmers([]);



      }



    } catch (err: any) {



      setError(



        err?.message ||



          "Unable to load registered farmers."



      );



    } finally {



      setFarmersLoading(false);



    }



  }, [adminVerified, adminKey]);







  useEffect(() => {



    if (adminVerified && page === "dashboard") {



      fetchFarmers();



    }



  }, [adminVerified, page, fetchFarmers]);







  // =====================================================



  // DEVICE CONDITION



  // =====================================================







  const fetchDeviceCondition = useCallback(



    async (storageId?: string) => {



      if (!storageId) {



        setDeviceCondition(null);



        setDeviceError("No storage unit assigned.");



        return;



      }







      try {



        setDeviceLoading(true);



        setDeviceError("");







        const response = await fetch(



          `${API_BASE_URL}/api/dashboard/${storageId}`



        );







        const data = await response.json();







        if (!response.ok) {



          throw new Error(



            data.message ||



              "Unable to load device condition."



          );



        }







        setDeviceCondition(data);



      } catch (err: any) {



        setDeviceCondition(null);







        setDeviceError(



          err?.message ||



            "Unable to load device condition."



        );



      } finally {



        setDeviceLoading(false);



      }



    },



    []



  );







  // =====================================================



  // FARMER



  // =====================================================







  const startEditingFarmer = () => {
    if (!selectedFarmer) return;

    setEditName(selectedFarmer.name || "");
    setEditPhone(selectedFarmer.phone || "");
    setEditSimNumber(selectedFarmer.simNumber || "");
    setEditLanguage(selectedFarmer.language || "en");
    setEditError("");
    setEditingFarmer(true);
  };

  const cancelEditingFarmer = () => {
    setEditingFarmer(false);
    setEditError("");
  };

  const saveFarmerChanges = async () => {
    if (!selectedFarmer) return;

    const farmerId = getFarmerId(selectedFarmer);

    if (!farmerId) {
      setEditError("Farmer ID is missing.");
      return;
    }

    const cleanName = editName.trim();
    const cleanPhone = editPhone.trim();
    const cleanSimNumber = editSimNumber.trim();

    if (!cleanName || !cleanPhone || !cleanSimNumber) {
      setEditError("Please complete all farmer details.");
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setEditError("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (!/^\d{10}$/.test(cleanSimNumber)) {
      setEditError("SIM800L number must contain exactly 10 digits.");
      return;
    }

    try {
      setEditSaving(true);
      setEditError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/farmers/${encodeURIComponent(farmerId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey.trim(),
          },
          body: JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
            simNumber: cleanSimNumber,
            language: editLanguage,
          }),
        }
      );

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(
          data?.message || `Unable to update farmer (${response.status}).`
        );
      }

      const updatedFarmer: Farmer = {
        ...selectedFarmer,
        ...(data?.farmer || {}),
        name: data?.farmer?.name ?? cleanName,
        phone: data?.farmer?.phone ?? cleanPhone,
        simNumber: data?.farmer?.simNumber ?? cleanSimNumber,
        language: data?.farmer?.language ?? editLanguage,
      };

      setSelectedFarmer(updatedFarmer);
      setFarmers((current) =>
        current.map((farmer) =>
          getFarmerId(farmer) === farmerId ? updatedFarmer : farmer
        )
      );

      setEditingFarmer(false);
      await fetchFarmers();

      Alert.alert(
        "Farmer Updated",
        "Farmer details have been updated successfully."
      );
    } catch (err: any) {
      setEditError(err?.message || "Unable to update farmer details.");
    } finally {
      setEditSaving(false);
    }
  };

  const openFarmer = (farmer: Farmer) => {



    setSelectedFarmer(farmer);



    setActiveFarmerTab("details");



    setDeviceCondition(null);



    setDeviceError("");



    setPage("farmer");







    if (farmer.storageId) {



      fetchDeviceCondition(farmer.storageId);



    }



  };







  // =====================================================



  // REGISTRATION



  // =====================================================







  const clearRegistrationForm = () => {



    setName("");



    setPhone("");



    setSimNumber("");



    setLanguage("en");



    setDevicePin("");



  };







  const registerFarmer = async () => {



    if (



      !name.trim() ||



      !phone.trim() ||



      !simNumber.trim() ||



      !devicePin.trim()



    ) {



      setError("Please complete all farmer details.");



      return;



    }







    if (!/^\d{10}$/.test(phone.trim())) {



      setError(



        "Farmer mobile number must contain exactly 10 digits."



      );



      return;



    }







    if (!/^\d{10}$/.test(simNumber.trim())) {



      setError(



        "Storage SIM number must contain exactly 10 digits."



      );



      return;



    }







    if (!/^\d{4}$/.test(devicePin.trim())) {



      setError("Device PIN must contain exactly 4 digits.");



      return;



    }







    try {



      setRegistering(true);



      setError("");







      const response = await fetch(



        `${API_BASE_URL}/api/admin/register`,



        {



          method: "POST",







          headers: {



            "Content-Type": "application/json",



            "x-admin-key": adminKey.trim(),



          },







          body: JSON.stringify({



            name: name.trim(),



            phone: phone.trim(),



            simNumber: simNumber.trim(),



            language,



            devicePin: devicePin.trim(),



          }),



        }



      );







      const data = await response.json();







      if (!response.ok) {



        throw new Error(



          data.message || "Farmer registration failed."



        );



      }







      const farmerName = data.farmer?.name || name.trim();







      clearRegistrationForm();



      await fetchFarmers();







      Alert.alert(



        "Registration Complete",



        `${farmerName} has been added to VOOLER.`,



        [



          {



            text: "Done",



            onPress: () => setPage("dashboard"),



          },



        ]



      );



    } catch (err: any) {



      setError(



        err?.message || "Unable to register farmer."



      );



    } finally {



      setRegistering(false);



    }



  };







  // =====================================================



  // LOGOUT



  // =====================================================







  const logoutAdmin = () => {



    setAdminKey("");



    setAdminVerified(false);



    setFarmers([]);



    setSelectedFarmer(null);



    setDeviceCondition(null);



    setError("");



    setPage("login");



  };







  // =====================================================



  // LOGIN



  // =====================================================







  if (page === "login") {



    return (



      <ScrollView



        className="flex-1 bg-slate-50"



        contentContainerClassName="pb-20"



        keyboardShouldPersistTaps="handled"



      >



        <View className="rounded-b-[40px] bg-teal-700 px-6 pb-12 pt-16">



          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/15">



            <Text className="text-3xl">❄️</Text>



          </View>







          <Text className="mt-6 text-xs font-bold uppercase tracking-[3px] text-teal-100">



            VOOLER MANAGEMENT



          </Text>







          <Text className="mt-2 text-4xl font-extrabold text-white">



            Admin Portal



          </Text>







          <Text className="mt-3 max-w-[300px] text-base leading-6 text-teal-100">



            Manage farmers, storage access and device



            conditions.



          </Text>



        </View>







        <View className="-mt-5 px-5">



          <View className="rounded-3xl border border-slate-200 bg-white p-6">



            <View className="mb-6 flex-row items-center">



              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">



                <Text className="text-xl">🔑</Text>



              </View>







              <View>



                <Text className="text-xl font-bold text-slate-900">



                  Admin Access



                </Text>







                <Text className="mt-1 text-sm text-slate-500">



                  Enter your authorized admin key



                </Text>



              </View>



            </View>







            {error ? (



              <View className="mb-4 rounded-2xl bg-red-50 p-4">



                <Text className="font-semibold text-red-700">



                  ⚠ {error}



                </Text>



              </View>



            ) : null}







            <Text className="mb-2 text-sm font-bold text-slate-700">



              Admin Key



            </Text>







            <Input



              value={adminKey}



              onChangeText={setAdminKey}



              placeholder="Enter admin key"



              secureTextEntry



              autoCapitalize="none"



              className="mb-5"



            />







            <Pressable



              disabled={verifying}



              onPress={verifyAdmin}



              className="rounded-2xl bg-teal-700 px-5 py-4"



              style={{



                opacity: verifying ? 0.6 : 1,



              }}



            >



              <Text className="text-center text-base font-bold text-white">



                {verifying



                  ? "Verifying..."



                  : "Continue to Dashboard →"}



              </Text>



            </Pressable>



          </View>







          <Pressable



            onPress={() => router.replace("/")}



            className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4"



          >



            <Text className="text-center font-bold text-slate-700">



              ← Return to Farmer Login



            </Text>



          </Pressable>



        </View>



      </ScrollView>



    );



  }







  // =====================================================



  // REGISTER FARMER



  // =====================================================







  if (page === "register") {



    return (



      <ScrollView



        className="flex-1 bg-slate-50"



        contentContainerClassName="px-5 pb-24 pt-14"



        keyboardShouldPersistTaps="handled"



      >



        <BackButton



          label="Admin Dashboard"



          onPress={() => {



            setError("");



            setPage("dashboard");



          }}



        />







        <Text className="text-3xl font-extrabold text-slate-900">



          New Farmer



        </Text>







        <Text className="mt-2 mb-7 text-base leading-6 text-slate-500">



          Create a farmer account and configure access to



          the VOOLER storage unit.



        </Text>







        {error ? (



          <View className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4">



            <Text className="font-semibold text-red-700">



              ⚠ {error}



            </Text>



          </View>



        ) : null}







        {/* PERSONAL DETAILS */}







        <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-5">



          <SectionHeading



            icon="👨‍🌾"



            title="Personal Details"



            subtitle="Farmer account information"



          />







          <Text className="mb-2 text-sm font-bold text-slate-700">



            Farmer Name



          </Text>







          <Input



            value={name}



            onChangeText={setName}



            placeholder="Full name"



            autoCapitalize="words"



            className="mb-4"



          />







          <Text className="mb-2 text-sm font-bold text-slate-700">



            Mobile Number



          </Text>







          <Input



            value={phone}



            onChangeText={(value) =>



              setPhone(



                value.replace(/\D/g, "").slice(0, 10)



              )



            }



            placeholder="10-digit mobile number"



            keyboardType="phone-pad"



            maxLength={10}



          />



        </View>







        {/* STORAGE */}







        <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-5">



          <SectionHeading



            icon="❄️"



            title="Storage Assignment"



            subtitle="Prototype storage configuration"



          />







          <Text className="mb-2 text-sm font-bold text-slate-700">



            Storage SIM Number



          </Text>







          <Input



            value={simNumber}



            onChangeText={(value) =>



              setSimNumber(



                value.replace(/\D/g, "").slice(0, 10)



              )



            }



            placeholder="10-digit SIM number"



            keyboardType="phone-pad"



            maxLength={10}



          />







          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-teal-50 p-4">



            <View>



              <Text className="text-xs font-bold uppercase tracking-wider text-teal-600">



                Assigned Storage



              </Text>







              <Text className="mt-1 text-xl font-bold text-teal-800">



                CS001



              </Text>



            </View>







            <Text className="text-3xl">❄️</Text>



          </View>



        </View>







        {/* DOOR ACCESS */}







        <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-5">



          <SectionHeading



            icon="🔐"



            title="Door Access"



            subtitle="Physical keypad security"



          />







          <Text className="mb-2 text-sm font-bold text-slate-700">



            4-Digit Device PIN



          </Text>







          <Input



            value={devicePin}



            onChangeText={(value) =>



              setDevicePin(



                value.replace(/\D/g, "").slice(0, 4)



              )



            }



            placeholder="••••"



            keyboardType="number-pad"



            secureTextEntry



            maxLength={4}



          />







          <Text className="mt-3 text-xs leading-5 text-slate-500">



            The farmer will enter this PIN on the physical



            VOOLER door keypad.



          </Text>



        </View>







        {/* LANGUAGE */}







        <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">



          <SectionHeading



            icon="🌐"



            title="Preferred Language"



            subtitle="Choose the farmer's interface language"



          />







          <View className="flex-row flex-wrap justify-between">



            {[



              { code: "en", label: "English" },



              { code: "bn", label: "বাংলা" },



              { code: "hi", label: "हिन्दी" },



              { code: "as", label: "অসমীয়া" },



            ].map((option) => {



              const selected = language === option.code;







              return (



                <Pressable



                  key={option.code}



                  onPress={() => setLanguage(option.code)}



                  className={`mb-3 w-[48%] rounded-2xl border px-4 py-4 ${



                    selected



                      ? "border-teal-700 bg-teal-700"



                      : "border-slate-200 bg-slate-50"



                  }`}



                >



                  <Text



                    className={`text-center font-bold ${



                      selected



                        ? "text-white"



                        : "text-slate-700"



                    }`}



                  >



                    {option.label}



                  </Text>



                </Pressable>



              );



            })}



          </View>



        </View>







        <Pressable



          disabled={registering}



          onPress={registerFarmer}



          className="rounded-2xl bg-teal-700 px-5 py-5"



          style={{



            opacity: registering ? 0.6 : 1,



          }}



        >



          <Text className="text-center text-base font-bold text-white">



            {registering



              ? "Creating Farmer Account..."



              : "✓ Register Farmer"}



          </Text>



        </Pressable>



      </ScrollView>



    );



  }







  // =====================================================



  // ENTRY LOGS



  // =====================================================



  const fetchEntryLogs = async (storageId?: string) => {

    if (!storageId) { setEntryLogs([]); setEntryLogsError("No storage unit assigned."); return; }

    try {

      setEntryLogsLoading(true); setEntryLogsError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/entry-logs/${encodeURIComponent(storageId)}`, { headers: { "x-admin-key": adminKey.trim() } });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Unable to load entry logs.");

      setEntryLogs(Array.isArray(data) ? data : Array.isArray(data.entryLogs) ? data.entryLogs : []);

    } catch (err: any) { setEntryLogs([]); setEntryLogsError(err?.message || "Unable to load entry logs."); }

    finally { setEntryLogsLoading(false); }

  };



  // =====================================================



  // FARMER MANAGEMENT



  // =====================================================







  if (page === "farmer" && selectedFarmer) {



    const latest = deviceCondition?.latest;







    return (



      <ScrollView



        className="flex-1 bg-slate-50"



        contentContainerClassName="pb-24"



        refreshControl={



          <RefreshControl



            refreshing={deviceLoading}



            onRefresh={() =>



              fetchDeviceCondition(



                selectedFarmer.storageId



              )



            }



          />



        }



      >



        {/* PROFILE HERO */}







        <View className="rounded-b-[36px] bg-teal-700 px-5 pb-7 pt-14">



          <Pressable



            onPress={() => {



              setSelectedFarmer(null);



              setDeviceCondition(null);



              setDeviceError("");



              setPage("dashboard");



            }}



            className="mb-6 flex-row items-center"



          >



            <Text className="mr-2 text-2xl font-bold text-white">



              ‹



            </Text>







            <Text className="font-bold text-white">



              Admin Dashboard



            </Text>



          </Pressable>







          <View className="flex-row items-center">



            <View className="mr-4 h-16 w-16 items-center justify-center rounded-3xl bg-white">



              <Text className="text-xl font-extrabold text-teal-700">



                {getInitials(selectedFarmer.name)}



              </Text>



            </View>







            <View className="flex-1">



              <Text className="text-2xl font-extrabold text-white">



                {selectedFarmer.name || "Farmer"}



              </Text>







              <Text className="mt-1 text-sm text-teal-100">



                {selectedFarmer.phone || "--"}



              </Text>







              <View className="mt-3 self-start rounded-full bg-white/15 px-3 py-1.5">



                <Text className="text-xs font-bold text-white">



                  ❄ {selectedFarmer.storageId || "No Storage"}



                </Text>



              </View>



            </View>



          </View>



        </View>







        <View className="px-5 pt-5">



          {/* TABS */}







          <View className="mb-6 flex-row rounded-2xl bg-slate-200 p-1">



            {[



              {



                id: "details" as FarmerTab,



                label: "Details",



              },



              {



                id: "device" as FarmerTab,



                label: "Device",



              },



              {



                id: "entry" as FarmerTab,



                label: "Entry Log",



              },



            ].map((tab) => {



              const selected =



                activeFarmerTab === tab.id;







              return (



                <Pressable



                  key={tab.id}



                  onPress={() => {



                    setActiveFarmerTab(tab.id);



                    if (



                      tab.id === "device" &&



                      selectedFarmer.storageId



                    ) {



                      fetchDeviceCondition(



                        selectedFarmer.storageId



                      );



                    }



                    if (



                      tab.id === "entry" &&



                      selectedFarmer.storageId



                    ) {



                      fetchEntryLogs(



                        selectedFarmer.storageId



                      );



                    }



                  }}



                  className={`flex-1 rounded-xl px-2 py-3 ${



                    selected ? "bg-white" : ""



                  }`}



                >



                  <Text



                    className={`text-center text-xs font-bold ${



                      selected



                        ? "text-teal-700"



                        : "text-slate-500"



                    }`}



                  >



                    {tab.label}



                  </Text>



                </Pressable>



              );



            })}



          </View>







          {/* DETAILS */}

          {activeFarmerTab === "details" ? (
            <>
              <SectionHeading
                icon="👤"
                title="Farmer Information"
                subtitle="Registered account details"
              />

              {!editingFarmer ? (
                <>
                  <Pressable
                    onPress={startEditingFarmer}
                    className="mb-4 flex-row items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4"
                  >
                    <Text className="font-bold text-teal-700">
                      ✏️ Edit Farmer Details
                    </Text>
                  </Pressable>

                  <View className="rounded-3xl border border-slate-200 bg-white px-5">
                    <InfoRow
                      icon="👨‍🌾"
                      label="Farmer Name"
                      value={selectedFarmer.name || "--"}
                    />

                    <InfoRow
                      icon="📱"
                      label="Mobile Number"
                      value={selectedFarmer.phone || "--"}
                    />

                    <InfoRow
                      icon="📶"
                      label="Storage SIM"
                      value={selectedFarmer.simNumber || "--"}
                    />

                    <InfoRow
                      icon="🌐"
                      label="Language"
                      value={getLanguageName(selectedFarmer.language)}
                    />

                    <InfoRow
                      icon="❄️"
                      label="Storage Unit"
                      value={selectedFarmer.storageId || "--"}
                    />

                    <InfoRow
                      icon="📍"
                      label="Storage Location"
                      value={getLocationText(selectedFarmer)}
                    />

                    <InfoRow
                      icon="📅"
                      label="Registered"
                      value={formatRegistrationDate(selectedFarmer.createdAt)}
                      last
                    />
                  </View>
                </>
              ) : (
                <View className="rounded-3xl border border-slate-200 bg-white p-5">
                  <View className="mb-5 flex-row items-center">
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                      <Text className="text-xl">✏️</Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-xl font-bold text-slate-900">
                        Edit Farmer Details
                      </Text>

                      <Text className="mt-1 text-sm text-slate-500">
                        Update the farmer's registered information.
                      </Text>
                    </View>
                  </View>

                  {editError ? (
                    <View className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                      <Text className="font-semibold text-red-700">
                        ⚠ {editError}
                      </Text>
                    </View>
                  ) : null}

                  <Text className="mb-2 text-sm font-bold text-slate-700">
                    Farmer Name
                  </Text>

                  <Input
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Farmer name"
                    autoCapitalize="words"
                    editable={!editSaving}
                    className="mb-4"
                  />

                  <Text className="mb-2 text-sm font-bold text-slate-700">
                    Mobile Number
                  </Text>

                  <Input
                    value={editPhone}
                    onChangeText={(value) =>
                      setEditPhone(value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!editSaving}
                    className="mb-4"
                  />

                  <Text className="mb-2 text-sm font-bold text-slate-700">
                    SIM800L Number
                  </Text>

                  <Input
                    value={editSimNumber}
                    onChangeText={(value) =>
                      setEditSimNumber(value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit SIM800L number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!editSaving}
                    className="mb-5"
                  />

                  <Text className="mb-3 text-sm font-bold text-slate-700">
                    Preferred Language
                  </Text>

                  <View className="mb-4 flex-row flex-wrap justify-between">
                    {[
                      { code: "en", label: "English" },
                      { code: "bn", label: "বাংলা" },
                      { code: "hi", label: "हिन्दी" },
                      { code: "as", label: "অসমীয়া" },
                    ].map((option) => {
                      const selected = editLanguage === option.code;

                      return (
                        <Pressable
                          key={option.code}
                          disabled={editSaving}
                          onPress={() => setEditLanguage(option.code)}
                          className={`mb-3 w-[48%] rounded-2xl border px-3 py-3 ${
                            selected
                              ? "border-teal-700 bg-teal-700"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Text
                            className={`text-center font-bold ${
                              selected ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="mb-5 rounded-2xl bg-slate-50 p-4">
                    <Text className="text-sm leading-5 text-slate-500">
                      Storage ID and Physical Access PIN are managed separately
                      and are not changed here.
                    </Text>
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      disabled={editSaving}
                      onPress={saveFarmerChanges}
                      className="flex-1 rounded-2xl bg-teal-700 px-4 py-4"
                      style={{ opacity: editSaving ? 0.6 : 1 }}
                    >
                      <Text className="text-center font-bold text-white">
                        {editSaving ? "Saving..." : "Save Changes"}
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={editSaving}
                      onPress={cancelEditingFarmer}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-4"
                    >
                      <Text className="text-center font-bold text-slate-700">
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          ) : null}



          {/* DEVICE */}







          {activeFarmerTab === "device" ? (



            <>



              <SectionHeading



                icon="📡"



                title="Device Condition"



                subtitle={`Live condition of ${



                  selectedFarmer.storageId || "storage"



                }`}



              />







              {deviceError ? (



                <View className="mb-4 rounded-2xl bg-red-50 p-4">



                  <Text className="font-semibold text-red-700">



                    ⚠ {deviceError}



                  </Text>



                </View>



              ) : null}







              {deviceLoading && !deviceCondition ? (



                <View className="rounded-3xl bg-white p-8">



                  <Text className="text-center text-slate-500">



                    Loading device condition...



                  </Text>



                </View>



              ) : null}







              {!deviceLoading &&



              !latest &&



              !deviceError ? (



                <View className="rounded-3xl border border-slate-200 bg-white p-8">



                  <Text className="text-center text-4xl">



                    📡



                  </Text>







                  <Text className="mt-3 text-center font-bold text-slate-800">



                    No readings available



                  </Text>







                  <Text className="mt-2 text-center text-sm text-slate-500">



                    Sensor readings will appear when the



                    VOOLER device sends data.



                  </Text>



                </View>



              ) : null}







              {latest ? (



                <>



                  {!latest.online ? (



                    <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">



                      <Text className="font-bold text-amber-800">



                        ⚠ Device Offline



                      </Text>







                      <Text className="mt-1 text-sm leading-5 text-amber-700">



                        Showing the latest stored readings.



                      </Text>



                    </View>



                  ) : null}







                  <View className="flex-row flex-wrap justify-between">



                    <DeviceTile



                      icon="📡"



                      label="Device"



                      value={



                        latest.online



                          ? "Online"



                          : "Offline"



                      }



                      type={



                        latest.online



                          ? "good"



                          : "danger"



                      }



                    />







                    <DeviceTile



                      icon="⚡"



                      label="Power"



                      value={



                        latest.power



                          ? "ON"



                          : "OFF"



                      }



                      type={



                        latest.power



                          ? "good"



                          : "danger"



                      }



                    />







                    <DeviceTile



                      icon="💧"



                      label="Humidity"



                      value={



                        typeof latest.humidity ===



                        "number"



                          ? `${latest.humidity.toFixed(1)}%`



                          : "--"



                      }



                      type="info"



                    />







                    <DeviceTile



                      icon="🛡️"



                      label="Emergency"



                      value={



                        deviceCondition?.controls



                          ?.emergencyShutdown



                          ? "Active"



                          : "Normal"



                      }



                      type={



                        deviceCondition?.controls



                          ?.emergencyShutdown



                          ? "danger"



                          : "good"



                      }



                    />



                  </View>







                  {/* CHAMBER 1 */}







                  <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-5">



                    <View className="mb-4 flex-row items-center justify-between">



                      <View>



                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">



                          Chamber 01



                        </Text>







                        <Text className="mt-1 text-lg font-bold text-slate-900">



                          Temperature



                        </Text>



                      </View>







                      <Text className="text-2xl">🌡️</Text>



                    </View>







                    <View className="flex-row gap-3">



                      <TemperatureBox



                        label="Current"



                        value={



                          latest.chamber1Temperature



                        }



                      />







                      <TemperatureBox



                        label="Set"



                        value={



                          latest.chamber1SetTemperature



                        }



                        accent="blue"



                      />



                    </View>



                  </View>







                  {/* CHAMBER 2 */}







                  <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-5">



                    <View className="mb-4 flex-row items-center justify-between">



                      <View>



                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">



                          Chamber 02



                        </Text>







                        <Text className="mt-1 text-lg font-bold text-slate-900">



                          Temperature



                        </Text>



                      </View>







                      <Text className="text-2xl">🌡️</Text>



                    </View>







                    <View className="flex-row gap-3">



                      <TemperatureBox



                        label="Current"



                        value={



                          latest.chamber2Temperature



                        }



                      />







                      <TemperatureBox



                        label="Set"



                        value={



                          latest.chamber2SetTemperature



                        }



                        accent="blue"



                      />



                    </View>



                  </View>







                  {/* LAST UPDATE */}







                  <View className="mb-4 rounded-2xl bg-slate-100 p-4">



                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">



                      Last Data Received



                    </Text>







                    <Text className="mt-1 font-bold text-slate-700">



                      {formatDateTime(



                        latest.createdAt ||



                          latest.timestamp



                      )}



                    </Text>



                  </View>







                  <Pressable



                    disabled={deviceLoading}



                    onPress={() =>



                      fetchDeviceCondition(



                        selectedFarmer.storageId



                      )



                    }



                    className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4"



                  >



                    <Text className="text-center font-bold text-teal-700">



                      {deviceLoading



                        ? "Refreshing..."



                        : "↻ Refresh Device Data"}



                    </Text>



                  </Pressable>



                </>



              ) : null}



            </>



          ) : null}







          {/* ENTRY LOG */}



          {activeFarmerTab === "entry" ? (

            <>

              <SectionHeading icon="🔐" title="Entry Log" subtitle="Physical door access history" />

              {entryLogsError ? <View className="mb-4 rounded-2xl bg-red-50 p-4"><Text className="font-semibold text-red-700">⚠ {entryLogsError}</Text></View> : null}

              {entryLogsLoading && entryLogs.length === 0 ? <View className="rounded-3xl border border-slate-200 bg-white p-8"><Text className="text-center text-slate-500">Loading entry logs...</Text></View> : null}

              {!entryLogsLoading && entryLogs.length === 0 && !entryLogsError ? (

                <View className="rounded-3xl border border-slate-200 bg-white p-6"><View className="items-center py-8"><View className="h-20 w-20 items-center justify-center rounded-full bg-teal-50"><Text className="text-4xl">🔐</Text></View><Text className="mt-5 text-xl font-bold text-slate-900">No entry records yet</Text><Text className="mt-2 max-w-[280px] text-center text-sm leading-6 text-slate-500">Door access events will appear here when the VOOLER device sends entry or exit events.</Text></View></View>

              ) : null}

              {entryLogs.length > 0 ? (

                <View className="rounded-3xl border border-slate-200 bg-white px-5">

                  {entryLogs.map((log, index) => {

                    const isExit = log.eventType === "DOOR_CLOSED"; const eventName = isExit ? "Exit" : "Entry"; const eventTime = log.timestamp || log.createdAt;

                    return <View key={log._id || `${eventTime || "log"}-${index}`} className={`flex-row items-center py-4 ${index === entryLogs.length - 1 ? "" : "border-b border-slate-100"}`}><View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-teal-50"><Text className="text-2xl">{isExit ? "↪️" : "🚪"}</Text></View><View className="flex-1"><Text className="text-base font-bold text-slate-900">{eventName}</Text><Text className="mt-1 text-sm text-slate-500">{formatDateTime(eventTime)}</Text></View><StatusBadge label={eventName} type={isExit ? "neutral" : "good"} /></View>;

                  })}

                </View>

              ) : null}

              <Pressable disabled={entryLogsLoading} onPress={() => fetchEntryLogs(selectedFarmer.storageId)} className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4" style={{ opacity: entryLogsLoading ? 0.6 : 1 }}><Text className="text-center font-bold text-teal-700">{entryLogsLoading ? "Refreshing..." : "↻ Refresh Entry Log"}</Text></Pressable>

            </>

          ) : null}



        </View>



      </ScrollView>



    );



  }







  // =====================================================



  // ADMIN DASHBOARD



  // =====================================================







  return (



    <ScrollView



      className="flex-1 bg-slate-50"



      contentContainerClassName="pb-24"



      refreshControl={



        <RefreshControl



          refreshing={farmersLoading}



          onRefresh={fetchFarmers}



        />



      }



    >



      {/* HERO */}







      <View className="rounded-b-[38px] bg-teal-700 px-5 pb-8 pt-14">



        <View className="flex-row items-center justify-between">



          <View>



            <Text className="text-xs font-bold uppercase tracking-[3px] text-teal-100">



              VOOLER MANAGEMENT



            </Text>







            <Text className="mt-2 text-3xl font-extrabold text-white">



              Admin Dashboard



            </Text>



          </View>







          <Pressable



            onPress={logoutAdmin}



            className="rounded-full bg-white/15 px-4 py-2.5"



          >



            <Text className="font-bold text-white">



              Logout



            </Text>



          </Pressable>



        </View>







        <Text className="mt-3 text-sm text-teal-100">



          Manage farmers and connected cold storage



        </Text>







        {/* SUMMARY */}







        <View className="mt-7 flex-row gap-3">



          <View className="flex-1 rounded-3xl bg-white/10 p-4">



            <Text className="text-2xl">👨‍🌾</Text>







            <Text className="mt-3 text-3xl font-extrabold text-white">



              {farmers.length}



            </Text>







            <Text className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-100">



              Farmers



            </Text>



          </View>







          <View className="flex-1 rounded-3xl bg-white/10 p-4">



            <Text className="text-2xl">❄️</Text>







            <Text className="mt-3 text-2xl font-extrabold text-white">



              CS001



            </Text>







            <Text className="mt-1 text-xs font-bold uppercase tracking-wider text-teal-100">



              Storage Unit



            </Text>



          </View>



        </View>



      </View>







      <View className="px-5 pt-6">



        {error ? (



          <View className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4">



            <Text className="font-semibold text-red-700">



              ⚠ {error}



            </Text>



          </View>



        ) : null}







        {/* REGISTER */}







        <Pressable



          onPress={() => {



            setError("");



            clearRegistrationForm();



            setPage("register");



          }}



          className="mb-7 flex-row items-center rounded-3xl bg-teal-50 p-5"



        >



          <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-teal-700">



            <Text className="text-3xl font-light text-white">



              +



            </Text>



          </View>







          <View className="flex-1">



            <Text className="text-lg font-bold text-slate-900">



              Register New Farmer



            </Text>







            <Text className="mt-1 text-sm text-slate-500">



              Add farmer & assign door access



            </Text>



          </View>







          <Text className="text-2xl font-bold text-teal-700">



            ›



          </Text>



        </Pressable>







        {/* FARMERS */}







        <SectionHeading



          icon="👨‍🌾"



          title="Registered Farmers"



          subtitle="Tap a farmer to manage their account"



        />







        {farmersLoading && farmers.length === 0 ? (



          <View className="rounded-3xl bg-white p-8">



            <Text className="text-center text-slate-500">



              Loading farmers...



            </Text>



          </View>



        ) : null}







        {!farmersLoading && farmers.length === 0 ? (



          <View className="rounded-3xl border border-slate-200 bg-white p-8">



            <Text className="text-center text-4xl">



              👨‍🌾



            </Text>







            <Text className="mt-4 text-center text-lg font-bold text-slate-800">



              No farmers yet



            </Text>







            <Text className="mt-2 text-center text-sm text-slate-500">



              Register your first VOOLER farmer above.



            </Text>



          </View>



        ) : null}







        {farmers.map((farmer, index) => (



          <Pressable



            key={



              getFarmerId(farmer) ||



              `${farmer.phone}-${index}`



            }



            onPress={() => openFarmer(farmer)}



            className="mb-4"



          >



            <View className="rounded-3xl border border-slate-200 bg-white p-5">



              <View className="flex-row items-center">



                {/* AVATAR */}







                <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">



                  <Text className="text-lg font-extrabold text-teal-700">



                    {getInitials(farmer.name)}



                  </Text>



                </View>







                {/* INFO */}







                <View className="flex-1">



                  <Text className="text-lg font-bold text-slate-900">



                    {farmer.name || "Unnamed Farmer"}



                  </Text>







                  <Text className="mt-1 text-sm text-slate-500">



                    📱 {farmer.phone || "--"}



                  </Text>



                </View>







                {/* STORAGE */}







                <StatusBadge



                  label={farmer.storageId || "--"}



                  type="info"



                />



              </View>







              <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4">



                <View className="flex-row items-center">



                  <Text className="mr-2 text-sm text-slate-400">



                    🌐



                  </Text>







                  <Text className="text-sm font-semibold text-slate-600">



                    {getLanguageName(farmer.language)}



                  </Text>



                </View>







                <Text className="font-bold text-teal-700">



                  Manage ›



                </Text>



              </View>



            </View>

          </Pressable>

        ))}
        <Text className="mt-5 text-center text-xs text-slate-400">
          VOOLER • Smart Solar Cold Storage
        </Text>
      </View>
    </ScrollView>
  );
}