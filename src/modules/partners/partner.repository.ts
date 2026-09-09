import { eq } from "drizzle-orm";

import { db } from "../../database/db.js";
import { partners, users } from "../../database/schema.js";

export class PartnerRepository {
    async findUserByTelegramId(telegramId: string) {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, telegramId))
            .limit(1);

        return result[0] ?? null;
    }

    async findPartnerByUserId(userId: number) {
        const result = await db
            .select()
            .from(partners)
            .where(eq(partners.userId, userId))
            .limit(1);

        return result[0] ?? null;
    }

    async findByAffiliateId(affiliateId: string) {
        const result = await db
            .select()
            .from(partners)
            .where(eq(partners.affiliateId, affiliateId))
            .limit(1);

        return result[0] ?? null;
    }

    async create(data: {
        userId: number;
        name: string;
        affiliateId: string;
    }) {
        const result = await db
            .insert(partners)
            .values(data)
            .returning();

        return result[0];
    }

    async setUserRolePartner(userId: number) {
        const result = await db
            .update(users)
            .set({
                role: "PARTNER",
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        return result[0];
    }
}