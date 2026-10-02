export type CreateGiveawayData = {
    title: string;
    endsAt: Date;
    winnersCount: number;
    prizeAmount: number;
    currency: string;
    requireAffiliate: boolean;
    requireFirstDeposit: boolean;
    minFirstDepositAmount: number;
    requireChannelSubscription: boolean;
    channelUsername: string | null;
};