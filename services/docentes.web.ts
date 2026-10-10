const API = process.env.EXPO_PUBLIC_DOCENTES_API_URL || "https://pokeanime-docentes-api.onrender.com";
export type Docente = {id:string;nombre:string;apellido:string;cargo?:string|null;programa?:string|null;perfil?:string|null;imagen?:string|null;pendiente_sync?:number};
export type DatosDocente = Omit<Docente,"id"|"pendiente_sync">;
async function req(path:string,init?:RequestInit) { const r=await fetch(`${API}${path}`,init); if(!r.ok)throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);return r.json(); }
const map=(x:any):Docente=>({...x,id:String(x.id)});
export async function listarDocentes(nombre=""):Promise<Docente[]> {const x=await req(`/docentes${nombre?`?nombre=${encodeURIComponent(nombre)}`:""}`);return (Array.isArray(x)?x:x.docentes??[]).map(map);}
export async function detalleDocente(id:string):Promise<Docente> {return map(await req(`/docentes/${encodeURIComponent(id)}`));}
export async function crearDocente(d:DatosDocente):Promise<Docente> {return map(await req('/docentes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}));}
export async function editarDocente(id:string,d:DatosDocente):Promise<void> {await req(`/docentes/${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});}
export async function eliminarDocente(id:string):Promise<void> {await req(`/docentes/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function sincronizarPendientes():Promise<number> {return 0;}
export async function pendientesSync():Promise<number> {return 0;}
