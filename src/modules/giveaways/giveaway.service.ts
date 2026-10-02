import {
    GiveawayRepository,
} from "./giveaway.repository.js";

import type {
    CreateGiveawayData,
} from "./giveaway.types.js";


export class GiveawayService {

    constructor(
        private readonly giveawayRepository =
            new GiveawayRepository(),
    ) {}


    async getPartnerGiveaways(
        telegramId: string,
    ) {
        return await this.giveawayRepository
            .findAllByPartnerTelegramId(
                telegramId,
            );
    }


    async getPartnerGiveawayParticipants(
        giveawayId: number,
        telegramId: string,
    ) {
        const giveaway =
            await this.giveawayRepository
                .findPartnerGiveawayByTelegramId(
                    giveawayId,
                    telegramId,
                );


        if (!giveaway) {
            throw new Error(
                "GIVEAWAY_NOT_FOUND_OR_FORBIDDEN",
            );
        }


        return await this.giveawayRepository
            .findParticipantsForAdmin(
                giveawayId,
            );
    }


    async getPartnerGiveawayWinners(
        giveawayId: number,
        telegramId: string,
    ) {
        const giveaway =
            await this.giveawayRepository
                .findPartnerGiveawayByTelegramId(
                    giveawayId,
                    telegramId,
                );


        if (!giveaway) {
            throw new Error(
                "GIVEAWAY_NOT_FOUND_OR_FORBIDDEN",
            );
        }


        return await this.giveawayRepository
            .findWinnersForAdmin(
                giveawayId,
            );
    }


    async getParticipantsForAdmin(
        giveawayId: number,
    ) {
        const giveaway =
            await this.giveawayRepository
                .findById(
                    giveawayId,
                );


        if (!giveaway) {
            throw new Error(
                "GIVEAWAY_NOT_FOUND",
            );
        }


        return await this.giveawayRepository
            .findParticipantsForAdmin(
                giveawayId,
            );
    }


    async getWinnersForAdmin(
        giveawayId: number,
    ) {
        const giveaway =
            await this.giveawayRepository
                .findById(
                    giveawayId,
                );


        if (!giveaway) {
            throw new Error(
                "GIVEAWAY_NOT_FOUND",
            );
        }


        return await this.giveawayRepository
            .findWinnersForAdmin(
                giveawayId,
            );
    }


    async getAllForAdmin() {
        const giveaways =
            await this.giveawayRepository
                .findAllForAdmin();


        return await Promise.all(
            giveaways.map(
                async (giveaway) => {

                    const [
                        participantsCount,
                        winnersCount,
                    ] =
                        await Promise.all([
                            this.giveawayRepository
                                .countParticipants(
                                    giveaway.id,
                                ),

                            this.giveawayRepository
                                .countWinners(
                                    giveaway.id,
                                ),
                        ]);


                    return {
                        ...giveaway,

                        participantsCount,

                        actualWinnersCount:
                            winnersCount,
                    };
                },
            ),
        );
    }

    async getActiveGiveawaysForPlayer(
        telegramUserId: string,
    ) {
        /*
        * Проверяем, привязан ли
        * Telegram пользователь
        * к casino player.
        */
        const linkedPlayer =
            await this.giveawayRepository
                .findLinkedCasinoPlayer(
                    telegramUserId,
                );


        /*
        * Если Player ID уже привязан,
        * используем его affiliateId
        * для фильтрации розыгрышей.
        */
        const affiliateId =
            linkedPlayer?.affiliateId;


        const activeGiveaways =
            await this.giveawayRepository
                .findActiveForPlayer(
                    affiliateId,
                );


        /*
        * Для каждого розыгрыша
        * проверяем участие пользователя
        * и считаем участников.
        */
        const giveaways =
            await Promise.all(
                activeGiveaways.map(
                    async (giveaway) => {

                        const [
                            participation,
                            participantsCount,
                        ] =
                            await Promise.all([
                                this.giveawayRepository
                                    .findPlayerParticipation(
                                        giveaway.id,
                                        telegramUserId,
                                    ),

                                this.giveawayRepository
                                    .countParticipants(
                                        giveaway.id,
                                    ),
                            ]);


                        return {
                            ...giveaway,

                            participantsCount,

                            participation,
                        };
                    },
                ),
            );


        /*
        * ВАЖНО:
        * player-giveaways.command.ts
        * ожидает именно такой объект.
        */
        return {
            linkedPlayer,
            giveaways,
        };
    }


    async getGiveawayById(
        giveawayId: number,
    ) {
        return this.giveawayRepository
            .findById(
                giveawayId,
            );
    }


    async createGiveawayForPartner(
        telegramId: string,
        data: CreateGiveawayData,
    ) {

        const partnerData =
            await this.giveawayRepository
                .findPartnerByTelegramId(
                    telegramId,
                );


        if (!partnerData) {
            throw new Error(
                "PARTNER_NOT_FOUND",
            );
        }


        if (
            partnerData.user.role !==
            "PARTNER"
        ) {
            throw new Error(
                "NOT_A_PARTNER",
            );
        }


        if (
            !partnerData.partner.isActive
        ) {
            throw new Error(
                "PARTNER_INACTIVE",
            );
        }


        if (
            data.endsAt.getTime() <=
            Date.now()
        ) {
            throw new Error(
                "INVALID_END_DATE",
            );
        }


        if (
            !Number.isInteger(
                data.winnersCount,
            ) ||
            data.winnersCount < 1
        ) {
            throw new Error(
                "INVALID_WINNERS_COUNT",
            );
        }


        if (
            !Number.isFinite(
                data.prizeAmount,
            ) ||
            data.prizeAmount <= 0
        ) {
            throw new Error(
                "INVALID_PRIZE_AMOUNT",
            );
        }


        if (
            data.currency !==
            "RUB"
        ) {
            throw new Error(
                "INVALID_CURRENCY",
            );
        }


        if (
            !Number.isFinite(
                data.minFirstDepositAmount,
            ) ||
            data.minFirstDepositAmount < 0
        ) {
            throw new Error(
                "INVALID_MIN_FIRST_DEPOSIT",
            );
        }


        return await this.giveawayRepository
            .create(
                partnerData.partner.id,
                data,
            );
    }
}