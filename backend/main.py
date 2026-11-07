from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kitchen Gallery POS API")

# <-- यह पूरा ब्लॉक जोड़ें -->
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # सभी फ्रंटएंड को अलाउ करने के लिए
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# <------------------------>

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

@app.get("/sales/", response_model=List[schemas.Sale], tags=["Sales"])
def get_sales_history(limit: int = 50, db: Session = Depends(get_db)):
    """हाल ही में हुई सेल की हिस्ट्री देखने के लिए"""
    return db.query(models.Sale).order_by(models.Sale.sale_date.desc()).limit(limit).all()

@app.delete("/sales/{sale_id}", tags=["Sales"])
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    """गलत सेल को डिलीट करने और स्टॉक वापस जोड़ने के लिए"""
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # 1. जो सामान बिका था, उसका स्टॉक वापस बढ़ाएं
    product = db.query(models.Product).filter(models.Product.id == sale.product_id).first()
    if product:
        product.current_stock += sale.quantity_sold
        
    # 2. सेल की रिकॉर्डिंग डिलीट करें
    db.delete(sale)
    db.commit()
    
    return {"message": f"Sale deleted successfully. {sale.quantity_sold} items added back to stock."}
