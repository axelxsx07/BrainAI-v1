# server.py
from http.server import HTTPServer
from handler import UnifiedHandler
from database import init_db
from pyngrok import ngrok
from threading import Thread
import telegram_bot

def run_server():
    init_db()
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, UnifiedHandler)

    # ngrok para tu servidor web
    public_url = ngrok.connect(8000)
    print(f"🌍 ngrok conectado en {public_url}")
    print("Servidor corriendo en http://localhost:8000")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Servidor detenido.")
        httpd.server_close()

if __name__ == "__main__":
    # Ejecutar bot de Telegram en thread separado
    bot_thread = Thread(target=telegram_bot.run_telegram_bot)
    bot_thread.start()

    # Ejecutar servidor HTTP (igual que antes)
    run_server()
