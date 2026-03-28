import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# We connect using the Neon Postgres URL. SQLAlchemy handles ssl requirements internally if specified.
DATABASE_URL = os.getenv("NEON_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("NEON_DATABASE_URL is not set in .env")

# create_engine manages the connection pool
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    # sslmode=require is handled in the query string
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    import logging
    logger = logging.getLogger("INDRA.Database")
    try:
        with engine.connect() as conn:
            logger.info("Successfully connected to Neon PostgreSQL Database.")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to Neon PostgreSQL Database: {e}")
        return False
