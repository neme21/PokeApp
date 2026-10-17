
const API_URL =
  process.env.EXPO_PUBLIC_IA_API_URL ||
  "http://172.16.2.74/:3005";

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
  }, 45000);

  try {
    const respuesta = await fetch(
      `${API_URL}/api/ia/preguntar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pregunta }),
        signal: controlador.signal,
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error || "Error del servidor IA"
      );
    }

    return datos as RespuestaIA;
  } finally {
    clearTimeout(timeout);
  }
}
