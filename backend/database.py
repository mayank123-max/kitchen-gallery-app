import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Docker compose se environment variable pick karega
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@db:5432/kitchen_gallery")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()