import {
    sqliteTable,
    integer,
    text,
    real,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";


// ==========================================
// USERS
// ==========================================

export const users = sqliteTable(
    "users",
    {
        id: integer("id")
            .primaryKey({ autoIncrement: true }),

        telegramId: text("telegram_id")
            .notNull()
            .unique(),

        username: text("username"),

        firstName: text("first_name"),

        role: text("role", {
            enum: ["PLAYER", "PARTNER", "ADMIN"],
        })
            .notNull()
            .default("PLAYER"),

        createdAt: integer("created_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),

        updatedAt: integer("updated_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),
    },
);


// ==========================================
// PARTNERS
// ==========================================

export const partners = sqliteTable(
    "partners",
    {
        id: integer("id")
            .primaryKey({ autoIncrement: true }),

        userId: integer("user_id")
            .notNull()
            .references(() => users.id),

        name: text("name")
            .notNull(),

        affiliateId: text("affiliate_id")
            .notNull(),

        isActive: integer("is_active", {
            mode: "boolean",
        })
            .notNull()
            .default(true),

        createdAt: integer("created_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),

        updatedAt: integer("updated_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (table) => ({
        userIdUnique: uniqueIndex("partners_user_id_unique")
            .on(table.userId),

        affiliateIdUnique: uniqueIndex(
            "partners_affiliate_id_unique",
        ).on(table.affiliateId),
    }),
);


// ==========================================
// GIVEAWAYS
// ==========================================

export const giveaways = sqliteTable(
    "giveaways",
    {
        id: integer("id")
            .primaryKey({ autoIncrement: true }),

        partnerId: integer("partner_id")
            .notNull()
            .references(() => partners.id),

        title: text("title")
            .notNull(),

        status: text("status", {
            enum: [
                "DRAFT",
                "ACTIVE",
                "FINISHED",
                "CANCELLED",
            ],
        })
            .notNull()
            .default("ACTIVE"),

        startsAt: integer("starts_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),

        endsAt: integer("ends_at", {
            mode: "timestamp",
        })
            .notNull(),

        winnersCount: integer("winners_count")
            .notNull(),

        requireAffiliate: integer(
            "require_affiliate",
            {
                mode: "boolean",
            },
        )
            .notNull()
            .default(true),

        requireFirstDeposit: integer(
            "require_first_deposit",
            {
                mode: "boolean",
            },
        )
            .notNull()
            .default(false),

        minFirstDepositAmount: real(
            "min_first_deposit_amount",
        )
            .notNull()
            .default(0),

        createdAt: integer("created_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),

        updatedAt: integer("updated_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),
    },
);


// ==========================================
// PRIZES
// ==========================================

export const giveawayPrizes = sqliteTable(
    "giveaway_prizes",
    {
        id: integer("id")
            .primaryKey({ autoIncrement: true }),

        giveawayId: integer("giveaway_id")
            .notNull()
            .references(() => giveaways.id),

        place: integer("place")
            .notNull(),

        amount: real("amount")
            .notNull(),

        currency: text("currency")
            .notNull()
            .default("RUB"),
    },
);


// ==========================================
// PARTICIPANTS
// ==========================================

export const participants = sqliteTable(
    "participants",
    {
        id: integer("id")
            .primaryKey({ autoIncrement: true }),

        giveawayId: integer("giveaway_id")
            .notNull()
            .references(() => giveaways.id),

        telegramUserId: text("telegram_user_id")
            .notNull(),

        casinoPlayerId: text("casino_player_id")
            .notNull(),

        joinedAt: integer("joined_at", {
            mode: "timestamp",
        })
            .notNull()
            .$defaultFn(() => new Date()),
    },
    (table) => ({
        giveawayTelegramUnique: uniqueIndex(
            "participants_giveaway_telegram_unique",
        ).on(
            table.giveawayId,
            table.telegramUserId,
        ),

        giveawayCasinoPlayerUnique: uniqueIndex(
            "participants_giveaway_player_unique",
        ).on(
            table.giveawayId,
            table.casinoPlayerId,
        ),
    }),
);