import type { Bot } from "grammy";

import type {
    BotContext,
} from "../../telegram/session/bot-session.js";

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


        // Победители
        for (
            const winner
            of result.winners
        ) {
            try {
                await this.bot.api
                    .sendMessage(
                        winner.telegramUserId,

                        `🎉 Поздравляем!

Вы заняли ${winner.place} место в розыгрыше:

🎁 ${giveaway.title}

💰 Приз: ${winner.prizeAmount} ${winner.currency}

🎟 Voucher:
${winner.voucherCode}`,
                    );
            } catch (error) {
                console.error(
                    `Failed to notify winner ${winner.telegramUserId}:`,
                    error,
                );
            }
        }


        // Результат партнёру

        const partnerTelegramId =
            await this.giveawayRepository
                .findPartnerTelegramId(
                    partner.id,
                );


        if (partnerTelegramId) {
            let message =
                `🏁 Розыгрыш завершён!
                🎁 ${giveaway.title}`;


            if (result.winners.length === 0) {
                message +=
                    "👥 В розыгрыше не было участников.\n";
            } else {
                message +=
                    `🏆 Победители: ${result.winners.length}\n\n`;

                for (
                    const winner
                    of result.winners
                ) {
                    message +=
                        `${winner.place} место\n` +
                        `Player ID: ${winner.casinoPlayerId}\n` +
                        `Приз: ${winner.prizeAmount} ${winner.currency}\n` +
                        `Voucher: ${winner.voucherCode}\n\n`;
                }
            }

            try {
                await this.bot.api
                    .sendMessage(
                        partnerTelegramId,
                        message,
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