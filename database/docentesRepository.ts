import { db } from "./sqlite";

export interface DocenteLocal {
  id_local: string;
  id_remoto: number | null;
  nombre: string;
  apellido: string;
  programa: string | null;
  cargo: string | null;
  perfil: string | null;
  imagen: string | null;
  actualizado_en: string;
  pendiente_sync: number;
  eliminado: number;
}

export async function obtenerDocentesLocales() {
  return await db.getAllAsync<DocenteLocal>(
    "SELECT * FROM docentes WHERE eliminado = 0 ORDER BY nombre"
  );
}

export async function guardarDocenteLocal(
  docente: Omit<
    DocenteLocal,
    "id_local" | "id_remoto" | "actualizado_en" |
    "pendiente_sync" | "eliminado"
  >
) {
  const idLocal = crypto.randomUUID();
  const fecha = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO docentes
      (id_local, nombre, apellido, programa, cargo,
       perfil, imagen, actualizado_en, pendiente_sync)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        idLocal,
        docente.nombre,
        docente.apellido,
        docente.programa,
        docente.cargo,
        docente.perfil,
        docente.imagen,
        fecha,
      ]
    );

    await db.runAsync(
      `INSERT INTO operaciones_pendientes
       (id_local, operacion, fecha)
       VALUES (?, ?, ?)`,
      [idLocal, "CREATE", fecha]
    );
  });

  return idLocal;
}