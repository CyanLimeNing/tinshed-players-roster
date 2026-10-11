# Technical demonstration segment — approximately 3 minutes

Use fictional demo data and practise this as your portion of the team's talk.
This is a technical run sheet, not a completed presentation, human UAT or final
report text. The formal A3 Brief requires the complete team presentation to
last 10 minutes, followed by 5 minutes of Q&A for lecturer/tutor acceptance.
This three-minute segment is only a suggested technical allocation within that
team presentation, not the official total duration.

Use candidate 1.2.0-rc.2 and the exact selected commit recorded in
INTEGRATION_REVIEW.md. Follow README startup; do not present the remote A2 main
as rc.2. Retained rc.1 54/12 logs are historical, not current evidence.

| Time | Action | Point to explain |
|---|---|---|
| 0:00-0:30 | Open the local app. Show a production with two performances and the per-performance crew calls. | A2 supplied the core roster; this candidate adds controls and validation. |
| 0:30-1:10 | Assign Demo Alice to Stage Manager. Try assigning Alice to Lighting Operator in the same performance. | The second role is refused with a visible reason. One-role is also a database constraint. |
| 1:10-1:40 | Confirm the first assignment, replace Alice with Demo Bob, then move it to the second performance. | Actual changes return to unconfirmed; moves also check conflicts. |
| 1:40-2:00 | Open an inactive volunteer's existing assignment, leave all values unchanged and Save. | Current inactive person stays selected; no-op Save preserves history and sends no PUT. Explicit changes still undergo API checks. |
| 2:00-2:20 | Open My Schedule for Bob, then the all-performance overview. | Schedule and roster reflect the change. The selector has no private account enforcement. |
| 2:20-2:45 | Show the current 59-test TAP and 12 core plus four inactive browser results; identify their run date/version. | These are AI technical checks. Distinguish prepublication working tree from final selected commit; refer to integration review. |
| 2:45-3:00 | Show README defaults, known limits and real PR/Jira/Confluence status. | Local SQLite, locked dependencies and limitations; member review, truthful tool records and lecturer/tutor acceptance are separate evidence. |

If asked about recovery: stop the server, copy the data directory, and restore a
stopped backup only after preserving current records. The automated persistence
test closes/reopens the database; it is not a complete human restore rehearsal.

If asked about procurement: this change introduces no runtime package or paid
service and makes no purchase. An A2 budget is a forecast unless actual invoices
or costs are available. If asked about availability enforcement: API logic checks
dates; the database one-role constraint is a different rule.

If asked about release or team review, show the actual objects recorded in
INTEGRATION_REVIEW.md. A connector 403, an AI review, local draft text or a
proposed branch name is not a real PR approval. State pending items accurately;
do not invent Jira keys, Confluence pages, past PM rotations or acceptance.
