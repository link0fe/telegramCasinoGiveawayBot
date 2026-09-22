import {
    and,
    desc,
    eq,
    lte,
    sql,
} from "drizzle-orm";
import { db } from "../../database/db.js";
import {
    users,
    partners,
    giveaways,
    giveawayPrizes,
    participants,
    winners,
} from "../../database/schema.js";
import type {
    CreateGiveawayData,
} from "./giveaway.types.js";


export class GiveawayRepository {

    async findParticipantsForAdmin( giveawayId: number,) {
        return await db
            .select({
                id:
                    participants.id,

                telegramUserId:
                    participants.telegramUserId,

                casinoPlayerId:
                    participants.casinoPlayerId,

                joinedAt:
                    participants.joinedAt,
            })
            .from(participants)
            .where(
                eq(
                    participants.giveawayId,
                    giveawayId,
                ),
            )
            .orderBy(
                participants.joinedAt,
            );
    }

    async findWinnersForAdmin( giveawayId: number ) {
        return await db
            .select({
                id:
                    winners.id,

                place:
                    winners.place,

                prizeAmount:
                    winners.prizeAmount,

                currency:
                    winners.currency,

                voucherCode:
                    winners.voucherCode,

                createdAt:
                    winners.createdAt,

                telegramUserId:
                    participants.telegramUserId,

                casinoPlayerId:
                    participants.casinoPlayerId,
            })
            .from(winners)
            .innerJoin(
                participants,
                eq(
                    winners.participantId,
                    participants.id,
                ),
            )
            .where(
                eq(
                    winners.giveawayId,
                    giveawayId,
                ),
            )
            .orderBy(
                winners.place,
            );
    }

    async countParticipants(giveawayId: number,) {
        const result =
            await db
                .select({
                    count:
                        sql<number>`
                            count(*)
                        `,
                })
                .from(participants)
                .where(
                    eq(
                        participants.giveawayId,
                        giveawayId,
                    ),
                );

        return Number(
            result[0]?.count ?? 0,
        );
    }

    async countWinners(giveawayId: number,) {
        const result =
            await db
                .select({
                    count:
                        sql<number>`
                            count(*)
                        `,
                })
                .from(winners)
                .where(
                    eq(
                        winners.giveawayId,
                        giveawayId,
                    ),
                );

        return Number(
            result[0]?.count ?? 0,
        );
    }

    async findAllForAdmin() {
        return await db
            .select({
                id:
                    giveaways.id,

                title:
                    giveaways.title,

                status:
                    giveaways.status,

                createdAt:
                    giveaways.createdAt,

                startsAt:
                    giveaways.startsAt,

                endsAt:
                    giveaways.endsAt,

                winnersCount:
                    giveaways.winnersCount,

                partnerId:
                    partners.id,

                partnerName:
                    partners.name,

                affiliateId:
                    partners.affiliateId,
            })
            .from(giveaways)
            .innerJoin(
                partners,
                eq(
                    giveaways.partnerId,
                    partners.id,
                ),
            )
            .orderBy(
                desc(
                    giveaways.createdAt,
                ),
            );
    }

    async findExpiredActive() {
        return db
            .select()
            .from(giveaways)
            .where(
                and(
                    eq(
                        giveaways.status,
                        "ACTIVE",
                    ),
                    lte(
                        giveaways.endsAt,
                        new Date(),
                    ),
                ),
            );
    }

    async findPartnerTelegramId( partnerId: number,) {
        const result = await db
            .select({
                telegramId:
                    users.telegramId,
            })
            .from(partners)
            .innerJoin(
                users,
                eq(
                    partners.userId,
                    users.id,
                ),
            )
            .where(
                eq(
                    partners.id,
                    partnerId,
                ),
            )
            .limit(1);

        return (
            result[0]?.telegramId ??
            null
        );
    }

    async findByIdWithPartner(giveawayId: number) {
        const result = await db
            .select({
                giveaway: giveaways,
                partner: partners,
            })
            .from(giveaways)
            .innerJoin(partners, eq(giveaways.partnerId, partners.id))
            .where(
                eq(giveaways.id, giveawayId),
            )
            .limit(1);
        return result[0] ?? null;
    }

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
                        
                    requireChannelSubscription:
                        data.requireChannelSubscription,

                    channelUsername:
                        data.channelUsername,
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
    async findAllByPartnerTelegramId(telegramId: string,) {
        return await db
            .select({
                id:
                    giveaways.id,

                title:
                    giveaways.title,

                status:
                    giveaways.status,

                createdAt:
                    giveaways.createdAt,

                startsAt:
                    giveaways.startsAt,

                endsAt:
                    giveaways.endsAt,

                winnersCount:
                    giveaways.winnersCount,

                requireAffiliate:
                    giveaways.requireAffiliate,

                requireFirstDeposit:
                    giveaways.requireFirstDeposit,

                minFirstDepositAmount:
                    giveaways.minFirstDepositAmount,
            })
            .from(giveaways)
            .innerJoin(
                partners,
                eq(
                    giveaways.partnerId,
                    partners.id,
                ),
            )
            .innerJoin(
                users,
                eq(
                    partners.userId,
                    users.id,
                ),
            )
            .where(
                and(
                    eq(
                        users.telegramId,
                        telegramId,
                    ),
                    eq(
                        partners.isActive,
                        true,
                    ),
                ),
            )
            .orderBy(
                desc(
                    giveaways.createdAt,
                ),
            );
    }
    async findPartnerGiveawayByTelegramId(
        giveawayId: number,
        telegramId: string,
    ) {
        const result =
            await db
                .select({
                    id:
                        giveaways.id,

                    title:
                        giveaways.title,

                    status:
                        giveaways.status,

                    partnerId:
                        giveaways.partnerId,
                })
                .from(giveaways)
                .innerJoin(
                    partners,
                    eq(
                        giveaways.partnerId,
                        partners.id,
                    ),
                )
                .innerJoin(
                    users,
                    eq(
                        partners.userId,
                        users.id,
                    ),
                )
                .where(
                    and(
                        eq(
                            giveaways.id,
                            giveawayId,
                        ),
                        eq(
                            users.telegramId,
                            telegramId,
                        ),
                        eq(
                            partners.isActive,
                            true,
                        ),
                    ),
                )
                .limit(1);

        return result[0] ?? null;
    }
}
