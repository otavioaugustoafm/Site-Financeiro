from pydantic import BaseModel
from datetime import date
from enum import Enum

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

class GastoBase(BaseModel):
    valor: float
    descricao: str | None = None
    data: date
    metodo_pagamento: MetodoPagamento
    categoria: Categoria

class GastoCreate(GastoBase):
    pass

class GastoResponse(GastoBase):
    id: int

    class Config:
        from_attributes = True 