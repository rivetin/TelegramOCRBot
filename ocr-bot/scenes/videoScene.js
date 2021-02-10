const { Composer } = require('telegraf')
const { WizardScene } = require('../node_modules/telegraf/lib/scenes/wizard')
const fileManager = require('../fileManager')
const OCR = require('../ocr')

const step1 = (ctx) => {
    ctx.replyWithHTML('Send me the exact frame where you want to extract the text in the format <code>hh:mm:ss</code>. Example: <code>00:00:50</code> \n If you want to extract text from multiple frames use <code>,</code> to separate them. Example: <code>00:00:30,00:00:34</code> ')
    return ctx.wizard.next()
}

const step2 = new Composer()
step2.on('text', (ctx) => {
    let message = ctx.update.message.text.toLowerCase()
    if (message.includes(':')) {
        let frames = message.includes(',') ? message.split(',') : [message]
        ctx.scene.session.state.frames = frames
        ctx.reply('I know where to look for the images , now please send me the video')
        return ctx.wizard.next()
    } else if (message.includes('cancel')) {
        leaveScene(ctx)
    } else {
        const currentStepIndex = ctx.wizard.cursor
        ctx.replyWithHTML('sorry but i am waiting for a message in the following format <code>hh:mm:ss</code>')
        return ctx.wizard.selectStep(currentStepIndex)
    }
})

step2.command('cancel', (ctx) => leaveScene(ctx))

const step3 = new Composer()
step3.on('video', async (ctx) => {
    ctx.reply('I have received the video please wait while i extract the text')
    let video = ctx.update.message.video
    const currentStepIndex = ctx.wizard.cursor
    const { file_id: fileId } = video
    const { file_unique_id: fileUniqueId } = video
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    let videoPath = await fileManager.downloadFile(fileUrl, fileUniqueId, 'Video')
    let frames = ctx.scene.session.state.frames
    let promises = []
    for (let i = 0; i < frames.length; i++) {
        promises.push(OCR.videoOCR(videoPath, fileUniqueId, frames[i]))
    }
    const data = await Promise.all(promises)
    data.forEach(item => {
        let text = item.text
        let frame = item.frame
        if (text != 'Empty') {
            ctx.replyWithHTML(`The text extracted from the frame at the video length <b>${frame}</b> is : \n <b>${text}</b>`)
        } else {
            ctx.replyWithHTML(`Sorry we couldn't extract any text from the frame at the video length <b>${frame}</b>`)
        }
    })

    fileManager.deleteFile(videoPath)
    ctx.reply('Lets try this again, send me the frames')
    return ctx.wizard.selectStep(1)
})
step3.on('text', async (ctx) => {
    let message = ctx.update.message.text.toLowerCase()
    if (message.includes('cancel')) {
        leaveScene()
    } else {
        const currentStepIndex = ctx.wizard.cursor
        ctx.reply('sorry but i am waiting for a video')
        return ctx.wizard.selectStep(currentStepIndex)
    }
});

const leaveScene = (ctx) => {
    ctx.reply('Bye !!!')
    return ctx.scene.leave()
}
const videoScene = new WizardScene('videoScene',
    (ctx) => step1(ctx),
    step2,
    step3
)
module.exports = { videoScene }