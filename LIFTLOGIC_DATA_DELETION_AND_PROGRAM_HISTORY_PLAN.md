# LiftLogic Data Deletion And Program History Plan

## Summary
Give users clear control over their data while protecting the integrity of workout history, progressive overload, trends, personal records, and coaching messages.

This plan focuses on two related problems:

- users need to delete or reset data with confidence
- LiftLogic needs to handle workout program changes without mixing old and new data in confusing or unsafe ways

The goal is not only privacy. It is also training accuracy. If deleted data or archived programs keep influencing recommendations, the app can give misleading coaching.

## Product Principle
User data should be understandable, reversible when possible, and scoped correctly.

LiftLogic should answer:

- What data am I deleting?
- What will this affect?
- Can I keep useful history while starting fresh?
- Is this recommendation based on my current program or all-time exercise history?
- What happens to in-progress workouts when I switch programs?

## Current Risk Areas

### Deletion Risks
- Deleted workout sessions may still appear in cached app data.
- Deleted sessions may keep affecting trends, personal records, progressive overload, weekly completion, and user messages.
- Deleting notes or badges may not refresh coaching messages that were generated from those signals.
- Deleting a workout plan may leave in-progress sessions pointing at a stale `workoutPlanId`.
- Deleting all app data may need to clear profile, settings, workout plan, workout sessions, local caches, message visibility state, and auth-adjacent client state.
- Partial deletion could create orphaned records if backend and client cache are not updated together.

### Program Switching Risks
- Old program sessions may count toward the new program's weekly completion.
- Dashboard may select a `programDayId` from an old plan if current-plan filtering is not strict.
- Trends may mix old and new programs without labeling that they are all-time trends.
- Personal records may be valid globally, but confusing if shown as current-program progress.
- Progressive overload may use old exercise history with a different rep range, equipment context, or training goal.
- An in-progress workout from the old program may continue after the user switches plans.
- Notes and badges from old programs may trigger recovery cautions in a new context where they may or may not still be relevant.
- Switching from a 5-day plan to a 3-day plan can break weekly target and streak messaging if current-plan scope is unclear.

## Data Scoping Model

Use three scopes consistently throughout the app.

### Current Program Scope
Only data tied to the active workout plan and active program version.

Use for:

- Dashboard weekly completion
- Today's workout
- planned workout progress
- current weekly target messages
- active workout resume/start decisions
- program review and focus block behavior

### Exercise History Scope
All relevant prior sessions for the same exercise, even across programs, unless the user chooses to reset exercise history.

Use for:

- starting weight estimates
- progressive overload context
- personal records
- exercise-specific trends

Rules:

- Label this clearly as exercise history, not current-program completion.
- Prefer recent history over old history.
- If the new program has a very different rep range or goal, explain that old data is being used only as a starting reference.

### All-Time Analytics Scope
All non-deleted completed sessions across programs.

Use for:

- long-term trends
- lifetime volume
- all-time PRs
- historical consistency

Rules:

- Trends should eventually let users filter by `Current program`, `Previous program`, or `All time`.
- All-time views should not drive current weekly completion.

## Deletion Types

### Delete Workout Session
User can delete one workout session.

Effects:

- Remove it from Dashboard, Calendar, Trends, PRs, progression, and messages.
- If the deleted session was in progress, return the user to Dashboard or Plan.
- Clear or refresh local caches that include the session.
- Show confirmation copy explaining that logged sets, notes, badges, and workout notes will be removed.

### Delete Exercise Feedback
User can delete notes and badges for one exercise log without deleting the whole session.

Effects:

- Remove exercise-level notes.
- Remove exercise-level badges.
- Recalculate recovery and progression messaging.
- Keep set data intact.

### Delete Workout Notes
User can delete overall workout notes and workout badges.

Effects:

- Keep session performance data.
- Remove summary notes and badges.
- Recalculate messages that depend on workout-level badges.

### Reset Exercise History
User can reset history for one exercise.

Effects:

- Do not necessarily delete old sessions.
- Mark that exercise history should be ignored for future recommendations before a chosen date.
- Keep historical sessions visible in all-time trends unless the user explicitly deletes sessions.

This is safer than deleting every workout that contains an exercise.

### Reset Current Program Progress
User can restart the current program while keeping account, settings, and historical workout data.

Effects:

- Archive or abandon in-progress sessions for the current plan.
- Current weekly progress resets.
- Exercise history remains available for starting weights and recommendations unless the user opts out.

### Delete Current Workout Plan
User can remove the active workout plan.

Effects:

- User returns to onboarding or plan selection.
- Existing completed sessions remain archived.
- In-progress sessions should be abandoned or explicitly resolved.
- Dashboard should not show old plan days.

### Delete All App Data
User can delete all LiftLogic data while keeping or deleting the auth account depending on implementation limits.

Effects:

- Delete profile data.
- Delete user settings.
- Delete workout plan.
- Delete workout sessions.
- Clear local caches.
- Clear message visibility state.
- Return to first-run/public flow.

This action needs the strongest confirmation.

## Program Switch UX

When a user changes workout programs, show a clear transition screen instead of silently replacing the plan.

Suggested copy:

```text
Switch workout program?
Your completed workouts will stay saved. LiftLogic can still use exercise history for starting weights, but weekly progress will restart for the new program.
```

Recommended options:

- Keep exercise history for recommendations
- Reset starting weights for the new program
- Archive in-progress workouts from the old program
- Start the new program today

Important defaults:

- Keep completed history.
- Archive the old program.
- Abandon old in-progress sessions only after confirmation.
- Restart weekly completion for the new program.

## Backend Strategy

### Soft Delete First
Use soft deletes for user-facing workout data before hard deletes.

Recommended fields:

```ts
deletedAt?: string;
deletedReason?: "user_deleted" | "account_deleted" | "program_reset";
archivedAt?: string;
archiveReason?: "program_switched" | "program_reset" | "plan_deleted";
```

Why:

- Safer during early development.
- Easier to recover from accidental deletion bugs.
- Lets derived queries consistently exclude deleted data.

### Program Versioning
Add or formalize a program-history model.

Potential model:

```ts
type UserProgramHistoryEntry = {
  id: string;
  workoutPlanId: string;
  programId: string;
  programVersion: number;
  startedAt: string;
  endedAt?: string;
  status: "active" | "archived" | "deleted";
  switchReason?: "onboarding" | "manual_switch" | "regenerated" | "reset";
};
```

Every workout session should be attributable to:

- `workoutPlanId`
- `programId`
- `programDayId`
- eventually `programHistoryId` or `programVersion`

The existing `workoutPlanId`, `programId`, and `programDayId` fields are a good start, but program switches need a stable historical boundary.

### Query Defaults
Backend endpoints should default to excluding deleted data.

Examples:

- workout sessions list excludes `deletedAt`
- current-plan dashboard queries filter active plan/program
- all-time trends include archived program data but exclude deleted sessions
- PR and progression utilities receive already-filtered session sets

## Client Strategy

### Cache Safety
After delete/reset/switch actions:

- clear or patch `appDataCache`
- refresh current profile/workout plan
- refresh visible workout sessions
- clear stale selected workout state
- clear message visibility if messages were tied to deleted content

### UI Placement
Settings should include a new `Data` or `Account Data` section.

Potential controls:

- Export data
- Delete workout history
- Reset current program progress
- Delete current workout plan
- Delete all app data

Workout-specific delete actions should live closer to the object:

- Workout Summary: delete this workout
- Exercise feedback sheet: clear notes and badges
- Exercise details/history: reset history for this exercise

## Implementation Phases

### Phase 1: Data Audit And Scope Rules
- Map all places that read workout sessions.
- Mark each use as `current program`, `exercise history`, or `all time`.
- Document current bugs and ambiguous behavior.
- Add helper names that make scope obvious.

Phase 1 deliverable:

- code audit notes
- list of endpoints/utilities/components that need scoping changes
- no user-facing behavior change yet

### Phase 2: Soft Delete Foundation
- Add soft-delete fields to workout sessions.
- Update backend queries to exclude deleted sessions by default.
- Add tests proving deleted sessions do not appear in session lists.
- Keep hard delete out of v1 unless needed for account deletion.

### Phase 3: Delete Workout Session
- Add backend endpoint to delete/soft-delete a workout session owned by the user.
- Add client API function.
- Add delete action to Workout Summary.
- Confirm before deleting.
- Refresh Dashboard, Calendar, Trends, and local cache after deletion.
- Add tests for deleted sessions no longer affecting derived data.

### Phase 4: Delete Notes And Badges
- Add UI for clearing exercise notes/badges.
- Add UI for clearing workout summary notes/badges.
- Reuse existing update workout session endpoint if possible.
- Recalculate messages after updates.
- Add tests around recovery messages disappearing after badges are cleared.

### Phase 5: Program History Model
- Add a stable program history/version concept.
- Mark current program as active.
- Archive previous program on switch.
- Ensure existing sessions remain tied to the program they came from.
- Add migration/default behavior for existing users.

### Phase 6: Program Switch Confirmation Flow
- Add a confirmation screen/sheet before replacing the active plan.
- Explain what happens to completed history, current weekly progress, and in-progress sessions.
- Let users choose whether to keep exercise history for recommendations.
- Archive or abandon old in-progress sessions based on user choice.

### Phase 7: Current Program Filtering
- Update Dashboard weekly completion to use current program scope only.
- Update Calendar indicators to distinguish current-plan sessions from archived-history sessions if needed.
- Update user messages so weekly completion and current-plan messages do not count archived programs.
- Add tests for switching from a 5-day plan to a 3-day plan.

### Phase 8: Exercise History Controls
- Add setting for whether old program exercise history can inform recommendations.
- Add per-exercise history reset.
- Make progression cards explain when they are using prior-program data.
- Add tests for recommendation behavior after exercise history reset.

### Phase 9: Trends And PR Filters
- Add current-program vs all-time filtering to Trends.
- Keep compound PR messaging global by default, but label all-time PRs clearly.
- Let users inspect historical programs.
- Add tests for PRs and volume charts with archived programs.

### Phase 10: Reset Current Program Progress
- Add Settings data action to reset the active program.
- Confirm the reset clearly.
- Archive/abandon in-progress sessions.
- Keep completed history unless the user chooses a stronger deletion option.
- Restart dashboard weekly progress.

### Phase 11: Delete Current Plan
- Add Settings data action to delete the active workout plan.
- Return user to welcome/onboarding or plan selection.
- Keep completed sessions archived.
- Prevent stale Dashboard and Plan views from rendering old plan data.

### Phase 12: Delete All App Data
- Add the strongest confirmation flow.
- Delete or anonymize profile, settings, workout plan, sessions, and app-specific records.
- Clear local caches and message visibility state.
- Return user to the public/first-run flow.
- Document any Firebase/auth account deletion limitations separately.

## Test Plan

### Unit Tests
- deleted sessions are excluded from normal session queries
- deleted sessions do not count toward weekly completion
- deleted sessions do not produce PRs
- deleted sessions do not affect progression recommendations
- cleared badges remove recovery caution messages
- current-program scope excludes archived programs
- all-time scope includes archived but non-deleted sessions
- exercise history reset ignores older logs for recommendations

### API Tests
- users cannot delete another user's sessions
- soft-deleted sessions are not returned by default
- program switch archives old program history
- in-progress old-program sessions are resolved during switch
- delete-all-data clears all app-owned records for that user

### UI Checks
- delete session confirmation
- clear notes/badges confirmation
- program switch confirmation
- reset current program progress confirmation
- delete current plan confirmation
- delete all app data confirmation
- Settings data controls at 320px and 375px widths

### Regression Checks
- Dashboard after program switch
- Calendar after deleting a workout
- Trends after deleting a workout
- Workout Summary after deleting current session
- Exercise page after old program history is archived
- User messages after deletion/reset/switch

## Open Questions

- Should account deletion also delete the Firebase auth user, or only app-owned data?
- Do we need data export before delete-all-data in v1?
- Should exercise history reset be a hidden advanced action or visible in Exercise Details?
- Should old program history be browseable from Settings, Trends, or Plan?
- Should PRs be all-time by default or current-program by default?
- How long should soft-deleted data remain recoverable before hard deletion?

## Assumptions

- Start with soft deletion for workout data.
- Keep completed workout history by default when switching programs.
- Current-program progress should reset on program switch.
- Exercise history can remain useful across programs, but it must be labeled and controllable.
- Do not change auth provider behavior until delete-all-data/account deletion is planned in detail.
