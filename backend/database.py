from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///./ExpensesTable.db"

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