import type {
    Bot,
} from "grammy";

import type {
    BotContext,
} from "../../telegram/session/bot-session.js";

import {
    GiveawayRepository,
} from "../../modules/giveaways/giveaway.repository.js";

import {
    GiveawayFinalizerService,
} from "../../modules/giveaways/giveaway-finalizer.service.js";


const CHECK_INTERVAL_MS =
    60 * 1000;


export function startGiveawayScheduler(
    bot: Bot<BotContext>,
) {
    const giveawayRepository =
        new GiveawayRepository();

    const finalizer =
        new GiveawayFinalizerService(
            bot,
        );


    let running = false;


    const checkGiveaways =
        async () => {

            if (running) {
                console.log(
                    "[GiveawayScheduler] Previous check still running. Skipping.",
                );

                return;
            }


            running = true;


            try {
                const giveaways =
                    await giveawayRepository
                        .findExpiredActive();


                if (
                    giveaways.length === 0
                ) {
                    return;
                }


                console.log(
                    `[GiveawayScheduler] Found ${giveaways.length} expired giveaway(s).`,
                );


                for (
                    const giveaway
                    of giveaways
                ) {
                    console.log(
                        `[GiveawayScheduler] Finalizing giveaway ${giveaway.id}: ${giveaway.title}`,
                    );


                    try {
                        const result =
                            await finalizer
                                .finalize(
                                    giveaway.id,
                                );


                        if (
                            result.success
                        ) {
                            console.log(
                                `[GiveawayScheduler] Giveaway ${giveaway.id} finished successfully.`,
                            );

                            continue;
                        }


                        console.log(
                            `[GiveawayScheduler] Giveaway ${giveaway.id} was not finished:`,
                            result,
                        );

                    } catch (error) {
                        console.error(
                            `[GiveawayScheduler] Error while finalizing giveaway ${giveaway.id}:`,
                            error,
                        );
                    }
                }

            } catch (error) {
                console.error(
                    "[GiveawayScheduler] Check failed:",
                    error,
                );

            } finally {
                running = false;
            }
        };


    // Проверяем сразу после запуска бота.
    void checkGiveaways();


    const interval =
        setInterval(
            () => {
                void checkGiveaways();
            },
            CHECK_INTERVAL_MS,
        );


    console.log(
        "[GiveawayScheduler] Started. Checking every 60 seconds.",
    );


    return interval;
}