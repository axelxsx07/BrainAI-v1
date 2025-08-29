const sidebar       = document.getElementById('sidebar');
const toggleBtn     = document.getElementById('toggleSidebar');
const chatList      = document.getElementById('chatList');
const conversation  = document.getElementById('conversation');
const userInput     = document.getElementById('userInput');
const sendBtn       = document.getElementById('sendBtn');
const chatArea      = document.getElementById('chatArea');
const modeSelector  = document.getElementById('modeSelector');
const modeCards     = modeSelector.querySelectorAll('.modeCard');
const chatTitleInput = document.getElementById('chatTitle');
const loginArea     = document.getElementById('loginArea');
const hiddenFileInput = document.getElementById('fileInput');
const fileUploadBtn = document.querySelector('.upload-icon');
const filePreviewContainer = document.getElementById('filePreviewContainer');

let chats = [];
let current = null;
let selectedMode = 'general';
let attachedFiles = []; // archivos pendientes de enviar

// ------------------- Sidebar -------------------
toggleBtn.onclick = () => {
  const open = sidebar.classList.toggle('open');
  toggleBtn.classList.toggle('rotated', open);
  chatArea.classList.toggle('shifted', open);
  document.querySelector('.input-area').classList.toggle('shifted', open);
};

// ------------------- Cambio de modo -------------------
modeCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!current || current.promptLocked) return;
    modeCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedMode = card.dataset.mode;
    if (current) current.mode = selectedMode;
  });
});

// ------------------- Funciones de chat -------------------
async function generateTitle(chat) {
  try {
    const firstUserMessage = chat.msgs.find(m => m.sender === 'user');
    if (!firstUserMessage) return;

    const res = await fetch('/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [firstUserMessage] })
    });
    const data = await res.json();
    if (!chat.title) {
      chat.title = data.title || '';
      renderList();
      render();
    }
  } catch (e) { console.error('Error generando título:', e); }
}

function newChat() {
  const n = { 
    title: '', 
    mode: selectedMode, 
    msgs: [{ text: '¡Hola! ¿Cómo puedo ayudarte?', sender: 'bot', files: [] }],
    promptLocked: false
  };
  chats.push(n);
  select(n);
  renderList();
  sidebar.classList.remove('open');
  toggleBtn.classList.remove('rotated');
  chatArea.classList.remove('shifted');
  document.querySelector('.input-area').classList.remove('shifted');
  const btn = document.getElementById('newChatBtn');
  btn.classList.add('animated');
  setTimeout(() => btn.classList.remove('animated'), 400);
  modeSelector.style.display = 'flex';
  clearAttachedFiles();
}

function select(c) {
  current = c;
  if (current.mode) {
    selectedMode = current.mode;
    modeCards.forEach(card => {
      card.classList.toggle('selected', card.dataset.mode === selectedMode);
    });
  }
  render();
  renderList();
  modeSelector.style.display = current.promptLocked ? 'none' : 'flex';
}

// ------------------- Render y lista -------------------
function renderList() {
  chatList.innerHTML = '';
  chats.forEach((c, i) => {
    const li = document.createElement('li');
    const nro = i + 1;
    li.textContent = c.title ? `Chat ${nro} - ${c.title}` : `Chat ${nro}`;
    li.className = '';
    if (c === current) li.classList.add('active');
    li.style.animationDelay = `${i * 0.05}s`;
    li.onclick = () => select(c);
    chatList.appendChild(li);
  });
}

function render() {
  conversation.innerHTML = '';
  current.msgs.forEach(m => appendMessageToDOM(m));

  conversation.scrollTop = conversation.scrollHeight;

  const idx = chats.indexOf(current) + 1;
  chatTitleInput.value = current.title !== '' ? current.title : `Chat ${idx}`;
  chatTitleInput.readOnly = true;
  chatTitleInput.style.cursor = 'default';
}

function appendMessageToDOM(msg) {
  const div = document.createElement('div');
  div.className = 'message ' + (msg.sender === 'user' ? 'user' : 'bot');

  // Archivos (si hay)
  if (msg.files && msg.files.length > 0) {
    msg.files.forEach(f => {
      const preview = document.createElement('div');
      preview.className = 'file-preview';
      preview.style.marginBottom = '4px'; // separación con el texto
      const span = document.createElement('span');
      span.textContent = f.name;
      preview.appendChild(span);
      div.appendChild(preview);
    });
  }

  // Texto
  if (msg.text) {
    const p = document.createElement('p');
    p.textContent = msg.text;
    p.style.margin = 0; // evitar que el texto agregue padding extra
    div.appendChild(p);
  }

  conversation.appendChild(div);
  conversation.scrollTop = conversation.scrollHeight;
}

// ------------------- Tipado -------------------
function setTyping(on) {
  if (on) {
    const d = document.createElement('div');
    d.className = 'typing';
    d.id = 'typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    conversation.appendChild(d);
    conversation.scrollTop = conversation.scrollHeight;
    sendBtn.disabled = true;
  } else {
    const t = document.getElementById('typing');
    if (t) t.remove();
    sendBtn.disabled = false;
  }
}

// ------------------- Manejo de archivos -------------------
fileUploadBtn.addEventListener('click', () => hiddenFileInput.click());

hiddenFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const fileData = { type: file.type, name: file.name, data: reader.result };
    attachedFiles.push(fileData);

    // Crear preview visual
    // Crear preview visual con botón de eliminar
    const preview = document.createElement('div');
    preview.className = 'file-preview';

    const span = document.createElement('span');
    span.textContent = file.name;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '✖';
    removeBtn.onclick = () => {
      // quitar el archivo de la lista
      attachedFiles = attachedFiles.filter(f => f !== fileData);
      // quitar el preview del DOM
      preview.remove();
      // deshabilitar enviar si ya no hay nada
      if (attachedFiles.length === 0 && !userInput.value.trim()) {
        sendBtn.disabled = true;
      }
    };

    preview.appendChild(span);
    preview.appendChild(removeBtn);
    filePreviewContainer.appendChild(preview);

    sendBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});

function clearAttachedFiles() {
  attachedFiles = [];
  filePreviewContainer.innerHTML = '';
}

// ------------------- Enviar mensaje -------------------
sendBtn.onclick = async () => {
  const text = userInput.value.trim();
  if (!current) return;
  if (!text && attachedFiles.length === 0) return;

  const userMsg = { text, sender: 'user', files: [...attachedFiles] };
  current.msgs.push(userMsg);
  appendMessageToDOM(userMsg);

  userInput.value = '';
  clearAttachedFiles();
  setTyping(true);

  // 🔥 Aquí lo movemos, para que se ejecute siempre en el primer mensaje (texto o archivo)
  if (!current.promptLocked) {
    current.promptLocked = true;
    modeSelector.style.display = 'none';
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: current.id || null,
        messages: current.msgs,
        mode: current.mode || 'general'
      })
    });
    const data = await res.json();
    setTyping(false);

    const botMsg = { text: data.message || data.reply, sender: 'bot', files: [] };
    current.msgs.push(botMsg);
    appendMessageToDOM(botMsg);

    if (!current.id && data.chat_id) current.id = data.chat_id;
    if (!current.title) await generateTitle(current);
  } catch {
    setTyping(false);
    const errMsg = { text: 'Error al conectar con el servidor.', sender: 'bot', files: [] };
    current.msgs.push(errMsg);
    appendMessageToDOM(errMsg);
  }
};

// ------------------- Ajuste de altura del textarea -------------------
userInput.addEventListener('input', () => {
  sendBtn.disabled = userInput.value.trim().length === 0 && attachedFiles.length === 0;
  userInput.style.height = 'auto';
  const lineHeight = 24;
  const lines = userInput.value.split('\n').length;
  const newHeight = Math.min(lines * lineHeight + 20, 200);
  userInput.style.height = newHeight + 'px';
});

// ------------------- Cargar chats -------------------
async function loadChats() {
  try {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('No history');
    const data = await res.json();

    if (Array.isArray(data.chats)) {
      chats = data.chats.map(chat => ({
        id: chat.id,
        title: chat.title || '',
        mode: chat.mode || 'general',
        msgs: chat.msgs.map(m => ({ ...m, files: m.files || [] })),
        promptLocked: chat.promptLocked || chat.msgs.length > 1
      }));

      if (chats.length > 0) select(chats[0]);
      else newChat();
    } else newChat();
  } catch (err) {
    console.error('Error loading chats:', err);
    newChat();
  }
}

// ------------------- Sesión -------------------
async function checkSession() {
  try {
    const res = await fetch('/api/session');
    if (!res.ok) throw new Error('No session');
    const data = await res.json();
    if (data.usuario) {
      loginArea.innerHTML = `Hola, ${data.usuario}`;
    }
  } catch { /* no session */ }
}

// ------------------- Inicialización -------------------
loadChats();
checkSession();
