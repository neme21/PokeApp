import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db, inicializarBaseDatos } from "../database/sqlite.native";

const API = process.env.EXPO_PUBLIC_DOCENTES_API_URL || "https://pokeanime-docentes-api.onrender.com";
export type Docente = { id: string; nombre: string; apellido: string; cargo?: string | null; programa?: string | null; perfil?: string | null; imagen?: string | null; pendiente_sync?: number };
export type DatosDocente = Omit<Docente, "id" | "pendiente_sync">;
type Fila = { id_local: string; id_remoto: number | null; nombre: string; apellido: string; cargo: string | null; programa: string | null; perfil: string | null; imagen: string | null; pendiente_sync: number };
const uuid = () => Crypto.randomUUID();
const map = (r: Fila): Docente => ({ id: r.id_local, nombre: r.nombre, apellido: r.apellido, cargo: r.cargo, programa: r.programa, perfil: r.perfil, imagen: r.imagen, pendiente_sync: r.pendiente_sync });
async function queue(id: string, tipo: string, payload: unknown) {
  await db.runAsync("INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)", uuid(), id, tipo, JSON.stringify(payload), new Date().toISOString());
}
export async function listarDocentes(nombre = ""): Promise<Docente[]> {
  await inicializarBaseDatos();
  const rows = await db.getAllAsync<Fila>("SELECT * FROM docentes WHERE eliminado=0 AND (nombre LIKE ? OR apellido LIKE ?) ORDER BY nombre", `%${nombre}%`, `%${nombre}%`);
  return rows.map(map);
}
export async function detalleDocente(id: string): Promise<Docente> {
  await inicializarBaseDatos();
  const r = await db.getFirstAsync<Fila>("SELECT * FROM docentes WHERE id_local=? AND eliminado=0", id);
  if (!r) throw new Error("Docente no encontrado en SQLite");
  return map(r);
}
export async function crearDocente(datos: DatosDocente): Promise<Docente> {
  await inicializarBaseDatos();
  const id = uuid(), fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync("INSERT INTO docentes (id_local,nombre,apellido,cargo,programa,perfil,imagen,actualizado_en,pendiente_sync) VALUES (?,?,?,?,?,?,?,?,1)", id,datos.nombre,datos.apellido,datos.cargo??null,datos.programa??null,datos.perfil??null,datos.imagen??null,fecha);
    await tx.runAsync("INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",uuid(),id,"CREATE",JSON.stringify(datos),fecha);
  });
  void sincronizarPendientes().catch(console.warn);
  return detalleDocente(id);
}
export async function editarDocente(id: string, datos: DatosDocente): Promise<void> {
  await inicializarBaseDatos();
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    const r = await tx.runAsync("UPDATE docentes SET nombre=?,apellido=?,cargo=?,programa=?,perfil=?,imagen=?,actualizado_en=?,pendiente_sync=1 WHERE id_local=? AND eliminado=0",datos.nombre,datos.apellido,datos.cargo??null,datos.programa??null,datos.perfil??null,datos.imagen??null,fecha,id);
    if (!r.changes) throw new Error("Docente local no encontrado");
    await tx.runAsync("INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",uuid(),id,"UPDATE",JSON.stringify(datos),fecha);
  });
  void sincronizarPendientes().catch(console.warn);
}
export async function eliminarDocente(id: string): Promise<void> {
  await inicializarBaseDatos();
  const fecha = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async tx => {
    const r = await tx.runAsync("UPDATE docentes SET eliminado=1,pendiente_sync=1,actualizado_en=? WHERE id_local=?",fecha,id);
    if (!r.changes) throw new Error("Docente local no encontrado");
    await tx.runAsync("INSERT INTO sync_outbox (op_id,id_local,tipo,payload,creado_en) VALUES (?,?,?,?,?)",uuid(),id,"DELETE","{}",fecha);
  });
  void sincronizarPendientes().catch(console.warn);
}
let ejecutando: Promise<number> | null = null;
export function sincronizarPendientes(): Promise<number> {
  if (ejecutando) return ejecutando;
  ejecutando = realizarSync().finally(() => { ejecutando = null; });
  return ejecutando;
}
async function realizarSync(): Promise<number> {
  await inicializarBaseDatos();
  const conexion = await NetInfo.fetch();
  if (!conexion.isConnected || conexion.isInternetReachable === false) return 0;
  const ops = await db.getAllAsync<{op_id:string;id_local:string;tipo:string;payload:string}>("SELECT * FROM sync_outbox ORDER BY creado_en, rowid");
  // Los op_id son únicos y el servidor recuerda los procesados: reintentos seguros.
  let enviados = 0;
  for (const op of ops) {
    const fila = await db.getFirstAsync<{id_remoto:number|null}>("SELECT id_remoto FROM docentes WHERE id_local=?",op.id_local);
    const response = await fetch(`${API}/sync/docentes`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op_id:op.op_id,id_local:op.id_local,tipo:op.tipo,docente:JSON.parse(op.payload),id_remoto:fila?.id_remoto??null})});
    if (!response.ok) throw new Error(`Sincronización HTTP ${response.status}: ${(await response.text()).slice(0,180)}`);
    const resultado: {id_remoto:number|null} = await response.json();
    await db.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync("DELETE FROM sync_outbox WHERE op_id=?",op.op_id);
      if (resultado.id_remoto != null) await tx.runAsync("UPDATE docentes SET id_remoto=? WHERE id_local=?",resultado.id_remoto,op.id_local);
      const resto = await tx.getFirstAsync<{total:number}>("SELECT COUNT(*) AS total FROM sync_outbox WHERE id_local=?",op.id_local);
      if (resto?.total===0) await tx.runAsync("UPDATE docentes SET pendiente_sync=0 WHERE id_local=?",op.id_local);
    });
    enviados++;
  }
  return enviados;
}
export async function pendientesSync(): Promise<number> {
  await inicializarBaseDatos();
  const r = await db.getFirstAsync<{total:number}>("SELECT COUNT(*) AS total FROM sync_outbox");
  return r?.total??0;
}
