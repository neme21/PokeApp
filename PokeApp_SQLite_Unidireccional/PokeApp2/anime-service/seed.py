import json, os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
load_dotenv(); client=MongoClient(os.environ["MONGODB_URI"]); db=client[os.getenv("MONGODB_DB","pokeanime")]; data=json.loads(Path(__file__).with_name("seed.json").read_text(encoding="utf-8")); db.personajes.delete_many({}); db.personajes.insert_many(data); print(f"Insertados {len(data)} personajes")
