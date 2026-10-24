import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_IA_API_URL || (Platform.OS === "web" ? "http://localhost:3005" : "http://192.168.1.100:3005");

export type ProveedorIA = "gemini" | "groq" | "cerebras" | "openai";
export type TiempoEspera = 20 | 40 | 80 | 160;
export type RespuestaIA = { dentro_contexto: boolean; respuesta: string; referencias: string[]; proveedor?: ProveedorIA; modelo?: string };

export async function preguntarIA(pregunta: string, proveedor: ProveedorIA = "gemini", tiempoSegundos: TiempoEspera = 40): Promise<RespuestaIA> {
  const controlador = new AbortController();
  const tiempo = setTimeout(() => controlador.abort(), tiempoSegundos * 1000);
  try {
    const respuesta = await fetch(`${API_URL}/api/ia/preguntar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: pregunta.trim(), proveedor, timeout: tiempoSegundos * 1000 }),
      signal: controlador.signal,
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
    return datos as RespuestaIA;
  } catch (error) {
    if (controlador.signal.aborted) throw new Error(`El backend no respondió dentro de ${tiempoSegundos} segundos.`);
    throw error;
  } finally { clearTimeout(tiempo); }
}
