const mineflayer = require('mineflayer');

class MinecraftBot {
    constructor(username, host, port, version, connectCommand, botId, io) {
        this.username = username;
        this.host = host;
        this.port = port;
        this.version = version;
        this.connectCommand = connectCommand;
        this.botId = botId;
        this.io = io;
        this.uptimeStart = Date.now();
        this.isAntiAfkActive = false; // Track Anti-AFK status
        this.antiAfkInterval = null; // Store the interval for Anti-AFK movement
        this.initBot();
    }

    initBot() {
        this.bot = mineflayer.createBot({
            username: this.username,
            host: this.host,
            port: this.port,
            version: this.version
        });

        this.bot.on('login', () => {
            this.bot.chat(this.connectCommand);
            this.io.to(this.botId).emit('botUsername', this.username); // Send bot username to client
        });

        // Emit in-game chat messages to the session room
        this.bot.on('message', (message) => {
            const msgContent = message.toString();
            this.io.to(this.botId).emit('message', msgContent);
        });

        this.bot.on('error', (err) => {
            console.error('Bot error:', err);
        });
    }

    // Start the Anti-AFK system
    startAntiAfk() {
        if (this.isAntiAfkActive) return;
        this.isAntiAfkActive = true;

        this.antiAfkInterval = setInterval(() => {
            // Toggle movement direction randomly
            const moveLeft = Math.random() > 0.5;
            this.bot.setControlState('left', moveLeft);
            this.bot.setControlState('right', !moveLeft);

            // Stop movement briefly before switching directions again
            setTimeout(() => {
                this.bot.setControlState('left', false);
                this.bot.setControlState('right', false);
            }, 500);
        }, 2000); // Adjust interval timing as needed
    }

    // Stop the Anti-AFK system
    stopAntiAfk() {
        if (!this.isAntiAfkActive) return;
        this.isAntiAfkActive = false;

        clearInterval(this.antiAfkInterval);
        this.bot.setControlState('left', false);
        this.bot.setControlState('right', false);
    }

    sendChatMessage(message) {
        this.bot.chat(message);
    }

    stop() {
        this.stopAntiAfk(); // Ensure Anti-AFK is stopped when the bot stops
        this.bot.end();
    }
}

module.exports = MinecraftBot;
