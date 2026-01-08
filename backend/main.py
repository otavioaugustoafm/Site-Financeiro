from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database 
from typing import List

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD PADRÃO

@app.post("/gastos", response_model=schemas.GastoResponse)
def criar_novo_gasto(gasto: schemas.GastoCreate, db: Session = Depends(get_db)):
    return database.adicionar_gasto(db=db, gasto_dados=gasto)

@app.get("/gastos", response_model=List[schemas.GastoResponse])
def ler_gastos_filtrados(db: Session = Depends(get_db), filtro: schemas.GastoFiltro = Depends()):
    return database.ler_gastos_filtrados(db, filtro)

@app.patch("/gastos/{gasto_id}")
def atualizar_gasto_id(gasto_id: int, gasto_update: schemas.GastoUpdate, db: Session = Depends(get_db)):
    gasto_atualizado = database.atualizar_gasto_id(db, gasto_id, gasto_update)

    if gasto_atualizado is None:
        raise HTTPException(status_code=404, detail="Gasto não encontrado para atualizar.")

    return {"mensagem": "Gasto atualizado com sucesso"}

@app.delete("/gastos/{gasto_id}")
def deletar_gasto_id(gasto_id: int, db: Session = Depends(get_db)):
    sucesso = database.deletar_gasto_id(db, gasto_id)
    
    if not sucesso:
        raise HTTPException(status_code=404, detail="Gasto não encontrado para deletar.")

    return {"mensagem": "Gasto removido com sucesso."}

# FUNÇÕES ESPECÍFICAS

@app.get("/dashboard", response_model=schemas.DashboardResponse)
def ler_dashboard(db: Session = Depends(get_db), filtro: schemas.GastoFiltro = Depends()):
    return database.obter_dashboard(db, filtro)