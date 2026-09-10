import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import type {
    BotContext,
} from "../session/bot-session.js";


const giveawayService =
    new GiveawayService();

const userService =
    new UserService();


export function registerGiveawayWizard(
    bot: Bot<BotContext>,
) {

    bot.callbackQuery(
        "partner:create-giveaway",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            const user =
                await userService
                    .getOrCreateTelegramUser({
                        telegramId:
                            String(ctx.from.id),

                        username:
                            ctx.from.username,

                        firstName:
                            ctx.from.first_name,
                    });

            if (
                user.role !==
                "PARTNER"
            ) {
                await ctx.reply(
                    "⛔ Создавать розыгрыши может только партнер.",
                );

                return;
            }

            ctx.session.giveawayWizard = {
                step: "TITLE",
                data: {},
            };

            await ctx.reply(
                "🎁 Введи название розыгрыша:",
            );
        },
    );


    bot.callbackQuery(
        /^giveaway:first-deposit:(yes|no)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            const wizard =
                ctx.session
                    .giveawayWizard;

            if (
                !wizard ||
                wizard.step !==
                "FIRST_DEPOSIT"
            ) {
                return;
            }

            const requireFirstDeposit =
                ctx.match[1] === "yes";

            if (requireFirstDeposit) {
                ctx.session.giveawayWizard = {
                    step: "MIN_FTD",

                    data: {
                        ...wizard.data,

                        requireFirstDeposit:
                            true,
                    },
                };

                await ctx.reply(
                    "💰 Введи минимальную сумму первого депозита:",
                );

                return;
            }


            ctx.session.giveawayWizard = {
                step: "WINNERS",

                data: {
                    ...wizard.data,

                    requireFirstDeposit:
                        false,

                    minFirstDepositAmount:
                        0,
                },
            };

            await ctx.reply(
                "🏆 Сколько будет победителей?",
            );
        },
    );


    bot.on(
        "message:text",
        async (ctx, next) => {
            const wizard =
                ctx.session
                    .giveawayWizard;

            if (!wizard) {
                await next();
                return;
            }


            const text =
                ctx.message.text.trim();


            if (
                text === "/cancel"
            ) {
                delete ctx.session
                    .giveawayWizard;

                await ctx.reply(
                    "❌ Создание розыгрыша отменено.",
                );

                return;
            }


            switch (
                wizard.step
            ) {

                case "TITLE": {
                    if (
                        text.startsWith("/")
                    ) {
                        await next();
                        return;
                    }

                    ctx.session.giveawayWizard = {
                        step: "DURATION",

                        data: {
                            title: text,
                        },
                    };

                    await ctx.reply(
                        "⏱ Через сколько минут завершить розыгрыш?\n\nНапример: 60",
                    );

                    return;
                }


                case "DURATION": {
                    const minutes =
                        Number(text);

                    if (
                        !Number.isInteger(
                            minutes,
                        ) ||
                        minutes < 1
                    ) {
                        await ctx.reply(
                            "❌ Введи количество минут целым числом больше 0.",
                        );

                        return;
                    }

                    ctx.session.giveawayWizard = {
                        step: "FIRST_DEPOSIT",

                        data: {
                            ...wizard.data,

                            durationMinutes:
                                minutes,
                        },
                    };

                    const keyboard =
                        new InlineKeyboard()
                            .text(
                                "✅ Да",
                                "giveaway:first-deposit:yes",
                            )
                            .text(
                                "❌ Нет",
                                "giveaway:first-deposit:no",
                            );

                    await ctx.reply(
                        "💳 Требовать первый депозит?",
                        {
                            reply_markup:
                                keyboard,
                        },
                    );

                    return;
                }


                case "MIN_FTD": {
                    const amount =
                        Number(text);

                    if (
                        Number.isNaN(amount) ||
                        amount < 0
                    ) {
                        await ctx.reply(
                            "❌ Введи корректную сумму.",
                        );

                        return;
                    }

                    ctx.session.giveawayWizard = {
                        step: "WINNERS",

                        data: {
                            ...wizard.data,

                            minFirstDepositAmount:
                                amount,
                        },
                    };

                    await ctx.reply(
                        "🏆 Сколько будет победителей?",
                    );

                    return;
                }


                case "WINNERS": {
                    const winnersCount =
                        Number(text);

                    if (
                        !Number.isInteger(
                            winnersCount,
                        ) ||
                        winnersCount < 1
                    ) {
                        await ctx.reply(
                            "❌ Количество победителей должно быть целым числом больше 0.",
                        );

                        return;
                    }

                    ctx.session.giveawayWizard = {
                        step: "PRIZES",

                        data: {
                            ...wizard.data,

                            winnersCount,
                        },
                    };

                    await ctx.reply(
                        `💰 Теперь введи ${winnersCount} призов через запятую.\n\nНапример:\n100,50,25`,
                    );

                    return;
                }


                case "PRIZES": {
                    const amounts =
                        text
                            .split(",")
                            .map(
                                (value) =>
                                    Number(
                                        value.trim(),
                                    ),
                            );


                    if (
                        amounts.some(
                            (amount) =>
                                Number.isNaN(
                                    amount,
                                ) ||
                                amount <= 0,
                        )
                    ) {
                        await ctx.reply(
                            "❌ Все призы должны быть числами больше 0.",
                        );

                        return;
                    }


                    if (
                        amounts.length !==
                        wizard.data
                            .winnersCount
                    ) {
                        await ctx.reply(
                            `❌ Нужно указать ровно ${wizard.data.winnersCount} призов.`,
                        );

                        return;
                    }


                    try {
                        const giveaway =
                            await giveawayService
                                .createGiveawayForPartner(
                                    String(
                                        ctx.from.id,
                                    ),
                                    {
                                        title:
                                            wizard.data
                                                .title,

                                        endsAt:
                                            new Date(
                                                Date.now() +
                                                wizard.data
                                                    .durationMinutes *
                                                60 *
                                                1000,
                                            ),

                                        winnersCount:
                                            wizard.data
                                                .winnersCount,

                                        requireAffiliate:
                                            true,

                                        requireFirstDeposit:
                                            wizard.data
                                                .requireFirstDeposit,

                                        minFirstDepositAmount:
                                            wizard.data
                                                .minFirstDepositAmount,

                                        prizes:
                                            amounts.map(
                                                (
                                                    amount,
                                                    index,
                                                ) => ({
                                                    place:
                                                        index +
                                                        1,

                                                    amount,

                                                    currency:
                                                        "USD",
                                                }),
                                            ),
                                    },
                                );


                        delete ctx.session
                            .giveawayWizard;


                        const botInfo =
                            await ctx.api.getMe();

                        const giveawayLink =
                            `https://t.me/${botInfo.username}?start=g_${giveaway.id}`;

                        await ctx.reply(
                            `✅ Розыгрыш создан!

                            🎁 ${giveaway.title}
                            🆔 ID: ${giveaway.id}
                            🏆 Победителей: ${giveaway.winnersCount}

                            🔗 Ссылка для участников:
                            ${giveawayLink}`,
                        );

                    } catch (error) {
                        console.error(
                            error,
                        );

                        await ctx.reply(
                            "❌ Не удалось создать розыгрыш.",
                        );
                    }

                    return;
                }
            }


            await next();
        },
    );
}