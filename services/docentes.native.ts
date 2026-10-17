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
}

export async function listarDocentes(nombre = ""): Promise<Docente[]> {
  await inicializarBaseDatos();
  const patron = `%${nombre}%`;
  const rows = await db.getAllAsync<Fila>(
    "SELECT * FROM docentes WHERE eliminado=0 AND (nombre LIKE ? OR apellido LIKE ?) ORDER BY nombre, apellido",
    patron,
    patron
  );
  return rows.map(map);
}

export async function detalleDocente(id: string): Promise<Docente> {
  await inicializarBaseDatos();
  const fila = await db.getFirstAsync<Fila>(
    "SELECT * FROM docentes WHERE id_local=? AND eliminado=0",
    id
  );
  if (!fila) throw new Error("Docente no encontrado en SQLite");
  return map(fila);
}

export async function crearDocente(datos: DatosDocente): Promise<Docente> {
  await inicializarBaseDatos();
  const id = uuid();
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync(
      "INSERT INTO docentes (id_local,nombre,apellido,cargo,programa,perfil,imagen,actualizado_en,pendiente_sync) VALUES (?,?,?,?,?,?,?,?,1)",
      id, datos.nombre, datos.apellido, datos.cargo ?? null, datos.programa ?? null,
      datos.perfil ?? null, datos.imagen ?? null, fecha
    );
    await tx.runAsync(
      "INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",
      uuid(), id, "CREATE", JSON.stringify(datos), fecha
    );
  });
  void sincronizarPendientes().catch(console.warn);
  return detalleDocente(id);
}

export async function editarDocente(id: string, datos: DatosDocente): Promise<void> {
  await inicializarBaseDatos();
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    const r = await tx.runAsync(
      "UPDATE docentes SET nombre=?,apellido=?,cargo=?,programa=?,perfil=?,imagen=?,actualizado_en=?,pendiente_sync=1 WHERE id_local=? AND eliminado=0",
      datos.nombre, datos.apellido, datos.cargo ?? null, datos.programa ?? null,
      datos.perfil ?? null, datos.imagen ?? null, fecha, id
    );
    if (!r.changes) throw new Error("Docente local no encontrado");
    await tx.runAsync(
      "INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",
      uuid(), id, "UPDATE", JSON.stringify(datos), fecha
    );
  });
  void sincronizarPendientes().catch(console.warn);
}

export async function eliminarDocente(id: string): Promise<void> {
  await inicializarBaseDatos();
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    const r = await tx.runAsync(
      "UPDATE docentes SET eliminado=1,pendiente_sync=1,actualizado_en=? WHERE id_local=? AND eliminado=0",
      fecha, id
    );
    if (!r.changes) throw new Error("Docente local no encontrado");
    await tx.runAsync(
      "INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",
      uuid(), id, "DELETE", "{}", fecha
    );
  });
  void sincronizarPendientes().catch(console.warn);
}

let ejecutando: Promise<number> | null = null;
export function sincronizarPendientes(): Promise<number> {
  if (ejecutando) return ejecutando;
  ejecutando = enviarPendientes().finally(() => { ejecutando = null; });
  return ejecutando;
}

async function enviarPendientes(): Promise<number> {
  await inicializarBaseDatos();
  if (!(await hayInternet())) return 0;
  const ops = await db.getAllAsync<Operacion>(
    "SELECT op_id,id_local,tipo,payload FROM sync_outbox ORDER BY creado_en,rowid"
  );
  let enviados = 0;
  for (const op of ops) {
    const fila = await db.getFirstAsync<{ id_remoto: number | null }>(
      "SELECT id_remoto FROM docentes WHERE id_local=?", op.id_local
    );
    if (!fila) throw new Error(`No existe el docente local ${op.id_local}`);
    const idRemoto = fila.id_remoto;
    let url: string;
    let method: "POST" | "PUT" | "DELETE";
    let body: string | undefined;
    if (op.tipo === "CREATE") {
      url = `${API_CREATE}/docentes`;
      method = "POST";
      body = op.payload;
    } else if (op.tipo === "UPDATE") {
      if (idRemoto == null) throw new Error(`UPDATE sin ID remoto: ${op.id_local}`);
      url = `${API_UPDATE}/docentes/${idRemoto}`;
      method = "PUT";
      body = op.payload;
    } else if (op.tipo === "DELETE") {
      if (idRemoto == null) throw new Error(`DELETE sin ID remoto: ${op.id_local}`);
      url = `${API_DELETE}/docentes/${idRemoto}`;
      method = "DELETE";
    } else {
      throw new Error(`Operación desconocida: ${op.tipo}`);
    }
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "Idempotency-Key": op.op_id },
      body,
    });
    if (!response.ok) {
      throw new Error(`${op.tipo} HTTP ${response.status}: ${(await response.text()).slice(0, 180)}`);
    }
    const resultado: { id?: number } = await response.json();
    let nuevoIdRemoto = idRemoto;
    if (op.tipo === "CREATE") {
      const id = Number(resultado.id);
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("CREATE no devolvió ID remoto válido");
      nuevoIdRemoto = id;
    }
    await db.withExclusiveTransactionAsync(async tx => {
      if (nuevoIdRemoto != null) {
        await tx.runAsync("UPDATE docentes SET id_remoto=? WHERE id_local=?", nuevoIdRemoto, op.id_local);
      }
      await tx.runAsync("DELETE FROM sync_outbox WHERE op_id=?", op.op_id);
      const resto = await tx.getFirstAsync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM sync_outbox WHERE id_local=?", op.id_local
      );
      if ((resto?.total ?? 0) === 0) {
        await tx.runAsync("UPDATE docentes SET pendiente_sync=0 WHERE id_local=?", op.id_local);
      }
    });
    enviados++;
  }
  return enviados;
}

let sincronizacionTotal: Promise<{ enviados: number; recibidos: number; nuevos: number }> | null = null;
export function sincronizarTodo(): Promise<{ enviados: number; recibidos: number; nuevos: number }> {
  if (sincronizacionTotal) return sincronizacionTotal;
  sincronizacionTotal = ejecutarSincronizacionTotal().finally(() => { sincronizacionTotal = null; });
  return sincronizacionTotal;
}

async function ejecutarSincronizacionTotal(): Promise<{ enviados: number; recibidos: number; nuevos: number }> {
  await inicializarBaseDatos();
  if (!(await hayInternet())) return { enviados: 0, recibidos: 0, nuevos: 0 };
  const enviados = await sincronizarPendientes();
  // No se importa la nube mientras haya cambios locales sin resolver.
  // Así se evita crear duplicados durante conflictos de sincronización.
  const pendientes = await pendientesSync();
  if (pendientes > 0) return { enviados, recibidos: 0, nuevos: 0 };
  const response = await fetch(`${API_READ}/docentes`);
  if (!response.ok) throw new Error(`READ HTTP ${response.status}`);
  const remoto: unknown = await response.json();
  if (!Array.isArray(remoto)) throw new Error("READ no devolvió una lista de docentes");
  const registros: Remoto[] = remoto.map((r: unknown) => {
    if (!r || typeof r !== "object") throw new Error("Docente remoto inválido");
    const d = r as Record<string, unknown>;
    if (!Number.isSafeInteger(d.id) || typeof d.nombre !== "string" || typeof d.apellido !== "string") {
      throw new Error("READ devolvió un docente sin ID o nombre válido");
    }
    return d as Remoto;
  });
  let recibidos = 0;
  let nuevos = 0;
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    for (const r of registros) {
      const local = await tx.getFirstAsync<Fila>(
        "SELECT * FROM docentes WHERE id_remoto=?", r.id
      );
      if (local) {
        if (local.pendiente_sync || local.eliminado) continue;
        await tx.runAsync(
          "UPDATE docentes SET nombre=?,apellido=?,cargo=?,programa=?,perfil=?,imagen=?,actualizado_en=? WHERE id_local=?",
          r.nombre, r.apellido, r.cargo ?? null, r.programa ?? null,
          r.perfil ?? null, r.imagen ?? null, fecha, local.id_local
        );
      } else {
        await tx.runAsync(
          "INSERT INTO docentes (id_local,id_remoto,nombre,apellido,cargo,programa,perfil,imagen,actualizado_en,pendiente_sync,eliminado,nuevo_remoto,visto) VALUES (?,?,?,?,?,?,?,?,?,0,0,1,0)",
          uuid(), r.id, r.nombre, r.apellido, r.cargo ?? null,
          r.programa ?? null, r.perfil ?? null, r.imagen ?? null, fecha
        );
        nuevos++;
      }
      recibidos++;
    }
  });
  return { enviados, recibidos, nuevos };
}

export async function pendientesSync(): Promise<number> {
  await inicializarBaseDatos();
  const r = await db.getFirstAsync<{ total: number }>("SELECT COUNT(*) AS total FROM sync_outbox");
  return r?.total ?? 0;
}

export async function contarDocentesNuevos(): Promise<number> {
  await inicializarBaseDatos();
  const r = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM docentes WHERE eliminado=0 AND nuevo_remoto=1 AND visto=0"
  );
  return r?.total ?? 0;
}

export async function marcarDocenteVisto(idLocal: string): Promise<void> {
  await inicializarBaseDatos();
  await db.runAsync(
    "UPDATE docentes SET visto=1,nuevo_remoto=0 WHERE id_local=?", idLocal
  );
}

export type IntervaloSync = 2 | 10 | 30;
export async function obtenerIntervaloSync(): Promise<IntervaloSync> {
  await inicializarBaseDatos();
  const r = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM sync_config WHERE clave='intervalo_segundos'"
  );
  const n = Number(r?.valor ?? 10);
  return n === 2 || n === 10 || n === 30 ? n : 10;
}

export async function guardarIntervaloSync(segundos: IntervaloSync): Promise<void> {
  if (segundos !== 2 && segundos !== 10 && segundos !== 30) {
    throw new Error("Intervalo no permitido");
  }
  await inicializarBaseDatos();
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_config (clave,valor) VALUES ('intervalo_segundos',?)",
    String(segundos)
  );
}
