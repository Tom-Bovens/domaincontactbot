

const path = require('path');
const envfile = `${process.cwd()}${path.sep}.env`;
require('dotenv').config({
    path: envfile
});
const ChipChat = require('chipchat');
const log = require('debug')('tourguide')
const get = require('lodash/get');
const incrementor = {
    // This function adds delay to the message to ensure the messages are posted in the right order
    autoDelayTime: 500,
    increment: function (timeToIncrease = 1) {
        this.autoDelayTime += (timeToIncrease * 1000);
        return this.autoDelayTime;
    },
    set: function (timeToSet = 1) {
        this.autoDelayTime = (timeToSet * 1000);
        return this.autoDelayTime;
    }
};
log(process.env.HOST,process.env.TOKEN)
const errorCatch = (error) => {
    log(error);
}

// Create a new bot instance
const bot = new ChipChat({
    host: process.env.HOST,
    token: process.env.TOKEN
});

// Crashes the code if no token is found
if (!process.env.TOKEN) {
    throw 'No token found, please define a token with export TOKEN=(Webhook token), or use an .env file.'
}

// Use any REST resource
// bot.users.get(bot.auth.user).then((botUser) => {
// log(`Hello ${botUser.role}`);
//});

// Logs any error produced to the console
bot.on('error', log);

bot.on('message.create.bot.command', async (info) => {
    if (info.text === "/join") {
        try {
            const conversationId = info.conversation
            log(conversationId)
            const conversation = await bot.conversations.get(conversationId)
            const user = conversation.participants.find((participants) => participants.role === 'agent');
            const getUser = await bot.users.get(user.user)
            log(getUser.email)
            if (user.role === 'agent') {
                await bot.send(conversationId, [{
                    type: 'card',
                    text: 'Colleagues of this contact.',
                    isBackchannel: true
                },
                {
                    type: 'card',
                    text: 'https://developers.chatshipper.com/docs/pg-introduction',
                    isBackchannel: true
                }])
            }
        } catch (e) {
            errorCatch(e)
        }
    }
});


// Start Express.js webhook server to start listening
bot.start();
