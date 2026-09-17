import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";


const userService =
    new UserService();

const giveawayService =
    new GiveawayService();


async function isAdmin(
    ctx: BotContext,
) {
    if (!ctx.from) {
        return false;
    }

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

    return user.role === "ADMIN";
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


export function registerAdminGiveawaysCommand(
    bot: Bot<BotContext>,
) {
    bot.callbackQuery(
        "admin:giveaways",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            const giveaways =
                await giveawayService
                    .getAllForAdmin();

            const keyboard =
                new InlineKeyboard();

            if (
                giveaways.length === 0
            ) {
                keyboard.text(
                    "⬅️ Назад",
                    "admin:giveaways:back",
                );

                await ctx.editMessageText(
                    "🎁 Розыгрышей пока нет.",
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
                const icon =
                    giveaway.status ===
                    "ACTIVE"
                        ? "🟢"
                        : giveaway.status ===
                          "FINISHED"
                        ? "✅"
                        : "⚪";

                keyboard
                    .text(
                        `${icon} #${giveaway.id} ${giveaway.title}`,
                        `admin:giveaway:${giveaway.id}`,
                    )
                    .row();
            }

            keyboard.text(
                "⬅️ Назад",
                "admin:giveaways:back",
            );

            await ctx.editMessageText(
                `🎁 Все розыгрыши

Всего: ${giveaways.length}

Выберите розыгрыш:`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );

    bot.callbackQuery(
        /^admin:giveaway:participants:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            const giveawayId =
                Number(ctx.match[1]);

            try {
                const participants =
                    await giveawayService
                        .getParticipantsForAdmin(
                            giveawayId,
                        );

                let message =
                    `👥 Участники розыгрыша #${giveawayId}

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
                            `🎟 #${participant.id}

    Telegram ID: ${participant.telegramUserId}
    Player ID: ${participant.casinoPlayerId}
    Дата участия: ${formatDate(
        participant.joinedAt,
    )}

    `;
                    }
                }

                const keyboard =
                    new InlineKeyboard()
                        .text(
                            "⬅️ К розыгрышу",
                            `admin:giveaway:${giveawayId}`,
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
                    "Admin participants error:",
                    error,
                );

                await ctx.reply(
                    "❌ Не удалось загрузить участников.",
                );
            }
        },
    );

    bot.callbackQuery(
        /^admin:giveaway:winners:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            const giveawayId =
                Number(ctx.match[1]);

            try {
                const winners =
                    await giveawayService
                        .getWinnersForAdmin(
                            giveawayId,
                        );

                let message =
                    `🏆 Победители розыгрыша #${giveawayId}

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
    Telegram ID: ${winner.telegramUserId}

    💰 Приз: ${winner.prizeAmount} ${winner.currency}
    🎫 Voucher: ${winner.voucherCode}

    `;
                    }
                }

                const keyboard =
                    new InlineKeyboard()
                        .text(
                            "⬅️ К розыгрышу",
                            `admin:giveaway:${giveawayId}`,
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
                    "Admin winners error:",
                    error,
                );

                await ctx.reply(
                    "❌ Не удалось загрузить победителей.",
                );
            }
        },
    );

    bot.callbackQuery(
        /^admin:giveaway:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            const giveawayId =
                Number(ctx.match[1]);

            const giveaways =
                await giveawayService
                    .getAllForAdmin();

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

            const keyboard =
                new InlineKeyboard()
                    .text(
                        `👥 Участники (${giveaway.participantsCount})`,
                        `admin:giveaway:participants:${giveaway.id}`,
                    )
                    .row()
                    .text(
                        `🏆 Победители (${giveaway.actualWinnersCount})`,
                        `admin:giveaway:winners:${giveaway.id}`,
                    )
                    .row()
                    .text(
                        "⬅️ К розыгрышам",
                        "admin:giveaways",
                    );

            await ctx.editMessageText(
                `🎁 ${giveaway.title}

ID: #${giveaway.id}

🤝 Партнёр: ${giveaway.partnerName}
Affiliate ID: ${giveaway.affiliateId}

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
    giveaway.participantsCount
}

🏆 Победителей:
${giveaway.actualWinnersCount} / ${
    giveaway.winnersCount
}`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    bot.callbackQuery(
        "admin:giveaways:back",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            // Возвращаемся через callback
            // главного ADMIN-меню.
            await ctx.editMessageText(
                "🏠 Главное меню",
                {
                    reply_markup:
                        new InlineKeyboard()
                            .text(
                                "👥 Партнеры",
                                "admin:partners",
                            )
                            .row()
                            .text(
                                "🎁 Все розыгрыши",
                                "admin:giveaways",
                            )
                            .row()
                            .text(
                                "📊 Данные казино",
                                "admin:casino-data",
                            )
                            .row()
                            .text(
                                "👤 Профиль",
                                "profile",
                            ),
                },
            );
        },
    );
}