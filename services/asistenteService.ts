
import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_IA_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:3005"
    : "http://192.168.1.100:3005");

export type RespuestaIA = {
  dentro_contexto: boolean;
  respuesta: string;
  referencias: string[];
};

export async function preguntarIA(
  pregunta: string
): Promise<RespuestaIA> {
  const controlador = new AbortController();

  const timeout = setTimeout(() => {
    controlador.abort();
  }, 120000);

  try {
    console.log("[IA] Conectando a:", API_URL);

    const respuesta = await fetch(
      `${API_URL}/api/ia/preguntar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta: pregunta.trim(),
        }),
        signal: controlador.signal,
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
        `Error HTTP ${respuesta.status}`
      );
    }

    return datos as RespuestaIA;
  } catch (error) {
    console.error("[IA] Error de conexión:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
