
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("pokeapp.db");

let init: Promise<void> | null = null;

async function agregarColumnaSiFalta(
  tabla: string,
  columna: string,
  definicion: string
): Promise<void> {
  const columnas = await db.getAllAsync<{
    name: string;
  }>(`PRAGMA table_info(${tabla})`);

  if (!columnas.some(c => c.name === columna)) {
    await db.execAsync(
      `ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`
    );
  }
}

async function prepararBaseDatos(): Promise<void> {
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
      eliminado INTEGER NOT NULL DEFAULT 0,
      nuevo_remoto INTEGER NOT NULL DEFAULT 0,
      visto INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS operaciones_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_local TEXT NOT NULL,
      operacion TEXT NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      op_id TEXT PRIMARY KEY NOT NULL,
      id_local TEXT NOT NULL,
      tipo TEXT NOT NULL,
      payload TEXT NOT NULL,
      creado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_config (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );

    INSERT OR IGNORE INTO sync_config (clave, valor)
    VALUES ('intervalo_segundos', '10');
  `);

  // MIGRACIONES PARA INSTALACIONES EXISTENTES
  await agregarColumnaSiFalta(
    "docentes",
    "nuevo_remoto",
    "INTEGER NOT NULL DEFAULT 0"
  );

  await agregarColumnaSiFalta(
    "docentes",
    "visto",
    "INTEGER NOT NULL DEFAULT 1"
  );

  // COMPROBAR DUPLICADOS ANTES DE CREAR ÍNDICE
  const duplicados = await db.getAllAsync<{
    id_remoto: number;
    total: number;
  }>(`
    SELECT id_remoto, COUNT(*) AS total
    FROM docentes
    WHERE id_remoto IS NOT NULL
    GROUP BY id_remoto
    HAVING COUNT(*) > 1
  `);

  if (duplicados.length === 0) {
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS
      idx_docentes_id_remoto
      ON docentes(id_remoto);
    `);
  } else {
    console.warn(
      "Existen ID remotos duplicados. Se requiere conciliación:",
      duplicados
    );
  }
}

export function inicializarBaseDatos(): Promise<void> {
  if (!init) {
    init = prepararBaseDatos().catch(error => {
      init = null;
      throw error;
    });
  }

  return init;
}
