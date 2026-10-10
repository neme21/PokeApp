import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// =====================================================
// 1. CONFIGURACIÓN DEL MICROSERVICIO
// =====================================================

const API =
  process.env.EXPO_PUBLIC_DOCENTES_API_URL ||
  "https://pokeanime-docentes-api.onrender.com";

// =====================================================
// 2. TIPOS DE DATOS
// =====================================================

type Campo =
  | "nombre"
  | "cargo"
  | "programa"
  | "descripcion"
  | "imagen";

type DatosDocente = Record<Campo, string>;

const datosIniciales: DatosDocente = {
  nombre: "",
  cargo: "",
  programa: "",
  descripcion: "",
  imagen: "",
};

// =====================================================
// 3. COMPONENTE PRINCIPAL
// =====================================================

export default function DocenteFormulario() {
  const parametros = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(parametros.id)
    ? parametros.id[0]
    : parametros.id;

  const editando = Boolean(id);

  // Estados del formulario
  const [datos, setDatos] = useState<DatosDocente>(datosIniciales);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Mensajes visibles en pantalla
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // =====================================================
  // 4. ACTUALIZAR CAMPOS DEL FORMULARIO
  // =====================================================

  const actualizarCampo = (campo: Campo, valor: string) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setError("");
    setMensajeExito("");
  };

  // =====================================================
  // 5. CONSULTAR DOCENTE PARA EDITAR
  // =====================================================

  useEffect(() => {
    let activo = true;

    const cargarDocente = async () => {
      if (!id) {
        setDatos({ ...datosIniciales });
        return;
      }

      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `${API}/docentes/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        if (!respuesta.ok) {
          throw new Error(
            `No se pudo consultar el docente. HTTP ${respuesta.status}`
          );
        }

        const docente = await respuesta.json();

        if (activo) {
          setDatos({
            nombre: docente.nombre ?? "",
            cargo: docente.cargo ?? "",
            programa: docente.programa ?? "",
            descripcion: docente.descripcion ?? "",
            imagen: docente.imagen ?? "",
          });
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al consultar el docente."
          );
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
  }, [id]);

  // =====================================================
  // 6. MOSTRAR MENSAJES
  // =====================================================

  const mostrarError = (mensaje: string) => {
    setError(mensaje);
    setMensajeExito("");

    if (Platform.OS !== "web") {
      Alert.alert("Error", mensaje);
    }
  };

  // =====================================================
  // 7. GUARDAR DOCENTE (POST O PUT)
  // =====================================================

  const guardarDocente = async () => {
    if (guardando || cargando) return;

    // Validar nombre
    if (!datos.nombre.trim()) {
      mostrarError("El nombre del docente es obligatorio.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeExito("");

    // Elegir operación según exista un ID
    const metodo = editando ? "PUT" : "POST";

    const url = editando
      ? `${API}/docentes/${encodeURIComponent(id!)}`
      : `${API}/docentes`;

    // Datos que se enviarán a PostgreSQL
    const cuerpo = {
      nombre: datos.nombre.trim(),
      cargo: datos.cargo.trim(),
      programa: datos.programa.trim(),
      descripcion: datos.descripcion.trim(),
      imagen: datos.imagen.trim(),
    };

    try {
      console.log("========== CRUD DOCENTES ==========");
      console.log("Operación:", metodo);
      console.log("URL:", url);
      console.log("Datos:", cuerpo);

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpo),
      });

      // Leer respuesta del servidor
      const texto = await respuesta.text();

      console.log("Estado HTTP:", respuesta.status);
      console.log("Respuesta:", texto);

      if (!respuesta.ok) {
        throw new Error(
          `El servidor respondió HTTP ${respuesta.status}.\n${texto.slice(0, 500)}`
        );
      }

      const mensaje = editando
        ? "Docente actualizado correctamente."
        : "Docente registrado correctamente.";

      setMensajeExito(mensaje);

      if (Platform.OS !== "web") {
        Alert.alert("Operación exitosa", mensaje);
      }

      // Volver al listado o pantalla anterior
      router.back();
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "Ocurrió un error desconocido.";

      console.error("ERROR CRUD DOCENTES:", err);

      mostrarError(
        `No fue posible guardar el docente.\n\n${mensaje}`
      );
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // 8. COMPONENTE REUTILIZABLE DE CAMPO
  // =====================================================

  const CampoFormulario = ({
    campo,
    etiqueta,
    obligatorio = false,
    multilinea = false,
  }: {
    campo: Campo;
    etiqueta: string;
    obligatorio?: boolean;
    multilinea?: boolean;
  }) => (
    <View style={styles.grupo}>
      <Text style={styles.etiqueta}>
        {etiqueta}
        {obligatorio ? " *" : ""}
      </Text>

      <TextInput
        style={[
          styles.input,
          multilinea && styles.inputMultilinea,
        ]}
        value={datos[campo]}
        onChangeText={(valor) => actualizarCampo(campo, valor)}
        placeholder={`Ingrese ${etiqueta.toLowerCase()}`}
        placeholderTextColor="#999"
        multiline={multilinea}
        textAlignVertical={multilinea ? "top" : "center"}
        editable={!guardando && !cargando}
        autoCapitalize={campo === "imagen" ? "none" : "sentences"}
      />
    </View>
  );

  // =====================================================
  // 9. INTERFAZ DEL FORMULARIO
  // =====================================================

  return (
    <View style={styles.container}>
      {/* ENCABEZADO */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonVolver}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#ffffff"
          />
        </TouchableOpacity>

        <Text style={styles.tituloHeader}>
          {editando ? "Editar docente" : "Nuevo docente"}
        </Text>
      </View>

      {/* CONTENIDO */}

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#e63946"
          />

          <Text style={styles.textoCarga}>
            Consultando información...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* TÍTULO */}

          <View style={styles.encabezadoFormulario}>
            <Ionicons
              name={editando ? "create-outline" : "person-add-outline"}
              size={30}
              color="#e63946"
            />

            <Text style={styles.tituloFormulario}>
              {editando
                ? "Actualizar información"
                : "Registrar nuevo docente"}
            </Text>

            <Text style={styles.subtitulo}>
              {editando
                ? "Modifica los datos del docente y guarda los cambios."
                : "Completa la información para registrar un docente."}
            </Text>
          </View>

          {/* MENSAJE DE ERROR */}

          {error ? (
            <View style={styles.cajaError}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color="#b42318"
              />

              <Text style={styles.textoError}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* MENSAJE DE ÉXITO */}

          {mensajeExito ? (
            <View style={styles.cajaExito}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#16803c"
              />

              <Text style={styles.textoExito}>
                {mensajeExito}
              </Text>
            </View>
          ) : null}

          {/* CAMPOS */}

          <CampoFormulario
            campo="nombre"
            etiqueta="Nombre completo"
            obligatorio
          />

          <CampoFormulario
            campo="cargo"
            etiqueta="Cargo"
          />

          <CampoFormulario
            campo="programa"
            etiqueta="Programa"
          />

          <CampoFormulario
            campo="descripcion"
            etiqueta="Descripción"
            multilinea
          />

          <CampoFormulario
            campo="imagen"
            etiqueta="URL de imagen"
          />

          {/* BOTÓN GUARDAR */}

          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando && styles.botonDeshabilitado,
            ]}
            onPress={guardarDocente}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {guardando ? (
              <View style={styles.filaBoton}>
                <ActivityIndicator color="#ffffff" />

                <Text style={styles.textoBoton}>
                  Guardando...
                </Text>
              </View>
            ) : (
              <View style={styles.filaBoton}>
                <Ionicons
                  name="save-outline"
                  size={22}
                  color="#ffffff"
                />

                <Text style={styles.textoBoton}>
                  {editando
                    ? "Guardar cambios"
                    : "Registrar docente"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* BOTÓN CANCELAR */}

          <TouchableOpacity
            style={styles.botonCancelar}
            onPress={() => router.back()}
            disabled={guardando}
          >
            <Text style={styles.textoCancelar}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

// =====================================================
// 10. ESTILOS
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
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  botonVolver: {
    marginRight: 16,
  },

  tituloHeader: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "bold",
  },

  // Scroll
  scroll: {
    flex: 1,
    width: "100%",
  },

  contenido: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 70,
  },

  // Encabezado del formulario
  encabezadoFormulario: {
    alignItems: "center",
    marginBottom: 28,
  },

  tituloFormulario: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#222",
    marginTop: 10,
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },

  // Campos
  grupo: {
    marginBottom: 20,
  },

  etiqueta: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#222",
    minHeight: 50,
  },

  inputMultilinea: {
    height: 120,
    paddingTop: 14,
  },

  // Guardar
  botonGuardar: {
    backgroundColor: "#e63946",
    paddingVertical: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  filaBoton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  textoBoton: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  // Cancelar
  botonCancelar: {
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 12,
  },

  textoCancelar: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  // Errores
  cajaError: {
    backgroundColor: "#fff0ee",
    borderWidth: 1,
    borderColor: "#f5b4ae",
    borderRadius: 10,
    padding: 15,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  textoError: {
    color: "#b42318",
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },

  // Éxito
  cajaExito: {
    backgroundColor: "#edf9f0",
    borderWidth: 1,
    borderColor: "#a9dcb7",
    borderRadius: 10,
    padding: 15,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  textoExito: {
    color: "#16803c",
    fontSize: 15,
    flex: 1,
  },

  // Carga
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  textoCarga: {
    fontSize: 16,
    color: "#666",
    marginTop: 14,
  },
});