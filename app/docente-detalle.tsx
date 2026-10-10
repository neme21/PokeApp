import { useCallback, useState } from "react";
import { detalleDocente } from "../services/docentes";

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

// =====================================================
// 1. CONFIGURACIÓN DEL MICROSERVICIO
// =====================================================


// =====================================================
// 2. ESTRUCTURA DEL DOCENTE
// =====================================================

// Campos reales devueltos por PostgreSQL mediante la API.

type Docente = {
  id: string;
  nombre: string;
  apellido?: string | null;
  cargo?: string | null;
  programa?: string | null;
  perfil?: string | null;
  imagen?: string | null;
};

// =====================================================
// 3. COMPONENTE PARA LAS TARJETAS
// =====================================================

type PropiedadesSeccion = {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  contenido: string;
};

function Seccion({
  icono,
  titulo,
  contenido,
}: PropiedadesSeccion) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tituloFila}>
        <Ionicons
          name={icono}
          size={25}
          color="#e63946"
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

// =====================================================
// 4. ENCABEZADO
// =====================================================

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.botonAtras}
        activeOpacity={0.7}
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

// =====================================================
// 5. PANTALLA PRINCIPAL
// =====================================================

export default function DocenteDetalle() {
  const parametros = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const id = Array.isArray(parametros.id)
    ? parametros.id[0]
    : parametros.id;

  // Estados
  const [docente, setDocente] = useState<Docente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reintento, setReintento] = useState(0);

  // =====================================================
  // 6. CONSULTAR DOCENTE DESDE LA API
  // =====================================================

  /*
    useFocusEffect vuelve a consultar el docente cada vez
    que la pantalla recupera el foco.

    Esto permite mostrar los datos actualizados después
    de editar un docente.
  */

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargarDocente = async () => {
        if (!id) {
          setDocente(null);
          setError("No se proporcionó el ID del docente.");
          setCargando(false);
          return;
        }

        try {
          setCargando(true);
          setError("");

          const datos = await detalleDocente(id);

          if (activo) {
            setDocente(datos);
          }
        } catch (err) {
          if (activo) {
            setDocente(null);

            setError(
              err instanceof Error
                ? err.message
                : "No se pudo consultar el docente."
            );
          }

          console.error("Error consultando docente:", err);
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

  // =====================================================
  // 7. PANTALLA DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#e63946"
          />

          <Text style={styles.textoCarga}>
            Cargando información del docente...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // 8. PANTALLA DE ERROR
  // =====================================================

  if (error || !docente) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.centro}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color="#e63946"
          />

          <Text style={styles.textoError}>
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

  // =====================================================
  // 9. PREPARAR INFORMACIÓN DEL DOCENTE
  // =====================================================

  const nombreCompleto = [
    docente.nombre,
    docente.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  const perfilProfesional =
    docente.perfil?.trim() ||
    "Este docente todavía no tiene un perfil profesional registrado.";

  // =====================================================
  // 10. INTERFAZ PRINCIPAL
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* ENCABEZADO FIJO */}

      <Header />

      {/* CONTENIDO DESPLAZABLE */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* PERFIL PRINCIPAL */}

        <View style={styles.perfilPrincipal}>
          {docente.imagen ? (
            <Image
              source={{ uri: docente.imagen }}
              style={styles.imagen}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.imagen,
                styles.sinImagen,
              ]}
            >
              <Ionicons
                name="person"
                size={60}
                color="#777777"
              />
            </View>
          )}

          <Text style={styles.nombre}>
            {nombreCompleto}
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

        {/* PERFIL PROFESIONAL DESDE POSTGRESQL */}

        <Seccion
          icono="document-text-outline"
          titulo="Perfil profesional"
          contenido={perfilProfesional}
        />

        {/* CARGO */}

        {docente.cargo ? (
          <Seccion
            icono="briefcase-outline"
            titulo="Cargo académico"
            contenido={docente.cargo}
          />
        ) : null}

        {/* PROGRAMA */}

        {docente.programa ? (
          <Seccion
            icono="school-outline"
            titulo="Programa académico"
            contenido={docente.programa}
          />
        ) : null}

        {/* INFORMACIÓN DEL REGISTRO */}

        <View style={styles.registro}>
          <Ionicons
            name="server-outline"
            size={18}
            color="#888888"
          />

          <Text style={styles.textoRegistro}>
            Docente registrado con ID #{docente.id}
          </Text>
        </View>

        <View style={styles.espacioFinal} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// 11. ESTILOS
// =====================================================

const styles = StyleSheet.create({
  // Pantalla
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  // Encabezado
  header: {
    backgroundColor: "#e63946",
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

  contenido: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 80,
  },

  // Perfil
  perfilPrincipal: {
    alignItems: "center",
    marginBottom: 32,
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
    color: "#e63946",
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

  // Tarjetas
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
  registro: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  textoRegistro: {
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

  textoCarga: {
    fontSize: 16,
    color: "#666666",
    marginTop: 15,
    textAlign: "center",
  },

  textoError: {
    fontSize: 16,
    color: "#555555",
    marginTop: 15,
    textAlign: "center",
  },

  botonReintentar: {
    backgroundColor: "#e63946",
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