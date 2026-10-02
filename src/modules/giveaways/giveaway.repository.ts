import {
    and,
    desc,
    eq,
    gt,
    lte,
    or,
    sql,
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    users,
    partners,
    giveaways,
    participants,
    winners,
    playerAccounts,
    casinoPlayers,
} from "../../database/schema.js";

import type {
    CreateGiveawayData,
} from "./giveaway.types.js";


export class GiveawayRepository {

    /*
     * =====================================
     * ADMIN PARTICIPANTS
     * =====================================
     */
    async findParticipantsForAdmin(
        giveawayId: number,
    ) {
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
            .from(
                participants,
            )
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


    /*
     * =====================================
     * ADMIN WINNERS
     * =====================================
     */
    async findWinnersForAdmin(
        giveawayId: number,
    ) {
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
            .from(
                winners,
            )
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


    /*
     * =====================================
     * COUNT PARTICIPANTS
     * =====================================
     */
    async countParticipants(
        giveawayId: number,
    ) {
        const result =
            await db
                .select({
                    count:
                        sql<number>`
                            count(*)
                        `,
                })
                .from(
                    participants,
                )
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


    /*
     * =====================================
     * COUNT WINNERS
     * =====================================
     */
    async countWinners(
        giveawayId: number,
    ) {
        const result =
            await db
                .select({
                    count:
                        sql<number>`
                            count(*)
                        `,
                })
                .from(
                    winners,
                )
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


    /*
     * =====================================
     * ADMIN GIVEAWAYS
     * =====================================
     */
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

                prizeAmount:
                    giveaways.prizeAmount,

                currency:
                    giveaways.currency,

                partnerId:
                    partners.id,

                partnerName:
                    partners.name,

                affiliateId:
                    partners.affiliateId,
            })
            .from(
                giveaways,
            )
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
            )
            .limit(
                10,
            );
    }


    /*
     * =====================================
     * LINKED CASINO PLAYER
     * =====================================
     */
    async findLinkedCasinoPlayer(
        telegramUserId: string,
    ) {
        const result =
            await db
                .select({
                    userId:
                        users.id,

                    telegramId:
                        users.telegramId,

                    casinoPlayerId:
                        casinoPlayers.id,

                    playerId:
                        casinoPlayers.playerId,

                    affiliateId:
                        casinoPlayers.affiliateId,

                    affiliateName:
                        casinoPlayers.affiliateName,
                })
                .from(
                    users,
                )
                .innerJoin(
                    playerAccounts,
                    eq(
                        playerAccounts.userId,
                        users.id,
                    ),
                )
                .innerJoin(
                    casinoPlayers,
                    eq(
                        playerAccounts.casinoPlayerId,
                        casinoPlayers.id,
                    ),
                )
                .where(
                    eq(
                        users.telegramId,
                        telegramUserId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * =====================================
     * PLAYER PARTICIPATION
     * =====================================
     */
    async findPlayerParticipation(
        giveawayId: number,
        telegramUserId: string,
    ) {
        const result =
            await db
                .select({
                    id:
                        participants.id,

                    giveawayId:
                        participants.giveawayId,

                    telegramUserId:
                        participants.telegramUserId,

                    casinoPlayerId:
                        participants.casinoPlayerId,

                    joinedAt:
                        participants.joinedAt,
                })
                .from(
                    participants,
                )
                .where(
                    and(
                        eq(
                            participants.giveawayId,
                            giveawayId,
                        ),

                        eq(
                            participants.telegramUserId,
                            telegramUserId,
                        ),
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * =====================================
     * ACTIVE GIVEAWAYS FOR PLAYER
     * =====================================
     */
    async findActiveForPlayer(
        affiliateId?: string,
    ) {

        const conditions = [
            eq(
                giveaways.status,
                "ACTIVE",
            ),

            gt(
                giveaways.endsAt,
                new Date(),
            ),

            eq(
                partners.isActive,
                true,
            ),
        ];


        /*
         * Если Player ID уже привязан,
         * показываем:
         *
         * 1. giveaways без affiliate requirement
         * 2. giveaways его affiliate
         */
        if (affiliateId) {

            conditions.push(
                or(
                    eq(
                        giveaways.requireAffiliate,
                        false,
                    ),

                    eq(
                        partners.affiliateId,
                        affiliateId,
                    ),
                )!,
            );
        }


        return await db
            .select({
                id:
                    giveaways.id,

                title:
                    giveaways.title,

                status:
                    giveaways.status,

                startsAt:
                    giveaways.startsAt,

                endsAt:
                    giveaways.endsAt,

                winnersCount:
                    giveaways.winnersCount,

                prizeAmount:
                    giveaways.prizeAmount,

                currency:
                    giveaways.currency,

                requireAffiliate:
                    giveaways.requireAffiliate,

                requireFirstDeposit:
                    giveaways.requireFirstDeposit,

                minFirstDepositAmount:
                    giveaways.minFirstDepositAmount,

                partnerId:
                    partners.id,

                partnerName:
                    partners.name,

                affiliateId:
                    partners.affiliateId,
            })
            .from(
                giveaways,
            )
            .innerJoin(
                partners,
                eq(
                    giveaways.partnerId,
                    partners.id,
                ),
            )
            .where(
                and(
                    ...conditions,
                ),
            )
            .orderBy(
                giveaways.endsAt,
            );
    }


    /*
     * =====================================
     * EXPIRED ACTIVE GIVEAWAYS
     * =====================================
     */
    async findExpiredActive() {
        return await db
            .select()
            .from(
                giveaways,
            )
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


    /*
     * =====================================
     * PARTNER TELEGRAM ID
     * =====================================
     */
    async findPartnerTelegramId(
        partnerId: number,
    ) {
        const result =
            await db
                .select({
                    telegramId:
                        users.telegramId,
                })
                .from(
                    partners,
                )
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


    /*
     * =====================================
     * GIVEAWAY + PARTNER
     * =====================================
     */
    async findByIdWithPartner(
        giveawayId: number,
    ) {
        const result =
            await db
                .select({
                    giveaway:
                        giveaways,

                    partner:
                        partners,
                })
                .from(
                    giveaways,
                )
                .innerJoin(
                    partners,
                    eq(
                        giveaways.partnerId,
                        partners.id,
                    ),
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
     * GIVEAWAY BY ID
     * =====================================
     */
    async findById(
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
     * PARTNER BY TELEGRAM
     * =====================================
     */
    async findPartnerByTelegramId(
        telegramId: string,
    ) {
        const result =
            await db
                .select({
                    partner:
                        partners,

                    user:
                        users,
                })
                .from(
                    partners,
                )
                .innerJoin(
                    users,
                    eq(
                        partners.userId,
                        users.id,
                    ),
                )
                .where(
                    eq(
                        users.telegramId,
                        telegramId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * =====================================
     * CREATE GIVEAWAY
     * =====================================
     */
    async create(
        partnerId: number,
        data: CreateGiveawayData,
    ) {
        const result =
            await db
                .insert(
                    giveaways,
                )
                .values({
                    partnerId,

                    title:
                        data.title,

                    status:
                        "ACTIVE",

                    endsAt:
                        data.endsAt,

                    winnersCount:
                        data.winnersCount,

                    prizeAmount:
                        data.prizeAmount,

                    currency:
                        data.currency,

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
                .returning();


        const giveaway =
            result[0];


        if (!giveaway) {
            throw new Error(
                "GIVEAWAY_CREATE_FAILED",
            );
        }


        return giveaway;
    }


    /*
     * =====================================
     * PARTNER GIVEAWAYS
     * =====================================
     *
     * Показываем только последние
     * 10 розыгрышей партнёра.
     */
    async findAllByPartnerTelegramId(
        telegramId: string,
    ) {
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

                prizeAmount:
                    giveaways.prizeAmount,

                currency:
                    giveaways.currency,

                requireAffiliate:
                    giveaways.requireAffiliate,

                requireFirstDeposit:
                    giveaways.requireFirstDeposit,

                minFirstDepositAmount:
                    giveaways.minFirstDepositAmount,
            })
            .from(
                giveaways,
            )
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
            )
            .limit(
                10,
            );
    }


    /*
     * =====================================
     * PARTNER GIVEAWAY ACCESS
     * =====================================
     */
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

                    winnersCount:
                        giveaways.winnersCount,

                    prizeAmount:
                        giveaways.prizeAmount,

                    currency:
                        giveaways.currency,
                })
                .from(
                    giveaways,
                )
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