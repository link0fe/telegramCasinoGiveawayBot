import type { SessionFlavor } from "grammy";

export type GiveawayWizardState =
    | {
        step: "TITLE";
        data: Record<string, never>;
    }
    | {
        step: "DURATION";
        data: {
            title: string;
        };
    }
    | {
        step: "FIRST_DEPOSIT";
        data: {
            title: string;
            durationMinutes: number;
        };
    }
    | {
        step: "MIN_FTD";
        data: {
            title: string;
            durationMinutes: number;
            requireFirstDeposit: true;
        };
    }
    | {
        step: "WINNERS";
        data: {
            title: string;
            durationMinutes: number;
            requireFirstDeposit: boolean;
            minFirstDepositAmount: number;
        };
    }
    | {
        step: "PRIZES";
        data: {
            title: string;
            durationMinutes: number;
            requireFirstDeposit: boolean;
            minFirstDepositAmount: number;
            winnersCount: number;
        };
    };

export type BotSession = {
    giveawayWizard?: GiveawayWizardState;
};

export type BotContext = SessionFlavor<BotSession>;