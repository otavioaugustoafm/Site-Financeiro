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
    OUTROS = "Outros"

class Mes(int, Enum):
    JANEIRO = 1
    FEVEREIRO = 2
    MARCO = 3
    ABRIL = 4
    MAIO = 5
    JUNHO = 6
    JULHO = 7
    AGOSTO = 8
    SETEMBRO = 9
    OUTUBRO = 10
    NOVEMBRO = 11
    DEZEMBRO = 12

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

class GastoFiltro(BaseModel):    
    valor_fixo: Optional[float] = None
    valor_inicio: Optional[float] = None
    valor_fim: Optional[float] = None

    descricao: Optional[str] = None

    mes: Optional[Mes] = None
    ano: Optional[int] = None
    data_fixa: Optional[date] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    
    metodo_pagamento: Optional[MetodoPagamento] = None
    categoria: Optional[Categoria] = None
    
class DashboardResponse(BaseModel):
    total_gastos: float
    total_categoria: dict[str, float]

class GastoCreate(GastoBase):
    parcelas: int = 1
    pass

class GastoResponse(GastoBase):
    id: int

    class Config:
        from_attributes = True 