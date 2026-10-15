# Yujie Li PR #5 Review Evidence

Reviewed commit: f3397cccf46543590f4af82ecdf0e5236c56487c
Reviewer: Yujie Li (real team member)
Date: 2026-10-15
Environment: Windows x64, Chrome, clean checkout from ZIP

## Scenarios

| # | Scenario | Result |
|---|---|---|
| 1 | normal assignment + confirm | PASS |
| 2 | same volunteer second role rejected, original data unchanged | PASS |
| 3 | inactive volunteer unchanged save keeps history | PASS |
| 4 | switch performance and save correct role | PASS |
| 5 | My Schedule shows correct performance and role | PASS |

## Findings

All five scenarios behaved as expected. No blocking defects found in this review.

## Evidence

Screenshots stored in `docs/a3/reviews/yujie/`:

- [scenario1_assign_confirm.png](yujie/scenario1_assign_confirm.png)
- [scenario2_second_role_rejected.png](yujie/scenario2_second_role_rejected.png)
- [scenario3_inactive_unchanged_save.png](yujie/scenario3_inactive_unchanged_save.png)
- [scenario4_move_performance.png](yujie/scenario4_move_performance.png)
- [scenario5_my_schedule.png](yujie/scenario5_my_schedule.png)

## Evidence organisation correction - 16 October 2026

An AI assistant corrected the screenshot directory and links in the existing
PR #6 branch. The five image files are unchanged from SME152's original upload
at commit `8952745816c8be1a0664c68c1612bffdccb302da`, where they were stored under
the duplicated path `docs/a3/reviews/docs/a3/reviews/yujie/`.

The reviewer identity, reviewed application commit, execution date, environment,
scenario results and findings above retain Yujie Li's original statement. This
organisation correction records no new execution or review approval. Image
SHA-256 values and the original source links are in the [screenshot manifest](yujie/README.md).
