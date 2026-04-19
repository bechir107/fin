import MySQLdb

def get_db():
    return MySQLdb.connect(
        host="localhost",
        user="root",
        password="",
        database="nutrition_db"
    )