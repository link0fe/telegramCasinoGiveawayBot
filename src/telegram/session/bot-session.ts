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

export type ParticipationState = {
    giveawayId: number;
    step: "WAITING_PLAYER_ID";
};

export type BotSession = {
    giveawayWizard?: GiveawayWizardState;
    participation?: ParticipationState;
    casinoUpload?: CasinoUploadState;
    partnerAdmin?: PartnerAdminState;
};

export type BotContext =
    SessionFlavor<BotSession>;

export type CasinoUploadState = {
    step: "WAITING_CSV";
};

export type PartnerAdminState =
    | {
        step: "WAITING_ADD_DATA";
    }
    | {
        step: "WAITING_REMOVE_ID";
    };