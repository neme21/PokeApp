import { Stack } from "expo-router";
import { useEffect } from "react";
import { AnimeProvider } from "../context/AnimeContext";
import { PokemonProvider } from "../context/PokemonContext";
import { inicializarBaseDatos } from "../database/sqlite.native";
export default function RootLayout(){useEffect(() => {
  inicializarBaseDatos()
    .then(() => console.log("SQLite inicializado correctamente"))
    .catch((error) => console.error("Error SQLite:", error));
}, []); return <PokemonProvider><AnimeProvider><Stack screenOptions={{headerShown:false}} /></AnimeProvider></PokemonProvider>}
