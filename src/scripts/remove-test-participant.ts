import {
    and,
    eq,
} from "drizzle-orm";

import { db } from "../database/db.js";

import {
    participants,
} from "../database/schema.js";


const giveawayId = 6;

const casinoPlayerId = "100001";


const deleted =
    await db
        .delete(participants)
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
        .returning();


if (deleted.length === 0) {
    console.log(
        "Participant not found.",
    );
} else {
    console.log(
        "Participant deleted:",
    );

    console.table(deleted);
}