// public/index.js
const socket = io();
const password = '1234';  // Change this to a secure password

// Authentication
function login() {
    const enteredPassword = document.getElementById('password').value;
    if (enteredPassword === password) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    } else {
        alert('Incorrect password');
    }
}

// Create a new bot session
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

socket.on('botCreated', (data) => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `<a href="/session/${data.botId}">${data.username}</a> - <button onclick="stopBot('${data.botId}')">Stop</button>`;
    document.getElementById('sessionList').appendChild(listItem);
});

function stopBot(botId) {
    socket.emit('stopBot', botId);
}
