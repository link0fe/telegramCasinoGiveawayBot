import {
    CasinoImportRepository,
} from "../modules/casino/casino-import.repository.js";


const repository =
    new CasinoImportRepository();


const imports =
    await repository.findAll();


if (imports.length === 0) {
    console.log(
        "No casino imports found.",
    );
} else {
    console.table(
        imports.map(
            (item) => ({
                id:
                    item.id,

                source:
                    item.source,

                fileName:
                    item.fileName,

                status:
                    item.status,

                totalRows:
                    item.totalRows,

                importedRows:
                    item.importedRows,

                skippedRows:
                    item.skippedRows,

                uploadedByUserId:
                    item.uploadedByUserId,

                startedAt:
                    item.startedAt,

                finishedAt:
                    item.finishedAt,

                errorMessage:
                    item.errorMessage,
            }),
        ),
    );
}