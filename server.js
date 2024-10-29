const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const session = require('express-session');
const path = require('path');
const BotManager = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3000",  // Replace with your frontend origin
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

const sessionMiddleware = session({
    secret: '1234',           
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }            
});

app.use(sessionMiddleware);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

const botManager = new BotManager(io);

app.use(express.static(path.join(__dirname, 'public')));

// Login route for setting session data
app.post('/login', express.json(), (req, res) => {
    const { password } = req.body;
    if (password === '1234') {  
        req.session.isAuthenticated = true;
        req.session.save(err => {
            if (err) return res.status(500).json({ success: false, message: 'Session save failed' });
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) return next();
    res.status(401).send('Unauthorized');
}

// Main page route with running sessions
app.get('/', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/api/running-sessions', isAuthenticated, (req, res) => {
    res.json(botManager.getRunningSessions());
});

app.get('/session/:botId', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'session.html'));
});

io.on('connection', (socket) => {
    if (!socket.request.session.isAuthenticated) {
        socket.disconnect(true);
        return;
    }

    console.log('New WebSocket connection authorized');

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
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
