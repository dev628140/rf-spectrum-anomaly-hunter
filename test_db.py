from backend.db.database import engine

try:
    conn = engine.connect()
    print("DATABASE CONNECTED")
    conn.close()

except Exception as e:
    print(e)