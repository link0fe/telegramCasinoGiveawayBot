import { eq } from "drizzle-orm";

import { db } from "../../database/db.js";
import { users } from "../../database/schema.js";

import type {
    TelegramUserData,
    UserRole,
} from "./user.types.js";


export class UserRepository {

    async findByTelegramId(telegramId: string) {
        const result = await db
            .select()
            .from(users)
            .where(
                eq(users.telegramId, telegramId)
            )
            .limit(1);

        return result[0] ?? null;
    }


    async create(
        data: TelegramUserData,
        role: UserRole = "PLAYER",
    ) {
        const result = await db
            .insert(users)
            .values({
                telegramId: data.telegramId,
                username: data.username ?? null,
                firstName: data.firstName ?? null,
                role,
            })
            .returning();

        return result[0];
    }
}