export type EligibilityResult =
    | {
        eligible: true;
    }
    | {
        eligible: false;
        reason:
            | "GIVEAWAY_NOT_FOUND"
            | "GIVEAWAY_NOT_ACTIVE"
            | "GIVEAWAY_ENDED"
            | "PLAYER_NOT_FOUND"
            | "WRONG_AFFILIATE"
            | "NO_FIRST_DEPOSIT"
            | "FIRST_DEPOSIT_TOO_SMALL";
    };