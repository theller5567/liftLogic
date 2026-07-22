# LiftLogic Load Feasibility Engine Plan

## Summary
Add a reusable load feasibility engine that checks whether a prescribed weight is realistic for a specific set and rep scheme. This should not replace LiftLogic's safer first-week starting-weight logic. Instead, it should become a validator and coaching layer that helps the app catch loads that are too aggressive when users edit weights, switch programs, review workouts, or receive progression guidance.

The core product idea:

> Starting weights should be conservative enough to earn progression. Feasibility checks should protect users whenever a weight is being assigned, edited, reused, or increased.

## Why This Matters
LiftLogic is built around progressive overload and detailed workout logging. That means the app needs to do more than suggest a starting weight once. It should continuously ask:

- Is this weight realistic for the prescribed reps and sets?
- Is this load appropriate after fatigue from earlier exercises?
- Did the user prove this load was manageable last time?
- If the user switches to a new program, does the old weight still make sense for the new rep scheme?
- If a user manually edits a weight upward, should LiftLogic warn them before they start?

The attached feasibility predictor is useful because it frames weight selection as a capacity check:

1. Estimate strength ceiling from known performance.
2. Convert that ceiling into the target rep range.
3. De-load for multi-set fatigue.
4. Compare the assigned weight against the feasible range.
5. Return a status the UI can explain clearly.

## Important Decision
Do not replace the current starting-weight algorithm.

LiftLogic already uses a safer version of this logic during onboarding:

- Epley estimated 1RM from user-provided anchors.
- Inverse Epley conversion for the prescription's top rep target.
- Multi-set reserve:
  - `4+ sets`: `0.84`
  - `3 sets`: `0.88`
  - `2 sets`: `0.92`
- First-week confidence buffer:
  - high confidence: `0.95`
  - medium confidence: `0.90`
  - low confidence: `0.85`
- Existing rounding and minimums.
- Same-workout pressing fatigue caps.

The external predictor uses a lighter fatigue reduction of `1.5%` per set after the first. That is useful for feasibility scoring, but less conservative than LiftLogic's first-week onboarding cap. The app should keep the safer onboarding cap and use feasibility checks as a broader validation layer.

## Product Principles
- Feasibility is coaching, not punishment.
- The app should warn before a user wastes a set on a clearly unrealistic load.
- Warnings should explain the reason in plain language.
- Users can override warnings, but LiftLogic should remember that context.
- Feasibility should respect the exact prescription, not only the exercise name.
- Recent actual workout performance should become more trusted than onboarding estimates over time.
- The system should work quietly in the background until it has something useful to say.

## Core Feasibility Model

### Inputs
The engine should accept:

- `assignedWeight`
- `weightUnit`
- `sets`
- `targetReps`
- optional `targetRepRange`
- `exerciseId`
- optional `canonicalEstimatorKey`
- equipment rounding increment
- user capacity source:
  - onboarding anchor
  - latest clean completed workout
  - best recent estimated 1RM
  - accepted manual weight
  - fallback default
- context:
  - exercise index in workout
  - previous exercises in same day
  - confidence level
  - experience level
  - whether the exercise is new to the user

### Outputs
Return a structured result:

```ts
type LoadFeasibilityStatus =
  | "safe"
  | "challenging"
  | "limit"
  | "too_heavy"
  | "unknown";

type LoadFeasibilityResult = {
  status: LoadFeasibilityStatus;
  assignedWeight?: number;
  feasibleWeight?: number;
  feasibilityRatio?: number;
  suggestedWeight?: number;
  reason: string;
  source: "onboarding" | "recent_performance" | "manual" | "default" | "unknown";
  confidence: "high" | "medium" | "low";
};
```

### Initial Math
Use shared helpers:

```ts
estimatedOneRepMax = weight * (1 + reps / 30)
singleSetCapacity = estimatedOneRepMax / (1 + targetReps / 30)
```

For feasibility scoring, use a lighter fatigue model than first-week onboarding:

```ts
fatigueMultiplier = 1 - ((sets - 1) * 0.015)
volumeAdjustedCapacity = singleSetCapacity * fatigueMultiplier
```

Then apply context:

- New exercise buffer: `0.95`
- Low confidence buffer: `0.95`
- Repeat compound pressing fatigue:
  - first compound press: `1.00`
  - second compound press: `0.95`
  - third or later compound press: `0.90`
- Beginner or returning-user buffer can be added later if needed.

### Suggested Status Thresholds
Use the feasibility ratio:

```ts
feasibilityRatio = assignedWeight / feasibleWeight
```

Recommended v1 thresholds:

- `safe`: `<= 0.92`
- `challenging`: `> 0.92 && <= 1.00`
- `limit`: `> 1.00 && <= 1.05`
- `too_heavy`: `> 1.05`
- `unknown`: missing reliable capacity data

Copy examples:

- Safe: `This load fits the target volume.`
- Challenging: `This is close to your estimated capacity for this rep target.`
- Limit: `This may be at your limit for all planned sets.`
- Too heavy: `This looks too heavy for the planned sets and reps. Consider reducing before you start.`
- Unknown: `Not enough history yet. Choose a load you can control.`

## User Flow Integration

### 1. Onboarding And Plan Generation
Current behavior should remain the source of initial starting weights.

Add feasibility as a post-generation audit:

- After preview generation, run feasibility against exercises with onboarding-derived or derived weights.
- If a generated weight is `limit` or `too_heavy`, cap it or attach a warning note.
- Keep the existing first-week conservative cap as the primary protection.
- Add tests to prove the audit does not raise weights.

User-facing effect:

- The user sees fewer accidentally aggressive suggestions.
- Plan notes become clearer when a weight is deliberately capped.

### 2. Workout Review Page
Use feasibility when the user edits starting weights before accepting the plan.

Behavior:

- When a user edits a weight, show a compact status:
  - `Looks manageable`
  - `Close to your limit`
  - `Likely too heavy for this prescription`
- If a user enters a `too_heavy` weight, show a warning panel with:
  - assigned weight
  - suggested feasible weight
  - reason
  - `Use suggested weight`
  - `Keep my weight`

Why this is valuable:

- Workout Review is the user's first chance to correct bad loads.
- It prevents a user from accidentally approving an unrealistic program.

### 3. Active Workout Exercise Page
Use feasibility before and during logging.

Behavior:

- Show a quiet feasibility note near the progression recommendation card when the current load is challenging or higher.
- If the user manually increases a load into `limit` or `too_heavy`, reuse the existing guardrail bottom sheet.
- If the user misses early sets badly, show a contextual suggestion:
  - `Drop remaining sets to 155 lb`
  - `Keep current weight`
  - `Adjust manually`

Important:

- Do not interrupt every set.
- Only warn when the assigned or edited load is meaningfully above feasible capacity.

### 4. Adjust Load Bottom Sheet
Upgrade the existing adjust-load workflow with feasibility context.

Add:

- recommended feasible weight
- reason text
- status badge
- `Use feasible weight`
- `Drop one step`
- `Keep current load`

Example:

```text
185 lb looks high for 4 sets of 12 based on your recent bench performance.
Suggested: 145 lb
```

This is the most natural place to make messages actionable.

### 5. Progressive Overload Guidance
Use feasibility as a safety check before suggesting an increase.

Behavior:

- If progression says `ready_to_increase`, check whether the recommended heavier load is still feasible for the prescription.
- If feasible, keep the normal increase recommendation.
- If near limit, suggest a smaller increase or repeat the current load.
- If too heavy, do not recommend the increase.

This prevents the app from saying:

```text
Try 5 lb more today.
```

when the full prescription would likely fail.

### 6. Drop Load Or Modify Messages
Use feasibility to make warning messages more specific.

Current warning:

```text
Drop the load or modify
```

Improved warning:

```text
Bench Press looks above your estimated 4x12 capacity. Try 145 lb or adjust before your next set.
```

This makes message actions feel smarter and less generic.

### 7. Program Switching
When a user switches programs, run feasibility checks against the new prescriptions.

Examples:

- A weight that worked for `3x5` may not work for `4x12`.
- A weight that worked as the first exercise may be too high as the third press of the day.
- Dumbbell-derived press weights should be recalculated if the new day has multiple chest presses.

Behavior:

- On program switch preview, flag exercises whose carried-over loads are `limit` or `too_heavy`.
- Offer:
  - `Use LiftLogic suggested loads`
  - `Keep my existing loads`
  - `Review flagged exercises`

### 8. Trends And Education
Use feasibility to explain patterns.

Examples:

- If a user repeatedly misses reps at weights above feasible capacity:
  - show a trend message explaining that the load is likely too aggressive.
- If a user completes several workouts below capacity:
  - progression messages can be more confident.

Do not overdo this in v1. Trends should summarize, not lecture.

## Data Strategy

### Capacity Sources In Priority Order
1. Latest clean completed log for the same exercise and prescription family.
2. Recent best estimated 1RM for the same exercise.
3. Onboarding anchor for the same canonical estimator key.
4. Derived anchor from a related exercise.
5. Default starting weight.

### Clean Log Definition
A log is clean when:

- required sets were completed
- targets were met or nearly met depending on context
- no pain badge
- no form issue badge
- no load-too-high signal

### Do Not Store Feasibility Results Yet
In v1, calculate feasibility from current data.

Consider storing later:

```ts
type LoadFeasibilitySnapshot = {
  exerciseId: string;
  prescription: {
    sets: number;
    reps: string;
  };
  assignedWeight: number;
  feasibleWeight: number;
  status: LoadFeasibilityStatus;
  source: LoadFeasibilityResult["source"];
  createdAt: string;
};
```

Only store if we need audit trails, analytics, or cross-device explanation history.

## Implementation Phases

## Phase 1: Shared Feasibility Utility

### Goal
Create a reusable engine that can evaluate a weight against a set/rep prescription.

### Tasks
- Add shared math helpers:
  - `estimateOneRepMax`
  - `getSingleSetCapacity`
  - `getVolumeAdjustedCapacity`
  - `getLoadFeasibility`
- Reuse existing rounding and weight-unit rules.
- Parse prescription reps using existing rep parsing helpers or move parsing into shared code.
- Add tests for:
  - `175 1RM`, `4x12`, assigned `125` => too high or limit depending threshold
  - `175 1RM`, `4x12`, assigned `120` => challenging/limit
  - missing capacity => unknown
  - kg rounding
  - new exercise buffer

### Done When
- Feasibility can be calculated without React components.
- Tests prove the math is stable.

### Phase Notes
- Completed Phase 1.
- Added `shared/utils/loadFeasibility.ts` with Epley 1RM estimation, inverse Epley single-set capacity, volume-adjusted capacity using a 1.5% fatigue reduction per additional set, prescription top-rep parsing, and structured feasibility statuses.
- Reused existing unit/equipment rounding and minimum-weight rules so feasibility suggestions match the rest of LiftLogic.
- Added focused coverage for 175 lb 1RM / 4x12 examples, unknown capacity, kg rounding, new-exercise and low-confidence buffers, and rep-range parsing.

## Phase 2: Capacity Source Resolver

### Goal
Teach the feasibility engine where user capacity comes from.

### Tasks
- Add resolver for:
  - onboarding anchors
  - recent clean exercise logs
  - recent estimated 1RM
  - derived exercise anchors
- Return source metadata and confidence.
- Prefer recent clean performance over onboarding estimates.
- Add tests for source priority.

### Done When
- The app can explain whether a feasibility result came from onboarding, recent performance, or fallback data.

### Phase Notes
- Completed Phase 2.
- Added `shared/utils/loadFeasibilityCapacity.ts` to resolve the best available capacity source for an exercise.
- Source priority is now explicit: recent clean completed performance, direct onboarding anchor, derived onboarding anchor, default estimate, then unknown.
- Resolver returns source metadata, confidence, canonical estimator key, derived-source info, and plain-language reason text for future UI explanations.
- Added tests proving source priority, ignored dirty/incomplete logs, derived onboarding anchors, default fallback, and unknown fallback behavior.

## Phase 3: Workout Review Feasibility Badges

### Goal
Warn users about unrealistic edited starting weights before they accept a plan.

### Tasks
- Run feasibility for visible review exercises.
- Add status badges to edited/weighted exercises.
- Add a warning panel for `too_heavy` edits.
- Add `Use suggested weight` action.
- Keep manual override available.

### Done When
- Users can identify and fix unrealistic starting weights during review.

### Phase Notes
- Completed Phase 3.
- Workout review cards now calculate feasibility for visible weighted exercises and show compact status badges: manageable, challenging, near limit, or too heavy.
- Weight-edit bottom sheets now re-check the draft weight as the user steps it up or down.
- Limit and too-heavy drafts show an inline warning with the suggested feasible weight and a `Use suggested weight` action.
- Manual override remains available because users can still save the entered weight.

## Phase 4: Active Workout Guardrails

### Goal
Warn users when active workout loads are likely too heavy for the current prescription.

### Tasks
- Add feasibility checks to `WorkoutExercise`.
- Show non-blocking status text for challenging loads.
- Trigger a bottom sheet for manual edits into `too_heavy`.
- Add a recommendation to reduce remaining sets after severe early misses.

### Done When
- The app can prevent or recover from obviously unrealistic active workout loads.

### Phase Notes
- Completed Phase 4.
- `WorkoutExercise` now checks the current target load against feasibility using recent workout history or default capacity when history is missing.
- Challenging, near-limit, and too-heavy active loads show a non-blocking load-check card with an adjust-load action.
- Manual stepper increases into `too_heavy` now open a confirmation bottom sheet with a safer suggested load and an override option.
- Early severe rep misses during an exercise now recommend dropping remaining sets through the existing adjustment sheet.

## Phase 5: Adjust Load Bottom Sheet Upgrade

### Goal
Make the adjust-load workflow smarter and more specific.

### Tasks
- Show feasibility status in the adjustment sheet.
- Add suggested feasible weight.
- Add `Use feasible weight` action.
- Keep existing `drop one step` and manual adjustment behavior.

### Done When
- Message actions and exercise-page warnings lead to a concrete safer load.

### Phase Notes
- Completed Phase 5.
- The adjust-load bottom sheet now shows the current feasibility status, reason text, and feasible target when available.
- Added a dedicated `Use feasible weight` action so load-check messages and active workout warnings lead to the safest calculated target.
- Kept a separate `Drop one step` action for quick manual reduction without replacing the user's ability to keep or manually adjust load from the set controls.

## Phase 6: Progression Recommendation Safety Check

### Goal
Prevent LiftLogic from recommending increases that exceed feasible volume.

### Tasks
- Check recommended progression weights with feasibility.
- If recommended increase is too aggressive, suggest smaller increase or repeat.
- Add tests for:
  - normal earned increase remains
  - near-limit increase becomes smaller
  - too-heavy increase becomes repeat/hold

### Done When
- Progressive overload stays ambitious but realistic.

### Phase Notes
- Completed Phase 6.
- Progressive overload recommendations now run earned increases through the load feasibility engine before suggesting them.
- Normal earned increases still remain intact.
- Oversized jumps are reduced to a smaller feasible increase when possible.
- Jumps that still look too heavy become repeat-weight recommendations instead of unsafe increases.
- Added tests for normal increases, reduced increases, and too-heavy repeat recommendations.

## Phase 7: Message System Integration

### Goal
Use feasibility results to make coaching messages more actionable.

### Tasks
- Add feasibility context to `Drop the load or modify` messages.
- Include suggested weight when a reliable feasible weight exists.
- Keep message copy short.
- Route action buttons to the upgraded adjust-load sheet.

### Done When
- Load warning messages explain what to change, not just that something is wrong.

### Phase Notes
- Completed in Phase 7. `Drop the load or modify` messages now include a
  feasible target when prior clean history supports one, and exercise message
  actions carry an explicit flag to open the adjust-load sheet.

## Phase 8: Program Switch Feasibility Audit

### Goal
Protect users when existing exercise history is reused under a new program prescription.

### Tasks
- Run feasibility audit during program switch/review.
- Flag carried-over weights that no longer match the new prescription.
- Add review flow for flagged exercises.
- Add tests for `3x5` to `4x12` transitions.

### Done When
- Program switching does not silently carry unrealistic loads into a new plan.

### Phase Notes
- Completed in Phase 8. Workout review now loads completed workout history and
  audits the preview against the new prescription, surfacing a review callout
  when prior strength loads look risky for the new set/rep scheme.

## Phase 9: Trends And Pattern Insights

### Goal
Use feasibility to explain repeated missed targets and load-too-high patterns.

### Tasks
- Detect repeated misses at weights above feasible capacity.
- Add a concise training pattern message.
- Avoid duplicate messages with existing missed-target warnings.
- Add tests for message lifecycle/fingerprint behavior.

### Done When
- Trends can distinguish effort problems from load-selection problems.

### Phase Notes
- Completed in Phase 9. Trends/recovery messages now detect repeated missed
  targets at loads above feasible capacity, explain the pattern as a load
  selection issue, and suppress the generic missed-target warning for the same
  exercises.

## Phase 10: Test And Polish

### Goal
Validate the feasibility engine across real user flows.

### Test Plan
- Onboarding-generated weights remain conservative.
- Review edits show feasibility status.
- Active workout manual increases warn when too heavy.
- Adjust-load sheet can apply feasible weight.
- Progression does not suggest unrealistic jumps.
- Program switches flag loads that no longer fit.
- Existing message lifecycle behavior still works.

### Commands
```bash
npm --prefix client run lint
npm test
npm run build
```

### Done When
- All tests pass.
- The plan has phase notes.
- The user-facing flow feels helpful, not noisy.

### Phase Notes
- Completed in Phase 10. Verified the full load feasibility flow after the
  final polish pass: onboarding/review feasibility, active workout warnings,
  adjust-load guidance, progression safety checks, program-switch audits, and
  message lifecycle behavior are covered by the current test suite.
- Validation passed with `npm --prefix client run lint`, `npm test`, and
  `npm run build`.
