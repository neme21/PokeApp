import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import { usePokemon } from "../../context/PokemonContext";

export default function DatosScreen() {
  const { pokemon } = usePokemon();

  if (!pokemon) {
    return (
      <View style={styles.container}>
        <Text style={styles.tituloVacio}>
          No hay datos disponibles
        </Text>

        <Text style={styles.textoVacio}>
          Primero busca un Pokémon desde Inicio.
        </Text>
      </View>
    );
  }

  const alturaMetros = pokemon.altura / 10;
  const pesoKg = pokemon.peso / 10;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Datos del Pokémon
      </Text>

      <View style={styles.tarjeta}>
        <View style={styles.fila}>
          <Text style={styles.etiqueta}>
            Nombre
          </Text>

          <Text style={styles.valorNombre}>
            {pokemon.nombre}
          </Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>ID</Text>

          <Text style={styles.valor}>
            #{String(pokemon.id).padStart(3, "0")}
          </Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>
            Altura
          </Text>

          <Text style={styles.valor}>
            {alturaMetros} m
          </Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>
            Peso
          </Text>

          <Text style={styles.valor}>
            {pesoKg} kg
          </Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>
        Movimientos
      </Text>

      <View style={styles.tarjeta}>
        <View style={styles.movimiento}>
          <Text style={styles.numeroMovimiento}>
            1
          </Text>

          <Text style={styles.textoMovimiento}>
            {pokemon.movimientos[0] || "N/A"}
          </Text>
        </View>

        <View style={styles.movimiento}>
          <Text style={styles.numeroMovimiento}>
            2
          </Text>

          <Text style={styles.textoMovimiento}>
            {pokemon.movimientos[1] || "N/A"}
          </Text>
        </View>
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

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#222",
  },

  tarjeta: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  etiqueta: {
    fontSize: 17,
    color: "#666",
  },

  valor: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },

  valorNombre: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
    color: "#e63946",
  },

  separador: {
    height: 1,
    backgroundColor: "#eeeeee",
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
  },

  movimiento: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  numeroMovimiento: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#e63946",
    color: "white",
    textAlign: "center",
    lineHeight: 35,
    fontWeight: "bold",
    marginRight: 15,
  },

  textoMovimiento: {
    fontSize: 17,
    textTransform: "capitalize",
  },

  tituloVacio: {
    fontSize: 24,
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