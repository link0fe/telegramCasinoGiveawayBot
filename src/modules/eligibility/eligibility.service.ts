import {
    GiveawayRepository,
} from "../giveaways/giveaway.repository.js";

import {
    DatabaseCasinoDataProvider,
} from "../casino/database-casino-data.provider.js";

import type {
    EligibilityResult,
} from "./eligibility.types.js";

export class EligibilityService {
    constructor(
        private readonly giveawayRepository =
            new GiveawayRepository(),

        private readonly casinoData =
            new DatabaseCasinoDataProvider(),
    ) {}

    async check(
        giveawayId: number,
        playerId: string,
    ): Promise<EligibilityResult> {
        const data =
            await this.giveawayRepository
                .findByIdWithPartner(
                    giveawayId,
                );

        if (!data) {
            return {
                eligible: false,
                reason: "GIVEAWAY_NOT_FOUND",
            };
        }

        const {
            giveaway,
            partner,
        } = data;

        if (
            giveaway.status !==
            "ACTIVE"
        ) {
            return {
                eligible: false,
                reason: "GIVEAWAY_NOT_ACTIVE",
            };
        }

        if (
            giveaway.endsAt.getTime() <=
            Date.now()
        ) {
            return {
                eligible: false,
                reason: "GIVEAWAY_ENDED",
            };
        }

        const player =
            await this.casinoData
                .findPlayerById(
                    playerId,
                );

        if (!player) {
            return {
                eligible: false,
                reason: "PLAYER_NOT_FOUND",
            };
        }

        if (
            giveaway.requireAffiliate &&
            player.affiliateId !==
                partner.affiliateId
        ) {
            return {
                eligible: false,
                reason: "WRONG_AFFILIATE",
            };
        }

        if (
            giveaway.requireFirstDeposit &&
            player.firstDepositCount < 1
        ) {
            return {
                eligible: false,
                reason: "NO_FIRST_DEPOSIT",
            };
        }

        if (
            giveaway.requireFirstDeposit &&
            player.firstDepositAmount <
                giveaway.minFirstDepositAmount
        ) {
            return {
                eligible: false,
                reason:
                    "FIRST_DEPOSIT_TOO_SMALL",
            };
        }

        return {
            eligible: true,
        };
    }
}