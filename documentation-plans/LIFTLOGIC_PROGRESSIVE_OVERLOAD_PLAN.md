# LiftLogic Progressive Overload Guidance Plan

## Summary
Make progressive overload a visible, trusted part of the workout experience. When a user completes an exercise successfully, LiftLogic should remember that performance and recommend a smart next target the next time the exercise appears.

The app should not silently increase weight. LiftLogic should recommend the increase, explain why, and let the user accept, stay at the same weight, or adjust manually.

## Product Principle
Progression should feel earned, safe, and understandable.

LiftLogic should answer:

- What did I do last time?
- Did I complete the target?
- Should I increase, repeat, reduce, or modify?
- Why is the app recommending that?

## Progression States

### Ready To Increase
Use when:

- Every planned set was completed.
- Actual reps meet or exceed the target for each set.
- No caution badges are present.

Suggested user message:

```text
You completed every target rep last time. Try 5 lb more today.
```

### Repeat Weight
Use when:

- All sets were completed, but the user marked `felt_hard` or `form_issue`.
- The workout was technically completed but should not automatically progress.

Suggested user message:

```text
You finished the work, but this was marked hard or form-limited. Repeat this weight and make it cleaner.
```

### Hold Steady
Use when:

- The user missed reps.
- The user did not complete every set.
- The exercise has a `missed_reps` badge.

Suggested user message:

```text
Stay at this weight until you complete all planned sets and reps.
```

### Reduce Or Modify
Use when:

- The exercise has a `pain` badge.
- Pain appears repeatedly in recent logs.

Suggested user message:

```text
This movement was marked with pain. Consider reducing load or swapping the exercise.
```

## Weight Increase Rules

Use the existing user weight-step settings instead of hardcoding `5 lb`.

Initial v1 defaults:

- Barbell: use barbell step.
- Dumbbell: use dumbbell step.
- Machine: use machine step.
- Cable: use cable step.
- Other weighted movements: use default step.

Special handling:

- Bodyweight exercises should not automatically suggest adding external load in v1.
- Timed, distance, and conditioning exercises should show a progression note but avoid weight increases in v1.
- If the previous exercise used `kg`, use the user's configured kg step.

## UX Flow

### Before Exercise Starts
On the workout exercise page, show a compact progression recommendation card above the set controls.

Examples:

```text
Ready to increase
Last time: 75 lb x 12, 12, 12
Today: try 80 lb
```

Actions:

- `Use recommendation`
- `Stay at previous weight`
- existing manual steppers remain available

### If User Attempts To Increase Too Early
Keep the existing warning pattern:

```text
You have not completed all target sets and reps at this weight yet.
```

Actions:

- `Stay at current weight`
- `Increase anyway`

### After Exercise Completion
When all sets are completed, mark the exercise as eligible for a future recommendation if it qualifies.

This does not need a separate database flag in v1 because it can be derived from workout history.

## Data Strategy

### V1: Derived Recommendations
Do not add a stored `readyToProgress` field yet.

Derive recommendation state from:

- most recent prior completed log for the same `exerciseId`
- completed set count
- actual reps vs target reps
- previous weight
- exercise badges
- workout badges if needed later

This keeps the feature flexible and avoids stale recommendation flags.

### Future: Stored Recommendation Outcomes
Later, consider storing recommendation outcomes when the user accepts or rejects a recommendation:

```ts
type ProgressionDecision =
  | "accepted_increase"
  | "stayed_same"
  | "manual_adjustment"
  | "reduced_load"
  | "swapped_exercise";
```

This would help the app learn user behavior over time.

## Implementation Phases

### Phase 1: Progression Utility
- Create a shared/client utility that evaluates the most recent prior exercise log.
- Return a structured recommendation:
  - `state`
  - `previousWeight`
  - `recommendedWeight`
  - `weightUnit`
  - `reason`
  - `canApplyWeight`
- Add tests for:
  - completed all reps -> ready to increase
  - missed reps -> hold steady
  - felt hard -> repeat weight
  - form issue -> repeat weight
  - pain -> reduce or modify
  - bodyweight/timed exercise -> no weight increase

### Phase 2: Exercise Page Recommendation Card
- Add a compact card to `WorkoutExercise.tsx`.
- Show prior performance and recommendation state.
- Add `Use recommendation` action when a weight increase can be applied.
- Add `Stay here` action to dismiss or keep current values.
- Preserve manual weight/reps controls.

Phase 2 notes:
- Added a reusable `ProgressionRecommendationCard` for the workout exercise page.
- The card now explains `Ready to increase`, `Repeat this weight`, `Hold steady`, and `Reduce or modify` states using the Phase 1 recommendation utility.
- The card appears above the set controls and can be dismissed with `Stay here`.
- The component supports a future `Use recommendation` action, but Phase 2 does not apply suggested weights yet; that remains Phase 3.
- Manual weight and rep controls remain unchanged.
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 3: Apply Recommendation To Sets
- When user accepts, update all incomplete sets for the active exercise to the recommended weight.
- Preserve completed sets.
- Persist the updated exercise logs.
- Show save/error state using existing workout save handling.

Phase 3 notes:
- Wired the recommendation card's `Use recommendation` action into the workout exercise page.
- Accepting a recommendation updates only incomplete sets for the active exercise.
- Completed sets are preserved exactly as logged.
- Recommended weights persist through the existing `updateWorkoutSession` draft-save flow.
- The recommendation card shows existing button loading feedback while saving.
- The card hides after a successful apply and also stays out of the way once all sets are completed.
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 4: Warning And Override Cleanup
- Keep the existing “Increase anyway?” guardrail.
- Make warning copy match the new progression state language.
- Ensure the guardrail does not conflict with accepting an official recommendation.

Phase 4 notes:
- Updated the manual weight-increase warning copy to use the same progression language as the recommendation card.
- The warning now frames the decision as a `Progression check` instead of a generic confirmation popup.
- The sheet shows the requested jump, then explains that the user can still override LiftLogic.
- Refined the guardrail logic so an earned recommendation can be accepted without a warning.
- Added protection against immediately jumping again before completing the newly accepted recommendation weight.
- Added advisory tests for:
  - allowing an earned first increase from prior completed history
  - warning when trying to jump again before completing the accepted recommendation
- Verification passed:
  - `npm test -- workoutAdvisory`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 5: Workout Summary Feedback Loop
- Surface useful badge/note prompts after completion:
  - `Felt easy` can support future increases.
  - `Felt hard` can recommend repeating.
  - `Improve form` can prevent increases.
  - `Pain` can suggest reducing or swapping.
- Keep the reflection optional.

Phase 5 notes:
- Kept the overall workout reflection optional on the summary page.
- Added per-exercise `Add progression feedback` / `Edit progression feedback` actions to the workout summary exercise log.
- Exercise feedback saves directly to each `WorkoutExerciseLog` as `notes` and `badgeIds`.
- These exercise-level badges feed the existing progressive overload recommendation logic:
  - `felt_hard` and `form_issue` recommend repeating the weight.
  - `missed_reps` recommends holding steady.
  - `pain` recommends reducing or modifying the movement.
- Workout-level tags remain available for overall session context, but the UI now clarifies that exercise-specific tags are added from each movement.
- Badge buttons now show their descriptions so users understand what each signal means.
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 6: Trends And Dashboard Follow-Up
- Add future cards such as:
  - `3 exercises ready to progress`
  - `2 lifts should repeat weight`
  - `Bench Press stalled for 2 sessions`
- Keep this out of v1 unless the exercise-page experience is working well.

Phase 6 notes:
- Added a `buildProgressionSummary` utility that derives high-level progression signals from completed workout history.
- The summary uses each exercise's latest completed log in the trend window.
- Added a Trends page `Next workout signals` panel with counts for:
  - Ready to progress
  - Repeat weight
  - Hold steady
  - Modify
- Each card shows up to three example exercises so the counts have useful context.
- The summary uses the same signal rules as the exercise-page advisory flow:
  - completed target with no caution badges -> ready
  - `felt_hard` / `form_issue` -> repeat
  - `missed_reps` or incomplete target -> hold
  - `pain` -> modify
- Added focused tests for grouping signals and choosing the latest completed log.
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test -- progressionSummary`
  - `npm test`
  - `npm run build`

### Phase 7: Final Integration And Drift Cleanup
- Centralize progression-state rules so exercise-page recommendations and Trends summaries cannot drift apart.
- Keep the final implementation derived from logs rather than adding stored recommendation flags.
- Run the full verification suite after the shared-rule refactor.

Phase 7 notes:
- Added `ActionableProgressiveOverloadState` and `getCompletedExerciseProgressionState` to `workoutAdvisory`.
- Refactored `getProgressiveOverloadRecommendation` to use the shared completed-exercise progression state.
- Refactored `buildProgressionSummary` to use the same shared state helper instead of duplicating badge and target-rep logic.
- This keeps the workout exercise page, workout summary feedback loop, and Trends progression panel aligned around one rule source.
- Verification passed:
  - `npm test -- workoutAdvisory progressionSummary`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

## Test Plan
- Completed all target sets and reps shows `Ready to increase`.
- Missing any set or rep shows `Hold steady`.
- `felt_hard` or `form_issue` shows `Repeat weight`.
- `pain` shows `Reduce or modify`.
- Accepting a recommendation updates incomplete set weights only.
- Manual steppers still work.
- Existing increase warning still appears when trying to jump early.
- Build and test:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

## Assumptions
- Recommendations should be visible before changing the user's workout values.
- Users should always be able to override LiftLogic.
- V1 should derive recommendations from logs instead of storing flags.
- Actual rest-time logging remains a separate future feature.

## Phase 1 Execution Notes
- Added `getProgressiveOverloadRecommendation` to the workout advisory utility.
- The utility derives recommendation state from the most recent prior completed log for the same exercise.
- Supported recommendation states:
  - `no_history`
  - `ready_to_increase`
  - `repeat_weight`
  - `hold_steady`
  - `reduce_or_modify`
- The utility returns `previousWeight`, `recommendedWeight`, `weightUnit`, `reason`, and `canApplyWeight`.
- Weight increases use the caller-provided weight step instead of a hardcoded value.
- Unweighted/bodyweight-style logs can still be marked `ready_to_increase`, but `canApplyWeight` stays false so the UI can recommend non-load progression instead.
- Added tests for completed targets, missed reps, hard/form badges, pain, and unweighted logs.
- Verified with `npm test -- workoutAdvisory`, `npm --prefix client run lint`, `npm test`, and `npm run build`.
