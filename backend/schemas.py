from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Product (Inventory) Schemas
class ProductBase(BaseModel):
    company_name: str
    item_name: str
    category: str
    cost_price: float
    selling_price: float
    current_stock: int = 0
    reorder_level: int = 2

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

# Sale (POS) Schemas
class SaleBase(BaseModel):
    product_id: int
    quantity_sold: int
    sold_price: float
    sold_by: str  # Example: "Mummy" or "Jija ji"

class SaleCreate(SaleBase):
    pass

class Sale(SaleBase):
    id: int
    sale_date: datetime

    class Config:
        from_attributes = True