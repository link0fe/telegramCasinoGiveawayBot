export type CreateGiveawayData = {
    title: string;
    endsAt: Date;
    winnersCount: number;
    requireAffiliate: boolean;
    requireFirstDeposit: boolean;
    minFirstDepositAmount: number;
    requireChannelSubscription: boolean;
    channelUsername: string | null;

    prizes: {
        place: number;
        amount: number;
        currency: string;
    }[];
};