import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

type Docente = {
  id: number;
  nombre: string;
  apellido: string;
  correo?: string | null;
  programa: string;
  imagen?: string | null;
  cargo: string;
  perfil?: string | null;
};

export default function DocenteScreen() {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState("");
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(
    "Busca un docente para consultar su información"
  );

  /*
   * Esta URL se cambiará por la URL pública de Render
   * cuando despleguemos el microservicio de docentes.
   */
  const API_DOCENTES = "http://localhost:3001";

  const buscarDocente = async () => {
    const texto = busqueda.trim();

    if (!texto) {
      setDocentes([]);
      setMensaje("Escribe el nombre de un docente");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const url =
        `${API_DOCENTES}/docentes?nombre=${encodeURIComponent(texto)}`;

      const respuesta = await fetch(url);

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      /*
       * Permitimos temporalmente ambas respuestas:
       *
       * [...]
       *
       * o
       *
       * { docentes: [...] }
       *
       * Cuando hagamos el microservicio definiremos
       * definitivamente el formato.
       */
      const lista: Docente[] = Array.isArray(datos)
        ? datos
        : datos.docentes || [];

      setDocentes(lista);

      if (lista.length === 0) {
        setMensaje("No se encontraron docentes");
      }
    } catch (error) {
      console.error("Error buscando docente:", error);

      setDocentes([]);
      setMensaje(
        "No fue posible consultar los docentes. Verifica el microservicio."
      );
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setDocentes([]);
    setMensaje("Busca un docente para consultar su información");
  };

  return (
    <View style={styles.container}>
      {/* ENCABEZADO */}

      <View style={styles.encabezado}>
        <Ionicons name="school-outline" size={38} color="#2563eb" />

        <Text style={styles.titulo}>Docentes UNINPAHU</Text>

        <Text style={styles.subtitulo}>
          Consulta información de los docentes
        </Text>
      </View>

      {/* BUSCADOR */}

      <View style={styles.contenedorBuscador}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#64748b"
            style={styles.iconoInput}
          />

          <TextInput
            style={styles.input}
            placeholder="Buscar docente..."
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={buscarDocente}
            returnKeyType="search"
          />

          {busqueda.length > 0 && (
            <TouchableOpacity onPress={limpiarBusqueda}>
              <Ionicons
                name="close-circle"
                size={22}
                color="#94a3b8"
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.botonBuscar}
          onPress={buscarDocente}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Ionicons name="search" size={23} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* RESULTADOS */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.resultados}
        showsVerticalScrollIndicator={false}
      >
        {cargando && (
          <View style={styles.estadoContainer}>
            <ActivityIndicator size="large" color="#2563eb" />

            <Text style={styles.estadoTexto}>
              Buscando docente...
            </Text>
          </View>
        )}

        {!cargando && docentes.length === 0 && (
          <View style={styles.estadoContainer}>
            <View style={styles.iconoGrande}>
             <Ionicons
                name="people-outline"
                size={65}
                color="#94a3b8"
              />
            </View>

            <Text style={styles.estadoTexto}>{mensaje}</Text>
          </View>
        )}

        {!cargando &&
          docentes.map((docente) => (
            <View key={docente.id} style={styles.card}>
              {/* FOTO */}

              {docente.imagen ? (
                <Image
                  source={{ uri: docente.imagen }}
                  style={styles.foto}
                />
              ) : (
                <View style={styles.sinFoto}>
                  <Ionicons
                    name="person"
                    size={48}
                    color="#64748b"
                  />
                </View>
              )}

              {/* INFORMACIÓN RESUMIDA */}

              <View style={styles.informacion}>
                <Text style={styles.nombre}>
                  {docente.nombre} {docente.apellido}
                </Text>

                <Text style={styles.cargo}>
                  {docente.cargo}
                </Text>

                <View style={styles.programaContainer}>
                  <Ionicons
                    name="school-outline"
                    size={16}
                    color="#64748b"
                  />

                  <Text style={styles.programa}>
                    {docente.programa}
                  </Text>
                </View>

                {/* VER MÁS */}

                <TouchableOpacity
                  style={styles.botonVerMas}
                  onPress={() =>
                    router.push({
                      pathname: "/detalle-docente",
                      params: {
                        id: docente.id.toString(),
                      },
                    })
                  }
                >
                  <Text style={styles.textoVerMas}>
                    Ver más
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}

        <View style={styles.espacioFinal} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: 55,
  },

  encabezado: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 5,
    textAlign: "center",
  },

  contenedorBuscador: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  inputContainer: {
    flex: 1,
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  iconoInput: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#0f172a",
  },

  botonBuscar: {
    width: 52,
    height: 52,
    backgroundColor: "#2563eb",
    marginLeft: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: {
    flex: 1,
  },

  resultados: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  estadoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 75,
    paddingHorizontal: 25,
  },

  iconoGrande: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  estadoTexto: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  foto: {
    width: 105,
    height: 125,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },

  sinFoto: {
    width: 105,
    height: 125,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },

  informacion: {
    flex: 1,
    paddingLeft: 15,
  },

  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },

  cargo: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 9,
  },

  programaContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  programa: {
    flex: 1,
    marginLeft: 5,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
  },

  botonVerMas: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  textoVerMas: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 6,
  },

  espacioFinal: {
    height: 30,
  },
});