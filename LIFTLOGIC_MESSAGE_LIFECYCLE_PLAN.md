# LiftLogic Message Lifecycle And Dismissal Plan

## Summary
Improve LiftLogic messages so they feel timely, dismissible, and tied to current training context. Messages should not pile up forever. They should appear when useful, disappear when resolved, and respect the user's choice to close them.

This plan builds on `LIFTLOGIC_USER_MESSAGING_PLAN.md` and focuses specifically on expiration, dismissal, freshness, and message organization.

## Product Goal
Messages should behave like coaching notes with memory:

- useful when they appear
- easy to dismiss
- regenerated when the underlying training data changes
- hidden when the issue is resolved
- separated by purpose so warnings, celebrations, and trends do not compete

## Guiding Rules
- Every message card gets a close button.
- Dismissing a message hides the card, not the underlying training data.
- Protected warnings can be dismissed for now, but may return after new relevant workout data.
- Trends should not feel like a permanent alert inbox.
- Latest workout messages and long-term pattern messages should be separate concepts.
- Message IDs and fingerprints should include enough context to know when a message is genuinely new.

## Phase 1: Audit Current Message Surfaces

### Goal
Document exactly where messages appear and whether each surface uses visibility/dismissal state.

### Tasks
- Audit message rendering on Dashboard, Trends, Workout Summary, and Workout Exercise.
- Identify which surfaces currently call:
  - `filterVisibleUserMessages`
  - `markUserMessagesSeen`
  - `dismissUserMessage`
- List which messages are currently protected and cannot be dismissed.
- Confirm whether message state is local-only or needs backend persistence later.

### Done When
- We have a short note in this file describing current behavior by surface.
- We know which components need close buttons.

### Phase Notes
- Completed audit on 2026-07-21.
- Current message state is client-local in `localStorage` under `liftlogic:user-messages:v1`; there is no backend message table or cross-device dismissal persistence yet.
- Dashboard already uses the visibility layer:
  - reads with `readUserMessageVisibilityState`
  - filters with `filterVisibleUserMessages`
  - marks visible messages with `markUserMessagesSeen`
  - dismisses with `dismissUserMessage`
  - only non-protected messages can currently be dismissed because `canDismissUserMessage` returns false for recovery, warning, and danger messages.
- Trends generates messages with `buildUserMessages`, filters to the `trends` surface, and immediately slices to 3. It does not use visibility state, seen counts, or dismissal.
- Workout Summary generates `workout_summary` messages for the current session and prior sessions. It does not use visibility state, seen counts, or dismissal.
- Workout Exercise generates `workout_exercise` messages for the active exercise. It does not use visibility state, seen counts, or dismissal.
- Components needing close buttons:
  - Dashboard message cards should be updated so protected messages can be dismissed for now.
  - Trends message cards need close buttons and visibility state.
  - Workout Summary insight cards need close buttons and visibility state.
  - Workout Exercise guidance cards need close buttons and visibility state.
- Current protected-message behavior is too strict for the desired UX. Recovery, warning, and danger messages always show if generated. The next implementation phase should distinguish permanent dismissal from short “dismiss for now” snoozing.

## Phase 2: Define Message Lifetimes

### Goal
Give each category a clear freshness window and dismissal behavior.

### Recommended Defaults

| Message Type | Example | Default Lifetime | Dismiss Behavior |
| --- | --- | --- | --- |
| Latest workout | Workout complete, PR from last workout | Until next completed workout or 7 days | Hide unless message fingerprint changes |
| Progressive overload | Ready to progress, hold steady | Until next relevant exercise log changes state | Hide for 7 days or until state changes |
| Missed target pattern | Targets missed repeatedly | Until latest relevant exercise result is successful | Hide for 24 hours, return after new failed signal |
| Load too high | Drop the load or modify | Until user completes clean work at lower/same adjusted load | Hide for 24 hours, return after new failed signal |
| Pain/form warning | Pain signal, form pattern | Until latest relevant logs are clean | Hide for 24 hours, return after new pain/form signal |
| Weekly completion | Weekly target complete | Current week only | Hide for 7 days or until next week |
| Education | Why repeat the weight? | First few relevant times only | Hide for 30 days |

### Tasks
- Add lifecycle metadata to generated messages:
  - `scope`
  - `sourceSessionId`
  - `sourceExerciseIds`
  - `expiresAt` or `validUntil`
  - `dismissalPolicy`
- Keep the initial implementation client-side.
- Avoid backend persistence until message behavior proves useful.

### Done When
- Each generated message has enough metadata to determine whether it is fresh, resolved, or dismissible.

### Phase Notes
- Pending.

## Phase 3: Add Close Buttons To Message Cards

### Goal
Make every visible message dismissible from the UI.

### Tasks
- Add close buttons to message cards on Dashboard.
- Add close buttons to Trends message cards.
- Add close buttons to Workout Summary message cards.
- Add close buttons to Workout Exercise guidance cards where appropriate.
- Use a clear accessible label such as `Dismiss message`.
- Keep the visual treatment small and quiet so the card still reads as coaching, not an alert box.

### Behavior
- Normal messages dismiss immediately.
- Warning/recovery messages use “dismiss for now.”
- Critical pain/recovery messages can return after the next relevant workout.

### Done When
- A user can close any message card on every surface where messages appear.
- Dismissal updates local visibility state immediately without requiring a page reload.

### Phase Notes
- Pending.

## Phase 4: Apply Visibility Logic To Trends

### Goal
Stop Trends from always showing the same top 3 generated messages.

### Tasks
- Use `filterVisibleUserMessages` on Trends.
- Mark visible Trends messages as seen with `markUserMessagesSeen`.
- Add `dismissUserMessage` handling for Trends cards.
- Keep Trends limited to high-signal messages, but apply visibility before slicing to 3.

### Done When
- Dismissed Trends messages disappear.
- Repeated visits do not keep resurfacing unchanged low-priority messages.
- Important warnings can still return according to their policy.

### Phase Notes
- Pending.

## Phase 5: Split Latest Workout Insights From Training Patterns

### Goal
Make message intent clearer and avoid mixing yesterday's workout feedback with long-term trends.

### Proposed Sections

#### Latest Workout Insights
Use the latest completed workout only.

Examples:
- workout complete
- PR achieved
- exercises ready next time
- exercises that should repeat or reduce next time

#### Training Patterns
Use a rolling history window.

Examples:
- repeated missed targets
- repeated pain or form flags
- consistency streaks
- stalled exercises
- weekly completion patterns

### Tasks
- Add grouping helpers:
  - `getLatestWorkoutMessages`
  - `getTrainingPatternMessages`
- Update Trends to render separate sections if both groups exist.
- Keep Dashboard focused on the highest-priority current action.

### Done When
- Trends no longer feels like one undifferentiated alert list.
- The user can tell whether a message is about the latest workout or a broader pattern.

### Phase Notes
- Pending.

## Phase 6: Add Rolling Time Windows

### Goal
Prevent old history from making stale messages stick around forever.

### Recommended Windows
- Latest workout insights: latest completed workout only.
- Progressive overload state: latest completed log per exercise.
- Recovery patterns: last 28 days.
- Missed target patterns: last 14-28 days.
- Weekly completion: current week only.
- Education tips: first-time or low-frequency only.

### Tasks
- Add session-window helpers for message generation.
- Apply rolling windows to recovery and missed-target pattern messages.
- Keep all-time history available for PR calculation, but only show PR messages for the latest workout/current week.

### Done When
- Old missed targets stop driving current warning cards once they fall outside the pattern window.
- Trends still has access to historical charts separately from messages.

### Phase Notes
- Pending.

## Phase 7: Add Resolved-State Logic

### Goal
Messages should disappear when the user fixes the thing.

### Resolution Examples
- `Targets missed repeatedly` resolves when the latest log for that exercise hits all target sets without a missed-reps badge.
- `Ready to progress` resolves after the user performs that exercise again at the recommended heavier weight.
- `Drop the load or modify` resolves when the user completes clean sets at a reduced or safer load.
- `Pain signal noticed` resolves when the latest relevant workout has no pain badge.
- `Form pattern noticed` resolves when the latest relevant workout has no form badge and target sets are completed.

### Tasks
- Add resolver helpers for repeated missed targets, pain, form, and load-too-high states.
- Prefer latest exercise state over old signals when deciding if a message remains active.
- Add tests around common resolution cases.

### Done When
- A user who improves performance does not keep seeing the old warning indefinitely.

### Phase Notes
- Pending.

## Phase 8: Upgrade Message Fingerprints

### Goal
Make dismissed messages return only when they are meaningfully new.

### Tasks
- Include key context in fingerprints:
  - message type
  - relevant exercise IDs
  - latest source session ID
  - current state such as `ready_to_increase`, `hold_steady`, `load_too_high`
- Avoid fingerprinting on copy alone.
- Add tests proving old dismissals do not hide genuinely new messages.

### Done When
- Dismissing yesterday's “Hold steady” does not hide today's new “Drop the load” warning.
- Copy edits do not accidentally reset every user's dismissed messages.

### Phase Notes
- Pending.

## Phase 9: Settings Controls For Message Volume

### Goal
Let users control how often coaching messages appear without losing important safety guidance.

### Settings To Add Or Confirm
- Frequency:
  - Standard
  - Fewer messages
  - Important only
- Snooze:
  - Snooze non-critical messages for 7 days
- Category toggles:
  - Completion
  - Progressive overload
  - Personal records
  - Consistency
  - Recovery and caution
  - Education

### Tasks
- Confirm existing settings cover the above.
- Add snooze if missing.
- Make protected recovery messages visible even when low-priority categories are off, but less repetitive.

### Done When
- Users can reduce message noise without disabling useful safety coaching.

### Phase Notes
- Pending.

## Phase 10: Test And Polish

### Goal
Verify the message system feels consistent across real app flows.

### Test Cases
- User dismisses a Trends message and it disappears immediately.
- Dismissed normal message stays hidden across refresh.
- Warning message can return after new relevant workout data.
- Latest workout PR message disappears after a newer completed workout with no PR.
- Missed-target warning resolves after a clean successful workout.
- Pain/form warnings remain conservative but not permanently sticky.
- Dashboard, Trends, Workout Summary, and Workout Exercise all respect message settings.

### Commands
```bash
npm --prefix client run lint
npm test
npm run build
```

### Done When
- All tests pass.
- The plan has phase notes documenting what was completed.
- The user-facing message behavior is predictable and calmer.

### Phase Notes
- Pending.
