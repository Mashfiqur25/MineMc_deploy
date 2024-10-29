// public/index.js
const socket = io();
const sessionList = document.getElementById('sessionList');

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
    sessionList.appendChild(listItem);
});

function stopBot(botId) {
    socket.emit('stopBot', botId);
}
