from db import get_db

try:
    db = get_db()
    cur = db.cursor()
    cur.execute("SHOW TABLES LIKE 'disponibilite'")
    table = cur.fetchone()
    if table:
        print("Table 'disponibilite' exists.")
        cur.execute("DESCRIBE disponibilite")
        columns = cur.fetchall()
        for col in columns:
            print(col)
    else:
        print("Table 'disponibilite' DOES NOT exist. Creating it...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS disponibilite (
                id INT AUTO_INCREMENT PRIMARY KEY,
                jour VARCHAR(20),
                heure_debut TIME,
                heure_fin TIME
            )
        """)
        db.commit()
        print("Table created successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'db' in locals(): db.close()
