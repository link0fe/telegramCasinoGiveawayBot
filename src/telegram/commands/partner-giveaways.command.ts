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
    showMainMenu,
} from "../helpers/show-main-menu.js";


const giveawayService =
    new GiveawayService();


const PARTICIPANTS_PER_PAGE = 10;


function formatStatus(
    status: string,
) {
    switch (status) {
        case "ACTIVE":
            return "🟢 Активен";

        case "FINISHED":
            return "✅ Завершён";

        case "CANCELLED":
            return "❌ Отменён";

        case "DRAFT":
            return "📝 Черновик";

        default:
            return status;
    }
}


function formatDate(
    date: Date | null,
) {
    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            dateStyle: "short",
            timeStyle: "short",
            timeZone:
                "Europe/Riga",
        },
    ).format(date);
}


export function registerPartnerGiveawaysCommand(
    bot: Bot<BotContext>,
) {

    /*
     * =====================================
     * PARTNER GIVEAWAYS
     * =====================================
     */
    bot.callbackQuery(
        "partner:giveaways",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (!ctx.from) {
                return;
            }

            const giveaways =
                await giveawayService
                    .getPartnerGiveaways(
                        String(
                            ctx.from.id,
                        ),
                    );

            const keyboard =
                new InlineKeyboard();

            if (
                giveaways.length === 0
            ) {
                keyboard.text(
                    "⬅️ Назад",
                    "partner:giveaways:back",
                );

                await ctx.editMessageText(
                    "🎁 У тебя пока нет розыгрышей.",
                    {
                        reply_markup:
                            keyboard,
                    },
                );

                return;
            }

            for (
                const giveaway
                of giveaways
            ) {
                let icon = "⚪";

                if (
                    giveaway.status ===
                    "ACTIVE"
                ) {
                    icon = "🟢";
                }

                if (
                    giveaway.status ===
                    "FINISHED"
                ) {
                    icon = "✅";
                }

                if (
                    giveaway.status ===
                    "CANCELLED"
                ) {
                    icon = "❌";
                }

                keyboard
                    .text(
                        `${icon} #${giveaway.id} ${giveaway.title}`,
                        `partner:giveaway:${giveaway.id}`,
                    )
                    .row();
            }

            keyboard.text(
                "⬅️ Назад",
                "partner:giveaways:back",
            );

            await ctx.editMessageText(
                `🎁 Мои розыгрыши

Всего: ${giveaways.length}

Выбери розыгрыш:`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    /*
     * =====================================
     * GIVEAWAY DETAILS
     * =====================================
     */
    bot.callbackQuery(
        /^partner:giveaway:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (!ctx.from) {
                return;
            }

            const giveawayId =
                Number(
                    ctx.match[1],
                );

            const giveaways =
                await giveawayService
                    .getPartnerGiveaways(
                        String(
                            ctx.from.id,
                        ),
                    );

            const giveaway =
                giveaways.find(
                    (item) =>
                        item.id ===
                        giveawayId,
                );

            if (!giveaway) {
                await ctx.reply(
                    "❌ Розыгрыш не найден.",
                );

                return;
            }

            const [
                participants,
                winners,
            ] =
                await Promise.all([
                    giveawayService
                        .getPartnerGiveawayParticipants(
                            giveawayId,
                            String(
                                ctx.from.id,
                            ),
                        ),

                    giveawayService
                        .getPartnerGiveawayWinners(
                            giveawayId,
                            String(
                                ctx.from.id,
                            ),
                        ),
                ]);

            const keyboard =
                new InlineKeyboard()
                    .text(
                        `👥 Участники (${participants.length})`,
                        `partner:giveaway:participants:${giveaway.id}`,
                    )
                    .row()
                    .text(
                        `🏆 Победители (${winners.length})`,
                        `partner:giveaway:winners:${giveaway.id}`,
                    )
                    .row()
                    .text(
                        "⬅️ К моим розыгрышам",
                        "partner:giveaways",
                    );

            await ctx.editMessageText(
                `🎁 ${giveaway.title}

ID: #${giveaway.id}

Статус: ${formatStatus(
    giveaway.status,
)}

📅 Создан:
${formatDate(
    giveaway.createdAt,
)}

▶️ Начало:
${formatDate(
    giveaway.startsAt,
)}

🏁 Окончание:
${formatDate(
    giveaway.endsAt,
)}

👥 Участников: ${
    participants.length
}

🏆 Победителей:
${winners.length} / ${
    giveaway.winnersCount
}

Условия:

🔗 Affiliate:
${
    giveaway.requireAffiliate
        ? "обязателен"
        : "не требуется"
}

💳 Первый депозит:
${
    giveaway.requireFirstDeposit
        ? "обязателен"
        : "не требуется"
}

💵 Минимальный FTD:
${giveaway.minFirstDepositAmount} $`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    /*
     * =====================================
     * PARTICIPANTS
     * =====================================
     *
     * Поддерживает:
     *
     * partner:giveaway:participants:5
     * partner:giveaway:participants:5:0
     * partner:giveaway:participants:5:1
     */
    bot.callbackQuery(
        /^partner:giveaway:participants:(\d+)(?::(\d+))?$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (!ctx.from) {
                return;
            }

            const giveawayId =
                Number(
                    ctx.match[1],
                );

            const requestedPage =
                Number(
                    ctx.match[2] ?? 0,
                );

            try {
                const participants =
                    await giveawayService
                        .getPartnerGiveawayParticipants(
                            giveawayId,
                            String(
                                ctx.from.id,
                            ),
                        );

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            participants.length /
                                PARTICIPANTS_PER_PAGE,
                        ),
                    );

                const page =
                    Math.min(
                        Math.max(
                            requestedPage,
                            0,
                        ),
                        totalPages - 1,
                    );

                const start =
                    page *
                    PARTICIPANTS_PER_PAGE;

                const pageParticipants =
                    participants.slice(
                        start,
                        start +
                            PARTICIPANTS_PER_PAGE,
                    );

                let message =
                    `👥 Участники

Всего: ${participants.length}
Страница: ${page + 1} / ${totalPages}

`;

                if (
                    participants.length ===
                    0
                ) {
                    message +=
                        "Участников пока нет.";
                } else {
                    for (
                        let index = 0;
                        index <
                        pageParticipants.length;
                        index++
                    ) {
                        const participant =
                            pageParticipants[
                                index
                            ]!;

                        const number =
                            start +
                            index +
                            1;

                        message +=
                            `${number}. 🎟 Участник

Player ID: ${participant.casinoPlayerId}
Telegram ID: ${participant.telegramUserId}
Дата: ${formatDate(
    participant.joinedAt,
)}

`;
                    }
                }

                const keyboard =
                    new InlineKeyboard();

                if (page > 0) {
                    keyboard.text(
                        "⬅️",
                        `partner:giveaway:participants:${giveawayId}:${page - 1}`,
                    );
                }

                keyboard.text(
                    `${page + 1} / ${totalPages}`,
                    "partner:participants:noop",
                );

                if (
                    page <
                    totalPages - 1
                ) {
                    keyboard.text(
                        "➡️",
                        `partner:giveaway:participants:${giveawayId}:${page + 1}`,
                    );
                }

                keyboard
                    .row()
                    .text(
                        "⬅️ К розыгрышу",
                        `partner:giveaway:${giveawayId}`,
                    );

                await ctx.editMessageText(
                    message,
                    {
                        reply_markup:
                            keyboard,
                    },
                );
            } catch (error) {
                console.error(
                    "Partner participants error:",
                    error,
                );

                await ctx.reply(
                    "❌ Розыгрыш не найден или нет доступа.",
                );
            }
        },
    );


    /*
     * Кнопка номера страницы.
     */
    bot.callbackQuery(
        "partner:participants:noop",
        async (ctx) => {
            await ctx.answerCallbackQuery();
        },
    );


    /*
     * =====================================
     * WINNERS
     * =====================================
     */
    bot.callbackQuery(
        /^partner:giveaway:winners:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (!ctx.from) {
                return;
            }

            const giveawayId =
                Number(ctx.match[1]);

            try {
                const winners =
                    await giveawayService
                        .getPartnerGiveawayWinners(
                            giveawayId,
                            String(
                                ctx.from.id,
                            ),
                        );

                let message =
                    `🏆 Победители

Всего: ${winners.length}

`;

                if (
                    winners.length === 0
                ) {
                    message +=
                        "Победителей пока нет.";
                } else {
                    for (
                        let index = 0;
                        index <
                        winners.length;
                        index++
                    ) {
                        const winner =
                            winners[index]!;

                        message +=
                            `${index + 1}. 🏆 Победитель

Player ID: ${winner.casinoPlayerId}
💰 Приз: ${winner.prizeAmount} ${winner.currency}
🎫 Voucher: ${winner.voucherCode}

`;
                    }
                }

                await ctx.editMessageText(
                    message,
                    {
                        reply_markup:
                            new InlineKeyboard()
                                .text(
                                    "⬅️ К розыгрышу",
                                    `partner:giveaway:${giveawayId}`,
                                ),
                    },
                );
            } catch (error) {
                console.error(
                    "Partner winners error:",
                    error,
                );

                await ctx.reply(
                    "❌ Розыгрыш не найден или нет доступа.",
                );
            }
        },
    );


    /*
     * =====================================
     * BACK
     * =====================================
     */
    bot.callbackQuery(
        "partner:giveaways:back",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            await showMainMenu(ctx);
        },
    );
}