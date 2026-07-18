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

### Phase 3: Apply Recommendation To Sets
- When user accepts, update all incomplete sets for the active exercise to the recommended weight.
- Preserve completed sets.
- Persist the updated exercise logs.
- Show save/error state using existing workout save handling.

### Phase 4: Warning And Override Cleanup
- Keep the existing “Increase anyway?” guardrail.
- Make warning copy match the new progression state language.
- Ensure the guardrail does not conflict with accepting an official recommendation.

### Phase 5: Workout Summary Feedback Loop
- Surface useful badge/note prompts after completion:
  - `Felt easy` can support future increases.
  - `Felt hard` can recommend repeating.
  - `Improve form` can prevent increases.
  - `Pain` can suggest reducing or swapping.
- Keep the reflection optional.

### Phase 6: Trends And Dashboard Follow-Up
- Add future cards such as:
  - `3 exercises ready to progress`
  - `2 lifts should repeat weight`
  - `Bench Press stalled for 2 sessions`
- Keep this out of v1 unless the exercise-page experience is working well.

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
