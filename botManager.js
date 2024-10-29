const MinecraftBot = require('./minecraftBot');  // Custom bot class for individual bots
const { v4: uuidv4 } = require('uuid');           // For generating unique bot IDs

class BotManager {
    constructor(io) {
        this.io = io;
        this.bots = {}; // Store each bot instance with its associated data
    }

    // Create a new bot session
    createBot(data, socket) {
        const botId = uuidv4();
        
        // Initialize the MinecraftBot with unique botId and pass the Socket.io instance
        const bot = new MinecraftBot(
            data.username,
            data.host,
            data.port,
            data.version,
            data.connectCommand,
            botId,
            this.io
        );
        
        // Store bot instance and associated metadata
        this.bots[botId] = {
            bot,
            username: data.username,
            uptimeStart: Date.now() // Record the start time for uptime tracking
        };

        // Emit the botCreated event with bot details to the client
        const botData = { botId, username: data.username, uptimeStart: this.bots[botId].uptimeStart };
        socket.emit('botCreated', botData);
        return botData;
    }

    // Stop and remove a bot session
    stopBot(botId) {
        if (this.bots[botId]) {
            const botInstance = this.bots[botId].bot;

            // Ensure safe stopping of the bot instance
            if (typeof botInstance.stop === 'function') {
                botInstance.stop();
            }

            // Remove the bot from active sessions and notify clients
            delete this.bots[botId];
            this.io.emit('botStopped', botId);
        }
    }

    // Send a chat message to a specific bot's in-game chat
    sendMessage(data) {
        const botSession = this.bots[data.botId];
        if (botSession) {
            botSession.bot.sendChatMessage(data.message);
        }
    }

    // Retrieve all running sessions for display on the homepage
    getRunningSessions() {
        return Object.keys(this.bots).map(botId => ({
            botId,
            username: this.bots[botId].username,
            uptimeStart: this.bots[botId].uptimeStart
        }));
    }
}

module.exports = BotManager;
