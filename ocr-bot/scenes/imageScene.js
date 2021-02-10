const { WizardScene } = require('../node_modules/telegraf/lib/scenes/wizard')
const { Composer } = require('telegraf')

const fileManager = require('../fileManager')
const OCR = require('../ocr')

const step1 = (ctx) => {
    ctx.reply('Send me the image')
    return ctx.wizard.next()
}

const step2 = new Composer()


step2.on('photo', async (ctx) => {
    ctx.reply('I have received the image please wait while i extract the text')
    let photos = ctx.update.message.photo
    const { file_id: fileId } = photos[photos.length - 1]
    const { file_unique_id: fileUniqueId } = photos[photos.length - 1]
    const fileUrl = await (ctx.telegram.getFileLink(fileId)) + " ";
    let imagePath = await fileManager.downloadFile(fileUrl, fileUniqueId, 'Image')

    let text = await OCR.extractText(imagePath)
    fileManager.deleteFile(imagePath)
    if (text != 'Empty') {
        ctx.replyWithHTML(`The extracted text is: \n <b>${text}</b>`)
    } else {
        ctx.reply(`Sorry we couldn't extract any text from the image`)
    }
    ctx.reply('Lets try this again , please send me another image')
    const currentStepIndex = ctx.wizard.cursor
    return ctx.wizard.selectStep(currentStepIndex)
});

step2.command('cancel', (ctx) => {
    ctx.reply('Bye bye')
    return ctx.scene.leave()
})

const imageScene = new WizardScene('imageScene',
    (ctx) => step1(ctx),
    step2,
)

module.exports = { imageScene }