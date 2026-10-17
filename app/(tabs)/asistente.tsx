
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { preguntarIA } from "../../services/asistenteService";

type Mensaje = {
  id: string;
  texto: string;
  autor: "usuario" | "ia";
  fueraContexto?: boolean;
};

const BIENVENIDA: Mensaje = {
  id: "bienvenida",
  autor: "ia",
  texto:
    "¡Hola! Soy el asistente de PokeApp. " +
    "Puedo responder preguntas sobre los Pokémon " +
    "y personajes de anime registrados en nuestra base de datos.",
};

export default function AsistenteScreen() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    BIENVENIDA,
  ]);

  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const enviandoRef = useRef(false);

  async function enviarPregunta() {
    const texto = pregunta.trim();

    if (!texto || enviandoRef.current) {
      return;
    }

    enviandoRef.current = true;
    setCargando(true);
    setPregunta("");

    const mensajeUsuario: Mensaje = {
      id: `${Date.now()}-usuario`,
      texto,
      autor: "usuario",
    };

    setMensajes(actual => [
      ...actual,
      mensajeUsuario,
    ]);

    try {
      const resultado = await preguntarIA(texto);

      const mensajeIA: Mensaje = {
        id: `${Date.now()}-ia`,
        texto: resultado.respuesta,
        autor: "ia",
        fueraContexto: !resultado.dentro_contexto,
      };

      setMensajes(actual => [
        ...actual,
        mensajeIA,
      ]);
    } catch (error) {
      const detalle =
        error instanceof Error
          ? error.message
          : "Error desconocido";

      setMensajes(actual => [
        ...actual,
        {
          id: `${Date.now()}-error`,
          autor: "ia",
          texto:
            "No pude conectar con el asistente.\n" +
            detalle,
        },
      ]);
    } finally {
      setCargando(false);
      enviandoRef.current = false;
    }
  }

  function limpiarChat() {
    if (enviandoRef.current) return;

    setMensajes([BIENVENIDA]);
    setPregunta("");
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.logo}>
          <Ionicons
            name="sparkles"
            size={25}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.titulos}>
          <Text style={styles.titulo}>
            Asistente PokeApp
          </Text>
          <Text style={styles.subtitulo}>
            Pokémon y personajes registrados
          </Text>
        </View>

        <TouchableOpacity
          onPress={limpiarChat}
          disabled={cargando}
        >
          <Ionicons
            name="trash-outline"
            size={23}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.area}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 90 : 0
        }
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContenido}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({
              animated: true,
            });
          }}
        >
          {mensajes.map(mensaje => {
            const esUsuario =
              mensaje.autor === "usuario";

            return (
              <View
                key={mensaje.id}
                style={[
                  styles.burbuja,
                  esUsuario
                    ? styles.burbujaUsuario
                    : styles.burbujaIA,
                  mensaje.fueraContexto
                    ? styles.burbujaRechazo
                    : null,
                ]}
              >
                {!esUsuario && (
                  <Text style={styles.etiqueta}>
                    {mensaje.fueraContexto
                      ? "FUERA DE CONTEXTO"
                      : "ASISTENTE IA"}
                  </Text>
                )}

                <Text
                  style={[
                    styles.textoMensaje,
                    esUsuario && styles.textoUsuario,
                  ]}
                >
                  {mensaje.texto}
                </Text>
              </View>
            );
          })}

          {cargando && (
            <View style={styles.cargando}>
              <ActivityIndicator
                size="small"
                color="#48A9FF"
              />
              <Text style={styles.cargandoTexto}>
                Consultando base de datos e IA...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.pie}>
          <Text style={styles.aviso}>
            Solo se permiten consultas sobre los
            registros de PokeApp.
          </Text>

          <View style={styles.entradaContenedor}>
            <TextInput
              style={styles.entrada}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#8794A5"
              value={pregunta}
              onChangeText={setPregunta}
              multiline
              maxLength={500}
              editable={!cargando}
            />

            <TouchableOpacity
              style={[
                styles.botonEnviar,
                (cargando || !pregunta.trim()) &&
                  styles.botonDeshabilitado,
              ]}
              onPress={enviarPregunta}
              disabled={cargando || !pregunta.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#0B1526",
  },
  area: {
    flex: 1,
  },
  encabezado: {
    backgroundColor: "#152942",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    backgroundColor: "#1769AA",
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  titulos: {
    flex: 1,
  },
  titulo: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitulo: {
    fontSize: 12,
    color: "#AFC3D8",
    marginTop: 3,
  },
  chat: {
    flex: 1,
  },
  chatContenido: {
    padding: 15,
    paddingBottom: 25,
  },
  burbuja: {
    maxWidth: "88%",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  burbujaUsuario: {
    alignSelf: "flex-end",
    backgroundColor: "#1769AA",
    borderBottomRightRadius: 4,
  },
  burbujaIA: {
    alignSelf: "flex-start",
    backgroundColor: "#22364F",
    borderBottomLeftRadius: 4,
  },
  burbujaRechazo: {
    backgroundColor: "#493039",
    borderWidth: 1,
    borderColor: "#A95364",
  },
  etiqueta: {
    color: "#83C8FF",
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 7,
  },
  textoMensaje: {
    color: "#E8EFF7",
    fontSize: 15,
    lineHeight: 22,
  },
  textoUsuario: {
    color: "#FFFFFF",
  },
  cargando: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  cargandoTexto: {
    color: "#AFC3D8",
    fontSize: 13,
  },
  pie: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#152942",
  },
  aviso: {
    color: "#AFC3D8",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 9,
  },
  entradaContenedor: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22364F",
    borderRadius: 25,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  entrada: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    maxHeight: 110,
    paddingVertical: 10,
  },
  botonEnviar: {
    backgroundColor: "#1769AA",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
});
