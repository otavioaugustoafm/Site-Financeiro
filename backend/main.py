from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database 

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home:
    return {"Começando um novo projeto..."}

@app.post("/gastos/", response_model=schemas.GastoResponse)
def criar_novo_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    return database.adicionar_gasto(db=db, gasto_dados=gasto)