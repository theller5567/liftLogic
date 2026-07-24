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

Phase 1 notes:
- Audited the current workout-session data flow without changing user-facing behavior.
- Current backend state:
  - `WorkoutSession` already stores `workoutPlanId`, `programId`, and `programDayId`, which gives us a useful baseline for program scoping.
  - There is no `deletedAt`, `archivedAt`, `programHistoryId`, or `programVersion` yet.
  - `GET /api/workout-sessions` currently filters by `clientId`, optional date range, and optional status only.
  - `GET /api/workout-sessions/:sessionId` can load any owned session, including sessions that may later become archived or deleted unless future filters are added.
  - Session creation is current-plan scoped because it loads the reviewed current `WorkoutPlan` and creates from the active preview.
- Current client readers and intended scopes:
  - `Dashboard.tsx`: current program scope. Weekly completion, today's workout, completed planned workout count, active/resume state, and dashboard weekly messages should only use active program sessions.
  - `Calendar.tsx`: mixed scope. Month indicators can show all non-deleted sessions, but selected-day detail should eventually distinguish current-plan sessions from archived-program history.
  - `WorkoutSessionLayout.tsx`: single-session plus exercise history scope. The loaded workout is the selected session; `priorSessions` are used for progression, PR, and recovery context.
  - `WorkoutExercise.tsx`: exercise history scope for progression and recovery guidance, with the current active session as the editing target.
  - `WorkoutSummary.tsx`: single-session plus exercise history scope. Summary messages and PR detection compare the completed session against prior history.
  - `Trends.tsx` / `trendsData.ts`: all-time analytics scope today. This should become filterable between current program and all time.
  - `userMessages.ts`: mixed scope. Weekly completion is current-program scope, while recovery, progression, and PR messages can use exercise history scope.
  - `workoutAdvisory.ts`: exercise history scope. Uses prior completed sessions before the current week to decide increase/repeat/hold/reduce.
  - `personalRecords.ts`: all-time exercise history scope today. PR messaging is compound-only, but future copy should label whether the PR is all-time or current-program.
- Ambiguous or risky behavior found:
  - Dashboard loads sessions by week but does not explicitly pass `workoutPlanId` or active `programId` to the API.
  - `completedWorkoutIds` can treat old sessions with the same `programDayId` as current-plan completions if old sessions are returned in the same date range.
  - Weekly completion messages only compare `programDayId` against the active preview, so old sessions can count if IDs overlap.
  - Trends currently treats every returned completed session as the same analytics population.
  - Progression and PR logic intentionally use prior history, but they do not know whether that history came from the current program, an archived program, or a future reset boundary.
  - There is no shared helper that makes session scope explicit, so each page currently decides scope through ad hoc query shape and local filtering.
- Recommended helper boundaries before deeper behavior work:
  - `isSessionInCurrentProgram(session, activePlanOrPreview)` for Dashboard and current-plan messages.
  - `filterCurrentProgramSessions(sessions, activePlanOrPreview)` for weekly completion and active/resume decisions.
  - `filterExerciseHistorySessions(sessions, options)` for progression, PRs, and exercise-specific history, eventually respecting reset cutoffs.
  - `filterAnalyticsSessions(sessions, scope)` for Trends views such as `current_program` and `all_time`.
  - `isDeletedSession(session)` / `filterActiveSessions(sessions)` once soft-delete fields exist.
- Recommended API query additions:
  - `workoutPlanId`
  - `programId`
  - `includeArchived`
  - `includeDeleted`
  - `scope=current_program|exercise_history|all_time`
- Suggested next move:
  - Phase 2 should add soft-delete fields and default backend exclusion first.
  - Phase 7 should later add explicit current-program filtering for Dashboard and weekly messages after program history/versioning exists.

### Phase 2: Soft Delete Foundation
- Add soft-delete fields to workout sessions.
- Update backend queries to exclude deleted sessions by default.
- Add tests proving deleted sessions do not appear in session lists.
- Keep hard delete out of v1 unless needed for account deletion.

Phase 2 notes:
- Added soft-delete metadata to workout sessions:
  - `deletedAt`
  - `deletedReason`
- Added matching shared DTO fields so deleted sessions can be represented safely when intentionally included.
- Updated the Mongo workout-session model with soft-delete fields and indexes.
- Updated the unique scheduled-session index so soft-deleted sessions do not block future sessions for the same day/program workout.
- Updated workout session routes so normal list/detail/existing-session reads exclude deleted sessions by default.
- Added optional `includeDeleted` query support for future administrative/export/recovery flows.
- Added `filterActiveWorkoutSessions` and `isDeletedWorkoutSession` shared helpers.
- Updated Trends, personal record detection, progressive overload recommendations, and user messages to ignore soft-deleted sessions defensively.
- Added focused tests proving soft-deleted sessions do not influence trends, PRs, progression, or messages.
- Verification passed:
  - `npm test -- workoutSessionScope trendsData personalRecords workoutAdvisory userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 3: Delete Workout Session
- Add backend endpoint to delete/soft-delete a workout session owned by the user.
- Add client API function.
- Add delete action to Workout Summary.
- Confirm before deleting.
- Refresh Dashboard, Calendar, Trends, and local cache after deletion.
- Add tests for deleted sessions no longer affecting derived data.

Phase 3 notes:
- Added `DELETE /api/workout-sessions/:sessionId` as the user-owned workout session soft-delete endpoint.
- Deleted sessions are stamped with `deletedAt` and `deletedReason: "user_deleted"`.
- In-progress sessions are marked `abandoned` when deleted so they no longer behave like resumable workouts.
- Added the client `deleteWorkoutSession` API helper.
- Added a Workout Summary delete action with a confirmation bottom sheet.
- After deletion, users are returned to Dashboard so the deleted session cannot keep being edited.
- Tightened `includeDeleted` query parsing so `"false"` is parsed as false instead of truthy.
- Existing soft-delete filters keep deleted sessions out of Dashboard, Calendar, Trends, PRs, progression, and coaching messages.
- Verification passed:
  - `npm test -- workoutSessionScope trendsData personalRecords workoutAdvisory userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 4: Delete Notes And Badges
- Add UI for clearing exercise notes/badges.
- Add UI for clearing workout summary notes/badges.
- Reuse existing update workout session endpoint if possible.
- Recalculate messages after updates.
- Add tests around recovery messages disappearing after badges are cleared.

Phase 4 notes:
- Added explicit clear actions inside the Workout Summary feedback sheets:
  - `Clear workout notes and tags`
  - `Clear exercise feedback`
- Reused the existing workout session update endpoint instead of adding a new delete endpoint for notes/badges.
- Clearing workout feedback sends `notes: null` and `badgeIds: []`.
- Clearing exercise feedback updates the selected exercise log with `notes: undefined` and `badgeIds: []`.
- Tightened backend badge update checks to use `updates.badgeIds !== undefined`, making empty badge arrays an explicit supported update.
- User messages recalculate naturally after `setSession(workoutSession)` because the summary uses the updated session state.
- Added tests proving recovery messages disappear after pain/form badges are cleared.
- Verification passed:
  - `npm test -- userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 5: Program History Model
- Add a stable program history/version concept.
- Mark current program as active.
- Archive previous program on switch.
- Ensure existing sessions remain tied to the program they came from.
- Add migration/default behavior for existing users.

Phase 5 notes:
- Added shared workout-plan history types:
  - `WorkoutProgramHistoryEntry`
  - `ProgramHistoryStatus`
  - `ProgramSwitchReason`
  - `WorkoutPlanDto`
- Added shared program-history utilities for:
  - creating active history entries
  - finding the active program entry
  - preserving the current history entry when the program has not changed
  - archiving the current entry and starting the next version when the program changes
- Added program-history fields to workout plans:
  - `activeProgramHistoryId`
  - `programHistory`
  - `programVersion`
- Added program-history fields to workout sessions:
  - `programHistoryId`
  - `programVersion`
- New workout sessions are now stamped with the active program history/version.
- Onboarding/template selection now seeds history for existing users if needed, archives the previous active program when the selected program changes, and starts a new active version.
- Saving an edited workout preview now preserves the active version for same-program edits, while still supporting a new program-history boundary if a future flow submits a different program preview.
- Existing users without history are treated as version 1 from their current plan before any new switch is recorded.
- This phase does not add the program-switch confirmation UI yet; that remains Phase 6.
- Verification passed:
  - `npm test -- workoutProgramHistory`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 6: Program Switch Confirmation Flow
- Add a confirmation screen/sheet before replacing the active plan.
- Explain what happens to completed history, current weekly progress, and in-progress sessions.
- Let users choose whether to keep exercise history for recommendations.
- Archive or abandon old in-progress sessions based on user choice.

Phase 6 notes:
- Added a program-switch confirmation bottom sheet for redo-onboarding submissions when the selected program changes.
- Added a matching confirmation guard to Workout Review template selection for direct/retry cases where a reviewed plan is being replaced.
- Confirmation copy explains that completed workouts stay saved and weekly progress restarts for the new program.
- Added user options for:
  - keeping exercise history for starting weights and progression
  - abandoning in-progress workouts from the old program
- `submitOnboardingAnswers` now accepts optional `switchOptions`.
- Backend onboarding submission now abandons old in-progress sessions only when:
  - there is an existing workout plan
  - the selected program actually changes
  - `abandonInProgressSessions` is enabled
- Completed workout sessions remain untouched.
- Existing pre-history sessions are handled by matching the previous `programId` when `programHistoryId` is missing.
- Added shared switch confirmation styling in `page.module.scss`.
- Verification passed:
  - `npm test -- workoutProgramHistory userFlow`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 7: Current Program Filtering
- Update Dashboard weekly completion to use current program scope only.
- Update Calendar indicators to distinguish current-plan sessions from archived-history sessions if needed.
- Update user messages so weekly completion and current-plan messages do not count archived programs.
- Add tests for switching from a 5-day plan to a 3-day plan.

Phase 7 notes:
- Added shared current-program session scope helpers:
  - `isWorkoutSessionInCurrentProgram`
  - `filterCurrentProgramWorkoutSessions`
  - `CurrentProgramScope`
- Dashboard now filters week sessions to the active program before calculating:
  - weekday completion status
  - completed planned workout ids
  - available workout options
  - active/resumable selected-day sessions
  - current weekly target messaging
- Weekly completion messages now accept current-program scope, so archived program sessions cannot complete the active program's weekly target.
- Calendar now distinguishes current-plan sessions from previous-program history:
  - current completed sessions keep the lime status dot
  - current in-progress sessions keep the blue status dot
  - archived/previous-program-only days use a muted history dot
  - selected-day details label older sessions as `Previous program`
- Added regression tests for switching from a completed 5-day plan to a 3-day plan.
- Existing pre-history sessions can still match the active program by `programId`, which keeps older same-program data usable for existing users.
- Verification passed:
  - `npm test -- workoutSessionScope userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 8: Exercise History Controls
- Add setting for whether old program exercise history can inform recommendations.
- Add per-exercise history reset.
- Make progression cards explain when they are using prior-program data.
- Add tests for recommendation behavior after exercise history reset.

Phase 8 notes:
- Added exercise-history preferences to shared user settings:
  - `includePreviousPrograms`
  - `resetCutoffs`
- Defaults keep prior-program exercise history enabled, because it is useful for starting weights and progressive overload context unless the user opts out.
- Added backend validation/model support so exercise-history settings persist through the API.
- Added shared exercise-history filtering that can:
  - exclude deleted sessions
  - exclude previous-program sessions when the user disables prior-program history
  - ignore logs before a per-exercise reset cutoff
- Added an `Exercise History` Settings accordion where users can:
  - toggle whether previous-program exercise logs can guide recommendations
  - see how many exercise-specific reset cutoffs are active
- Added a per-exercise reset control to Exercise Details.
  - This does not delete workout logs.
  - It only prevents older logs for that exercise from guiding future recommendations.
  - Users can re-enable older logs for that exercise from the same screen.
- Progressive overload recommendation cards now label when a recommendation is based on exercise history from a previous program.
- Workout Exercise, Workout Summary, Trends, and progression messages now receive exercise-history scope.
- Added tests proving:
  - previous-program history is ignored when disabled
  - previous-program history is labeled when used
  - exercise reset cutoffs remove older logs from recommendations
  - summary progression ignores logs before reset cutoffs
- Verification passed:
  - `npm test -- workoutAdvisory progressionSummary userSettings workoutSessionScope userMessages`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 9: Trends And PR Filters
- Add current-program vs all-time filtering to Trends.
- Keep compound PR messaging global by default, but label all-time PRs clearly.
- Let users inspect historical programs.
- Add tests for PRs and volume charts with archived programs.

Phase 9 notes:
- Added a reusable Trends session scope filter:
  - `current_program`
  - `all_time`
- Trends now defaults to `Current program`, so the page no longer silently mixes archived programs into active-program charts.
- Added a Trends scope control that lets users switch between:
  - active program sessions only
  - all non-deleted workout history
- All-time trends still include archived program sessions, which preserves long-term training value.
- Added a lightweight `Programs logged` panel on Trends so users can inspect historical program buckets from logged sessions.
- Personal record messages now clearly label records as all-time compound-lift PRs.
- Compound PR detection remains global by default, matching the idea that a true PR is useful across programs.
- Added tests proving:
  - current-program trend scope excludes previous-program sessions
  - all-time trend scope keeps archived but non-deleted sessions
  - PR messages use all-time compound-lift copy
- Verification passed:
  - `npm test -- trendsData userMessages personalRecords`
  - `npm test`
  - `npm run build`
  - `npm --prefix client run lint`

### Phase 10: Reset Current Program Progress
- Add Settings data action to reset the active program.
- Confirm the reset clearly.
- Archive/abandon in-progress sessions.
- Keep completed history unless the user chooses a stronger deletion option.
- Restart dashboard weekly progress.

Phase 10 notes:
- Added a shared `resetProgramHistoryForPreview` helper that:
  - archives the current active program history entry
  - creates a fresh active entry for the same program
  - increments the program version so future sessions attach to a clean progress boundary
- Added `POST /api/workout-plan/reset-progress`.
  - Completed sessions are preserved.
  - In-progress sessions tied to the previous active program history are marked `abandoned`.
  - Legacy in-progress sessions without a `programHistoryId` are also handled when they belong to the current program.
- Added a Settings `Data` accordion with a guarded `Reset current program progress` action.
- Added a confirmation bottom sheet explaining that completed workout history, notes, badges, PR history, and previous programs stay saved.
- Updated the client API and app-data cache flow so the active session sees the fresh program version immediately after reset.
- Added tests proving reset archives the active program and starts a new version while preserving older history.
- Verification passed:
  - `npm test -- workoutProgramHistory`
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 11: Delete Current Plan
- Add Settings data action to delete the active workout plan.
- Return user to welcome/onboarding or plan selection.
- Keep completed sessions archived.
- Prevent stale Dashboard and Plan views from rendering old plan data.

Phase 11 notes:
- Added `DELETE /api/workout-plan/current`.
  - Deletes the active workout plan document owned by the user.
  - Preserves completed workout sessions as historical training data.
  - Marks in-progress sessions for the deleted plan as `abandoned`.
- Added the `deleteCurrentWorkoutPlan` client API helper.
- Added a second Settings `Data` action for deleting the current workout plan.
- Added a dedicated confirmation bottom sheet explaining:
  - active plan is removed
  - in-progress workouts are abandoned
  - completed sessions, logs, notes, badges, and PR history remain saved
- After deletion, Settings clears the cached active workout plan and navigates to `/welcome`.
- Updated Plan routing so users with no active plan are sent to `/welcome` instead of falling through to onboarding.
- Dashboard already respects the shared user-flow destination and redirects away from stale dashboard state when the active plan is gone.
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

### Phase 12: Delete All App Data
- Add the strongest confirmation flow.
- Delete or anonymize profile, settings, workout plan, sessions, and app-specific records.
- Clear local caches and message visibility state.
- Return user to the public/first-run flow.
- Document any Firebase/auth account deletion limitations separately.

Phase 12 notes:
- Added `DELETE /api/profile/app-data`.
  - Deletes the authenticated user's LiftLogic profile record.
  - Deletes user settings.
  - Deletes workout plans.
  - Deletes workout sessions, including completed sessions, notes, badges, and exercise logs.
  - Returns deleted record counts for transparency.
  - Explicitly returns `firebaseAccountDeleted: false` because this endpoint deletes app-owned data, not the Firebase/Google auth account.
- Added the `deleteAllAppData` client API helper.
- Added a critical Settings `Data` action for deleting all LiftLogic app data.
- Added the strongest confirmation sheet in this plan:
  - explains what records are deleted
  - explains Google/Firebase account is not deleted
  - requires typing `DELETE` before the destructive action enables
- Added `clearUserMessageVisibilityState` so dismissed/seen coaching message state is removed during the data wipe.
- After successful deletion, Settings:
  - clears message visibility state
  - signs the user out
  - relies on sign-out cleanup to clear app-data caches and local workout state
  - returns the user to the public start screen
- Verification passed:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

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
