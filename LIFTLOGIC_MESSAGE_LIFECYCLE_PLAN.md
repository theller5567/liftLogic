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
- Completed on 2026-07-21.
- Added lifecycle metadata support to `UserMessage`:
  - `scope`
  - `sourceSessionId`
  - `sourceExerciseIds`
  - `expiresAt`
  - `dismissalPolicy`
- Added lifecycle metadata to generated completion, weekly completion, recovery, progressive overload, and personal record messages.
- Updated visibility fingerprints to include lifecycle source context, so a dismissed message can return when the source session or relevant exercise set changes.
- Changed protected-message dismissal behavior from “cannot dismiss” to “dismiss for now.” Recovery, warning, and danger messages now use a shorter default cooldown of 24 hours unless the message provides its own policy.
- Added tests for generated lifecycle metadata, temporary recovery-message dismissal, source-context changes, and expiration.
- Backend persistence is still intentionally deferred; visibility remains local-only in this phase.

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
- Completed on 2026-07-21.
- Added a shared `useUserMessageVisibility` hook so message surfaces can reuse local visibility state, seen tracking, filtering, and dismissal.
- Dashboard already had close buttons; because Phase 2 changed protected messages to “dismiss for now,” Dashboard close controls now apply to warning/recovery/danger cards too.
- Added close buttons and visibility handling to:
  - Trends message cards
  - Workout Summary insight cards
  - Workout Exercise guidance cards
- Close buttons use accessible labels such as `Dismiss {message title}` and update local visibility immediately.
- This phase intentionally kept the current message grouping mostly intact. The deeper Trends split between latest workout insights and training patterns remains in Phase 5.

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
- Completed on 2026-07-21.
- Trends now uses the shared visibility hook added in Phase 3, which applies local visibility state, marks visible messages as seen, and dismisses messages through `dismissUserMessage`.
- Corrected Trends ordering so the app now generates all Trends-surface messages, applies visibility/dismissal filtering, and only then limits the visible list to 3 cards.
- This means dismissing the top Trends message can allow the next eligible message to appear instead of leaving the list artificially short.
- Important warnings still return according to their lifecycle dismissal policy when their cooldown expires or their fingerprint/source context changes.

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
- Completed on 2026-07-21.
- Added `groupTrendUserMessages` so Trends can separate latest workout insights from broader training patterns without duplicating classification logic in the page component.
- Latest workout insights now include latest-workout messages and exercise-action messages, covering workout completion, PRs, ready-to-progress notes, repeat-weight notes, and reduce-weight notes.
- Training patterns now catch the remaining Trends messages, including recovery warnings and weekly completion messages.
- Updated Trends to render each populated group under its own heading while preserving the existing dismiss button behavior.
- Added a focused utility test to make sure latest workout, exercise action, and training pattern messages land in the expected sections.

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
- Completed on 2026-07-21.
- Added session-window helpers that anchor message freshness to the latest completed workout in the available session set.
- Weekly completion messages now evaluate only the latest completed workout's week, so older completed workouts do not accidentally complete the current week.
- Recovery pattern messages now look at the last 28 days of completed workouts.
- Missed-target pattern messages now use a tighter 21-day window so old failed workouts stop driving current warnings.
- Personal record messages still compare against all-time prior history, but only announce when the requested session is the latest completed workout.
- Added tests proving stale missed-target history is ignored and weekly completion does not pull workouts from a prior week.

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
- Completed on 2026-07-21.
- Added resolved-state filtering for recovery and missed-target messages. Older pain, form, or missed-target logs stop producing a message once the latest log for that same exercise is clean.
- Kept the first actionable adjustment workflow focused on the active workout exercise screen, where the app already has enough session and exercise context to save a real change.
- Added an `Adjust exercise load` bottom sheet on the workout exercise page. It can apply the recommended drop when available, drop one additional configured weight increment, or keep the current load.
- The adjustment updates the current exercise prescription snapshot and all remaining uncompleted sets while preserving completed set history.
- Changed the reduce/modify progression card action label to `Adjust load`, while normal progression recommendations still use the existing apply-recommendation behavior.
- Added `Adjust load` actions to active exercise caution messages when the current exercise has a weight target.
- Added tests proving pain and missed-target messages resolve when the latest exercise log is clean.
- Broader accepted-program prescription editing and cross-page message deep links remain a future workflow, rather than forcing a generic link that cannot yet make the requested change.

## Phase 7.5: Add Cross-Page Message Actions

### Goal
Make Dashboard, Trends, and Workout Summary messages actionable when the app can route the user to a real adjustment point.

### Core Behavior
- Add action rendering to Trends message cards.
- Expand Dashboard and Workout Summary actions beyond generic `to` links when message source context includes exercise ids.
- For a single actionable exercise:
  - Show an `Adjust load` or `Review exercise` action.
  - Route to the next/current workout exercise screen when that exercise exists in an active session.
  - Open or expose the existing `Adjust exercise load` bottom sheet from Phase 7.
- For multiple actionable exercises:
  - Show one message-level action such as `Review exercises`.
  - Open a bottom sheet listing the affected exercises.
  - Each exercise row should show the exercise name, short reason, and a button to review/adjust that exercise.
  - Route only after the user chooses the specific exercise.
- If no active/upcoming workout contains the exercise:
  - Do not show a fake adjustment button.
  - Show a safer action such as `View trends` or `Open plan` until a broader accepted-program prescription editor exists.

### Multi-Exercise Guidance
- Do not send users directly to the first exercise when a message mentions several movements.
- Keep the message itself compact, then let the chooser sheet handle the detail.
- Prioritize exercises by severity:
  - load too high or pain first
  - repeated missed targets next
  - hold/repeat guidance last
- If there are more than 3 affected exercises, show the first 3 and summarize the remaining count.

### Tasks
- Add a message action resolver that can map `sourceExerciseIds` to current/upcoming workout exercise routes.
- Add a reusable `MessageActionChooser` bottom sheet for multi-exercise messages.
- Render message actions on Trends, Dashboard secondary cards, and Workout Summary cards.
- Support a route state flag such as `{ openAdjustmentSheet: true }` so the workout exercise page can automatically open the adjustment sheet after navigation.
- Add tests for single-exercise routing, multi-exercise chooser data, and no-route fallback behavior.

### Done When
- Existing Dashboard/Trends/Summary `Drop the load or modify` messages are no longer dead ends when the related exercise is in an active workout.
- Multi-exercise messages let the user choose which exercise to adjust instead of guessing.
- Messages without a real adjustment destination avoid misleading action buttons.

### Phase Notes
- Completed on 2026-07-21.
- Added a shared `resolveMessageExerciseAction` helper that maps message `sourceExerciseIds` to real in-progress workout exercise routes.
- Dashboard and Trends now show message actions only when the related exercise exists in an editable active workout session.
- Single-exercise reduce/modify messages show `Adjust load` and route directly to the workout exercise screen.
- Single-exercise non-reduce progression messages use `Review exercise` so the action label does not overpromise a load change.
- Multi-exercise messages show `Review exercises` and open a chooser bottom sheet listing the affected exercises before routing.
- The workout exercise route now accepts `{ openAdjustmentSheet: true }` state and opens the adjustment sheet automatically after navigation.
- Completed workout summary messages still avoid fake adjustment actions when there is no active editable session target.
- Added resolver tests for single target routing, multi-exercise chooser data, non-reduce labeling, and no-route fallback behavior.

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
- Completed on 2026-07-21.
- Added stable `stateKey` lifecycle context to generated completion, weekly completion, recovery, progressive overload, and personal record messages.
- Updated message fingerprints to prefer stable lifecycle context:
  - message id
  - lifecycle scope
  - lifecycle state key
  - source session id
  - sorted relevant exercise ids
- Copy-only edits to a message title/body no longer resurface previously dismissed messages.
- Meaningful training changes still resurface messages, including changed source exercises or changed states such as `hold_steady` becoming `load_too_high`.
- Source exercise ids are deduped and sorted before fingerprinting, so ordering changes do not create fake new messages.
- Added focused tests for copy-stable dismissals, state-change resurfacing, source-context resurfacing, and reordered exercise id stability.

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
- Completed on 2026-07-21.
- Confirmed the app already had message volume preferences for:
  - frequency: `standard`, `fewer`, and `important_only`
  - category toggles for completion, progressive overload, personal records, consistency, recovery, and education
  - surface toggles for Dashboard, Workout Summary, Workout Exercise, and Trends
  - protected recovery/caution messages that can still appear when recovery is disabled
- Added a real non-critical message snooze preference with `nonCriticalSnoozedUntil`.
- Added a Settings control that lets users snooze non-critical coaching messages for 7 days or clear the active snooze.
- Wired snooze filtering into message generation so completion, PR, progression, consistency, and education messages pause while recovery warnings still appear.
- Updated the server settings schema and Mongoose model so the snooze timestamp can persist with the rest of user settings.
- Added tests proving active snooze hides non-critical messages, protected recovery cautions still show, and expired snoozes allow messages again.

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
- Completed on 2026-07-21.
- Confirmed Dashboard, Trends, Workout Summary, and Workout Exercise all pass `settings.messages` into message generation and use the shared visibility/dismissal flow where message cards are rendered.
- Confirmed the plan's core behavior is covered by tests:
  - dismissed messages disappear from visibility filtering
  - dismissed normal messages stay hidden during cooldown
  - warning messages return when source context or state changes
  - missed-target, pain, and form messages resolve when latest relevant logs are clean
  - message settings filter categories, surfaces, frequency, and snooze state
- Added a final PR freshness regression test proving an older PR message does not keep appearing after a newer completed workout with no PR.
- Ran the full Phase 10 verification commands successfully.
- Remaining future polish: backend persistence for dismissed/seen state if cross-device message memory becomes important.
