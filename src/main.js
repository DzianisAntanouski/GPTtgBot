import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

const INIT_SESSION = {
    messages: [],
};

process.env.PORT = config.get('PORT')

const ACCESS = []

const bot = new Telegraf(config.get("TG_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
    ctx.session = INIT_SESSION;
    await ctx.reply("Still waiting your new messages ...");
});

bot.command("lever", async (ctx) => {
    ACCESS.push(ctx.message.from.id);
    await ctx.reply("Done, use chat");
});

bot.command("start", async (ctx) => {
    ctx.session = INIT_SESSION;
    await ctx.reply("Still waiting your new messages ...");
});

bot.on(message("voice"), async (ctx) => {
    if (!ACCESS.includes(ctx.message.from.id)) {
        await ctx.reply(code("You don't have access"))
        return
    }
    ctx.session ??= INIT_SESSION;
    try {
        await ctx.reply(code("Message apply, please wait ..."));

        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);

        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openai.transcription(mp3Path);

        await ctx.reply(code(`Your request is: ${text}`));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: text,
        });

        const gptMessage = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSIS,
            content: gptMessage.content,
        });
        await ctx.reply(gptMessage.content);
    } catch (error) {
        console.error("Err", error.message);
    }
});

bot.on(message("text"), async (ctx) => {
    ctx.session ??= INIT_SESSION;
    if (!ACCESS.includes(ctx.message.from.id)) {
        await ctx.reply(code("You don't have access"))
        return
    }
    try {
        await ctx.reply(code("Message apply, please wait ..."));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text,
        });

        const gptMessage = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSIS,
            content: gptMessage.content,
        });
        await ctx.reply(gptMessage.content);

    } catch (error) {
        console.error("Err", error.message);
    }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
