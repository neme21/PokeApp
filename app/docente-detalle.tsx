import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

// URL del microservicio desplegado en Render
const API =
  process.env.EXPO_PUBLIC_DOCENTES_API_URL ||
  "https://pokeanime-docentes-api.onrender.com";

// Estructura de datos del docente
type Docente = {
  id: number;
  nombre: string;
  cargo?: string;
  programa?: string;
  correo?: string;
  descripcion?: string;
  imagen?: string;
};

// Componente reutilizable para mostrar información
function Seccion({
  icono,
  titulo,
  contenido,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  contenido: string;
}) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tituloFila}>
        <Ionicons
          name={icono}
          size={25}
          color="#ef3340"
          style={styles.icono}
        />

        <Text style={styles.tituloTarjeta}>
          {titulo}
        </Text>
      </View>

      <Text style={styles.contenidoTarjeta}>
        {contenido}
      </Text>
    </View>
  );
}

// Encabezado de la pantalla
function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.botonAtras}
      >
        <Ionicons
          name="arrow-back"
          size={28}
          color="#ffffff"
        />
      </TouchableOpacity>

      <Text style={styles.headerTitulo}>
        Detalle del docente
      </Text>
    </View>
  );
}

// Pantalla principal
export default function DocenteDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [docente, setDocente] = useState<Docente | null>(null);

  const [error, setError] = useState("");

  const [cargando, setCargando] = useState(true);

  const [reintento, setReintento] = useState(0);

  /*
    Cada vez que la pantalla obtiene el foco,
    vuelve a consultar el microservicio.

    Esto permite visualizar los cambios después
    de actualizar un docente.
  */
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargarDocente = async () => {
        if (!id) {
          setError("No se proporcionó el ID del docente.");
          setCargando(false);
          return;
        }

        try {
          setCargando(true);
          setError("");

          const respuesta = await fetch(
            `${API}/docentes/${encodeURIComponent(id)}`,
            {
              cache: "no-store",
            }
          );

          if (!respuesta.ok) {
            if (respuesta.status === 404) {
              throw new Error("El docente no fue encontrado.");
            }

            throw new Error(
              `Error del servidor: ${respuesta.status}`
            );
          }

          const data: Docente = await respuesta.json();

          if (activo) {
            setDocente(data);
          }
        } catch (err) {
          console.error("Error al consultar docente:", err);

          if (activo) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo cargar la información del docente."
            );

            setDocente(null);
          }
        } finally {
          if (activo) {
            setCargando(false);
          }
        }
      };

      cargarDocente();

      return () => {
        activo = false;
      };
    }, [id, reintento])
  );

  // Pantalla de carga
  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#ef3340"
          />

          <Text style={styles.cargandoTexto}>
            Consultando información del docente...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla de error
  if (error || !docente) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.centro}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color="#ef3340"
          />

          <Text style={styles.errorTexto}>
            {error || "No se encontró información del docente."}
          </Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={() => setReintento((valor) => valor + 1)}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#ffffff"
            />

            <Text style={styles.textoBoton}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado fijo */}
      <Header />

      {/* Contenido desplazable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información principal */}
        <View style={styles.perfil}>
          {docente.imagen ? (
            <Image
              source={{ uri: docente.imagen }}
              style={styles.imagen}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagen, styles.sinImagen]}>
              <Ionicons
                name="person"
                size={60}
                color="#777777"
              />
            </View>
          )}

          <Text style={styles.nombre}>
            {docente.nombre}
          </Text>

          {docente.cargo ? (
            <Text style={styles.cargo}>
              {docente.cargo}
            </Text>
          ) : null}

          {docente.programa ? (
            <Text style={styles.programa}>
              {docente.programa}
            </Text>
          ) : null}
        </View>

        {/* Descripción obtenida desde PostgreSQL */}
        <Seccion
          icono="document-text-outline"
          titulo="Descripción profesional"
          contenido={
            docente.descripcion?.trim() ||
            "Este docente todavía no tiene una descripción registrada."
          }
        />

        {/* Información académica */}
        {docente.programa ? (
          <Seccion
            icono="school-outline"
            titulo="Programa académico"
            contenido={docente.programa}
          />
        ) : null}

        {/* Cargo */}
        {docente.cargo ? (
          <Seccion
            icono="briefcase-outline"
            titulo="Cargo"
            contenido={docente.cargo}
          />
        ) : null}

        {/* Correo institucional */}
        {docente.correo ? (
          <Seccion
            icono="mail-outline"
            titulo="Correo institucional"
            contenido={docente.correo}
          />
        ) : null}

        {/* Identificador del registro */}
        <View style={styles.identificador}>
          <Ionicons
            name="server-outline"
            size={17}
            color="#888888"
          />

          <Text style={styles.identificadorTexto}>
            Registro de docente #{docente.id}
          </Text>
        </View>

        <View style={styles.espacioFinal} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  // Encabezado
  header: {
    backgroundColor: "#ef3340",
    minHeight: 74,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  botonAtras: {
    paddingVertical: 12,
    paddingRight: 18,
  },

  headerTitulo: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    flexShrink: 1,
  },

  // Scroll
  scroll: {
    flex: 1,
    width: "100%",
  },

  body: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 80,
  },

  // Perfil principal
  perfil: {
    alignItems: "center",
    marginBottom: 30,
  },

  imagen: {
    width: 125,
    height: 125,
    borderRadius: 63,
    marginBottom: 20,
    backgroundColor: "#eeeeee",
  },

  sinImagen: {
    justifyContent: "center",
    alignItems: "center",
  },

  nombre: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#222222",
    textAlign: "center",
  },

  cargo: {
    fontSize: 18,
    color: "#ef3340",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },

  programa: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },

  // Tarjetas de información
  tarjeta: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 18,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  icono: {
    marginRight: 12,
  },

  tituloTarjeta: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333333",
    flexShrink: 1,
  },

  contenidoTarjeta: {
    fontSize: 16,
    color: "#555555",
    lineHeight: 25,
  },

  // Identificador
  identificador: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  identificadorTexto: {
    marginLeft: 8,
    color: "#888888",
    fontSize: 13,
  },

  // Carga y errores
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  cargandoTexto: {
    marginTop: 15,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },

  errorTexto: {
    marginTop: 15,
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
  },

  botonReintentar: {
    backgroundColor: "#ef3340",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  textoBoton: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  espacioFinal: {
    height: 30,
  },
});