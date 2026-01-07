from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///db/ExpensesTable.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# CRUD PADRÃO

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

# FUNÇÕES ESPECÍFICAS

def ler_gastos_filtrados(db: Session, filtro: schemas.GastoFiltro):
    query = db.query(models.Gasto)
    
    if filtro.valor_fixo:
        query = query.filter(models.Gasto.valor == filtro.valor_fixo)
    else:
        if filtro.valor_inicio:
            query = query.filter(models.Gasto.valor >= filtro.valor_inicio)
        if filtro.valor_fim:
            query = query.filter(models.Gasto.valor <= filtro.valor_fim)

    if filtro.descricao:
        query = query.filter(models.Gasto.descricao.ilike(f"%{filtro.descricao}%"))

    if filtro.mes and filtro.ano:
        data_inicio_fatura = date(filtro.ano, filtro.mes, 4)
        if filtro.mes == 12:
            mes_fim = 1
            ano_fim = filtro.ano + 1
        else:
            mes_fim = filtro.mes + 1
            ano_fim = filtro.ano
        data_fim_fatura = date(ano_fim, mes_fim, 3)    
        query = query.filter(models.Gasto.data.between(data_inicio_fatura, data_fim_fatura))
    elif:
        if filtro.data_inicio:
            query = query.filter(models.Gasto.data >= filtro.data_inicio)
        if filtro.data_fim:
            query = query.filter(models.Gasto.data <= filtro.data_fim)
    else filtro.data_fixa:
        query = query.filter(models.Gasto.data == filtro.data_fixa)

    if filtro.metodo_pagamento:
        query = query.filter(models.Gasto.metodo_pagamento == filtro.metodo_pagamento)

    if filtro.categoria:
        query = query.filter(models.Gasto.categoria == filtro.categoria)

    return query.all()