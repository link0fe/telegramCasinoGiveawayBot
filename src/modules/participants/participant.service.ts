import {
    ParticipantRepository,
} from "./participant.repository.js";

import {
    EligibilityService,
} from "../eligibility/eligibility.service.js";


export class ParticipantService {

    constructor(
        private readonly participantRepository =
            new ParticipantRepository(),

        private readonly eligibilityService =
            new EligibilityService(),
    ) {}


    async joinGiveaway(
        giveawayId: number,
        telegramUserId: string,
        casinoPlayerId: string,
    ) {
        const existingTelegram =
            await this.participantRepository
                .findByTelegramUser(
                    giveawayId,
                    telegramUserId,
                );

        if (existingTelegram) {
            return {
                success: false as const,
                reason: "ALREADY_JOINED" as const,
            };
        }


        const existingPlayer =
            await this.participantRepository
                .findByCasinoPlayer(
                    giveawayId,
                    casinoPlayerId,
                );

        if (existingPlayer) {
            return {
                success: false as const,
                reason:
                    "PLAYER_ID_ALREADY_USED" as const,
            };
        }


        const eligibility =
            await this.eligibilityService
                .check(
                    giveawayId,
                    casinoPlayerId,
                );


        if (!eligibility.eligible) {
            return {
                success: false as const,
                reason: eligibility.reason,
            };
        }


        const participant =
            await this.participantRepository
                .create({
                    giveawayId,
                    telegramUserId,
                    casinoPlayerId,
                });


        return {
            success: true as const,
            participant,
        };
    }
}