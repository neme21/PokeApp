import * as SQLite from "expo-sqlite";
export const db = SQLite.openDatabaseSync("pokeapp.db");
let init: Promise<void> | null = null;
export function inicializarBaseDatos(): Promise<void> {
  if (!init) init = db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS docentes (
      id_local TEXT PRIMARY KEY NOT NULL,
      id_remoto INTEGER, nombre TEXT NOT NULL, apellido TEXT NOT NULL,
      programa TEXT, cargo TEXT, perfil TEXT, imagen TEXT,
      actualizado_en TEXT NOT NULL, pendiente_sync INTEGER NOT NULL DEFAULT 0,
      eliminado INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS operaciones_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_local TEXT NOT NULL, operacion TEXT NOT NULL, fecha TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_outbox (
      op_id TEXT PRIMARY KEY NOT NULL, id_local TEXT NOT NULL,
      tipo TEXT NOT NULL, payload TEXT NOT NULL, creado_en TEXT NOT NULL
    );
  `).catch(e => { init = null; throw e; });
  return init;
}
