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

import {
    showMainMenu,
} from "../helpers/show-main-menu.js";


const giveawayService =
    new GiveawayService();

const userService =
    new UserService();


export function registerGiveawayWizard(
    bot: Bot<BotContext>,
) {

    /*
     * =========================
     * START CREATE GIVEAWAY
     * =========================
     */
    bot.callbackQuery(
        "partner:create-giveaway",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            const user =
                await userService
                    .getOrCreateTelegramUser({
                        telegramId:
                            String(
                                ctx.from.id,
                            ),

                        username:
                            ctx.from.username,

                        firstName:
                            ctx.from.first_name,
                    });


            if (
                !user ||
                user.role !==
                    "PARTNER"
            ) {

                await ctx.reply(
                    "⛔ Создавать розыгрыши может только партнер.",
                );

                return;
            }


            /*
             * Не оставляем активным
             * admin workflow.
             */
            delete ctx.session
                .partnerAdmin;


            ctx.session.giveawayWizard = {
                step:
                    "TITLE",

                data: {},
            };


            await ctx.reply(
                `🎁 Введи название розыгрыша.

/cancel — отменить создание`,
            );
        },
    );


    /*
     * =========================
     * FIRST DEPOSIT
     * =========================
     */
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
                ctx.match[1] ===
                "yes";


            /*
             * Если FTD обязателен —
             * спрашиваем минимальную сумму.
             */
            if (
                requireFirstDeposit
            ) {

                ctx.session.giveawayWizard = {
                    step:
                        "MIN_FTD",

                    data: {
                        ...wizard.data,

                        requireFirstDeposit:
                            true,
                    },
                };


                await ctx.reply(
                    `💰 Введи минимальную сумму первого депозита в рублях.

Например:
5000`,
                );


                return;
            }


            /*
             * Если FTD не нужен —
             * сразу переходим
             * к количеству победителей.
             */
            ctx.session.giveawayWizard = {
                step:
                    "WINNERS",

                data: {
                    ...wizard.data,

                    requireFirstDeposit:
                        false,

                    minFirstDepositAmount:
                        0,
                },
            };


            await ctx.reply(
                `🏆 Сколько будет победителей?

Например:
3`,
            );
        },
    );


    /*
     * =========================
     * TEXT WIZARD
     * =========================
     */
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
                ctx.message.text
                    .trim();


            /*
             * =========================
             * CANCEL
             * =========================
             */
            if (
                text ===
                "/cancel"
            ) {

                delete ctx.session
                    .giveawayWizard;


                await ctx.reply(
                    "❌ Создание розыгрыша отменено.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * Остальные команды
             * wizard не перехватывает.
             */
            if (
                text.startsWith("/")
            ) {

                await next();

                return;
            }


            switch (
                wizard.step
            ) {

                /*
                 * =========================
                 * TITLE
                 * =========================
                 */
                case "TITLE": {

                    if (
                        text.length < 1
                    ) {

                        await ctx.reply(
                            "❌ Название не может быть пустым.",
                        );

                        return;
                    }


                    ctx.session.giveawayWizard = {
                        step:
                            "DURATION",

                        data: {
                            title:
                                text,
                        },
                    };


                    await ctx.reply(
                        `⏱ Через сколько минут завершить розыгрыш?

Например:
60`,
                    );


                    return;
                }


                /*
                 * =========================
                 * DURATION
                 * =========================
                 */
                case "DURATION": {

                    const minutes =
                        Number(
                            text,
                        );


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
                        step:
                            "FIRST_DEPOSIT",

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


                /*
                 * =========================
                 * MINIMUM FIRST DEPOSIT
                 * =========================
                 */
                case "MIN_FTD": {

                    const amount =
                        Number(
                            text,
                        );


                    if (
                        !Number.isFinite(
                            amount,
                        ) ||
                        amount < 0
                    ) {

                        await ctx.reply(
                            "❌ Введи корректную сумму в рублях.",
                        );


                        return;
                    }


                    ctx.session.giveawayWizard = {
                        step:
                            "WINNERS",

                        data: {
                            ...wizard.data,

                            minFirstDepositAmount:
                                amount,
                        },
                    };


                    await ctx.reply(
                        `🏆 Сколько будет победителей?

Например:
3`,
                    );


                    return;
                }


                /*
                 * =========================
                 * WINNERS
                 * =========================
                 */
                case "WINNERS": {

                    const winnersCount =
                        Number(
                            text,
                        );


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
                        step:
                            "PRIZE_AMOUNT",

                        data: {
                            ...wizard.data,

                            winnersCount,
                        },
                    };


                    await ctx.reply(
                        `🎟 Введи номинал одного ваучера в рублях.

Каждый победитель получит ваучер этого номинала.

Например:
1000`,
                    );


                    return;
                }


                /*
                 * =========================
                 * PRIZE AMOUNT
                 * =========================
                 */
                case "PRIZE_AMOUNT": {

                    const prizeAmount =
                        Number(
                            text,
                        );


                    if (
                        !Number.isFinite(
                            prizeAmount,
                        ) ||
                        prizeAmount <= 0
                    ) {

                        await ctx.reply(
                            `❌ Введи корректный номинал ваучера.

Например:
1000`,
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

                                        prizeAmount,

                                        currency:
                                            "RUB",

                                        /*
                                         * Розыгрыш относится
                                         * к affiliate партнера.
                                         */
                                        requireAffiliate:
                                            true,

                                        requireFirstDeposit:
                                            wizard.data
                                                .requireFirstDeposit,

                                        minFirstDepositAmount:
                                            wizard.data
                                                .minFirstDepositAmount,

                                        /*
                                         * Проверка подписки
                                         * временно отключена.
                                         */
                                        requireChannelSubscription:
                                            false,

                                        channelUsername:
                                            null,
                                    },
                                );


                        delete ctx.session
                            .giveawayWizard;


                        const botInfo =
                            await ctx.api
                                .getMe();


                        const giveawayLink =
                            `https://t.me/${botInfo.username}?start=g_${giveaway.id}`;


                        const totalPrizeAmount =
                            giveaway.winnersCount *
                            giveaway.prizeAmount;


                        await ctx.reply(
                            `✅ Розыгрыш создан!

🎁 ${giveaway.title}
🆔 ID: ${giveaway.id}

🏆 Победителей: ${giveaway.winnersCount}
🎟 Ваучер каждому: ${formatMoney(
                                giveaway.prizeAmount,
                            )}

💰 Общий призовой фонд: ${formatMoney(
                                totalPrizeAmount,
                            )}

📦 Для завершения розыгрыша потребуется:
${giveaway.winnersCount} × ${formatMoney(
                                giveaway.prizeAmount,
                            )}

🔗 Ссылка для участников:
${giveawayLink}`,
                        );


                        await showMainMenu(
                            ctx,
                        );


                    } catch (error) {

                        console.error(
                            error,
                        );


                        const message =
                            error instanceof Error
                                ? error.message
                                : String(
                                    error,
                                );


                        if (
                            message ===
                            "PARTNER_INACTIVE"
                        ) {

                            await ctx.reply(
                                `⛔ Ваш аккаунт партнёра отключён.

Создание новых розыгрышей недоступно.`,
                            );


                            delete ctx.session
                                .giveawayWizard;


                            await showMainMenu(
                                ctx,
                            );


                            return;
                        }


                        if (
                            message ===
                            "INVALID_PRIZE_AMOUNT"
                        ) {

                            await ctx.reply(
                                "❌ Некорректный номинал ваучера.",
                            );


                            return;
                        }


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


/*
 * =========================
 * FORMAT MONEY
 * =========================
 */
function formatMoney(
    amount: number,
) {

    return (
        new Intl.NumberFormat(
            "ru-RU",
            {
                maximumFractionDigits:
                    2,
            },
        ).format(
            amount,
        )
        +
        " ₽"
    );
}