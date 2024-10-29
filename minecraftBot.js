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
            this.io.to(this.botId).emit('botUsername', this.username);
        });

        // Emit in-game messages to the session
        this.bot.on('message', (message) => {
            const msgContent = message.toString();
            this.io.to(this.botId).emit('message', msgContent);
        });

        this.bot.on('error', (err) => {
            console.error('Bot error:', err);
        });
    }

    sendChatMessage(message) {
        this.bot.chat(message);
    }

    stop() {
        this.bot.end();
    }
}

module.exports = MinecraftBot;
