let socket;

async function login() {
    const password = document.getElementById('password').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (response.ok) {
        // Hide login section and show main content
        document.getElementById('login').style.display = 'none';
        document.getElementById('mainContent').classList.remove('d-none');

        // Initialize WebSocket connection after login
        socket = io();

        loadSessions(); // Load existing sessions once after login
        setupSocketListeners(); // Set up WebSocket listeners
    } else {
        alert('Incorrect password');
    }
}

// Load all running sessions from the server and display them on the homepage
async function loadSessions() {
    const response = await fetch('/api/running-sessions');
    const sessions = await response.json();
    sessions.forEach(addSessionToList);
}

// Set up Socket.io event listeners
function setupSocketListeners() {
    socket.on('botCreated', (data) => {
        // Check if botId already exists in the session list to avoid duplicates
        if (!document.getElementById(`session-${data.botId}`)) {
            addSessionToList(data);
        }
    });

    socket.on('botStopped', (botId) => {
        const sessionList = document.getElementById('sessionList');
        const botItem = document.getElementById(`session-${botId}`);
        if (botItem) {
            sessionList.removeChild(botItem);
        }
    });
}

// Add a bot session to the session list and start uptime tracking
function addSessionToList({ botId, username, uptimeStart }) {
    const listItem = document.createElement('li');
    listItem.id = `session-${botId}`; // Set a unique ID for each session list item
    listItem.className = 'list-group-item';
    listItem.innerHTML = `
        <a href="/session/${botId}">${username}</a> - 
        <span id="uptime-${botId}">Uptime: ${formatUptime(uptimeStart)}</span>
        <button onclick="stopBot('${botId}')" class="btn btn-sm btn-danger ms-2">Stop</button>
    `;
    document.getElementById('sessionList').appendChild(listItem);

    // Update uptime every second
    setInterval(() => {
        document.getElementById(`uptime-${botId}`).textContent = `Uptime: ${formatUptime(uptimeStart)}`;
    }, 1000);
}

// Helper function to format uptime in hours, minutes, and seconds
function formatUptime(uptimeStart) {
    const seconds = Math.floor((Date.now() - uptimeStart) / 1000);
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function stopBot(botId) {
    socket.emit('stopBot', botId);
}

document.getElementById('loginButton').addEventListener('click', login);
document.getElementById('createBotButton').addEventListener('click', createBot);

function createBot() {
    const data = {
        username: document.getElementById('username').value,
        host: document.getElementById('host').value,
        port: parseInt(document.getElementById('port').value),
        version: document.getElementById('version').value,
        connectCommand: document.getElementById('connectCommand').value
    };
    socket.emit('createBot', data);
}
