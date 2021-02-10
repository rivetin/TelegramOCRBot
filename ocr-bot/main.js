const { Telegraf, Scenes, session, } = require('telegraf')

const { Stage } = require('./node_modules/telegraf/lib/scenes/stage')
const { Markup } = require('telegraf')



require('dotenv').config()

const imageScene = require('./scenes/imageScene').imageScene
const videoScene = require('./scenes/videoScene').videoScene

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([imageScene, videoScene])
bot.use(session())
bot.use(stage.middleware())

bot.start((ctx) => {
    let userFirstName = ctx.message.from.first_name
    let message = ` Hello master ${userFirstName}, i am OCR bot your humble servant. \n
    Where would you like to extract text from ?`

    let options = Markup.inlineKeyboard([
        { text: 'Extract from 🖼️', callback_data: 'extractFromImage' },
        { text: 'Extract from 🎬', callback_data: 'extractFromVideo' },
    ])
    ctx.reply(message, options)
})

bot.action('extractFromImage', Stage.enter('imageScene'))
bot.action('extractFromVideo', Stage.enter('videoScene'))

bot.launch()