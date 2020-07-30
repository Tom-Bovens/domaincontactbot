

// To-do
// Make a good save/load system that allows an agent to come back to a conversation that has since been closed.
    // Editing the videoContentDescription on Video 6 once it is unprivatised.

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

bot.on('user.create', async (loginUser) => {
    try {
        const user = await bot.users.get(get(loginUser, 'data.user.id'))
        const userId = user.id
        const hasSeenGuide = get(user, 'meta.hasSeenCommentguide', 'false')
        log(`User guide status: ${hasSeenGuide}`)
        if (hasSeenGuide === "false") {
            log("User has not seen the guide on result comments yet.")
            if (user.role == 'guest') {
                if (userId) {
                    let conversation
                    const oldConvFinder = await bot.conversations.list({ name:'Result comments', participants:{ user: userId } })
                    if (oldConvFinder.length > 0) {
                        conversation = oldConvFinder[0]
                        await bot.send(conversation.id, [
                            {
                                text: `Hey there ${user.givenName}! Welcome to Chatshipper! I need to show you something. Just a second!`,
                                isBackchannel: false,
                                role: 'bot',
                                delay: incrementor.set(3)
                            }
                        ])
                    } else {
                        conversation = await bot.conversations.create(
                            { name: 'Result comments', messages: [{ text: `Hey there ${user.givenName}! I need to show you something!` }] }
                        )
                    }
                    await bot.send(conversation.id, {
                        type: 'command',
                        text: '/assign',
                        meta: {
                            "users": [
                                userId
                            ]
                        }
                    })
                    await bot.send(conversation.id, [
                        {
                            text: `Chatshipper has a nice feature called result commenting, which can be used to leave feedback on forms your colleagues made!`,
                            isBackchannel: false,
                            role: 'bot',
                            delay: incrementor.increment(3)
                        },
                        {
                            text: `Just a second, i think i have an example of it somewhere...`,
                            isBackchannel: false,
                            role: 'bot',
                            delay: incrementor.increment(3)
                        },
                        {
                            contentType: 'image/png',
                            text: 'https://cht.onl/a/x7zEKfz3X/commentonform.gif',
                            delay: incrementor.increment(4)
                        }
                    ])
                }
            } else {
                log(`User is not a guest. Role is : ${user.role}`)
            }
        }
    } catch (e){
        errorCatch(e)
    }
});

// Start Express.js webhook server to start listening
bot.start();
