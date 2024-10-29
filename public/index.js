let socket;

// Function to handle login and establish WebSocket connection
async function login() {
    const password = document.getElementById('password').value;
    
    // Send login request to the server
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (response.ok) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

        // Initialize the WebSocket connection after successful login
        socket = io();
        
        loadSessions();  // Load existing sessions
        setupSocketListeners();  // Set up WebSocket listeners
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
    socket.on('botCreated', addSessionToList);
    socket.on('botStopped', (botId) => {
        const sessionList = document.getElementById('sessionList');
        const botItem = sessionList.querySelector(`a[href="/session/${botId}"]`).parentElement;
        sessionList.removeChild(botItem);
    });
}

// Function to create a new bot session
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

// Adds a bot session to the session list and starts uptime tracking
function addSessionToList({ botId, username, uptimeStart }) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <a href="/session/${botId}">${username}</a> - 
        <span id="uptime-${botId}">Uptime: ${formatUptime(uptimeStart)}</span>
        <button onclick="stopBot('${botId}')">Stop</button>
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

// Function to stop a bot session by emitting an event to the server
function stopBot(botId) {
    socket.emit('stopBot', botId);
}

// Event listener for the "Login" button
document.getElementById('loginButton').addEventListener('click', login);

// Event listener for the "Create Bot" button
document.getElementById('createBotButton').addEventListener('click', createBot);
