import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()
app=FastAPI(title="PokeAnime - Anime API",version="1.0.0",description="Microservicio Python que consulta MongoDB con 10 personajes de anime.")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
client=MongoClient(os.environ["MONGODB_URI"]); col=client[os.getenv("MONGODB_DB","pokeanime")]["personajes"]
def clean(x):
    x=dict(x); x.pop("_id",None); return x
@app.get("/")
def root(): return {"mensaje":"Microservicio Anime funcionando","swagger":"/docs"}
@app.get("/personajes")
def listar(): return [clean(x) for x in col.find().sort("id",1)]
@app.get("/personajes/{busqueda}")
def buscar(busqueda:str):
    q={"id":int(busqueda)} if busqueda.isdigit() else {"nombre":{"$regex":f"^{busqueda}$","$options":"i"}}
    x=col.find_one(q)
    if not x: raise HTTPException(status_code=404,detail="Personaje no encontrado")
    return clean(x)
