import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { crearDocente, detalleDocente, editarDocente } from "../services/docentes";


type Campo = "nombre" | "apellido" | "cargo" | "programa" | "descripcion" | "imagen";
type DatosDocente = Record<Campo, string>;

const datosIniciales: DatosDocente = {
  nombre: "",
  apellido: "",
  cargo: "",
  programa: "",
  descripcion: "",
  imagen: "",
};

type CampoFormularioProps = {
  campo: Campo;
  etiqueta: string;
  valor: string;
  alCambiar: (campo: Campo, valor: string) => void;
  deshabilitado: boolean;
  obligatorio?: boolean;
  multilinea?: boolean;
};

// Fuera del componente principal para conservar el foco al escribir.
function CampoFormulario({
  campo,
  etiqueta,
  valor,
  alCambiar,
  deshabilitado,
  obligatorio = false,
  multilinea = false,
}: CampoFormularioProps) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.etiqueta}>
        {etiqueta}{obligatorio ? " *" : ""}
      </Text>
      <TextInput
        style={[styles.input, multilinea && styles.inputMultilinea]}
        value={valor}
        onChangeText={(texto) => alCambiar(campo, texto)}
        placeholder={`Ingrese ${etiqueta.toLowerCase()}`}
        placeholderTextColor="#999"
        multiline={multilinea}
        textAlignVertical={multilinea ? "top" : "center"}
        editable={!deshabilitado}
        autoCapitalize={campo === "imagen" ? "none" : "words"}
        autoCorrect={campo !== "imagen"}
      />
    </View>
  );
}

export default function DocenteFormulario() {
  const parametros = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(parametros.id) ? parametros.id[0] : parametros.id;
  const editando = Boolean(id);

  const [datos, setDatos] = useState<DatosDocente>({ ...datosIniciales });
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const actualizarCampo = (campo: Campo, valor: string) => {
    setDatos((anterior) => ({ ...anterior, [campo]: valor }));
    setError("");
    setMensajeExito("");
  };

  useEffect(() => {
    let activo = true;

    const cargarDocente = async () => {
      if (!id) {
        setDatos({ ...datosIniciales });
        setError("");
        setCargando(false);
        return;
      }

      setCargando(true);
      setError("");
      try {
        const docente = await detalleDocente(id);
        if (activo) {
          setDatos({
            nombre: docente.nombre ?? "",
            apellido: docente.apellido ?? "",
            cargo: docente.cargo ?? "",
            programa: docente.programa ?? "",
            descripcion: docente.perfil ?? docente.descripcion ?? "",
            imagen: docente.imagen ?? "",
          });
        }
      } catch (err) {
        if (activo) {
          setError(err instanceof Error ? err.message : "Error al consultar el docente.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargarDocente();
    return () => { activo = false; };
  }, [id]);

  const mostrarError = (mensaje: string) => {
    setError(mensaje);
    setMensajeExito("");
    if (Platform.OS !== "web") Alert.alert("Error", mensaje);
  };

  const guardarDocente = async () => {
    if (guardando || cargando) return;

    if (!datos.nombre.trim()) {
      mostrarError("El nombre del docente es obligatorio.");
      return;
    }
    if (!datos.apellido.trim()) {
      mostrarError("El apellido del docente es obligatorio.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensajeExito("");


    const cuerpo = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      cargo: datos.cargo.trim(),
      programa: datos.programa.trim(),
      perfil: datos.descripcion.trim(),
      imagen: datos.imagen.trim(),
    };

    try {
      if (editando && id) await editarDocente(id, cuerpo);
      else await crearDocente(cuerpo);

      const mensaje = editando
        ? "Docente guardado. Se enviará a la nube cuando haya conexión."
        : "Docente guardado. Se enviará a la nube cuando haya conexión.";
      setMensajeExito(mensaje);
      if (Platform.OS !== "web") Alert.alert("Operación exitosa", mensaje);
      router.back();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      console.error("ERROR CRUD DOCENTES:", err);
      mostrarError(`No fue posible guardar el docente.\n\n${mensaje}`);
    } finally {
      setGuardando(false);
    }
  };

  const deshabilitado = cargando || guardando;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botonVolver}>
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>{editando ? "Editar docente" : "Nuevo docente"}</Text>
      </View>

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.textoCarga}>Consultando información...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.encabezadoFormulario}>
            <Ionicons
              name={editando ? "create-outline" : "person-add-outline"}
              size={30}
              color="#e63946"
            />
            <Text style={styles.tituloFormulario}>
              {editando ? "Actualizar información" : "Registrar nuevo docente"}
            </Text>
            <Text style={styles.subtitulo}>
              {editando
                ? "Modifica los datos del docente y guarda los cambios."
                : "Completa la información para registrar un docente."}
            </Text>
          </View>

          {!!error && (
            <View style={styles.cajaError}>
              <Ionicons name="alert-circle-outline" size={24} color="#b42318" />
              <Text style={styles.textoError}>{error}</Text>
            </View>
          )}
          {!!mensajeExito && (
            <View style={styles.cajaExito}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#16803c" />
              <Text style={styles.textoExito}>{mensajeExito}</Text>
            </View>
          )}

          <CampoFormulario campo="nombre" etiqueta="Nombre" valor={datos.nombre} alCambiar={actualizarCampo} deshabilitado={deshabilitado} obligatorio />
          <CampoFormulario campo="apellido" etiqueta="Apellido" valor={datos.apellido} alCambiar={actualizarCampo} deshabilitado={deshabilitado} obligatorio />
          <CampoFormulario campo="cargo" etiqueta="Cargo" valor={datos.cargo} alCambiar={actualizarCampo} deshabilitado={deshabilitado} />
          <CampoFormulario campo="programa" etiqueta="Programa" valor={datos.programa} alCambiar={actualizarCampo} deshabilitado={deshabilitado} />
          <CampoFormulario campo="descripcion" etiqueta="Perfil profesional" valor={datos.descripcion} alCambiar={actualizarCampo} deshabilitado={deshabilitado} multilinea />
          <CampoFormulario campo="imagen" etiqueta="URL de imagen" valor={datos.imagen} alCambiar={actualizarCampo} deshabilitado={deshabilitado} />

          <TouchableOpacity
            style={[styles.botonGuardar, deshabilitado && styles.botonDeshabilitado]}
            onPress={guardarDocente}
            disabled={deshabilitado}
            activeOpacity={0.8}
          >
            <View style={styles.filaBoton}>
              {guardando ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="save-outline" size={22} color="#ffffff" />}
              <Text style={styles.textoBoton}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar docente"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} disabled={guardando}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: { backgroundColor: "#e63946", paddingHorizontal: 22, paddingVertical: 18, flexDirection: "row", alignItems: "center" },
  botonVolver: { marginRight: 16 },
  tituloHeader: { color: "#ffffff", fontSize: 21, fontWeight: "bold" },
  scroll: { flex: 1, width: "100%" },
  contenido: { width: "100%", maxWidth: 800, alignSelf: "center", paddingHorizontal: 22, paddingTop: 28, paddingBottom: 70 },
  encabezadoFormulario: { alignItems: "center", marginBottom: 28 },
  tituloFormulario: { fontSize: 23, fontWeight: "bold", color: "#222", marginTop: 10, textAlign: "center" },
  subtitulo: { fontSize: 15, color: "#666", textAlign: "center", marginTop: 8 },
  grupo: { marginBottom: 20 },
  etiqueta: { fontSize: 16, fontWeight: "600", color: "#222", marginBottom: 8 },
  input: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: "#222", minHeight: 50 },
  inputMultilinea: { height: 120, paddingTop: 14 },
  botonGuardar: { backgroundColor: "#e63946", paddingVertical: 17, borderRadius: 12, alignItems: "center", marginTop: 8 },
  botonDeshabilitado: { opacity: 0.65 },
  filaBoton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  textoBoton: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  botonCancelar: { paddingVertical: 17, alignItems: "center", marginTop: 12 },
  textoCancelar: { fontSize: 16, color: "#666", fontWeight: "600" },
  cajaError: { backgroundColor: "#fff0ee", borderWidth: 1, borderColor: "#f5b4ae", borderRadius: 10, padding: 15, marginBottom: 22, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  textoError: { color: "#b42318", fontSize: 14, lineHeight: 21, flex: 1 },
  cajaExito: { backgroundColor: "#edf9f0", borderWidth: 1, borderColor: "#a9dcb7", borderRadius: 10, padding: 15, marginBottom: 22, flexDirection: "row", alignItems: "center", gap: 10 },
  textoExito: { color: "#16803c", fontSize: 15, flex: 1 },
  centro: { flex: 1, justifyContent: "center", alignItems: "center", padding: 25 },
  textoCarga: { fontSize: 16, color: "#666", marginTop: 14 },
});
