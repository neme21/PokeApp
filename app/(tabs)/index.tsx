import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { usePokemon } from "../../context/PokemonContext";
import { POKEMON_API } from "../../config/api";

export default function InicioScreen() {
  const { pokemon, setPokemon } = usePokemon();

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  const buscarPokemon = async () => {
    if (!busqueda.trim()) {
      Alert.alert(
        "Atención",
        "Escribe el nombre o ID de un Pokémon"
      );
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        `${POKEMON_API}/pokemon/${busqueda.trim()}`
      );

      if (!respuesta.ok) {
        throw new Error("Pokémon no encontrado");
      }

      const datos = await respuesta.json();

      setPokemon(datos);
    } catch (error) {
      setPokemon(null);

      Alert.alert(
        "Error",
        "No se pudo encontrar el Pokémon"
      );
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setPokemon(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoTexto}>P</Text>
      </View>

      <Text style={styles.titulo}>PokéApp</Text>

      <Text style={styles.subtitulo}>
        Encuentra información sobre tus Pokémon favoritos
      </Text>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>
          Buscar Pokémon
        </Text>

        <View style={styles.buscador}>
          <TextInput
            style={styles.input}
            placeholder="Ej: pikachu o 25"
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={buscarPokemon}
          />

          <TouchableOpacity
            style={styles.botonBuscar}
            onPress={buscarPokemon}
            disabled={cargando}
          >
            <Text style={styles.textoBoton}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>

        {cargando && (
          <View style={styles.cargando}>
            <ActivityIndicator
              size="large"
              color="#e63946"
            />

            <Text style={styles.textoCargando}>
              Buscando Pokémon...
            </Text>
          </View>
        )}

        {pokemon && !cargando && (
          <View style={styles.resultado}>
            <Text style={styles.encontrado}>
              Pokémon encontrado
            </Text>

            <Text style={styles.nombre}>
              {pokemon.nombre}
            </Text>

            <Text style={styles.indicacion}>
              Usa las pestañas Pokémon y Datos para
              consultar la información.
            </Text>
          </View>
        )}
      </View>

      {(pokemon || busqueda.length > 0) && (
        <TouchableOpacity
          style={styles.botonLimpiar}
          onPress={limpiarBusqueda}
        >
          <Text style={styles.textoLimpiar}>
            Limpiar búsqueda
          </Text>
        </TouchableOpacity>
      )}
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

  logo: {
    alignSelf: "center",
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#e63946",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  logoTexto: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },

  titulo: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },

  subtitulo: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 7,
    marginBottom: 30,
  },

  tarjeta: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  etiqueta: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },

  buscador: {
    flexDirection: "row",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  botonBuscar: {
    justifyContent: "center",
    backgroundColor: "#e63946",
    paddingHorizontal: 20,
    marginLeft: 8,
    borderRadius: 10,
  },

  textoBoton: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  cargando: {
    alignItems: "center",
    marginTop: 25,
  },

  textoCargando: {
    marginTop: 10,
    color: "#666",
  },

  resultado: {
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },

  encontrado: {
    fontSize: 14,
    color: "#666",
  },

  nombre: {
    fontSize: 26,
    fontWeight: "bold",
    textTransform: "capitalize",
    color: "#e63946",
    marginVertical: 5,
  },

  indicacion: {
    textAlign: "center",
    color: "#666",
  },

  botonLimpiar: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },

  textoLimpiar: {
    color: "#666",
    fontWeight: "bold",
  },
});