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
                            String(ctx.from.id),
                        ),

                    giveawayService
                        .getPartnerGiveawayWinners(
                            giveawayId,
                            String(ctx.from.id),
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

💰 Минимальный FTD:
${giveaway.minFirstDepositAmount}`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );
    bot.callbackQuery(
        /^partner:giveaway:participants:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (!ctx.from) {
                return;
            }

            const giveawayId =
                Number(ctx.match[1]);

            try {
                const participants =
                    await giveawayService
                        .getPartnerGiveawayParticipants(
                            giveawayId,
                            String(ctx.from.id),
                        );

                let message =
                    `👥 Участники

    Всего: ${participants.length}

    `;

                if (
                    participants.length === 0
                ) {
                    message +=
                        "Участников пока нет.";
                } else {
                    for (
                        const participant
                        of participants
                    ) {
                        message +=
                            `🎟 Player ID: ${participant.casinoPlayerId}
    Telegram ID: ${participant.telegramUserId}
    Дата: ${formatDate(
        participant.joinedAt,
    )}

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
                    "Partner participants error:",
                    error,
                );

                await ctx.reply(
                    "❌ Розыгрыш не найден или нет доступа.",
                );
            }
        },
    );

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
                            String(ctx.from.id),
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
                        const winner
                        of winners
                    ) {
                        message +=
                            `🏆 Место #${winner.place}

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

    bot.callbackQuery(
        "partner:giveaways:back",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            await showMainMenu(ctx);
        },
    );
}