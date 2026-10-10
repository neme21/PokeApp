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

export async function obtenerDocentesLocales(): Promise<DocenteLocal[]> {
  return [];
}

export async function guardarDocenteLocal(
  docente: Omit<
    DocenteLocal,
    | "id_local"
    | "id_remoto"
    | "actualizado_en"
    | "pendiente_sync"
    | "eliminado"
  >
): Promise<string> {
  throw new Error("El almacenamiento SQLite solo está disponible en Android/iOS");
}