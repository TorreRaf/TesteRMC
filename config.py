import os
from urllib.parse import quote_plus

DRIVER = quote_plus("ODBC Driver 17 for SQL Server")

USER = "usr_gr"
PASSWORD = quote_plus("energy1899")
SERVER = "srv-db-01"
DATABASE = "INTRANET_WOORI"

class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "segredo123")
