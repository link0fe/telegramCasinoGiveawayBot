import {
    and,
    asc,
    eq,
} from "drizzle-orm";

import { db } from "../../database/db.js";

import {
    giveawayPrizes,
    giveaways,
    participants,
    vouchers,
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
            voucherId: number;
            voucherCode: string;
        }[],
    ) {
        return db.transaction(
            (tx) => {
                const savedWinners = [];

                for (
                    const item
                    of winnerData
                ) {
                    const winner =
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
                            .returning()
                            .get();

                    if (!winner) {
                        throw new Error(
                            "WINNER_CREATE_FAILED",
                        );
                    }

                    const voucher =
                        tx.update(vouchers)
                            .set({
                                isUsed: true,
                                winnerId:
                                    winner.id,
                                usedAt:
                                    new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        vouchers.id,
                                        item.voucherId,
                                    ),
                                    eq(
                                        vouchers.isUsed,
                                        false,
                                    ),
                                ),
                            )
                            .returning()
                            .get();

                    if (!voucher) {
                        throw new Error(
                            `VOUCHER_ALREADY_USED:${item.voucherId}`,
                        );
                    }

                    savedWinners.push({
                        ...winner,
                        telegramVoucherCode:
                            voucher.code,
                    });
                }


                tx.update(giveaways)
                    .set({
                        status:
                            "FINISHED",
                        updatedAt:
                            new Date(),
                    })
                    .where(
                        eq(
                            giveaways.id,
                            giveawayId,
                        ),
                    )
                    .run();


                return savedWinners;
            },
        );
    }
}