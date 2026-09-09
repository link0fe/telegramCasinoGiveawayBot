import { UserRepository } from "./user.repository.js";

import type {
    TelegramUserData,
} from "./user.types.js";


export class UserService {

    constructor(
        private readonly userRepository =
            new UserRepository(),
    ) {}


    async getOrCreateTelegramUser(
        data: TelegramUserData,
    ) {

        const existing =
            await this.userRepository
                .findByTelegramId(
                    data.telegramId,
                );

        if (existing) {
            return existing;
        }


        return this.userRepository.create(
            data,
            "PLAYER",
        );
    }
}