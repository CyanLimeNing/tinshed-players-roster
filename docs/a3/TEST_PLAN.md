# A3 test plan and traceability

> Current follow-up candidate: rc.3 (15 October 2026). See [RC3_REVIEW_AND_VALIDATION.md](RC3_REVIEW_AND_VALIDATION.md) for the role-response correction and new tests. The rc.2 execution records below retain their original dates and source identity.

Updated 11 October 2026 for candidate **1.2.0-rc.2**. This record separates
current AI-assisted technical checks from retained rc.1 history. A real team
member's PR review, Jira AC demonstration, Confluence publication and
lecturer/tutor formal acceptance require separate human/process evidence.
R01-R07 and test IDs are local evidence identifiers, not Jira keys.

## Method, entry and exit conditions

Entry: baseline source identified, dependencies installed using the lockfile,
isolated fictional fixtures, and no real volunteer data. API tests use temporary
in-memory databases; PERSIST01 uses a temporary file and actually closes/reopens
the database. Assertions check responses and persisted state, including refusal
paths. The executable tests are the exact repeatable steps and data source.

Run `npm test` or `npm run test:evidence -- your-run-label`. A case may also be
isolated using `node --test --test-name-pattern=VAL15 test/validation.test.js`.
The repeatable core UI workflow is `scripts/browser-validation.cjs`;
it uses Playwright with installed Edge and a temporary in-memory app. Playwright
is a validation tool only, not a runtime dependency. Additional
`scripts/inactive-ui-regression.cjs` checks the inactive current assignee and no-op Save.
These scripts are technical checks, not a member's PR review or UAT.

For optional UI execution, set `A3_PLAYWRIGHT_MODULE` to the absolute installed
Playwright module path and `A3_UI_EVIDENCE_DIR` to an absolute output directory
outside the source checkout. Installed Edge is required. Run:

```bash
node scripts/browser-validation.cjs
node scripts/inactive-ui-regression.cjs
```

Results/screenshots are saved in the configured directory's core-ui and
inactive-ui subdirectories. The 59-test `npm test` suite does not depend on
these optional browser tools. README documents this separate validation setup.

Exit for this technical check: all selected automated tests pass, core interface
actions are exercised, and known limits are documented. This exit condition does
not establish the case study's complete Definition of Done, which needs real
member PR review, truthful Jira state, Confluence decisions and actual AC
demonstrations. Course formal acceptance is the required lecturer/tutor
10-minute presentation followed by 5-minute Q&A.

## Results and provenance

| Run | Result | Interpretation |
|---|---|---|
| Original A2 baseline | 34 runner entries passed | Historical; includes helpers.js, so only 33 behavioural tests |
| 5 Oct before fixes | 35 passed / 16 failed of 51 | Historical candidate defect-discovery run |
| 5 Oct after fixes | 51 passed / 0 failed | Historical initial fixes; original version/date retained |
| 11 Oct rc.1 API/persistence | 54 passed / 0 failed | Historical: 33 inherited + 20 validation + 1 persistence |
| 11 Oct rc.1 browser workflow | 12 passed / 0 failed | Historical Edge 155.0.4283.45, 1365x900 and 390x844 |
| 11 Oct rc.1 clean source start | Passed | Historical fresh source copy; not a network clone or member checkout |
| 11 Oct rc.2 prepublication API/persistence | 59 passed / 0 failed | Current working-tree run; 54 existing + REV01-05; metadata records dirty Git state and source hashes |
| 11 Oct rc.2 core browser workflow | 12 passed / 0 failed | AI technical check; Edge 155.0.4283.45, 1365x900 and 390x844 |
| 11 Oct rc.2 inactive-history workflow | 4 passed / 0 failed | IUI01-04; AI technical check; Edge 155.0.4283.45, 1365x900 |
| Final selected rc.2 commit | See INTEGRATION_REVIEW.md and final-commit run metadata | Separate rerun required; do not reinterpret prepublication Git HEAD as a clean tested commit |

Current core browser results contain no uncaught JavaScript errors. Their one
HTTP 409 and corresponding console resource error were expected from the
deliberate duplicate-role refusal. IUI04 deliberately generates one HTTP 400
for an inactive volunteer's duty change; it is an expected refusal, not an
unexpected browser failure. Inactive-history checks verify the full assignment
state and count PUT requests; unchanged Save must send zero PUT requests.

Current delivery-bundle evidence is retained at:

- `outputs/evidence/integration-prepublication/`: 59-test TAP, stderr and metadata.
- `outputs/evidence/core-ui/ui-results.json`: 12 core flows, timestamps and environment.
- `outputs/evidence/inactive-ui/results.json`: IUI01-04, before/after state, source hashes and screenshots.
- The final-commit run path, selected SHA and any clean-checkout/startup evidence:
  see `INTEGRATION_REVIEW.md` for the actual current result.

These top-level bundle outputs are separate from the source ZIP. Retained
`docs/a3/evidence/final-2026-10-11/` 54/12 logs belong to rc.1; their folder name
does not make them the final rc.2 result.

The earlier baseline was materialised from 29 verified GitHub blobs; its tree
matches `b29f71cb5d70968f5972ba26c0891f944b381c45`. That local snapshot and
rc.1 source-copy startup are not successful network-clone evidence. The
connector's branch-creation HTTP 403 and current authorised Git transport are
separate results; current actual remote publication is recorded in
INTEGRATION_REVIEW.md. Do not infer a member's successful checkout from AI
source-copy or script results.

## Retained rc.1 traceability and cases

The companion workbook retains the four concepts in the supplied examples:
scenarios, cases, traceability matrix and summary. Its case rows use the template's
14 columns. The examples' booking data are not project evidence. Every listed
case below is backed by executable assertions and a retained rc.1 result. The
PASS column is explicitly historical; current aggregate rc.2 runs are in the
table above. Jira links remain pending real team mapping, and local IDs are not
Jira issue keys.

| ID | Requirement | Test / expected behaviour | rc.1 historical result | Executable source |
|---|---|---|---|---|
| ASG01 | R03 | a volunteer is assigned to a role for a performance | PASS | test/assignments.test.js:14 |
| ASG02 | R03 | an assignment appears on the performance roster | PASS | test/assignments.test.js:29 |
| ASG03 | R03 | a role outside the crew call is refused | PASS | test/assignments.test.js:42 |
| ASG04 | R03 | THE ONE-ROLE RULE: a second role in the same performance is refused with a reason | PASS | test/assignments.test.js:54 |
| ASG05 | R03 | THE ONE-ROLE RULE: moving an assignment onto a performance the volunteer already works is refused | PASS | test/assignments.test.js:78 |
| ASG06 | R03 | replacing the volunteer on an assignment keeps the position filled by the new person | PASS | test/assignments.test.js:98 |
| ASG07 | R03 | removing an assignment opens the position rather than deleting it | PASS | test/assignments.test.js:113 |
| ASG08 | R03 | changing one assignment does not affect any other assignment | PASS | test/assignments.test.js:132 |
| ASG09 | R03 | an assignment can be confirmed | PASS | test/assignments.test.js:149 |
| PERSIST01 | R06 | PERSIST01 saved volunteers, performances and assignments survive reopening the database | PASS | test/persistence.test.js:10 |
| PROD01 | R02 | a production is created with a title | PASS | test/productions.test.js:14 |
| PROD02 | R02 | a production without a title is refused | PASS | test/productions.test.js:21 |
| PROD03 | R02 | performances are listed in date and time order | PASS | test/productions.test.js:27 |
| PROD04 | R02 | changing one performance leaves the others unaffected | PASS | test/productions.test.js:44 |
| PROD05 | R02 | removing a performance leaves the production and its other performances intact | PASS | test/productions.test.js:60 |
| PROD06 | R02 | an evening call has a bar; a matinee call does not | PASS | test/productions.test.js:75 |
| PROD07 | R02 | the crew call of one performance can be revised without touching another | PASS | test/productions.test.js:95 |
| ROST01 | R04 | the roster shows filled and open positions for every role in the call | PASS | test/roster.test.js:14 |
| ROST02 | R04 | the production roster covers every performance in date order | PASS | test/roster.test.js:30 |
| ROST03 | R04 | a volunteer sees their own assignments with production, date, time and role | PASS | test/roster.test.js:47 |
| ROST04 | R04 | a volunteer with no assignments gets an empty list rather than an error | PASS | test/roster.test.js:65 |
| UNAV01 | R05 | a volunteer can record a date range they cannot be rostered | PASS | test/unavailability.test.js:18 |
| UNAV02 | R05 | a range with startsOn after endsOn is refused | PASS | test/unavailability.test.js:36 |
| UNAV03 | R05 | a performance inside an unavailable range refuses the assignment with a reason | PASS | test/unavailability.test.js:47 |
| UNAV04 | R05 | the first and last day of the range are also refused (inclusive boundaries) | PASS | test/unavailability.test.js:66 |
| UNAV05 | R05 | a performance outside the range is accepted | PASS | test/unavailability.test.js:88 |
| UNAV06 | R05 | moving an assignment to an unavailable date is refused | PASS | test/unavailability.test.js:105 |
| UNAV07 | R05 | removing the recorded range allows the volunteer to be rostered again | PASS | test/unavailability.test.js:128 |
| VAL01 | R01 | VAL01 blank contact information is rejected on create | PASS | test/validation.test.js:7 |
| VAL02 | R01 | VAL02 an update cannot erase the volunteer name | PASS | test/validation.test.js:14 |
| VAL03 | R01 | VAL03 an update cannot erase the last contact method | PASS | test/validation.test.js:20 |
| VAL04 | R01 | VAL04 email only is a valid contact method | PASS | test/validation.test.js:26 |
| VAL05 | R02 | VAL05 impossible performance dates are rejected | PASS | test/validation.test.js:33 |
| VAL06 | R02 | VAL06 impossible performance times are rejected | PASS | test/validation.test.js:41 |
| VAL07 | R02 | VAL07 invalid dates on update preserve the old performance | PASS | test/validation.test.js:48 |
| VAL08 | R05 | VAL08 impossible unavailable dates are rejected | PASS | test/validation.test.js:54 |
| VAL09 | R05 | VAL09 real leap day is accepted and non leap day is rejected | PASS | test/validation.test.js:59 |
| VAL10 | R01 | VAL10 changing assignment to an inactive volunteer is rejected | PASS | test/validation.test.js:65 |
| VAL11 | R03 | VAL11 changing assignment to a role outside the call is rejected | PASS | test/validation.test.js:73 |
| VAL12 | R03 | VAL12 replacing a confirmed assignment requires a new confirmation | PASS | test/validation.test.js:80 |
| VAL13 | R03 | VAL13 a no change assignment update preserves confirmation | PASS | test/validation.test.js:88 |
| VAL14 | R02 | VAL14 nested performance operations cannot affect another production | PASS | test/validation.test.js:96 |
| VAL15 | R02 | VAL15 duplicate crew roles are rejected without losing the old crew call | PASS | test/validation.test.js:106 |
| VAL16 | R02 | VAL16 a crew call edit cannot silently hide existing assignments | PASS | test/validation.test.js:114 |
| VAL17 | R05 | VAL17 moving a performance to an unavailable date is rejected | PASS | test/validation.test.js:122 |
| VAL18 | R07 | VAL18 malformed JSON returns a client error | PASS | test/validation.test.js:129 |
| VAL19 | R02 | VAL19 rescheduling clears confirmation and preserves assignment identity | PASS | test/validation.test.js:135 |
| VAL20 | R02 | VAL20 unknown crew template is rejected without creating a performance | PASS | test/validation.test.js:144 |
| VOL01 | R01 | a volunteer can be added with name and contact details | PASS | test/volunteers.test.js:13 |
| VOL02 | R01 | a volunteer with no contact method is refused | PASS | test/volunteers.test.js:27 |
| VOL03 | R01 | a volunteer can be found again and listed | PASS | test/volunteers.test.js:34 |
| VOL04 | R01 | contact details can be updated | PASS | test/volunteers.test.js:44 |
| VOL05 | R01 | deactivating a volunteer keeps their historical assignments | PASS | test/volunteers.test.js:53 |
| VOL06 | R01 | an inactive volunteer cannot be rostered on a new assignment | PASS | test/volunteers.test.js:80 |

## Additional rc.2 review regressions

REV01-05 were added by independent AI technical review and are included in the
59-test prepublication suite. They strengthen state-preservation assertions;
they are not evidence that another real team member approved the PR.

| ID | Requirement | Assertions | Current technical result | Executable source |
|---|---|---|---|---|
| REV01 | R02, R04 | Exact evening 9-person and matinee 7-person crew calls; two Ushers; no matinee Bar; initial openings match counts | PASS in rc.2 prepublication run | test/review-regression.test.js:21 |
| REV02 | R03 | A refused same-volunteer conflict move preserves complete confirmed assignments in both performances | PASS in rc.2 prepublication run | test/review-regression.test.js:48 |
| REV03 | R01, R03, R05 | Replacements with occupied, inactive or unavailable volunteers refuse with a reason and preserve complete confirmed records | PASS in rc.2 prepublication run | test/review-regression.test.js:69 |
| REV04 | R02, R03, R05 | Unavailable reschedule refusal preserves dates, confirmations, both performance assignments and production roster | PASS in rc.2 prepublication run | test/review-regression.test.js:96 |
| REV05 | R01, R02, R03, R05, R06 | Reopening file storage preserves inactive history, availability, revised crew counts and confirmation; unavailable new assignment still refuses | PASS in rc.2 prepublication run | test/review-regression.test.js:124 |

The P1 UI defect was separate: the editor omitted the inactive current
volunteer, so an unchanged Save could select an active alternative. The rc.2
fix retains the current option and skips PUT for a no-op Save.

| ID | Requirement | Browser assertion | Current technical result |
|---|---|---|---|
| IUI01 | R01, R03, R07 | Inactive assignee remains selected with an active alternative; unchanged Save preserves complete confirmed history and sends zero PUTs | PASS |
| IUI02 | R01, R03, R07 | With no active volunteers, unchanged Save preserves complete confirmed assignment and sends zero PUTs | PASS |
| IUI03 | R03, R07 | Explicit active replacement succeeds with stable assignment ID and resets confirmation/notified flags | PASS |
| IUI04 | R01, R03, R07 | Inactive assignee role change refuses visibly with HTTP 400; full original assignment remains unchanged | PASS |

All four assertions are repeatable in `scripts/inactive-ui-regression.cjs`;
the original working-directory script was copied into the formal source tree
so the procedure no longer depends on an unpublished local helper.

`12 core + 4 inactive = 16` counts browser checks, not additional API tests or
independent human acceptance cases. Do not add the 59 and 16 counts and report
the total as full requirements coverage. Real coverage is the mapped AC and
its normal, refusal and state-preservation evidence.

## Limits and remaining acceptance work

No Docker execution, independent team-machine install, load/concurrency test,
production security assessment, full accessibility audit, Firefox/Safari run or
human UAT was performed. Source hashes and Git state in run-metadata.json
identify the application actually checked; a dirty prepublication working tree
must not be described as a clean final commit. Documentation added later does
not change tested runtime files. Review TECHNICAL_HANDOVER.md and
INTEGRATION_REVIEW.md before claiming technical readiness.

Atlassian connection returned USER_NOT_LOGGED_IN. Actual Jira mapping/state,
Confluence decisions/handover, another member's PR review, AC demonstrations
and lecturer/tutor 10-minute presentation plus 5-minute Q&A remain separate
completion gates. The candidate is not formally accepted merely because its
tests pass.
