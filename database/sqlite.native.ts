import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("pokeapp.db");

export async function inicializarBaseDatos() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS docentes (
      id_local TEXT PRIMARY KEY NOT NULL,
      id_remoto INTEGER,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      programa TEXT,
      cargo TEXT,
      perfil TEXT,
      imagen TEXT,
      actualizado_en TEXT NOT NULL,
      pendiente_sync INTEGER NOT NULL DEFAULT 0,
      eliminado INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS operaciones_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_local TEXT NOT NULL,
      operacion TEXT NOT NULL,
      fecha TEXT NOT NULL
    );
  `);

  console.log("Base de datos SQLite inicializada");
}