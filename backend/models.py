from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.orm import declarative_base
import enum

Base = declarative_base()

class MetodoPagamento(str, enum.Enum):
    CREDITO = "Crédito"
    DEBITO = "Débito"

class Categoria(str, enum.Enum):
    INVESTIMENTO = "Investimento"
    ALIMENTACAO = "Alimentação"
    GASTOS_FIXOS = "Gastos Fixos"
    GASTOS_EXTRAS = "Gastos Extras"
    TRANSPORTE = "Transporte"
    COMPRAS = "Compras"
    OUTROS = "Outros"

class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Float, nullable=False)
    descricao = Column(String)
    data = Column(Date, nullable=False)
    
    metodo_pagamento = Column(Enum(MetodoPagamento), nullable=False)
    categoria = Column(Enum(Categoria), nullable=False)