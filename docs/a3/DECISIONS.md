# A3 technical decision record

> Current follow-up candidate: rc.3 (15 October 2026). See [RC3_REVIEW_AND_VALIDATION.md](RC3_REVIEW_AND_VALIDATION.md) for the role-response correction and new tests. The rc.2 execution records below retain their original dates and source identity.

Recorded 11 October 2026. Local decision IDs below are not Jira keys. These are
implemented technical choices or proposals based on source and actual checks,
not invented team meetings, approvals or client decisions. Confluence publication
and real issue links remain pending account connection.

| ID | Question and source | Alternatives and selected technical treatment | Reason, effect and verification | Approval / follow-up |
|---|---|---|---|---|
| D01 | Assignment PUT bypassed active-person and crew-call validation in A2 | Validate target volunteer, role and availability before any UPDATE; rely on UNIQUE for one-person/one-performance | Prevents accepted invalid updates and preserves records on refusal; VAL10-13 and REV02-03 | Implemented candidate; team PR review / Jira AC pending |
| D02 | Performance reschedule could put a rostered volunteer on an unavailable date | Reject conflicting change, or automatically delete/reassign duties; selected rejection with explanation | Retains existing date and duties; no destructive implicit resolution; VAL17, REV04 | Implemented; coordinator resolves conflicts first |
| D03 | Confirmations could refer to old person, duty or date/time | Keep old confirmation, or require a new confirmation; selected reset only for actual changes | Reflects the reply's scope; VAL12-13, VAL19; notification delivery is not implemented | Implemented; team should agree derived confirmation policy |
| D04 | Whole crew-call edits could erase calls or strand assigned roles | Validate unique names/counts, reject removing occupied roles, replace in transaction | Refusal preserves original calls and duties; VAL15-16 | Implemented; no capacity limit introduced |
| D05 | AI technical review reproduced inactive-history silent replacement | Disable editor entirely, allow explicit active replacement, or preserve current option and detect no-op; selected current option plus no-op guard | Preserves history and confirmation with zero PUT on unchanged Save; explicit active replacement remains available; IUI01-04 | Fixed rc.2; independent AI regression passed; human PR review pending |
| D06 | Local SQLite persistence is needed; earlier hosting forecast assumed a free persistent environment | Local file demo, container volume, or paid durable hosting; selected local Node 24 demo for this candidate | Case permits clean checkout; npm ci/start and file/process restart evidence are required; no hosting expenditure incurred | Technical preparation only; hosted budget/provider choice pending team verification |
| D07 | Crew counts may represent targets or hard capacity | Current code shows demand/open positions but permits overstaffing | Case template totals are 9/7; REV01 verifies exact roles/counts. Maximum-capacity enforcement was not stated as an explicit original AC | Existing behaviour; team confirmation required before changing policy; backlog |
| D08 | New unavailability may conflict with an existing assignment | Current behaviour retains existing duty; possible future warning/rejection/resolution workflow | No automatic cancellation; coordinator must resolve existing conflicts manually. New assignment/update/reschedule checks still apply | Known limitation, not a claim of complete availability consistency; backlog |
| D09 | Deactivation should preserve history but may leave future duties | Retain all existing assignments; reject new inactive assignments/replacements | Preserves original historical requirement; future reassignment is manual. REV05 and IUI checks verify preservation | Existing behaviour; team agree future-duty policy; backlog |
| D10 | Core scope versus stakeholder requests | Keep ticketing, renewals, skills/certificates, rehearsals, venues, hours, equipment, swaps and messaging outside this candidate | Aligns case exclusions and avoids unverified scope expansion; record real deferred Jira backlog entries after connection | Product backlog records pending; no invented story points or sprint history |
| D11 | Cross-production assignment movement | API supports target performance; editor lists current production only | Existing capability/limitation; do not claim complete UI movement coverage | Disclose and prioritise UI selector only if coordinator requires it |
| D12 | A3 integration and evidence provenance | Real team topic branch + actual PR; local source snapshot used only while transport was unavailable | Baseline's 29 Git blobs verified and local snapshot tree equals actual remote main tree. Connector ref creation returned 403; existing system proxy restores Git transport | See INTEGRATION_REVIEW.md for actual publication outcome; independent human review still required |

The student and team must verify these decisions against their real Jira stories
and record who approved each derived policy. Publishing this file in GitHub alone
does not meet the case's requirement to record decisions in Confluence.

## Ranked next-sprint proposals

1. Resolve conflicts when new unavailability overlaps existing duties, to avoid
   distributing a roster with unresolved availability information.
2. Add authentication and authorisation before any shared use with real contacts,
   because the current prototype permits all reachable readers/writers.
3. Agree and implement future-duty handling after volunteer deactivation, while
   preserving historical records.
4. Agree whether staffing counts are hard limits; implement and test only if
   approved, to prevent accidental capacity assumptions.
5. Add cross-production movement to the editor if coordination needs it; API
   support alone does not make the operation discoverable in the UI.
6. Rehearse stopped backup/restore and validate container persistence, to support
   a durable handover beyond the currently verified local path.
7. Test keyboard/screen-reader use and additional browsers, then capture real
   assessor/stakeholder feedback; automated Edge checks do not establish usability.
8. Add CI to the actual PR if the team chooses it, to repeat the automated suite
   on subsequent commits; no GitHub Actions result is claimed in this run.
