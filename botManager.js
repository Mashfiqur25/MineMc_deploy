const MinecraftBot = require('./minecraftBot');
const { v4: uuidv4 } = require('uuid');

class BotManager {
    constructor(io) {
        this.io = io;
        this.bots = {}; // Store each bot instance with its associated data
    }

    createBot(data, socket) {
        const botId = uuidv4();
        
        const bot = new MinecraftBot(
            data.username,
            data.host,
            data.port,
            data.version,
            data.connectCommand,
            botId,
            this.io
        );

        this.bots[botId] = {
            bot,
            username: data.username,
            uptimeStart: Date.now(),
            chatLogs: [],
            isAntiAfkActive: false // Track Anti-AFK state for each bot
        };

        bot.bot.on('message', (message) => {
            const msgContent = message.toString();
            this.bots[botId].chatLogs.push(msgContent);
        });

        const botData = { botId, username: data.username, uptimeStart: this.bots[botId].uptimeStart };
        socket.emit('botCreated', botData);
        return botData;
    }

    getChatLogs(botId) {
        return this.bots[botId]?.chatLogs || [];
    }

    stopBot(botId) {
        if (this.bots[botId]) {
            const botInstance = this.bots[botId].bot;
            if (typeof botInstance.stop === 'function') {
                botInstance.stop();
            }
            delete this.bots[botId];
            this.io.emit('botStopped', botId);
        }
    }

    sendMessage(data) {
        const botSession = this.bots[data.botId];
        if (botSession) {
            botSession.bot.sendChatMessage(data.message);
        }
    }

    // Start Anti-AFK for a specific bot and save state
    startAntiAfk(botId) {
        if (this.bots[botId]) {
            this.bots[botId].bot.startAntiAfk();
            this.bots[botId].isAntiAfkActive = true;
        }
    }

    // Stop Anti-AFK for a specific bot and save state
    stopAntiAfk(botId) {
        if (this.bots[botId]) {
            this.bots[botId].bot.stopAntiAfk();
            this.bots[botId].isAntiAfkActive = false;
        }
    }

    getRunningSessions() {
        return Object.keys(this.bots).map(botId => ({
            botId,
            username: this.bots[botId].username,
            uptimeStart: this.bots[botId].uptimeStart
        }));
    }
}

module.exports = BotManager;
