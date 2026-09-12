# Dataset catalog and first ingest

## Active dataset

| Field                  | Value                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| Publisher              | US Census Bureau                                                                 |
| Program                | Current Population Survey, Annual Social and Economic Supplement                 |
| Table                  | PINC-11, all races, male and female counts combined                              |
| Income reference year  | 2024                                                                             |
| Survey year            | 2025                                                                             |
| Geography              | United States, `0100000US`                                                       |
| Population             | People age 15 and over as of March 2025, including zero and negative income      |
| Measure                | Annual individual money income before taxes                                      |
| Exclusions from income | Capital gains and noncash benefits                                               |
| Bins                   | 44; $2,500 intervals below $100,000, $50,000 intervals from $100,000 to $250,000 |
| Open tails             | Under $2,500; $250,000 and over                                                  |
| Refresh cadence        | Annual, reviewed before changing source year                                     |
| Transformation         | `cps-pinc11-v1`                                                                  |

This is a comparison with the full age-eligible population, including retirees, students, nonworkers and people working part time. It must never be labeled a percentile among workers, full-time workers, or people with income only. Ages are measured in March of the survey year. An individual's calendar-year total money income is the matching input, not their household income, net worth, or take-home pay.

Primary references:

- [Census PINC-11 publication and rounding notes](https://www.census.gov/data/tables/time-series/demo/income-poverty/cps-pinc/pinc-11.2024.html).
- [Male all-race source workbook](https://www2.census.gov/programs-surveys/cps/tables/pinc-11/2025/pinc11_1.xlsx).
- [Female all-race source workbook](https://www2.census.gov/programs-surveys/cps/tables/pinc-11/2025/pinc11_2.xlsx).
- [CPS subject definitions](https://www.census.gov/programs-surveys/cps/technical-documentation/subject-definitions.html).
- [2025 CPS technical documentation](https://www2.census.gov/programs-surveys/cps/techdocs/cpsmar25.pdf).

## Reproduction

Run `npm ci` then `npm run ingest:census` from the repository root. No API credential is needed: the job downloads the two public workbooks directly from Census. Request URLs are fixed in source and contain no secret query parameters. Files have a 30-second download timeout, a one-megabyte size limit, and allowlisted archive members with limits on decompressed size.

The job archives the exact returned bytes in `packages/datasets/data/raw/{combined-sha256}/`. Workbook hashes and byte sizes travel in `datasetVersion.artifacts`. The combined hash is SHA-256 of the male workbook bytes followed by the female workbook bytes, in that order. Parsing verifies table identity, survey and income years, all-race number columns, sex, thousand-person units, lower-tail definition, row labels and threshold widths.

Read the first worksheet only. Each sex's total is cell B10. Rows 11–54 pair income bounds in column A with all-race estimates in column B. Multiply each count by 1,000, then add matching male/female brackets. Inclusive published upper bounds such as $4,999 become exclusive $5,000 boundaries. No subgroup, median, mean, or overlapping subtotal is added to the distribution.

Counts are rounded survey estimates. The normalized denominator is the sum of those bracket counts; `sourceReportedTotal` retains the separately published aggregate (278,300,000 for this release). A discrepancy above 0.5% fails validation; it is not corrected by silently modifying any bracket. New totals more than 20% different from the previous good version require review. Counts, income bounds, duplicate keys, missing values, year changes, unexpected units, wrong sex files and altered workbook schema are independently checked.

Immutable normalized files live in `data/versions/`. Only after validation does the job atomically replace `data/last-good.json`, containing the version ID, source checksum and complete distribution. The web application reads that manifest and validates it again without network access. Identical content and transformation versions leave it unchanged, retaining the original retrieval timestamp. Failed runs are logged separately without raw exception text and cannot replace the last-good dataset. The original workbooks and full normalized version make offline reproduction possible; tests reproduce the committed manifest from those bytes.

## Interpretation and limits

Current salary is not automatically converted into 2024 dollars. The UI identifies the reference year and asks for comparable before-tax income. Within a closed bracket, the calculator assumes a uniform income distribution. The wider $100,000–$250,000 brackets make those point estimates especially approximate. Open tails receive a percentile range with no point estimate. Bin ranges are not confidence intervals and do not describe survey sampling error. Income clustering, underreporting, nonresponse, disclosure rounding and survey error remain limitations.

This first release intentionally contains no local, age, household, occupation, wealth or tax estimates. The prior attempted Census API returned an HTML response without usable records. Direct official spreadsheet access provided a complete real national income source. ACS B19325 remains an available later path through the official [table-based summary file](https://www.census.gov/programs-surveys/acs/data/summary-file.html); it has a different definition and population treatment and must be modeled independently. BLS, BEA, FRED and state-tax ingest are future milestones rather than placeholder values.

## Operations and storage

The immutable file snapshot is the deployable bootstrap store. PostgreSQL tables mirror these source/version/distribution contracts; a database-backed publisher should wrap insertions and advancement of its last-good pointer in one transaction. No database write is claimed by the file publisher. Production scheduling, durable object storage, alert delivery and a reviewed freshness SLA require provisioned infrastructure. The current job is manually or CI invoked and writes local run records. Recheck Census releases before promoting a newer reference year; this snapshot does not imply that 2024 is the newest release forever.
