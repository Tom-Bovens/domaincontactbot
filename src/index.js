
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

// Logs any error produced to the console
bot.on('error', log);

bot.on('message.create.*.command', async (message, conversation) => {
    log(message.text)
    if (message.text === "/join") {
        try {
            const user = conversation.participants.find(p => p.role === 'admin' || p.role === 'owner');
            if (user) {
                const getUser = await bot.users.get(user.user)
                const domain = (getUser.email.split('@'))[1] // Splits the email address in tween, returning the domain in an array.
                const organization = await bot.organizations.get(user.organization)
                const organizationDomain = organization.whitelist.find((whitelist) => whitelist === domain);
                if (organizationDomain) {
                    const colleagues = await bot.users.list({ organization:user.organization, email:`~@${domain}` })
                    let string = `<b><p style="font-size:15px">Colleagues of this contact. Domain is ${domain} </p></b> </br>`
                    const map = colleagues.map(x => `<a href="https://youtube.com"><i>${x.displayName}</i></a>`)
                    string = string + map.join(' </br>')
                    log(string)
                    await conversation.say({
                        contentType: 'text/html',
                        type: 'card',
                        text: string,
                        isBackchannel: true
                    })
                }
            } else { log("No admins or owners in this chat.") }
        } catch (e) {
            errorCatch(e)
        }
    }
});

// Start Express.js webhook server to start listening
bot.start();
