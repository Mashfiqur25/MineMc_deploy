const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const session = require('express-session');
const path = require('path');
const BotManager = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

// Configure session middleware
const sessionMiddleware = session({
    secret: '1234', // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to `true` if using HTTPS
});

// Use the session middleware for Express routes
app.use(sessionMiddleware);

// Wrap the session middleware to work with Socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the Bot Manager with Socket.io instance
const botManager = new BotManager(io);

// Route for handling login
app.post('/login', express.json(), (req, res) => {
    const { password } = req.body;
    if (password === '1234') { // Replace with a secure password
        req.session.isAuthenticated = true;
        req.session.save(err => {
            if (err) return res.status(500).json({ success: false, message: 'Session save failed' });
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) return next();
    res.status(401).send('Unauthorized');
}

// Route to serve the main page (homepage)
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to get all running sessions for display on the homepage
app.get('/api/running-sessions', isAuthenticated, (req, res) => {
    res.json(botManager.getRunningSessions());
});

// Route to serve each bot session page
app.get('/session/:botId', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'session.html'));
});

// WebSocket connection handling
io.on('connection', (socket) => {
    if (!socket.request.session.isAuthenticated) {
        console.log('Socket connection unauthorized');
        socket.disconnect(true);
        return;
    }

    console.log('New WebSocket connection authorized');

    socket.on('joinSession', (botId) => {
        socket.join(botId);
        const botSession = botManager.bots[botId];
        if (botSession) {
            socket.emit('botUsername', botSession.username);
            socket.emit('chatLogs', botManager.getChatLogs(botId));
            socket.emit('antiAfkState', botSession.isAntiAfkActive || false); // Send Anti-AFK state to client
        }
    });

    socket.on('createBot', (data) => {
        const botData = botManager.createBot(data, socket);
        io.emit('botCreated', botData);
    });

    socket.on('stopBot', (botId) => {
        botManager.stopBot(botId);
        io.emit('botStopped', botId);
    });

    socket.on('sendMessage', (data) => {
        botManager.sendMessage(data);
    });

    socket.on('startAntiAfk', (botId) => {
        botManager.startAntiAfk(botId);
    });

    socket.on('stopAntiAfk', (botId) => {
        botManager.stopAntiAfk(botId);
    });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
