import { PartnerRepository } from "./partner.repository.js";

import type { CreatePartnerData } from "./partner.types.js";

export class PartnerService {
    constructor(
        private readonly partnerRepository =
            new PartnerRepository(),
    ) {}

    async createPartner(data: CreatePartnerData) {
        const user =
            await this.partnerRepository
                .findUserByTelegramId(
                    data.telegramId,
                );

        if (!user) {
            throw new Error(
                "USER_NOT_FOUND",
            );
        }

        const existingPartner =
            await this.partnerRepository
                .findPartnerByUserId(
                    user.id,
                );

        if (existingPartner) {
            throw new Error(
                "USER_ALREADY_PARTNER",
            );
        }

        const existingAffiliate =
            await this.partnerRepository
                .findByAffiliateId(
                    data.affiliateId,
                );

        if (existingAffiliate) {
            throw new Error(
                "AFFILIATE_ALREADY_EXISTS",
            );
        }

        const partner =
            await this.partnerRepository.create({
                userId: user.id,
                name: data.name,
                affiliateId: data.affiliateId,
            });

        await this.partnerRepository
            .setUserRolePartner(
                user.id,
            );

        return partner;
    }

    async deactivatePartner(partnerId: number) {
        const partner =
            await this.partnerRepository
                .findById(
                    partnerId,
                );

        if (!partner) {
            throw new Error(
                "PARTNER_NOT_FOUND",
            );
        }

        await this.partnerRepository
            .deactivate(
                partnerId,
            );
    }
}