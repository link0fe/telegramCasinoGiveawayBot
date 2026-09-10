import {
    asc,
    eq,
} from "drizzle-orm";

import { db } from "../../database/db.js";

import {
    giveawayPrizes,
    giveaways,
    participants,
    winners,
} from "../../database/schema.js";


export class WinnerRepository {

    async findGiveaway(
        giveawayId: number,
    ) {
        const result = await db
            .select()
            .from(giveaways)
            .where(
                eq(
                    giveaways.id,
                    giveawayId,
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }


    async findParticipants(
        giveawayId: number,
    ) {
        return db
            .select()
            .from(participants)
            .where(
                eq(
                    participants.giveawayId,
                    giveawayId,
                ),
            );
    }


    async findPrizes(
        giveawayId: number,
    ) {
        return db
            .select()
            .from(giveawayPrizes)
            .where(
                eq(
                    giveawayPrizes.giveawayId,
                    giveawayId,
                ),
            )
            .orderBy(
                asc(
                    giveawayPrizes.place,
                ),
            );
    }


    async findWinners(
        giveawayId: number,
    ) {
        return db
            .select()
            .from(winners)
            .where(
                eq(
                    winners.giveawayId,
                    giveawayId,
                ),
            )
            .orderBy(
                asc(
                    winners.place,
                ),
            );
    }


    async saveWinnersAndFinish(
        giveawayId: number,
        winnerData: {
            participantId: number;
            place: number;
            prizeAmount: number;
            currency: string;
            voucherCode: string;
        }[],
    ) {
        return db.transaction(
            (tx) => {

                for (
                    const item
                    of winnerData
                ) {
                    tx.insert(winners)
                        .values({
                            giveawayId,
                            participantId:
                                item.participantId,
                            place:
                                item.place,
                            prizeAmount:
                                item.prizeAmount,
                            currency:
                                item.currency,
                            voucherCode:
                                item.voucherCode,
                        })
                        .run();
                }


                tx.update(giveaways)
                    .set({
                        status: "FINISHED",
                        updatedAt: new Date(),
                    })
                    .where(
                        eq(
                            giveaways.id,
                            giveawayId,
                        ),
                    )
                    .run();


                return winnerData;
            },
        );
    }
}