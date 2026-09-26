import { Tabs } from "expo-router";

import {
  House,
  ChartNoAxesColumnIncreasing,
  User,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // No header above the tab screens
        headerShown: false,

        // Active tab colour
        tabBarActiveTintColor: "#0f766e",

        // Inactive tab colour
        tabBarInactiveTintColor: "#94a3b8",

        // Bottom navigation styling
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,

          backgroundColor: "#ffffff",

          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",

          elevation: 8,

          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },

        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      {/* =========================
          DASHBOARD
      ========================== */}

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",

          tabBarIcon: ({ color, size }) => (
            <House
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* =========================
          HISTORY
      ========================== */}

      <Tabs.Screen
        name="history"
        options={{
          title: "History",

          tabBarIcon: ({ color, size }) => (
            <ChartNoAxesColumnIncreasing
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* =========================
          PROFILE
      ========================== */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, size }) => (
            <User
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />
    </Tabs>
  );
}