import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    emoji,
} from "../ui/emojis.js";

import {
    createPlayerKeyboard,
} from "../keyboards/main.keyboards.js";


const giveawayService =
    new GiveawayService();


export function registerPlayerGiveawaysCommand(
    bot: Bot<BotContext>,
) {

    /*
     * =====================================
     * OPEN GIVEAWAYS
     * =====================================
     */
    bot.callbackQuery(
        "player:giveaways",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            try {

                await showGiveawayPage(
                    ctx,
                    0,
                    false,
                );

            } catch (error) {

                console.error(
                    "Failed to load player giveaways:",
                    error,
                );


                await ctx.reply(
                    "❌ Не удалось загрузить список розыгрышей.",
                );
            }
        },
    );


    /*
     * =====================================
     * NAVIGATION
     * =====================================
     */
    bot.callbackQuery(
        /^player:giveaways:(\d+)$/,
        async (ctx) => {

            await ctx.answerCallbackQuery();


            const index =
                Number(
                    ctx.match[1],
                );


            if (
                !Number.isInteger(
                    index,
                ) ||
                index < 0
            ) {
                return;
            }


            try {

                await showGiveawayPage(
                    ctx,
                    index,
                    true,
                );

            } catch (error) {

                console.error(
                    "Failed to navigate giveaways:",
                    error,
                );
            }
        },
    );


    /*
     * =====================================
     * NOOP
     * =====================================
     */
    bot.callbackQuery(
        "player:giveaways:noop",
        async (ctx) => {

            await ctx.answerCallbackQuery();
        },
    );


    /*
     * =====================================
     * PLAYER MENU
     * =====================================
     */
    bot.callbackQuery(
        "player:menu",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            const keyboard =
                createPlayerKeyboard();


            try {

                await ctx.editMessageText(
                    "🏠 <b>Главное меню</b>",
                    {
                        parse_mode:
                            "HTML",

                        reply_markup:
                            keyboard,
                    },
                );

            } catch (error) {

                console.error(
                    "Failed to show player menu:",
                    error,
                );
            }
        },
    );
}


/*
 * =====================================
 * SHOW GIVEAWAY
 * =====================================
 */
async function showGiveawayPage(
    ctx: BotContext,
    requestedIndex: number,
    editMessage: boolean,
) {

    const telegramUserId =
        ctx.from?.id;


    if (!telegramUserId) {
        return;
    }


    const result =
        await giveawayService
            .getActiveGiveawaysForPlayer(
                String(
                    telegramUserId,
                ),
            );


    const {
        linkedPlayer,
        giveaways,
    } = result;


    /*
     * =====================================
     * NO GIVEAWAYS
     * =====================================
     */
    if (
        giveaways.length ===
        0
    ) {

        let message =
            `${emoji("slots")} <b>Активные розыгрыши</b>

Сейчас для тебя нет доступных розыгрышей.`;


        if (linkedPlayer) {

            message +=
                `

🎰 Твой Player ID:
<code>${escapeHtml(
                    linkedPlayer.playerId,
                )}</code>`;
        }


        message +=
            `

${emoji("star")} Загляни немного позже!`;


        const keyboard =
            new InlineKeyboard()
                .text(
                    "🏠 Главное меню",
                    "player:menu",
                );


        await sendOrEdit(
            ctx,
            message,
            keyboard,
            editMessage,
        );


        return;
    }


    /*
     * =====================================
     * INDEX
     * =====================================
     */
    const total =
        giveaways.length;


    const index =
        (
            requestedIndex %
            total
            +
            total
        ) %
        total;


    const giveaway =
        giveaways[index];


    if (!giveaway) {
        return;
    }


    const previousIndex =
        index === 0
            ? total - 1
            : index - 1;


    const nextIndex =
        index ===
        total - 1
            ? 0
            : index + 1;


    /*
     * =====================================
     * HEADER
     * =====================================
     */
    let message =
        `${emoji("slots")} <b>Активные розыгрыши</b>

<b>${index + 1} из ${total}</b>

${emoji("gift")} <b>${escapeHtml(
            giveaway.title,
        )}</b>

🏆 Победителей: <b>${giveaway.winnersCount}</b>`;


    /*
     * =====================================
     * PRIZE
     * =====================================
     *
     * Теперь у розыгрыша один номинал
     * ваучера для всех победителей.
     */
    message +=
        `

🎟 <b>Ваучер каждому победителю:</b>
${formatPrize(
            giveaway.prizeAmount,
            giveaway.currency,
        )}`;


    /*
     * Общий призовой фонд.
     */
    const totalPrizeAmount =
        giveaway.prizeAmount *
        giveaway.winnersCount;


    message +=
        `

💰 Общий призовой фонд:
<b>${formatPrize(
            totalPrizeAmount,
            giveaway.currency,
        )}</b>`;


    /*
     * =====================================
     * PARTICIPANTS COUNT
     * =====================================
     */
    message +=
        `

👥 Участников: <b>${giveaway.participantsCount}</b>`;


    /*
     * =====================================
     * END DATE
     * =====================================
     */
    message +=
        `

⏰ Завершение:
<b>${formatDate(
            giveaway.endsAt,
        )}</b>`;


    /*
     * =====================================
     * FIRST DEPOSIT
     * =====================================
     */
    if (
        giveaway
            .requireFirstDeposit
    ) {

        message +=
            `

💳 Требуется первый депозит`;


        if (
            giveaway
                .minFirstDepositAmount >
            0
        ) {

            message +=
                ` от <b>${formatMoney(
                    giveaway
                        .minFirstDepositAmount,
                )}</b>`;
        }

    } else {

        message +=
            `

💳 Первый депозит не требуется`;
    }


    /*
     * =====================================
     * AFFILIATE
     * =====================================
     */
//     if (
//         giveaway
//             .requireAffiliate
//     ) {

//         message +=
//             `

// 🔗 Для игроков партнёра <b>${escapeHtml(
//                 giveaway.partnerName,
//             )}</b>`;

//     } else {

//         message +=
//             `

// 🌍 Доступен всем игрокам`;
//     }


    /*
     * =====================================
     * PARTICIPATION
     * =====================================
     */
    if (
        giveaway
            .participation
    ) {

        message +=
            `

${emoji("luckyCat")} <b>Ты уже участвуешь!</b>

🎰 Player ID:
<code>${escapeHtml(
                giveaway
                    .participation
                    .casinoPlayerId,
            )}</code>`;

    } else if (
        linkedPlayer
    ) {

        message +=
            `

🎰 Твой Player ID:
<code>${escapeHtml(
                linkedPlayer.playerId,
            )}</code>`;
    }


    /*
     * =====================================
     * KEYBOARD
     * =====================================
     */
    const keyboard =
        new InlineKeyboard();


    /*
     * Навигацию показываем только,
     * если розыгрышей больше одного.
     */
    if (
        total >
        1
    ) {

        keyboard
            .text(
                "◀️",
                `player:giveaways:${previousIndex}`,
            )
            .text(
                `${index + 1}/${total}`,
                "player:giveaways:noop",
            )
            .text(
                "▶️",
                `player:giveaways:${nextIndex}`,
            )
            .row();
    }


    /*
     * Участвовать можно только,
     * если пользователь ещё
     * не зарегистрирован
     * в этом розыгрыше.
     */
    if (
        !giveaway
            .participation
    ) {

        keyboard
            .text(
                "🎟 Участвовать",
                `giveaway:join:${giveaway.id}`,
            )
            .row();
    }


    keyboard
        .text(
            "🏠 Главное меню",
            "player:menu",
        );


    await sendOrEdit(
        ctx,
        message,
        keyboard,
        editMessage,
    );
}


/*
 * =====================================
 * SEND / EDIT
 * =====================================
 */
async function sendOrEdit(
    ctx: BotContext,
    message: string,
    keyboard: InlineKeyboard,
    editMessage: boolean,
) {

    /*
     * Навигация:
     * меняем существующее сообщение.
     */
    if (editMessage) {

        try {

            await ctx.editMessageText(
                message,
                {
                    parse_mode:
                        "HTML",

                    reply_markup:
                        keyboard,
                },
            );

        } catch (error) {

            if (
                isMessageNotModifiedError(
                    error,
                )
            ) {
                return;
            }


            throw error;
        }


        return;
    }


    /*
     * Первое открытие:
     * создаём одно сообщение.
     */
    await ctx.reply(
        message,
        {
            parse_mode:
                "HTML",

            reply_markup:
                keyboard,
        },
    );
}


/*
 * =====================================
 * PRIZE
 * =====================================
 */
function formatPrize(
    amount: number,
    currency: string,
) {

    const formatted =
        new Intl.NumberFormat(
            "ru-RU",
            {
                maximumFractionDigits:
                    2,
            },
        ).format(
            amount,
        );


    if (
        currency ===
        "RUB"
    ) {

        return `${formatted} ₽`;
    }


    return `${formatted} ${currency}`;
}


/*
 * =====================================
 * MONEY
 * =====================================
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


/*
 * =====================================
 * DATE
 * =====================================
 */
function formatDate(
    date: Date,
) {

    return date
        .toLocaleString(
            "ru-RU",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",
            },
        );
}


/*
 * =====================================
 * HTML ESCAPE
 * =====================================
 */
function escapeHtml(
    value: string,
) {

    return value
        .replace(
            /&/g,
            "&amp;",
        )
        .replace(
            /</g,
            "&lt;",
        )
        .replace(
            />/g,
            "&gt;",
        )
        .replace(
            /"/g,
            "&quot;",
        )
        .replace(
            /'/g,
            "&#039;",
        );
}


/*
 * =====================================
 * TELEGRAM ERROR
 * =====================================
 */
function isMessageNotModifiedError(
    error: unknown,
) {

    return String(
        error,
    ).includes(
        "message is not modified",
    );
}