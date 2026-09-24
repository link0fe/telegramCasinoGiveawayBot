import {
    and,
    eq,
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    vouchers,
} from "../../database/schema.js";

export class VoucherRepository {
    async findAvailable(
        amount: number,
        currency: string,
    ) {
        const result =
            await db
                .select()
                .from(vouchers)
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
                .limit(1);

        return result[0] ?? null;
    }

    async create(
        code: string,
        amount: number,
        currency: string,
    ) {
        const result =
            await db
                .insert(vouchers)
                .values({
                    code,
                    amount,
                    currency,
                    isUsed: false,
                })
                .onConflictDoNothing({
                    target:
                        vouchers.code,
                })
                .returning();

        return result[0] ?? null;
    }

    async findAll() {
        return await db
            .select()
            .from(vouchers);
    }

    async markUsed(
        voucherId: number,
        winnerId: number,
    ) {
        const result =
            await db
                .update(vouchers)
                .set({
                    isUsed: true,
                    winnerId,
                    usedAt: new Date(),
                })
                .where(
                    and(
                        eq(
                            vouchers.id,
                            voucherId,
                        ),
                        eq(
                            vouchers.isUsed,
                            false,
                        ),
                    ),
                )
                .returning();

        return result[0] ?? null;
    }
}