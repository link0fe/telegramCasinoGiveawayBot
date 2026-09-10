import {
    EligibilityService,
} from "../modules/eligibility/eligibility.service.js";

const service =
    new EligibilityService();

const giveawayId = 8;

for (
    const playerId of [
        "100001",
        "100002",
        "200001",
        "999999",
    ]
) {
    const result =
        await service.check(
            giveawayId,
            playerId,
        );

    console.log(
        playerId,
        "=>",
        result,
    );
}