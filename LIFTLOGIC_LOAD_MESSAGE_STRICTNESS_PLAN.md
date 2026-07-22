# LiftLogic Load Message Strictness Plan

## Summary

Refine LiftLogic's load-reduction coaching so users do not see discouraging or stale `Drop the load or modify` messages too early. The app should distinguish normal fatigue while adapting to a new load from true evidence that the prescribed weight is too high.

## Issues To Fix

### 1. Stale New-Plan Messages

After redoing onboarding or switching programs, users can still see `Drop the load or modify` messages from the previous program before completing any workouts in the new plan.

Expected behavior:
- A new plan should start with clean current-program coaching.
- Old load warnings should not appear as active guidance for the new plan.
- Historical warnings may still appear in all-time history views, but not as immediate current-plan actions.

### 2. Load Reduction Messages Are Too Sensitive

Some normal fatigue patterns are currently treated as a load-too-high problem.

Example:

```text
Prescription: 3 sets of 8-12 reps
Actual:       12, 9, 6
```

This should not trigger `Drop the load or modify`. A trainer would likely read this as a user adjusting to a new weight: strong first set, acceptable second set, fatigue drop on the final set. The better recommendation is to repeat the load and build toward all sets in range.

### 3. Feasibility Warnings Show Too Early

After onboarding, the user can see warning labels on the workout review screen before doing any workout in the new plan. The feasibility engine should first help create manageable starting weights, not immediately present the user with warnings.

## Phase 1: Scope Messages To The Active Program

### Goal
Prevent old-plan load warnings from appearing as new-plan coaching.

### Tasks
- Scope `Drop the load or modify` messages to the active program history by default.
- Do not show load-reduction messages for a new program until the user has completed at least one workout in that program.
- Keep previous program data available in all-time Trends, but do not treat it as current coaching.
- Make sure redo-onboarding and manual program-switch flows reset current-plan load messages.

### Done When
- A user can switch plans and see no immediate `Drop the load or modify` message before completing a workout in the new plan.

### Phase Notes
- Completed in Phase 1. Current-program coaching now scopes progression
  messages to current-program sessions when an active program scope is present,
  and Trends passes that scope while the user is viewing current-program data.
- Added coverage to ensure archived load-too-high sessions do not create a
  current-program `Drop the load or modify` message after a program switch.

## Phase 2: Make Drop/Modify Logic Stricter

### Goal
Only tell users to reduce or modify when the failure pattern is strong enough.

### Do Not Trigger Drop/Modify When
- Most sets are inside the prescribed rep range.
- The user hits the top target on one set and fades later.
- Only the final set drops below the minimum.
- The pattern looks like normal adaptation to a new load.

Examples that should not trigger drop/modify:

```text
3x8-12 -> 12, 9, 6
3x8-12 -> 8, 8, 7
3x8-12 -> 12, 8, 5
```

These should become repeat-weight or build-capacity guidance.

### Trigger Drop/Modify When
- No sets hit the minimum target reps.
- Only one set hits the minimum target, and the remaining sets are severe misses.
- Two or more sets miss the minimum by 3+ reps.
- Average completion is very low, such as below 70% of the minimum target.
- Missed reps are paired with pain or form issue.
- The same severe miss pattern repeats across workouts.

Examples that should trigger drop/modify:

```text
3x8-12 -> 6, 5, 4
3x8-12 -> 12, 5, 4
3x8-12 -> 8, 4, 4
```

### Phase Notes
- Completed in Phase 2. Load-too-high detection now judges severe misses
  against the bottom of the prescribed rep range, while progression eligibility
  still uses the top of the range.
- Normal fatigue patterns such as `12, 9, 6`, `8, 8, 7`, and `12, 8, 5`
  no longer create `Drop the load or modify`.
- The repeated load-selection message now requires the same stricter
  load-too-high signal before showing `Load may be too high`.
- Added tests for normal fatigue, severe misses, and message-level suppression
  of drop-load warnings.

## Phase 3: Split Repeat-Weight From Drop-Weight Coaching

### Goal
Make recommendations feel like a trainer's judgment.

### Add A Second History-Aware Classifier
Phase 2 made the current-workout signal stricter. Phase 3 should add a second
classifier that uses recent exercise history to decide whether a missed target
is normal adaptation or a premature load jump.

The current-set classifier answers:

```text
Did this workout pattern prove the load is too heavy today?
```

The history-aware classifier answers:

```text
Did the user increase before earning it, and did performance get worse enough
that we should recommend returning to the previous load?
```

### Inputs
- Current prescription: sets, minimum reps, top reps.
- Current exercise result: actual reps per set, weight, badges, completion.
- Most recent same-exercise history in the active program.
- Previous successful weight and reps.
- Whether the current weight is higher than the previous weight.
- Whether the previous weight was truly earned by hitting the top of the rep
  range across all required sets.

### Classifier Flow
1. Run the current-set load-too-high classifier first.
2. If current-set evidence is severe, return `drop_load_or_modify`.
3. If the user completed every set at or near the top of the range, return
   `increase_load`.
4. If the current weight is higher than the previous same-exercise weight,
   compare current performance against the previous weight:
   - If the previous weight was not earned and current performance has multiple
     below-range sets, recommend returning to the previous load.
   - If every current set is inside the prescribed rep range, do not recommend
     dropping weight just because the user missed the top of the range.
   - If the previous weight was earned but the new load causes a major collapse,
     recommend dropping back or using a smaller jump.
   - If the user has strong early sets and only fades late, repeat the current
     load.
5. If there is no useful history, default borderline cases to repeat/load-build
   guidance instead of drop-load guidance.

### Premature Progression Rules
- Treat a load jump as earned only when the previous same-exercise session hit
  the top target on all required sets, or nearly all sets if the prescription
  allows a range and the app later supports trainer-configurable leniency.
- If the user increased from a previous load and the current session has
  multiple below-range sets without a forgiving late-fatigue pattern, recommend
  returning to the previous load or using a smaller jump.
- Do not ask a user to drop weight when every set is within the prescribed rep
  range, such as `12, 8, 8` on `3x8-12`.
- If the current first set is below the minimum by 2+ reps after a jump, treat
  that as stronger evidence the jump was too aggressive.
- If only the final set collapses after strong early sets, repeat the current
  load rather than immediately dropping.

### Example Outcomes

```text
3x8-12 -> 12, 9, 6       = repeat weight
3x8-12 -> 8, 8, 7        = repeat weight
3x8-12 -> 12, 8, 5       = repeat weight with caution
3x8-12 -> 12, 12, 3      = repeat weight; strong early work, late fatigue
3x8-12 -> 7, 6, 5        = drop load or modify
3x8-12 -> 6, 5, 4        = drop load or modify
3x8-12 -> 12, 5, 4       = drop load or modify
3x8-12 -> 8, 4, 4        = drop load or modify
3x8-12 -> 12, 12, 12     = increase load
+5 lb -> 12, 8, 8        = quiet hold/repeat internally; no user message
+5 lb -> 12, 7, 6        = return to previous load or smaller jump
```

### Classification Examples

```text
3x8-12 -> 12, 9, 6   = repeat weight
3x8-12 -> 8, 8, 7    = repeat weight
3x8-12 -> 12, 8, 5   = repeat weight with caution
3x8-12 -> 12, 12, 3  = repeat weight with late-fatigue note
3x8-12 -> 6, 5, 4    = drop load or modify
3x8-12 -> 12, 5, 4   = drop load or modify
Pain + missed reps   = reduce load or swap
Form issue + misses  = repeat, reduce, or swap depending severity
```

### Done When
- Normal fatigue creates repeat-weight guidance.
- Severe misses create load-reduction guidance.
- Premature manual increases can recommend returning to the previous load.
- Earned increases that fade late recommend repeating the current load.
- Repeat-weight and hold-steady outcomes remain quiet internal states, not
  standalone user messages.

### Phase Notes
- Phase 3 should not create any user-facing `Hold steady`, `Repeat weight`, or
  `Repeat load` messages. Those outcomes may still be used internally to avoid
  increasing too soon.
- Completed in Phase 3. Added a history-aware premature progression classifier
  that compares the latest completed result against the previous same-exercise
  load.
- The classifier keeps strong early work with late-set fatigue quiet, including
  `12, 12, 3`, and keeps all-within-range work quiet, including `12, 8, 8`
  on `3x8-12`.
- The classifier can recommend returning to the prior load for a jump like
  `135 -> 140` followed by `12, 7, 6` on `3x8-12`.
- Removed the standalone `progression-repeat-weight` user message so repeat and
  hold outcomes do not create extra dashboard, workout summary, or Trends
  messages.

## Phase 4: Make Feasibility Quiet During First Review

### Goal
Use the feasibility engine to improve generated weights before the user sees warnings.

### Tasks
- Run feasibility during plan generation or workout review preparation.
- If a generated starting weight is too aggressive, silently lower it to the feasible target.
- Avoid warning labels on first review unless the user manually edits a weight upward.
- Keep feasibility warnings inside the weight editor and active workout flow.

### Done When
- A new user sees manageable starting weights, not immediate warning labels.

### Phase Notes
- Completed in Phase 4. Workout review now applies feasibility adjustments to
  the generated preview before the user sees it.
- Too-heavy starting weights backed by onboarding or recent workout history are
  silently lowered to the feasible suggestion.
- First-review feasibility banners and card labels stay quiet for the adjusted
  baseline. They only appear if the user edits a weight above that baseline.
- Review completion persists the quietly adjusted preview before marking the
  plan reviewed, so the accepted program and active workouts inherit the safer
  loads.

## Phase 5: Improve Message Timing

### Goal
Show load-reduction messages only after enough evidence.

### Tasks
- Require at least one completed workout in the active program before current-plan progression messages appear.
- Require repeated evidence before showing load-selection pattern messages.
- Keep immediate pain warnings, since pain is high priority.
- Do not show load-reduction messages immediately after onboarding or program switch.

### Done When
- The app feels helpful after onboarding instead of noisy or critical.

### Phase Notes
- Completed in Phase 5. Recovery and progression messages now use current
  program sessions when current-program scope is supplied, so old-plan coaching
  does not leak into new-plan dashboard, workout summary, or active exercise
  surfaces.
- Load-selection pattern messages now require repeated qualifying evidence for
  the same exercise instead of combining unrelated one-off misses across
  multiple lifts.
- All-time views can still show historical load-selection patterns when no
  current-program scope is supplied.
- Recent capacity now ignores failed below-range sets, missed-rep logs, pain
  logs, and form-issue logs so a failed attempt cannot become the benchmark for
  future feasibility checks.

## Phase 6: Update Message Copy

### Goal
Make coaching messages more specific and less harsh.

### Quiet Repeat-Weight Copy

Do not send this as a dashboard, summary, or Trends message. Use this only in
small inline contexts where the user is already reviewing that exercise.

```text
Bench Press faded late. Repeat this load and aim to bring every set into range before increasing.
```

### True Drop-Load Copy

```text
Bench Press is missing the target range across most sets. Drop the load or choose an easier variation next time.
```

### Multiple Exercises Copy

```text
A few lifts are missing the target range across most sets. Review the loads before progressing.
```

### Phase Notes
- Completed in Phase 6. Persisted user messages no longer generate a generic
  repeated missed-target warning that tells the user to hold or repeat weight.
- Repeat-weight and hold-steady guidance remains available only as inline
  exercise-level context, such as when the user is reviewing or manually
  adjusting a specific load.
- `Drop the load or modify` copy now explains that the exercise is missing the
  target range across most sets.
- Repeated load-selection pattern copy now uses a softer `Review load
  selection` title and only appears for true repeated load-too-high evidence.
- Repeated form copy no longer tells the user to repeat weight; it recommends a
  cleaner load or safer variation before increasing.

## Phase 7: Tests

### Required Cases
- `3x8-12 -> 12, 9, 6` does not create `Drop the load or modify`.
- `3x8-12 -> 8, 8, 7` does not create `Drop the load or modify`.
- `3x8-12 -> 6, 5, 4` does create `Drop the load or modify`.
- `3x8-12 -> 12, 5, 4` does create `Drop the load or modify`.
- Pain or form issue with missed reps still creates caution.
- New program with zero completed workouts does not show stale drop/modify messages.
- Current-program Trends stay clean after a switch.
- All-time Trends can still show historical patterns.

### Phase Notes
- Completed in Phase 7. Existing advisory tests cover the exact normal-fatigue
  and severe-miss examples in the plan.
- Added message-layer coverage to prove normal fatigue does not create
  persisted repeat-load, hold-steady, missed-target, or drop-load cards on
  dashboard, workout summary, or Trends surfaces.
- Strengthened reduce/modify message coverage so true severe misses include
  the new `missing the target range across most sets` copy.
- Existing program-scope tests continue to verify current-program Trends stay
  clean after switching plans while all-time history can still show archived
  load-selection patterns.

## Success Criteria

- Load-reduction messages are stricter and more trustworthy.
- New plans do not inherit old-plan warnings.
- Feasibility improves starting weights before warning the user.
- Repeat-weight guidance handles normal fatigue without clutter.
- Users feel coached, not scolded.
