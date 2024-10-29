const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const BotManager = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Password-protected access
const ACCESS_PASSWORD = "your_password"; // Change this to a secure password
app.use((req, res, next) => {
    const auth = req.headers['authorization'];
    if (auth === `Bearer ${ACCESS_PASSWORD}`) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Initialize Bot Manager
const botManager = new BotManager(io);

// Home route - displays running sessions
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Session route - displays individual bot session
app.get('/session/:botId', (req, res) => {
    const botId = req.params.botId;
    if (botManager.bots[botId]) {
        res.sendFile(__dirname + '/public/session.html');
    } else {
        res.status(404).send('Session not found');
    }
});

// Socket.io connections
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('createBot', (data) => botManager.createBot(data, socket));
    socket.on('sendMessage', (data) => botManager.sendMessage(data));
    socket.on('stopBot', (botId) => botManager.stopBot(botId));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
