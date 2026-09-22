import {
    eq,
    desc
} from "drizzle-orm";

import {
    db,
} from "../../database/db.js";

import {
    casinoImports,
} from "../../database/schema.js";


export type CasinoImportSource =
    | "TELEGRAM"
    | "PLAYWRIGHT"
    | "CLI";


export class CasinoImportRepository {

    async create(
        source: CasinoImportSource,
        fileName: string | null,
        uploadedByUserId: number | null,
    ) {
        const result =
            await db
                .insert(casinoImports)
                .values({
                    source,
                    fileName,
                    uploadedByUserId,

                    status: "FAILED",

                    totalRows: 0,
                    importedRows: 0,
                    skippedRows: 0,

                    startedAt:
                        new Date(),
                })
                .returning();

        return result[0] ?? null;
    }


    async markSuccess(
        importId: number,
        data: {
            totalRows: number;
            importedRows: number;
            skippedRows: number;
        },
    ) {
        await db
            .update(casinoImports)
            .set({
                status: "SUCCESS",

                totalRows:
                    data.totalRows,

                importedRows:
                    data.importedRows,

                skippedRows:
                    data.skippedRows,

                errorMessage: null,

                finishedAt:
                    new Date(),
            })
            .where(
                eq(
                    casinoImports.id,
                    importId,
                ),
            );
    }


    async markFailed(
        importId: number,
        errorMessage: string,
    ) {
        await db
            .update(casinoImports)
            .set({
                status: "FAILED",

                errorMessage,

                finishedAt:
                    new Date(),
            })
            .where(
                eq(
                    casinoImports.id,
                    importId,
                ),
            );
    }

    async findAll() {
        return await db
            .select()
            .from(casinoImports)
            .orderBy(
                desc(
                    casinoImports.startedAt,
                ),
            );
    }
}