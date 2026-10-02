import type {
    Bot,
} from "grammy";

import type {
    BotContext,
} from "../../telegram/session/bot-session.js";

import {
    emoji,
} from "../../telegram/ui/emojis.js";

import {
    WinnerService,
} from "../winners/winner.service.js";

import {
    GiveawayRepository,
} from "./giveaway.repository.js";


export class GiveawayFinalizerService {

    constructor(
        private readonly bot:
            Bot<BotContext>,

        private readonly winnerService =
            new WinnerService(),

        private readonly giveawayRepository =
            new GiveawayRepository(),
    ) {}


    async finalize(
        giveawayId: number,
    ) {
        const result =
            await this.winnerService
                .finishGiveaway(
                    giveawayId,
                );


        if (!result.success) {
            return result;
        }


        const giveawayData =
            await this.giveawayRepository
                .findByIdWithPartner(
                    giveawayId,
                );


        if (!giveawayData) {
            console.error(
                `Giveaway ${giveawayId}: partner data not found.`,
            );

            return result;
        }


        const {
            giveaway,
            partner,
        } = giveawayData;


        /*
         * Уведомляем победителей.
         */
        for (
            const winner
            of result.winners
        ) {
            try {
                await this.bot.api
                    .sendMessage(
                        winner.telegramUserId,

                        `${emoji("party")} <b>ПОЗДРАВЛЯЕМ!</b>

Вы победили в розыгрыше!

${emoji("slots")} <b>${giveaway.title}</b>

${emoji("diamond")} Ваш выигрыш:
<b>${winner.prizeAmount} ${winner.currency}</b>

${emoji("gift")} <b>Ваш Voucher:</b>
<code>${winner.voucherCode}</code>

${emoji("luckyCat")} Удача сегодня на вашей стороне!`,

                        {
                            parse_mode:
                                "HTML",
                        },
                    );
            } catch (error) {
                console.error(
                    `Failed to notify winner ${winner.telegramUserId}:`,
                    error,
                );
            }
        }


        /*
         * Результат партнёру.
         */
        const partnerTelegramId =
            await this.giveawayRepository
                .findPartnerTelegramId(
                    partner.id,
                );


        if (partnerTelegramId) {
            let message =
                `🏁 <b>Розыгрыш завершён!</b>

🎁 <b>${giveaway.title}</b>

`;


            if (
                result.winners.length === 0
            ) {
                message +=
                    "👥 В розыгрыше не было участников.";
            } else {
                message +=
                    `🏆 Победителей: <b>${result.winners.length}</b>

`;


                for (
                    const winner
                    of result.winners
                ) {
                    message +=
                        `🏅 <b>Победитель</b>\n` +
                        `Player ID: <code>${winner.casinoPlayerId}</code>\n` +
                        `Приз: <b>${winner.prizeAmount} ${winner.currency}</b>\n` +
                        `Voucher: <code>${winner.voucherCode}</code>\n\n`;
                }
            }


            try {
                await this.bot.api
                    .sendMessage(
                        partnerTelegramId,
                        message,
                        {
                            parse_mode:
                                "HTML",
                        },
                    );
            } catch (error) {
                console.error(
                    `Failed to notify partner ${partnerTelegramId}:`,
                    error,
                );
            }
        }


        return result;
    }
}