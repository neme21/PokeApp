import React,{createContext,useContext,useState} from "react";
export type AnimeCharacter={id:number;nombre:string;anime:string;descripcion:string;imagen:string};
type Ctx={personaje:AnimeCharacter|null;setPersonaje:(p:AnimeCharacter|null)=>void};
const AnimeContext=createContext<Ctx|undefined>(undefined);
export function AnimeProvider({children}:{children:React.ReactNode}){const [personaje,setPersonaje]=useState<AnimeCharacter|null>(null);return <AnimeContext.Provider value={{personaje,setPersonaje}}>{children}</AnimeContext.Provider>}
export function useAnime(){const c=useContext(AnimeContext);if(!c)throw new Error("useAnime debe usarse dentro de AnimeProvider");return c;}
