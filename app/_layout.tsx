import { Stack } from "expo-router";
import { PokemonProvider } from "../context/PokemonContext";
import { AnimeProvider } from "../context/AnimeContext";
export default function RootLayout(){return <PokemonProvider><AnimeProvider><Stack screenOptions={{headerShown:false}} /></AnimeProvider></PokemonProvider>}
