import sys
from db import get_db

db = get_db()
cur = db.cursor()
cur.execute("SHOW TABLES")
tables = cur.fetchall()
print("Tables:", tables)

for t in tables:
    table_name = t[0]
    cur.execute(f"DESCRIBE {table_name}")
    print(f"\nSchema for {table_name}:")
    for col in cur.fetchall():
        print(col)

cur.close()
db.close()
