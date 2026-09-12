# Shared contracts

Zod schemas and inferred TypeScript types for versioned public distributions and calculator inputs/outputs. Bracket bounds are lower-inclusive and upper-exclusive; a null endpoint means an open tail. Percentages are always 0–100. Schemas validate contiguous bins, count totals, rounded-total tolerance, provenance, timestamps, and input ranges.

No browser, database, or network dependencies. All consumers share these definitions.
