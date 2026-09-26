import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

export interface Pokemon {
  id: number;
  nombre: string;
  altura: number;
  peso: number;
  imagen: string;
  movimientos: string[];
}

interface PokemonContextType {
  pokemon: Pokemon | null;
  setPokemon: (pokemon: Pokemon | null) => void;
}

const PokemonContext = createContext<PokemonContextType | undefined>(
  undefined
);

export function PokemonProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  return (
    <PokemonContext.Provider value={{ pokemon, setPokemon }}>
      {children}
    </PokemonContext.Provider>
  );
}

export function usePokemon() {
  const context = useContext(PokemonContext);

  if (context === undefined) {
    throw new Error(
      "usePokemon debe utilizarse dentro de PokemonProvider"
    );
  }

  return context;
}