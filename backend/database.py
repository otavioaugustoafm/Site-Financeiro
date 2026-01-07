from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///db/ExpensesTable.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def adicionar_gasto(db: Session, gasto_dados):

    db_gasto = models.Gasto(
        valor = gasto_dados.valor,
        descricao = gasto_dados.descricao,
        data = gasto_dados.data,
        metodo_pagamento = gasto_dados.metodo_pagamento,
        categoria = gasto_dados.categoria
    )

    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)

    return db_gasto

def ler_todos_gastos(db: Session):
    return db.query(models.Gasto).all()    

def atualizar_gasto_id(db: Session, gasto_id: int, dados_atualizacao: schemas.GastoUpdate):
    gasto_banco = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()

    if gasto_banco is None:
        return None

    dados_dict = dados_atualizacao.model_dump(exclude_unset=True)

    for key, value in dados_dict.items():
        setattr(gasto_banco, key, value)

    db.add(gasto_banco)
    db.commit()
    db.refresh(gasto_banco)
    
    return True

def deletar_gasto_id(db: Session, gasto_id: int):
    gasto = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()

    if gasto is not None:
        db.delete(gasto)
        db.commit()
        return True
    
    return False