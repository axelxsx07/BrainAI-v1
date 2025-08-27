from chat_utils import get_prompt_by_mode, build_prompt
from config import co, PROMPT_BASE  # Asegúrate que PROMPT_BASE esté definido en config.py
import telebot

# 🔑 Token de tu bot de Telegram
TELEGRAM_BOT_TOKEN = '7609862924:AAGsxaRvN-t5_qHN3ACpLZe5VR6MmTINXzM'
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# 📌 Comando /start
@bot.message_handler(commands=['start'])
def welcome(message):
    bot.send_message(message.chat.id, "👋 ¡Hola! Soy BrainAI en Telegram. Escribe tu pregunta o tema y te ayudaré.")

# 📌 Manejador de mensajes de texto
@bot.message_handler(func=lambda msg: msg.content_type == 'text')
def chat_handler(message):
    user_input = message.text
    chat_id = message.chat.id

    try:
        # Usamos el prompt base de config.py
        prompt = build_prompt([{"text": user_input, "sender": "user"}], PROMPT_BASE)

        response = co.generate(
            model='command-r-plus',
            prompt=prompt,
            max_tokens=300,
            temperature=0.7,
            k=0,
            p=0.75,
            stop_sequences=["--"],
        )
        answer = response.generations[0].text.strip()
    except Exception as e:
        answer = f"❌ Error al generar respuesta: {str(e)}"

    # 🔹 Usamos send_message para evitar errores de reply_to
    bot.send_message(chat_id, answer)

# 📌 Función para iniciar el bot en polling
def run_telegram_bot():
    print("🤖 Bot de Telegram iniciado en modo polling...")
    bot.infinity_polling()
