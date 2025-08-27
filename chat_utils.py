from config import PROMPT_BASE

def get_prompt_by_mode(mode):
    prompts = {
        'general': PROMPT_BASE + "\nEres BrainAI, un asistente útil, amigable y profesional.",
        'matematico': PROMPT_BASE + "\nEres BrainAI, un asistente experto en matemáticas avanzadas.",
        'cientifico': PROMPT_BASE + "\nEres BrainAI, un asistente experto en ciencias naturales y experimentales.",
        'fisico': PROMPT_BASE + "\nEres BrainAI, un asistente especializado en física teórica y aplicada.",
        'programador': PROMPT_BASE + "\nEres BrainAI, un asistente experto en programación, desarrollo y depuración de código.",
        'quimico': PROMPT_BASE + "\nEres BrainAI, un asistente especializado en química orgánica e inorgánica.",
        'lenguajes': PROMPT_BASE + "\nEres BrainAI, un asistente experto en lingüística y traducción.",
    }
    return prompts.get(mode, prompts['general'])

def build_prompt(messages, base_prompt):
    conversation = base_prompt + "\n\n"
    for m in messages:
        prefix = "Usuario: " if m['sender'] == 'user' else "BrainAI: "
        conversation += prefix + m['text'] + "\n"
    conversation += "BrainAI: "
    return conversation
