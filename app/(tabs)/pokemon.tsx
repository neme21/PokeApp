import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePokemon } from "../../context/PokemonContext";

export default function PokemonScreen() {
  const { pokemon } = usePokemon();

  if (!pokemon) {
    return (
      <View style={styles.container}>
        <View style={styles.vacio}>
          <Text style={styles.interrogacion}>?</Text>

          <Text style={styles.tituloVacio}>
            Ningún Pokémon seleccionado
          </Text>

          <Text style={styles.textoVacio}>
            Busca un Pokémon desde la pestaña Inicio.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tarjeta}>
        <Text style={styles.numero}>
          #{String(pokemon.id).padStart(3, "0")}
        </Text>

        <Text style={styles.nombre}>
          {pokemon.nombre}
        </Text>

        <View style={styles.contenedorImagen}>
          <Image
            source={{ uri: pokemon.imagen }}
            style={styles.imagen}
          />
        </View>

        <Text style={styles.descripcion}>
          Imagen oficial del Pokémon seleccionado
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#f1f3f5",
  },

  tarjeta: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 25,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  numero: {
    fontSize: 16,
    color: "#888",
    fontWeight: "bold",
  },

  nombre: {
    fontSize: 34,
    fontWeight: "bold",
    textTransform: "capitalize",
    marginTop: 5,
    color: "#222",
  },

  contenedorImagen: {
    width: 280,
    height: 280,
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 140,
  },

  imagen: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },

  descripcion: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },

  vacio: {
    alignItems: "center",
  },

  interrogacion: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    textAlign: "center",
    lineHeight: 100,
    fontSize: 55,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 20,
  },

  tituloVacio: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  textoVacio: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
});