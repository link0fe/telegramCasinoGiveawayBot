import {
    eq,
} from "drizzle-orm";

import {
    db,
} from "../database/db.js";

import {
    users,
} from "../database/schema.js";


const userId =
    Number(
        process.argv[2],
    );

const role =
    process.argv[3];


if (
    !Number.isInteger(userId) ||
    userId < 1
) {
    console.error(
        "Usage: npx tsx src/scripts/set-user-role.ts <userId> <role>",
    );

    process.exit(1);
}


if (
    role !== "PLAYER" &&
    role !== "PARTNER" &&
    role !== "ADMIN"
) {
    console.error(
        "Role must be PLAYER, PARTNER or ADMIN",
    );

    process.exit(1);
}


const existingUser =
    await db
        .select()
        .from(users)
        .where(
            eq(
                users.id,
                userId,
            ),
        )
        .limit(1);


const user =
    existingUser[0];


if (!user) {
    console.error(
        `User ${userId} not found.`,
    );

    process.exit(1);
}


console.log(
    `Current role: ${user.role}`,
);


await db
    .update(users)
    .set({
        role,
    })
    .where(
        eq(
            users.id,
            userId,
        ));


const updatedUser =
    await db
        .select()
        .from(users)
        .where(
            eq(
                users.id,
                userId,
            ),
        )
        .limit(1);


console.log(
    `User ${userId}: ${user.role} -> ${updatedUser[0]?.role}`,
);