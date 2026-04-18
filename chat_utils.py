from config import PROMPT_BASE

def get_prompt_by_mode(mode):
    base = PROMPT_BASE

    prompts = {
        'general': base + "\nEres BrainAI, un asistente útil, amigable y profesional.",
        'matematico': base + "\nEres BrainAI, un asistente experto en matemáticas avanzadas.",
        'cientifico': base + "\nEres BrainAI, un asistente experto en ciencias naturales y experimentales.",
        'fisico': base + "\nEres BrainAI, un asistente especializado en física teórica y aplicada.",
        'programador': base + "\nEres BrainAI, un asistente experto en programación, desarrollo y depuración de código.",
        'quimico': base + "\nEres BrainAI, un asistente especializado en química orgánica e inorgánica.",
        'lenguajes': base + "\nEres BrainAI, un asistente experto en lingüística y traducción.",
    }

    return prompts.get(mode, prompts['general'])


def build_prompt(messages, base_prompt):
    """
    Esta función es opcional.
    Solo úsala si NO estás usando chat_history en Cohere.
    """

    conversation = base_prompt + "\n\n"

    for m in messages:
        sender = m.get('sender', 'user')
        text = m.get('text', '')

        prefix = "Usuario: " if sender == 'user' else "BrainAI: "
        conversation += f"{prefix}{text}\n"

    conversation += "BrainAI: "
    return conversation
