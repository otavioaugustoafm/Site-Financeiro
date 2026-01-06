from sqlalchemy.orm import Session
import models

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