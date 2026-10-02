import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import {
    createPlayerKeyboard,
    createPartnerKeyboard,
    createAdminKeyboard,
} from "../keyboards/main.keyboards.js";

import {
    emoji,
} from "../ui/emojis.js";


const userService =
    new UserService();

const giveawayService =
    new GiveawayService();


export function registerStartCommand(
    bot: Bot<BotContext>,
) {
    bot.command(
        "start",
        async (ctx) => {
            const telegramUser =
                ctx.from;


            if (!telegramUser) {
                return;
            }


            const user =
                await userService
                    .getOrCreateTelegramUser({
                        telegramId:
                            String(
                                telegramUser.id,
                            ),

                        username:
                            telegramUser.username,

                        firstName:
                            telegramUser.first_name,
                    });


            if (!user) {
                await ctx.reply(
                    "❌ Не удалось загрузить пользователя.",
                );

                return;
            }


            const startPayload =
                ctx.match?.trim();


            /*
             * Пользователь пришёл
             * по ссылке на розыгрыш.
             *
             * Например:
             * /start g_15
             */
            if (
                startPayload &&
                startPayload.startsWith(
                    "g_",
                )
            ) {
                const giveawayId =
                    Number(
                        startPayload.slice(
                            2,
                        ),
                    );


                if (
                    !Number.isInteger(
                        giveawayId,
                    )
                ) {
                    await ctx.reply(
                        "❌ Некорректная ссылка на розыгрыш.",
                    );

                    return;
                }


                const giveaway =
                    await giveawayService
                        .getGiveawayById(
                            giveawayId,
                        );


                if (!giveaway) {
                    await ctx.reply(
                        "❌ Розыгрыш не найден.",
                    );

                    return;
                }


                if (
                    giveaway.status !==
                    "ACTIVE"
                ) {
                    await ctx.reply(
                        "❌ Этот розыгрыш уже недоступен.",
                    );

                    return;
                }


                if (
                    giveaway.endsAt.getTime() <=
                    Date.now()
                ) {
                    await ctx.reply(
                        "⏰ Розыгрыш уже завершён.",
                    );

                    return;
                }


                const keyboard =
                    new InlineKeyboard()
                        .text(
                            "🎟 Участвовать",
                            `giveaway:join:${giveaway.id}`,
                        );


                await ctx.reply(
                    `${emoji("slots")} <b>${giveaway.title}</b>

🏆 Победителей: <b>${giveaway.winnersCount}</b>

Нажми кнопку ниже, чтобы принять участие.`,
                    {
                        parse_mode:
                            "HTML",

                        reply_markup:
                            keyboard,
                    },
                );

                return;
            }


            let keyboard;


            switch (user.role) {
                case "ADMIN":
                    keyboard =
                        createAdminKeyboard();
                    break;

                case "PARTNER":
                    keyboard =
                        createPartnerKeyboard();
                    break;

                default:
                    keyboard =
                        createPlayerKeyboard();
            }


            await ctx.reply(
                `👋 Привет, ${telegramUser.first_name}!`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );
}