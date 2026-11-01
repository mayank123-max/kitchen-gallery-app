from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kitchen Gallery POS API")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Shree Siddhivinayak Kitchen Gallery API is running!"}

# ==========================================
# 1. INVENTORY (PRODUCT) APIs
# ==========================================

@app.post("/products/", response_model=schemas.Product, tags=["Inventory"])
def add_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """दुकान में नया आइटम जोड़ने के लिए"""
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/products/", response_model=List[schemas.Product], tags=["Inventory"])
def search_products(search: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """आइटम सर्च करने के लिए (नाम या कंपनी से)"""
    query = db.query(models.Product)
    if search:
        # आइटम के नाम या कंपनी के नाम से सर्च
        query = query.filter(
            models.Product.item_name.ilike(f"%{search}%") | 
            models.Product.company_name.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()

# ==========================================
# 2. SALES (POS) APIs
# ==========================================

@app.post("/sales/", response_model=schemas.Sale, tags=["Sales"])
def make_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    """सामान बेचने और ऑटोमैटिक स्टॉक माइनस करने के लिए"""
    # 1. पहले चेक करें कि आइटम स्टॉक में है या नहीं
    product = db.query(models.Product).filter(models.Product.id == sale.product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Item not found!")
    if product.current_stock < sale.quantity_sold:
        raise HTTPException(status_code=400, detail=f"Not enough stock! Only {product.current_stock} left.")

    # 2. अगर स्टॉक है, तो स्टॉक में से क्वांटिटी माइनस करें
    product.current_stock -= sale.quantity_sold

    # 3. सेल का रिकॉर्ड डेटाबेस में सेव करें
    db_sale = models.Sale(**sale.model_dump())
    db.add(db_sale)
    
    db.commit()
    db.refresh(db_sale)
    return db_sale