import { eq } from "drizzle-orm";

import { db } from "../../database/db.js";

import {
    users,
    partners,
    giveaways,
    giveawayPrizes,
} from "../../database/schema.js";

import type {
    CreateGiveawayData,
} from "./giveaway.types.js";


export class GiveawayRepository {
    async findById(giveawayId: number) {
        const result = await db
            .select()
            .from(giveaways)
            .where(
                eq(giveaways.id, giveawayId),
            )
            .limit(1);

        return result[0] ?? null;
    }

    async findPartnerByTelegramId(
        telegramId: string,
    ) {
        const result = await db
            .select({
                partner: partners,
                user: users,
            })
            .from(partners)
            .innerJoin(
                users,
                eq(partners.userId, users.id),
            )
            .where(
                eq(users.telegramId, telegramId),
            )
            .limit(1);

        return result[0] ?? null;
    }


    async create(
        partnerId: number,
        data: CreateGiveawayData,
    ) {
        return db.transaction((tx) => {

            const giveawayResult = tx
                .insert(giveaways)
                .values({
                    partnerId,

                    title: data.title,

                    status: "ACTIVE",

                    endsAt: data.endsAt,

                    winnersCount:
                        data.winnersCount,

                    requireAffiliate:
                        data.requireAffiliate,

                    requireFirstDeposit:
                        data.requireFirstDeposit,

                    minFirstDepositAmount:
                        data.minFirstDepositAmount,
                })
                .returning()
                .all();

            const giveaway =
                giveawayResult[0];

            if (!giveaway) {
                throw new Error(
                    "GIVEAWAY_CREATE_FAILED",
                );
            }


            if (data.prizes.length > 0) {
                tx.insert(giveawayPrizes)
                    .values(
                        data.prizes.map(
                            (prize) => ({
                                giveawayId:
                                    giveaway.id,

                                place:
                                    prize.place,

                                amount:
                                    prize.amount,

                                currency:
                                    prize.currency,
                            }),
                        ),
                    )
                    .run();
            }


            return giveaway;
        });
    }
}