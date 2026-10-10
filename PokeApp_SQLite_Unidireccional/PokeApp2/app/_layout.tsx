import { sincronizarPendientes } from "../services/docentes";
import NetInfo from "@react-native-community/netinfo";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AnimeProvider } from "../context/AnimeContext";
import { PokemonProvider } from "../context/PokemonContext";
import { inicializarBaseDatos } from "../database/sqlite";
export default function RootLayout(){useEffect(() => {
  inicializarBaseDatos()
    .then(() => console.log("SQLite inicializado correctamente"))
    .catch((error) => console.error("Error SQLite:", error));
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) void sincronizarPendientes().catch(console.warn);
  });
  return unsubscribe;
}, []); return <PokemonProvider><AnimeProvider><Stack screenOptions={{headerShown:false}} /></AnimeProvider></PokemonProvider>}
