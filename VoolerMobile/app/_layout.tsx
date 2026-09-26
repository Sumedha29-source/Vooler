import "@/global.css";

import { NAV_THEME } from "@/lib/theme";
import { ThemeProvider } from "expo-router/react-navigation";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

export {
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
      />

      <Stack>
        {/* Farmer login */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* Farmer Dashboard / History / Profile */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Admin Portal */}
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="+not-found"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <PortalHost />
    </ThemeProvider>
  );
}