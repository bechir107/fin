import MySQLdb
try:
    db = MySQLdb.connect(host="localhost", user="root", password="", database="nutrition_db")
    cursor = db.cursor()
    print("--- TABLE patient ---")
    cursor.execute("DESCRIBE patient")
    for row in cursor.fetchall():
        print(row)
    print("--- TABLE user ---")
    cursor.execute("DESCRIBE user")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print(e)
