import sqlite3
from config import DB_PATH

def get_connection():
    """Devuelve una conexión a la base de datos SQLite."""
    conn = sqlite3.connect(DB_PATH)
    # Esto permite acceder a las columnas por nombre como en MySQL dictionary=True
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crea las tablas necesarias si no existen."""
    try:
        conn = get_connection()
        c = conn.cursor()

        # Tabla users
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')

        # Tabla chats
        c.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                mode TEXT NOT NULL,
                title TEXT,
                messages TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        print("Tablas creadas correctamente (SQLite).")
    except Exception as err:
        print(f"Error al inicializar la base de datos: {err}")
    finally:
        c.close()
        conn.close()
