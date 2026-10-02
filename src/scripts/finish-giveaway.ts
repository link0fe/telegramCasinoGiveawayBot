import {
    Bot,
} from "grammy";

import {
    env,
} from "../config/env.js";

import type {
    BotContext,
} from "../telegram/session/bot-session.js";

import {
    GiveawayFinalizerService,
} from "../modules/giveaways/giveaway-finalizer.service.js";


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


const bot =
    new Bot<BotContext>(
        env.BOT_TOKEN,
    );


const finalizer =
    new GiveawayFinalizerService(
        bot,
    );


console.log(
    `Finalizing giveaway ${giveawayId}...`,
);


const result =
    await finalizer.finalize(
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
    "\n=== GIVEAWAY FINISHED ===",
);


console.table(
    result.winners.map(
        (winner) => ({
            place:
                winner.place,

            playerId:
                winner.casinoPlayerId,

            prize:
                `${winner.prizeAmount} ${winner.currency}`,

            voucher:
                winner.voucherCode,

            telegramUserId:
                winner.telegramUserId,
        }),
    ),
);


console.log(
    "\nNotifications sent.",
);