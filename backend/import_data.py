import pandas as pd
from database import SessionLocal
import models

def import_inventory():
    db = SessionLocal()
    try:
        print("1. Saamaan_Purchase.xlsx se data import ho raha hai...")
        purchase_data = pd.read_excel("Saamaan_Purchase.xlsx", sheet_name=None)
        
        for sheet_name, df in purchase_data.items():
            if sheet_name == 'Total Investment':
                continue
                
            print(f"   -> Processing Vendor/Sheet: {sheet_name}")
            
            # --- FIX: Excel ke merged cells ko theek karne ke liye ---
            if 'Company' in df.columns:
                df['Company'] = df['Company'].ffill()
            # ---------------------------------------------------------

            for index, row in df.iterrows():
                if pd.isna(row.get('Product')):
                    continue
                    
                item_name = str(row['Product']).strip()
                company_name = str(row['Company']).strip() if pd.notna(row.get('Company')) else "Local/Unbranded"
                quantity = int(row['Quantity']) if pd.notna(row.get('Quantity')) else 0
                cost_price = float(row['Total Price per piece']) if pd.notna(row.get('Total Price per piece')) else 0.0
                selling_price = float(row['MRP per piece']) if pd.notna(row.get('MRP per piece')) else 0.0
                
                existing_product = db.query(models.Product).filter(
                    models.Product.item_name == item_name
                ).first()

                if not existing_product:
                    new_product = models.Product(
                        company_name=company_name,
                        item_name=item_name,
                        category=sheet_name,
                        cost_price=cost_price,
                        selling_price=selling_price,
                        current_stock=quantity,
                        reorder_level=2
                    )
                    db.add(new_product)
                else:
                    existing_product.current_stock += quantity
        
        db.commit()
        print("✅ Saara Naya Saamaan Import Ho Gaya!")

        print("\n2. Sale.xlsx se sales import aur stock update ho raha hai...")
        sale_data = pd.read_excel("Sale.xlsx", sheet_name=None)
        
        for sheet_name, df in sale_data.items():
            print(f"   -> Processing Month: {sheet_name}")
            for index, row in df.iterrows():
                if pd.isna(row.get('Product')):
                    continue
                    
                sold_item_name = str(row['Product']).strip()
                qty_sold = int(row['Quantity Sold']) if pd.notna(row.get('Quantity Sold')) else 0
                sold_price = float(row['Total Sale in Ruppees ']) if pd.notna(row.get('Total Sale in Ruppees ')) else 0.0
                sold_by_person = str(row['Sale By']) if pd.notna(row.get('Sale By')) else "Unknown"

                product = db.query(models.Product).filter(
                    models.Product.item_name == sold_item_name
                ).first()

                if product:
                    if product.current_stock >= qty_sold:
                        product.current_stock -= qty_sold
                    else:
                        product.current_stock = 0
                    
                    new_sale = models.Sale(
                        product_id=product.id,
                        quantity_sold=qty_sold,
                        sold_price=sold_price,
                        sold_by=sold_by_person
                    )
                    db.add(new_sale)
        
        db.commit()
        print("✅ Sales bhi import ho gayi aur stock minus ho gaya!")

    except Exception as e:
        print(f"❌ Error aaya bhai: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_inventory()