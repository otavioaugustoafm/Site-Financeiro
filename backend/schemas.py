from pydantic import BaseModel
from datetime import date
from enum import Enum
from typing import Optional

class MetodoPagamento(str, Enum):
    CREDITO = "Crédito"
    DEBITO = "Débito"

class Categoria(str, Enum):
    INVESTIMENTO = "Investimento"
    ALIMENTACAO = "Alimentação"
    GASTOS_FIXOS = "Gastos Fixos"
    GASTOS_EXTRAS = "Gastos Extras"
    TRANSPORTE = "Transporte"
    COMPRAS = "Compras"
    OUTROS = "Outro3s"

class GastoBase(BaseModel):
    valor: float
    descricao: str | None = None
    data: date
    metodo_pagamento: MetodoPagamento
    categoria: Categoria

class GastoUpdate(BaseModel):
    valor: Optional[float] = None
    descricao: Optional[str] = None
    data: Optional[date] = None
    metodo_pagamento: Optional[MetodoPagamento] = None
    categoria: Optional[Categoria] = None

class GastoCreate(GastoBase):
    pass

class GastoResponse(GastoBase):
    id: int

    class Config:
        from_attributes = True 