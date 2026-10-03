import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e63946",
        tabBarInactiveTintColor: "#666",
        headerStyle: {
          backgroundColor: "#e63946",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          height: 65,
          paddingTop: 5,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="pokemon"
        options={{
          title: "Pokémon",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="image" size={size} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="anime"
        options={{
          title: "Anime",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="datos"
        options={{
          title: "Datos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}