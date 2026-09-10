import { Bot } from "grammy";

import { env } from "../config/env.js";

import {
    WinnerService,
} from "../modules/winners/winner.service.js";

import {
    GiveawayRepository,
} from "../modules/giveaways/giveaway.repository.js";


const giveawayId =
    Number(
        process.argv[2],
    );


if (
    !Number.isInteger(
        giveawayId,
    ) ||
    giveawayId < 1
) {
    console.error(
        "Usage: npm.cmd run giveaway:finish -- <giveawayId>",
    );

    process.exit(1);
}


const winnerService =
    new WinnerService();

const giveawayRepository =
    new GiveawayRepository();

const bot =
    new Bot(env.BOT_TOKEN);


const result =
    await winnerService
        .finishGiveaway(
            giveawayId,
        );


if (!result.success) {
    console.log(
        "Giveaway was not finished:",
        result,
    );

    process.exit(0);
}


console.log(
    "\n=== WINNERS ===",
);

console.table(
    result.winners,
);


// ------------------------------------
// Получаем giveaway + partner
// ------------------------------------

const giveawayData =
    await giveawayRepository
        .findByIdWithPartner(
            giveawayId,
        );


if (!giveawayData) {
    console.log(
        "Could not load giveaway partner.",
    );

    process.exit(0);
}


const {
    giveaway,
    partner,
} = giveawayData;


// ------------------------------------
// Отправляем сообщения победителям
// ------------------------------------

for (
    const winner
    of result.winners
) {
    try {
        await bot.api.sendMessage(
            winner.telegramUserId,
            `🎉 Поздравляем!

Вы заняли ${winner.place} место в розыгрыше:

🎁 ${giveaway.title}

💰 Приз: ${winner.prizeAmount} ${winner.currency}

🎟 Voucher:
${winner.voucherCode}`,
        );

        console.log(
            `Winner ${winner.telegramUserId} notified.`,
        );
    } catch (error) {
        console.error(
            `Failed to notify winner ${winner.telegramUserId}:`,
            error,
        );
    }
}


// ------------------------------------
// Сообщение партнёру
// ------------------------------------

let partnerMessage =
    `🏁 Розыгрыш завершён!

🎁 ${giveaway.title}

🏆 Победители:

`;


for (
    const winner
    of result.winners
) {
    partnerMessage +=
        `${winner.place} место\n` +
        `Player ID: ${winner.casinoPlayerId}\n` +
        `Prize: ${winner.prizeAmount} ${winner.currency}\n` +
        `Voucher: ${winner.voucherCode}\n\n`;
}


console.log(
    "\n=== PARTNER RESULT ===",
);

console.log(
    partnerMessage,
);

const partnerTelegramId =
    await giveawayRepository
        .findPartnerTelegramId(
            partner.id,
        );


if (partnerTelegramId) {
    try {
        await bot.api.sendMessage(
            partnerTelegramId,
            partnerMessage,
        );

        console.log(
            `Partner ${partnerTelegramId} notified.`,
        );
    } catch (error) {
        console.error(
            "Failed to notify partner:",
            error,
        );
    }
}