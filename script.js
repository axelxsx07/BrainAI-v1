const sidebar    = document.getElementById('sidebar');
const toggleBtn  = document.getElementById('toggleSidebar');
const chatList   = document.getElementById('chatList');
const conversation = document.getElementById('conversation');
const userInput  = document.getElementById('userInput');
const sendBtn    = document.getElementById('sendBtn');
const chatArea   = document.getElementById('chatArea');
const modeSelector = document.getElementById('modeSelector');
const modeCards = modeSelector.querySelectorAll('.modeCard');
const chatTitleInput = document.getElementById('chatTitle');
const loginArea = document.getElementById('loginArea');

let chats = [];
let current = null;
let selectedMode = 'general';

toggleBtn.onclick = () => {
  const open = sidebar.classList.toggle('open');
  toggleBtn.classList.toggle('rotated', open);
  chatArea.classList.toggle('shifted', open);
  document.querySelector('.input-area').classList.toggle('shifted', open);
};

modeCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!current || current.promptLocked) return; // No cambiar modo si ya está bloqueado

    modeCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedMode = card.dataset.mode;

    if (current) {
      current.mode = selectedMode;
    }
  });
});

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
  } catch (e) {
    console.error('Error generando título:', e);
  }
}

function newChat() {
  const n = { 
    title: '', 
    mode: selectedMode, 
    msgs: [{ text: '¡Hola! ¿Cómo puedo ayudarte?', sender: 'bot' }],
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

function renderList() {
  chatList.innerHTML = '';
  chats.forEach((c, i) => {
    const li = document.createElement('li');
    const nro = i + 1;
    li.textContent = c.title
      ? `Chat ${nro} - ${c.title}`
      : `Chat ${nro}`;
    li.className = '';
    if (c === current) li.classList.add('active');
    li.style.animationDelay = `${i * 0.05}s`;
    li.onclick = () => select(c);
    chatList.appendChild(li);
  });
}

function render() {
  conversation.innerHTML = '';
  current.msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = 'message ' + (m.sender === 'user' ? 'user' : 'bot');
    div.textContent = m.text;
    conversation.appendChild(div);
  });
  conversation.scrollTop = conversation.scrollHeight;
  sendBtn.disabled = false;
  const idx = chats.indexOf(current) + 1;
  chatTitleInput.value = current.title !== '' ? current.title : `Chat ${idx}`;
  chatTitleInput.readOnly = true;
  chatTitleInput.style.cursor = 'default';
}

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

sendBtn.onclick = async () => {
  const text = userInput.value.trim();
  if (!text || !current) return;
  current.msgs.push({ text, sender: 'user' });
  userInput.value = '';
  render();
  setTyping(true);

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
    current.msgs.push({ text: data.message || data.reply, sender: 'bot' });

    if (!current.id && data.chat_id) {
      current.id = data.chat_id;
    }

    render();

    if (!current.title) {
      await generateTitle(current);
    }
  } catch {
    setTyping(false);
    current.msgs.push({ text: 'Error al conectar con el servidor.', sender: 'bot' });
    render();
  }
};

userInput.addEventListener('input', () => {
  sendBtn.disabled = userInput.value.trim().length === 0;
  userInput.style.height = 'auto';
  const lineHeight = 24;
  const lines = userInput.value.split('\n').length;
  const newHeight = Math.min(lines * lineHeight + 20, 200);
  userInput.style.height = newHeight + 'px';
});

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
        msgs: chat.msgs || [],
        promptLocked: chat.promptLocked || chat.msgs.length > 1
      }));

      if (chats.length > 0) {
        select(chats[0]);
      } else {
        newChat();
      }
    } else {
      newChat();
    }
  } catch (err) {
    console.error('Error loading chats:', err);
    newChat();
  }
}

async function checkSession() {
  try {
    const res = await fetch('/api/session');
    if (!res.ok) throw new Error('No session');
    const data = await res.json();
    if (data.usuario) {
      loginArea.innerHTML = `<span style="color:#1e90ff; padding:1rem; font-size: 1rem;">Bienvenido, ${data.usuario}</span>`;
      await loadChats();
    } else {
      loginArea.innerHTML = `<a href="registro.html" class="login-link" target="_self" rel="noopener noreferrer">Login in</a>`;
      newChat();
    }
  } catch {
    loginArea.innerHTML = `<a href="registro.html" class="login-link" target="_self" rel="noopener noreferrer">Login in</a>`;
    newChat();
  }
}

checkSession();
