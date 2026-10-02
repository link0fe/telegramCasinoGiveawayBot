import type {
    Bot,
} from "grammy";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    emoji,
} from "../ui/emojis.js";


export function registerCustomEmojiDebug(
    bot: Bot<BotContext>,
) {

    /*
     * Тест отображения custom emoji.
     */
    bot.command(
        "emojitest",
        async (ctx) => {
            console.log(
                "[EmojiTest] command received",
            );

            await ctx.reply(
                `${emoji("star")} <b>CASINO GIVEAWAY</b>

${emoji("slots")} Розыгрыши

${emoji("diamond")} Premium призы

${emoji("gift")} Бонусы и подарки

${emoji("luckyCat")} Победители

${emoji("party")} Поздравляем!

${emoji("strawberry")} Casino bonus

${emoji("fire")} Горячий розыгрыш

${emoji("lightning")} Участвовать`,
                {
                    parse_mode:
                        "HTML",
                },
            );
        },
    );


    /*
     * Debug для получения custom_emoji_id.
     */
    bot.on(
        "message:text",
        async (ctx, next) => {
            const entities =
                ctx.message.entities ?? [];

            const customEmojis =
                entities.filter(
                    (entity) =>
                        entity.type ===
                        "custom_emoji",
                );


            if (
                customEmojis.length === 0
            ) {
                await next();

                return;
            }


            const result =
                customEmojis.map(
                    (
                        entity,
                        index,
                    ) => [
                        `Emoji ${index + 1}`,
                        `ID: ${entity.custom_emoji_id}`,
                        `Offset: ${entity.offset}`,
                        `Length: ${entity.length}`,
                    ].join("\n"),
                );


            console.log(
                "[CustomEmoji]",
                customEmojis,
            );


            await ctx.reply(
                [
                    "✨ Custom Emoji найден!",
                    "",
                    ...result,
                ].join("\n"),
            );
        },
    );
}