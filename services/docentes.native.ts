import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db, inicializarBaseDatos } from "../database/sqlite.native";

const API_CREATE = "https://pokeapp-sw6p.onrender.com";
const API_READ = "https://docente-read.onrender.com";
const API_UPDATE = "https://pokeapp-7yhu.onrender.com";
const API_DELETE = "https://docente-delete.onrender.com";

export type Docente = {
  id: string;
  nombre: string;
  apellido: string;
  cargo?: string | null;
  programa?: string | null;
  perfil?: string | null;
  imagen?: string | null;
  pendiente_sync?: number;
  nuevo_remoto?: number;
  visto?: number;
};
export type DatosDocente = Omit<Docente, "id" | "pendiente_sync" | "nuevo_remoto" | "visto">;
type Fila = {
  id_local: string;
  id_remoto: number | null;
  nombre: string;
  apellido: string;
  cargo: string | null;
  programa: string | null;
  perfil: string | null;
  imagen: string | null;
  pendiente_sync: number;
  eliminado: number;
  nuevo_remoto: number;
  visto: number;
};
type Remoto = {
  id: number;
  nombre: string;
  apellido: string;
  cargo?: string | null;
  programa?: string | null;
  perfil?: string | null;
  imagen?: string | null;
};
type Operacion = {
  op_id: string;
  id_local: string;
  tipo: string;
  payload: string;
};

// Coincidencia académica: nombre + apellido + programa normalizados.
// No es una identidad universal: para producción usar código institucional único.
function normalizar(valor: string | null | undefined): string {
  return (valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function mismaPersona(a: Pick<Remoto, "nombre" | "apellido" | "programa">,
                     b: Pick<Remoto, "nombre" | "apellido" | "programa">): boolean {
  return normalizar(a.nombre) === normalizar(b.nombre) &&
    normalizar(a.apellido) === normalizar(b.apellido) &&
    normalizar(a.programa) === normalizar(b.programa);
}
async function leerRemotos(): Promise<Remoto[]> {
  const response = await fetch(`${API_READ}/docentes`);
  if (!response.ok) throw new Error(`READ HTTP ${response.status}`);
  const remoto: unknown = await response.json();
  if (!Array.isArray(remoto)) throw new Error("READ no devolvió una lista de docentes");
  return remoto.map((r: unknown) => {
    if (!r || typeof r !== "object") throw new Error("Docente remoto inválido");
    const d = r as Record<string, unknown>;
    if (!Number.isSafeInteger(d.id) || typeof d.nombre !== "string" || typeof d.apellido !== "string") {
      throw new Error("READ devolvió un docente sin ID o nombre válido");
    }
    return d as Remoto;
  });
}

const uuid = () => Crypto.randomUUID();
const map = (r: Fila): Docente => ({
  id: r.id_local,
  nombre: r.nombre,
  apellido: r.apellido,
  cargo: r.cargo,
  programa: r.programa,
  perfil: r.perfil,
  imagen: r.imagen,
  pendiente_sync: r.pendiente_sync,
  nuevo_remoto: r.nuevo_remoto,
  visto: r.visto,
});

async function hayInternet(): Promise<boolean> {
  const estado = await NetInfo.fetch();
  return !!estado.isConnected && estado.isInternetReachable !== false;