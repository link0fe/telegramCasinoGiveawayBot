import { db } from "../database/db.js";

import {
    users,
    partners,
    giveaways,
    participants,
    winners,
    casinoPlayers,
    vouchers
} from "../database/schema.js";


const allUsers =
    await db.select().from(users);

const allPartners =
    await db.select().from(partners);

const allGiveaways =
    await db.select().from(giveaways);

const allParticipants =
    await db.select().from(participants);

const allWinners =
    await db.select().from(winners);

const allCasinoPlayers =
    await db.select().from(casinoPlayers);

const allVouchers =
    await db.select().from(vouchers);

console.log("\n=== VOUCHERS ===",);
console.table(allVouchers,);

console.log("\n=== USERS ===");
console.table(allUsers);

console.log("\n=== PARTNERS ===");
console.table(allPartners);

console.log("\n=== GIVEAWAYS ===");
console.table(allGiveaways);


console.log("\n=== PARTICIPANTS ===");
console.table(allParticipants);

console.log("\n=== WINNERS ===");
console.table(allWinners);

console.log("\n=== CASINO PLAYERS ===");
console.table(allCasinoPlayers);