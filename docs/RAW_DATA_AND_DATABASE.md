# raw-data and database Responsibilities

## raw-data

`raw-data` stores original input files.

Responsibilities:

- Preserve unmodified txt sources.
- Provide traceable source material for Importer.
- Avoid derived, generated, or validated artifacts.

Non-responsibilities:

- No validation output.
- No generated Persona data.
- No database-ready records.

## database

`database` stores structured artifacts derived from source material.

Responsibilities:

- Store standard JSON created by Importer.
- Store validation reports and validated records.
- Store schemas or export formats needed by the system.
- Preserve source references back to `raw-data`.

Non-responsibilities:

- No raw txt source ownership.
- No runtime Persona entity table or collection.
- No unvalidated Generator output as accepted data.

