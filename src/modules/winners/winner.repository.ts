import {
    and,
    asc,
    eq,
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    giveaways,
    participants,
    vouchers,
    winners,
} from "../../database/schema.js";


export class WinnerRepository {

    /*
     * =====================================
     * GIVEAWAY
     * =====================================
     */
    async findGiveaway(
        giveawayId: number,
    ) {
        const result =
            await db
                .select()
                .from(
                    giveaways,
                )
                .where(
                    eq(
                        giveaways.id,
                        giveawayId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * =====================================
     * PARTICIPANTS
     * =====================================
     */
    async findParticipants(
        giveawayId: number,
    ) {
        return await db
            .select()
            .from(
                participants,
            )
            .where(
                eq(
                    participants.giveawayId,
                    giveawayId,
                ),
            );
    }


    /*
     * =====================================
     * EXISTING WINNERS
     * =====================================
     */
    async findWinners(
        giveawayId: number,
    ) {
        return await db
            .select()
            .from(
                winners,
            )
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


    /*
     * =====================================
     * AVAILABLE VOUCHERS
     * =====================================
     *
     * Получаем только свободные ваучеры
     * нужного номинала и валюты.
     *
     * limit = сколько ваучеров
     * требуется для победителей.
     */
    async findAvailableVouchers(
        amount: number,
        currency: string,
        limit: number,
    ) {
        return await db
            .select()
            .from(
                vouchers,
            )
            .where(
                and(
                    eq(
                        vouchers.amount,
                        amount,
                    ),

                    eq(
                        vouchers.currency,
                        currency,
                    ),

                    eq(
                        vouchers.isUsed,
                        false,
                    ),
                ),
            )
            .limit(
                limit,
            );
    }


    /*
     * =====================================
     * SAVE WINNERS + USE VOUCHERS
     * =====================================
     *
     * Всё выполняется в одной transaction.
     *
     * Если хотя бы один voucher уже занят
     * или winner не создаётся —
     * вся операция откатывается.
     */
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

                    /*
                     * Создаём winner.
                     */
                    const winner =
                        tx.insert(
                            winners,
                        )
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


                    /*
                     * Помечаем voucher использованным.
                     *
                     * Дополнительно проверяем isUsed=false,
                     * чтобы нельзя было случайно
                     * выдать один voucher дважды.
                     */
                    const voucher =
                        tx.update(
                            vouchers,
                        )
                            .set({
                                isUsed:
                                    true,

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


                /*
                 * Только после успешного
                 * создания всех winners
                 * завершаем giveaway.
                 */
                tx.update(
                    giveaways,
                )
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