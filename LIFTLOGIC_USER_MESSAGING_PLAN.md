# LiftLogic User Messaging And Performance Feedback Plan

## Summary
Create a reusable messaging system that helps users understand what their training data means. LiftLogic should celebrate consistency, call out progress, warn gently when recovery or pain matters, and guide the user toward the next smart action.

The goal is not to spam users with motivational popups. The goal is to make the app feel like a useful training partner that notices important moments.

## Product Principle
Messages should be earned, specific, and actionable.

LiftLogic should answer:

- What just happened?
- Why does it matter?
- What should I do next?

Good messages should feel tied to real data:

- completed weekly workouts
- personal records
- progressive overload readiness
- missed reps
- pain or form issues
- consistency streaks
- recovery patterns
- workout completion trends

## Message Categories

### Completion Messages
Use when the user completes meaningful planned work.

Examples:

```text
Weekly target complete
You finished all 4 planned workouts this week. Great consistency.
```

```text
Workout complete
Chest is logged. Your next session will use this data to guide progression.
```

Potential triggers:

- current workout completed
- all planned workouts for the week completed
- first workout completed
- first full week completed
- extra workout completed beyond the weekly plan

### Progressive Overload Messages
Use when the user earns a next-step recommendation.

Examples:

```text
Ready to progress
3 exercises are ready for a small increase next time.
```

```text
Repeat and clean it up
Bench Press was completed, but marked hard. Repeat the weight next time.
```

Potential triggers:

- exercise ready to increase
- exercise should repeat weight
- exercise should hold steady
- exercise should reduce or modify
- multiple exercises ready to progress after a workout

### Personal Record Messages
Use when the user beats a meaningful prior best.

Examples:

```text
New personal record
Bench Press moved from 175 lb to 180 lb for the same rep target.
```

```text
Volume PR
You logged your highest chest volume this month.
```

Potential PR types:

- heaviest weight for an exercise
- best estimated one-rep max
- most reps at a given weight
- most total volume for an exercise
- highest weekly volume by muscle group
- longest consistency streak
- fastest workout completion without missed work

### Consistency Messages
Use when the user is building reliable behavior.

Examples:

```text
Consistency is building
You have trained 3 weeks in a row.
```

```text
Back on track
You completed your first workout after a missed week.
```

Potential triggers:

- weekly completion streak
- workout-day streak
- returning after inactivity
- completed workout despite prior missed day
- maintained plan adherence above a threshold

### Recovery And Readiness Messages
Use when rest, fatigue, or caution should guide the next action.

Examples:

```text
Recovery check
You marked two exercises as hard this week. Consider keeping today's jumps conservative.
```

```text
Pain signal noticed
Shoulder pain showed up again. Consider swapping pressing movements today.
```

Potential triggers:

- repeated `pain` badge
- repeated `felt_hard` badges
- missed reps across multiple exercises
- high training frequency without rest
- workout duration or rest times trending unusually high
- same muscle group trained too frequently

### Education Messages
Use sparingly to explain why LiftLogic is recommending something.

Examples:

```text
Why repeat the weight?
You completed the sets, but marked form as an issue. Repeating the weight helps build cleaner reps before increasing.
```

```text
Why increase slowly?
Small jumps keep progress steady without forcing missed reps too early.
```

Best placements:

- recommendation cards
- info popovers
- workout summary explanations
- first time a user sees a new recommendation type

## UX Placement Strategy

### Dashboard
Use dashboard messages for high-level weekly and next-action guidance.

Good dashboard messages:

- weekly target complete
- next workout ready
- exercises ready to progress
- recent PRs
- consistency streaks
- recovery caution

Avoid:

- showing too many cards at once
- interrupting the user with modal messages
- repeating the same message every visit

### Workout Exercise Page
Use exercise-page messages for immediate lift decisions.

Good exercise-page messages:

- ready to increase
- repeat weight
- hold steady
- pain or form caution
- previous performance summary

Avoid:

- weekly dashboard-style celebrations
- long educational copy while the user is actively logging

### Workout Summary
Use summary messages for reflection and immediate accomplishment.

Good summary messages:

- workout complete
- PRs achieved
- exercises ready next time
- missed-rep patterns
- optional workout notes prompt
- badge-based insights

### Trends
Use Trends for deeper, less urgent analysis.

Good Trends messages:

- weekly volume changes
- completion streaks
- PR history
- exercise progression patterns
- stalled exercises
- recovery signals

### Future Push/In-App Notifications
Keep notifications conservative.

Good candidates:

- planned workout reminder
- weekly target complete
- first PR
- missed workout follow-up

Avoid:

- noisy motivational messages
- guilt-based reminders
- multiple messages for the same event

## Message Priority Rules

Only show the highest-signal messages when space is limited.

Suggested priority:

1. Safety or pain warning
2. Current workout action needed
3. Weekly target complete
4. Personal record
5. Progressive overload readiness
6. Consistency streak
7. Educational tip

If multiple messages exist, show:

- one primary dashboard message
- optional secondary compact messages
- a `View insights` path to see more

## Tone Guidelines

Messages should sound like LiftLogic:

- direct
- encouraging
- data-aware
- never guilt-heavy
- never cheesy
- focused on the next smart action

Prefer:

```text
You finished all planned workouts this week.
```

Avoid:

```text
You crushed it, champion!
```

Prefer:

```text
Repeat this weight and make the reps cleaner.
```

Avoid:

```text
You failed your reps, so do not increase.
```

## Data Strategy

### V1: Derived Message Engine
Start with derived messages from existing data.

Use:

- workout sessions
- workout completion status
- exercise logs
- set logs
- workout badges
- exercise badges
- current workout plan
- calendar week
- progressive overload utility
- progression summary utility

Avoid adding permanent message records in v1 unless needed for dismissal tracking.

### V1.5: Dismissal And Seen State
Add lightweight seen/dismissal tracking so messages do not repeat too much.

Possible shape:

```ts
type UserMessageReceipt = {
  messageKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  dismissedAt?: string;
};
```

### Future: Stored Training Events
Later, create durable training events for things like PRs and milestone history.

Possible shape:

```ts
type TrainingEvent =
  | "workout_completed"
  | "weekly_target_completed"
  | "personal_record"
  | "progression_ready"
  | "recovery_warning";
```

This would support timelines, notification history, and richer coaching.

## Implementation Phases

### Phase 1: Message Model And Rules
- Create a shared message type for dashboard/workout insights.
- Define message categories, priority, severity, action labels, and destinations.
- Add a utility that returns sorted user messages from workout/session data.
- Start with derived messages only.

Phase 1 notes:
- Added a reusable `UserMessage` model with category, severity, priority, surfaces, and optional action data.
- Added message categories for completion, progressive overload, personal records, consistency, recovery, and education.
- Added `buildUserMessages`, `sortUserMessages`, `getUserMessagesForSurface`, and `getPrimaryUserMessage`.
- Started with derived messages only:
  - workout-complete message for a newly completed session
  - recovery warning when pain badges are present
  - progression-ready message using the existing progression summary utility
- Added focused tests for priority sorting, surface filtering, workout completion messages, recovery warnings, and progression messages.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 2: Weekly Completion Message
- Detect when planned workouts for the current week are complete.
- Add dashboard message:
  - `Weekly target complete`
  - include completed count and planned count
  - show a calm success style
- Do not show as a modal.
- Add tests for 3-day, 4-day, 5-day, and extra-workout cases.

Phase 2 notes:
- Added a preview-aware weekly completion message to the user message engine.
- The message appears when all planned workout days for the current week have completed sessions.
- Extra completed sessions beyond the plan are included in the message copy.
- Wired the Dashboard to render the highest-priority dashboard message as a compact in-page card.
- Kept the weekly completion message non-modal and placed it above the workout card.
- Added focused tests for completed 3-day, 4-day, 5-day, and extra-session cases.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 3: Workout Summary Performance Messages
- Add summary insights after workout completion.
- Include:
  - workout complete
  - exercises ready to progress
  - exercises to repeat
  - pain/form cautions
- Keep the overall workout note bottom sheet optional.

Phase 3 notes:
- Expanded the message engine with workout-summary progression insights.
- Workout Summary now shows a compact insight stack after the completion stats.
- Summary messages now include:
  - workout complete
  - ready to progress
  - repeat weight / clean up form
  - hold steady
  - pain caution
- The existing optional workout notes bottom sheet remains unchanged.
- Added focused tests for summary progression messages and pain-priority ordering.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 4: Personal Record Detection
- Create PR utilities for:
  - heaviest weight for exercise
  - most reps at same weight
  - highest exercise volume
  - highest estimated one-rep max if enough data exists
- Add first PR messages to Workout Summary and Trends.
- Keep PR logic conservative so users trust it.

Phase 4 notes:
- Added a dedicated personal-record utility for completed workout sessions.
- PR detection now supports:
  - heaviest weight for an exercise
  - most reps at the same weight
  - highest exercise volume
  - best estimated one-rep max
- PRs are only generated when there is prior completed history for the same exercise.
- PR messages are compound-only in v1 so accessories and isolation exercises do not create noisy records.
- Added a `New personal record` message for Workout Summary and Trends.
- Trends now passes the latest completed session into the message engine and renders a compact training-message strip.
- Added focused tests for PR detection and PR message surfaces.
- Verification passed:
  - `npm test -- personalRecords userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 5: Dashboard Message Center
- Add one primary message area near the top of the Dashboard.
- Show only the highest-priority message by default.
- Support secondary compact insights if there are multiple useful messages.
- Add dismiss behavior only if the message can safely stay hidden.

Phase 5 notes:
- Added a Dashboard message center that renders the highest-priority dashboard message as the primary card.
- Added compact secondary insight cards for up to two additional dashboard messages so useful context can surface without turning the Dashboard into a feed.
- Added `getSecondaryUserMessages` to keep primary/secondary surface message selection reusable.
- Deferred dismiss behavior until seen-state and frequency controls are implemented in later phases.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 6: Trends Insight Timeline
- Add a Trends section for recent training events.
- Include:
  - PRs
  - weekly completion
  - progression-ready changes
  - consistency streaks
  - recovery cautions
- Keep this as a history/insights view, not a notification feed.

### Phase 7: Recovery And Safety Messages
- Detect repeated pain, form issues, or missed reps.
- Surface caution messages on Dashboard, Workout Exercise, and Summary.
- Suggest reducing load, repeating weight, or swapping exercises.
- Avoid medical language or diagnosis.

Phase 7 notes:
- Expanded recovery messaging beyond single pain flags.
- Added repeated pain, repeated form issue, and repeated missed-target detection.
- Repeated pain is treated as the highest-priority recovery message and uses stronger caution styling.
- Workout Exercise can now receive active-exercise recovery cautions through the shared message engine.
- Workout Summary now passes prior sessions into the message engine so repeated recovery patterns can be detected after a completed workout.
- Recovery copy stays focused on training adjustments: reduce load, use a pain-free range, repeat weight, or swap the movement.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 8: Message Frequency Controls
- Add seen/dismissal tracking.
- Prevent the same message from showing too often.
- Add rules for when messages can reappear.
- Add tests for repeated dashboard visits.
- Allow users to close messages

Phase 8 notes:
- Added client-side message visibility tracking for Dashboard messages.
- Non-critical messages can be dismissed and will reappear when the content changes or after a cooldown.
- Non-critical messages that have been seen repeatedly are temporarily cooled down to avoid repeating the same insight on every Dashboard visit.
- Recovery, warning, and danger messages are protected from dismissal and frequency suppression in v1.
- Added Dashboard dismiss controls for messages that can safely stay hidden.
- Added focused tests for dismissal, content-change reappearance, cooldown reappearance, repeated-view suppression, and protected recovery cautions.
- Verification passed:
  - `npm test -- userMessageVisibility userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 9: User Message Preferences
- Add a Settings section where users can control what message types they want to see.
- Let users configure message categories:
  - Completion
  - Progressive overload
  - Personal records
  - Consistency
  - Recovery and caution
  - Education tips
- Let users choose an overall message frequency:
  - Standard
  - Fewer messages
  - Important only
- Let users control message surfaces:
  - Dashboard messages
  - Workout summary insights
  - Exercise-page guidance
  - Future reminders or notifications
- Keep safety and pain-related messages protected:
  - Do not fully hide repeated pain warnings by default.
  - If users can disable them, require clear copy explaining that LiftLogic may stop surfacing important training cautions.
- Store preferences in the user profile or a dedicated settings object.
- Make the message engine respect preferences before returning displayable messages.
- Add tests for hidden categories, reduced frequency, and important-only mode.

Phase 9 notes:
- Added persisted message preferences to user settings with defaults and deep-merge handling.
- Added server validation for message categories, message frequency, surfaces, and future reminder preference.
- Added Settings > Messages controls for categories, frequency, surfaces, and future reminders.
- Message building now respects category, surface, and frequency preferences across Dashboard, Workout Summary, Workout Exercise, and Trends.
- Protected recovery warning and danger messages can still appear so important caution messaging is not fully hidden.
- Added focused tests for hidden categories, reduced frequency, important-only mode, disabled surfaces, and protected recovery cautions.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

## Initial Message Ideas

- `Weekly target complete`: all planned workouts finished.
- `Extra session logged`: user exceeded weekly target.
- `First workout logged`: new user completes first workout.
- `First full week complete`: new user completes first planned week.
- `Ready to progress`: one or more exercises qualify for progression.
- `PR achieved`: user beat a prior best.
- `Clean repeat`: user repeated weight after prior form issue and completed it.
- `Comeback workout`: user returns after a gap.
- `Recovery check`: multiple hard/pain/form badges in recent sessions.
- `Stalled lift`: same exercise has missed targets across multiple sessions.
- `Strong consistency`: multiple completed weeks in a row.
- `Volume jump`: weekly volume increased sharply compared to recent baseline.
- `Deload suggestion`: repeated fatigue, missed reps, or pain signals appear.

## Test Plan

- Unit tests:
  - weekly completion detection
  - message priority sorting
  - PR detection
  - repeated-message suppression
  - pain/form/missed-rep caution rules
- Visual checks:
  - Dashboard message card
  - Workout Summary insight area
  - Trends insight timeline
  - mobile 320px and 375px widths
- Accessibility checks:
  - messages are readable on dark surfaces
  - success/warning states do not rely on color alone
  - actions and dismiss buttons have clear labels
- Run:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

## Assumptions

- Start with in-app messages only.
- No push notifications in the first pass.
- Keep messaging derived from workout data unless dismissal tracking requires lightweight storage.
- User message preferences should be added after the base message engine exists.
- Keep the tone calm and coach-like.
- Do not add AI-generated coaching text until the deterministic message system is stable.
