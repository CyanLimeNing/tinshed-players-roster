# rc.3 assignment-editor review follow-up

Recorded 15 October 2026. Candidate 1.2.0-rc.3 is a technical review
candidate, not a merged release or another real member's approval.

## Reproduced issue

Independent AI technical review of rc.2 commit 9cb38a0141d8c84109f0dfb0e7865a29779acc14
found a P2 response-order problem in the assignment editor. Selecting P2,
then P3, choosing Usher after P3 loaded and finally receiving P2's older
response could replace the role choices and reset the selected duty. Saving
could write P3/Stage Manager rather than the selected P3/Usher. The server
accepted that valid-but-unintended role.

The reproduction executed actual client code with controlled role-response
ordering and a real isolated Express/SQLite API. It was an AI function-level
test, not a rendered-browser or real-member review claim.

## Correction

- Apply role results only for the latest request and still-selected performance.
- Disable Role and Save while the current role request is pending or failed.
- Guard the save callback as well as the visible button.
- Permit recovery by reselecting a performance. Obsolete successes and
  failures cannot replace the current options, selection or error state.
- Keep the inactive historical assignee and unchanged-Save protections.

No runtime dependency, database schema, business rule or paid service changed.
The optional editor blocking callback defaults to the earlier behaviour for
other editors. Network failures are reported by the current role request;
obsolete requests do not overwrite the current banner.

## Regression and final validation

`npm test` now includes 59 earlier API/persistence tests and two client-state
tests: UIROLE01 checks out-of-order success and the actual saved duty;
UIROLE02 checks pending/failed Save blocking, record preservation, stale
failures and recovery. Both run actual helper/editor/assignment code with a
minimal DOM model and a real isolated API. They do not replace browser tests.

Run `node --test test/ui-role-loading.test.js` for the focused regression.
Record final commit, full-suite output, clean-checkout scope, process restart
and actual browser results separately under `outputs/evidence/member-checks-2026-10-15/`.
The exact current PR head must be read back after publication. Earlier rc.2
59-test/16-UI and later 14 October 25-UI records keep their original source
identity and dates; they are historical evidence, not rc.3 executions.

## Review and course boundaries

This follow-up is AI-assisted technical work. Another actual group member
must still complete the course-required PR review and record real findings.
Team policy confirmation and lecturer/tutor formal acceptance are separate.
No historical meeting, sprint or project-manager rotation is inferred.
