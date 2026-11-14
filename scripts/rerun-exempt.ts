// Defect: a flake on a leak, refusal or isolation assertion is reported as green after a second run,
// and nobody investigates it as the defect it may be (testing T4).
// A failed test is never rerun when its file or its name says it is one of those: isolation between
// companies or projects, a refusal, a leak. The words over-match on purpose, since a test wrongly
// kept out of the second run only costs a rerun by hand, and one wrongly let in hides a defect.
// The match is proved by rerun-exempt.test.ts, against the repository's own file names.
// Revalidate by 2027-05-14, or when the test names change language.
const FILE = /isolation|refus|recus|leak|vaz/i
const NAME =
  /recus|refus|isolat|isolament|vaz|leak|outra empresa|outro projeto|de outra|de outro|estranh|alheio|forast/i

export function neverRerun(failure: { file: string; name: string }): boolean {
  return FILE.test(failure.file) || NAME.test(failure.name)
}
