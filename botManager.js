const MinecraftBot = require('./minecraftBot');
const { v4: uuidv4 } = require('uuid');

class BotManager {
    constructor(io) {
        this.io = io;
        this.bots = {};
    }

    createBot(data, socket) {
        const botId = uuidv4();
        const bot = new MinecraftBot(data.username, data.host, data.port, data.version, data.connectCommand, botId, this.io);
        this.bots[botId] = bot;
        socket.emit('botCreated', { botId, username: data.username });  // Emit event to confirm bot creation
    }

    sendMessage(data) {
        const bot = this.bots[data.botId];
        if (bot) bot.sendChatMessage(data.message);
    }

    stopBot(botId) {
        if (this.bots[botId]) {
            this.bots[botId].stop();
            delete this.bots[botId];
            this.io.emit('botStopped', botId);
        }
    }
}

module.exports = BotManager;
