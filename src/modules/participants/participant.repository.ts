import {
    and,
    eq,
} from "drizzle-orm";

import { db } from "../../database/db.js";

import {
    participants,
} from "../../database/schema.js";


export class ParticipantRepository {

    async findByTelegramUser(
        giveawayId: number,
        telegramUserId: string,
    ) {
        const result = await db
            .select()
            .from(participants)
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


    async findByCasinoPlayer(
        giveawayId: number,
        casinoPlayerId: string,
    ) {
        const result = await db
            .select()
            .from(participants)
            .where(
                and(
                    eq(
                        participants.giveawayId,
                        giveawayId,
                    ),
                    eq(
                        participants.casinoPlayerId,
                        casinoPlayerId,
                    ),
                ),
            )
            .limit(1);

        return result[0] ?? null;
    }


    async create(data: {
        giveawayId: number;
        telegramUserId: string;
        casinoPlayerId: string;
    }) {
        const result = await db
            .insert(participants)
            .values(data)
            .returning();

        return result[0];
    }
}