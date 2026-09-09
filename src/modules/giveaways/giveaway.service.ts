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

    async getGiveawayById(giveawayId: number) {
        return this.giveawayRepository
            .findById(giveawayId);
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


        if (!partnerData.partner.isActive) {
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


        if (data.winnersCount < 1) {
            throw new Error(
                "INVALID_WINNERS_COUNT",
            );
        }


        if (
            data.prizes.length !==
            data.winnersCount
        ) {
            throw new Error(
                "PRIZES_COUNT_MISMATCH",
            );
        }


        return this.giveawayRepository.create(
            partnerData.partner.id,
            data,
        );
    }
}