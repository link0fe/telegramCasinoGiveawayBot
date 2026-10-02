import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    casinoPlayers,
    playerAccounts,
    users,
} from "../../database/schema.js";


export class PlayerAccountRepository {

    /*
     * Ищем привязку по Telegram ID.
     *
     * Возвращаем:
     * user + player account + casino player.
     */
    async findByTelegramId(
        telegramId: string,
    ) {
        const result =
            await db
                .select({
                    account:
                        playerAccounts,

                    casinoPlayer:
                        casinoPlayers,
                })
                .from(
                    playerAccounts,
                )
                .innerJoin(
                    users,
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
                        telegramId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * Проверяем, привязан ли данный
     * Casino Player к кому-либо.
     */
    async findByCasinoPlayerId(
        casinoPlayerId: number,
    ) {
        const result =
            await db
                .select()
                .from(
                    playerAccounts,
                )
                .where(
                    eq(
                        playerAccounts.casinoPlayerId,
                        casinoPlayerId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * Находим casino player
     * по настоящему Player ID,
     * например "100001".
     */
    async findCasinoPlayer(
        playerId: string,
    ) {
        const result =
            await db
                .select()
                .from(
                    casinoPlayers,
                )
                .where(
                    eq(
                        casinoPlayers.playerId,
                        playerId,
                    ),
                )
                .limit(1);


        return result[0] ?? null;
    }


    /*
     * Находим внутреннего пользователя
     * по Telegram ID.
     */
    async findUserByTelegramId(
        telegramId: string,
    ) {
        const result =
            await db
                .select()
                .from(
                    users,
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
     * Создаём постоянную связь.
     */
    async create(
        userId: number,
        casinoPlayerId: number,
    ) {
        const result =
            await db
                .insert(
                    playerAccounts,
                )
                .values({
                    userId,
                    casinoPlayerId,
                })
                .returning();


        return result[0] ?? null;
    }
}