import {
    CasinoCsvImportService,
} from "./casino-csv-import.service";

import {
    CasinoImportRepository,
} from "./casino-import.repository.js";

import type {
    CasinoImportSource,
} from "./casino-import.repository.js";


export class CasinoImportAuditService {

    constructor(
        private readonly csvImportService =
            new CasinoCsvImportService(),

        private readonly importRepository =
            new CasinoImportRepository(),
    ) {}


    async importFile(
        filePath: string,
        options: {
            source: CasinoImportSource;
            fileName: string | null;
            uploadedByUserId: number | null;
        },
    ) {
        const importRecord =
            await this.importRepository
                .create(
                    options.source,
                    options.fileName,
                    options.uploadedByUserId,
                );

        if (!importRecord) {
            throw new Error(
                "CASINO_IMPORT_RECORD_CREATE_FAILED",
            );
        }


        try {
            const result =
                await this.csvImportService
                    .importFile(
                        filePath,
                    );


            await this.importRepository
                .markSuccess(
                    importRecord.id,
                    {
                        totalRows:
                            result.totalRows,

                        importedRows:
                            result.imported,

                        skippedRows:
                            result.skipped,
                    },
                );


            return result;
        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);


            await this.importRepository
                .markFailed(
                    importRecord.id,
                    errorMessage,
                );


            throw error;
        }
    }
}