from sqlalchemy.orm import Session
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import func
from datetime import date
import models
import schemas
import calendar

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "db", "ExpensesTable.db")

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# CRUD PADRÃO

def adicionar_gasto(db: Session, gasto_dados: schemas.GastoCreate):
    primeiro_gasto_criado = None

    for i in range(gasto_dados.parcelas):
        novo_mes = gasto_dados.data.month + i
        novo_ano = gasto_dados.data.year

        while novo_mes > 12:
            novo_mes -= 12
            novo_ano += 1

        _, ultimo_dia_do_mes = calendar.monthrange(novo_ano, novo_mes)
        novo_dia = min(gasto_dados.data.day, ultimo_dia_do_mes)

        nova_data = date(novo_ano, novo_mes, novo_dia)

        if gasto_dados.parcelas > 1:
            nova_descricao = f"{gasto_dados.descricao} ({i+1}/{gasto_dados.parcelas})"
        else:
            nova_descricao = gasto_dados.descricao

        db_gasto = models.Gasto(
            valor = gasto_dados.valor,
            descricao = nova_descricao,
            data = nova_data,
            metodo_pagamento = gasto_dados.metodo_pagamento,
            categoria = gasto_dados.categoria
        )

        db.add(db_gasto)

        if i == 0:
            primeiro_gasto_criado = db_gasto

    db.commit()
    db.refresh(primeiro_gasto_criado)

    return primeiro_gasto_criado   

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
    elif filtro.data_fixa:
        query = query.filter(models.Gasto.data == filtro.data_fixa)
    else:
        if filtro.data_inicio:
            query = query.filter(models.Gasto.data >= filtro.data_inicio)
        if filtro.data_fim:
            query = query.filter(models.Gasto.data <= filtro.data_fim)

    if filtro.metodo_pagamento:
        query = query.filter(models.Gasto.metodo_pagamento == filtro.metodo_pagamento)

    if filtro.categoria:
        query = query.filter(models.Gasto.categoria == filtro.categoria)

    return query.all()

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

def obter_dashboard(db: Session, filtro: schemas.GastoFiltro):
    query = db.query(models.Gasto)

    if not filtro.mes:
        filtro.mes = date.today().month
    if not filtro.ano:
        filtro.ano = date.today().year

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
    
    total_mes = query.with_entities(func.sum(models.Gasto.valor)).scalar() or 0.0

    total_fatura = query.filter(
        models.Gasto.metodo_pagamento == models.MetodoPagamento.CREDITO
    ).with_entities(func.sum(models.Gasto.valor)).scalar() or 0.0

    resultados_categoria = query.with_entities(
        models.Gasto.categoria,
        func.sum(models.Gasto.valor)
    ).group_by(models.Gasto.categoria).all()

    dict_categorias = {categoria.value: valor for categoria, valor in resultados_categoria}

    return schemas.DashboardResponse(
        total_gastos=total_mes,
        total_fatura=total_fatura,
        total_categoria=dict_categorias
    )