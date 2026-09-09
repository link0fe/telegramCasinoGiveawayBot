import { GiveawayService } from "../modules/giveaways/giveaway.service.js";

const giveawayService =
    new GiveawayService();

const TEST_PARTNER_TELEGRAM_ID =
    "999999999";

const giveaway =
    await giveawayService
        .createGiveawayForPartner(
            TEST_PARTNER_TELEGRAM_ID,
            {
                title:
                    "Dan Test Giveaway",

                endsAt:
                    new Date(
                        Date.now() +
                        60 * 60 * 1000,
                    ),

                winnersCount: 3,

                requireAffiliate: true,

                requireFirstDeposit: true,

                minFirstDepositAmount: 20,

                prizes: [
                    {
                        place: 1,
                        amount: 100,
                        currency: "USD",
                    },
                    {
                        place: 2,
                        amount: 50,
                        currency: "USD",
                    },
                    {
                        place: 3,
                        amount: 25,
                        currency: "USD",
                    },
                ],
            },
        );

console.log(
    "Giveaway created:",
    giveaway,
);