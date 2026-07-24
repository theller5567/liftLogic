# LiftLogic Project Map

## Purpose

LiftLogic helps users train with progressive overload by remembering what happened in each workout and using that history to guide the next one. The app should make it easy to see what was planned, what was actually performed, what improved, what stalled, and what should happen next.

The app starts with Google auth, welcomes first-time users into setup, collects onboarding details, generates a starter program, lets the user review or edit it, and then routes them into a dashboard for following the plan. Long term, the recommendation system should rely less on static onboarding answers and more on real training behavior: completed sets, missed reps, skipped exercises, performance trends, recovery signals, and exercise preferences.

## Product North Star

LiftLogic is not just a workout template picker or a workout log. It is a training memory system.

The core promise:

> LiftLogic tracks your sets, reps, weights, exercise choices, and workout outcomes so each future session can be more informed than the last.

Every major feature should support one or more of these goals:

- Help the user know what to do today.
- Help the user understand what happened last time.
- Help the user progress safely through weight, reps, sets, exercise selection, or recovery.
- Help the user recognize when a lift, muscle group, or plan needs adjustment.
- Help the user stay consistent without feeling overwhelmed.

## Original Product Intent

This section should preserve the early prompts and ideas that shaped the app. Add the original AI prompts here when available so future design and engineering decisions can stay connected to the reason LiftLogic was created.

### Distilled Intent

- Emphasize progressive overload.
- Track what happens during workouts in enough detail to assist future workouts.
- Use workout history to make future recommendations smarter, safer, and more personal.
- Start with hypertrophy-focused and strength-focused training paths.
- Use onboarding to understand goals, body measurements, experience, and training context.
- Let users edit onboarding/profile information later as their goals, body, equipment, or schedule changes.
- Treat workout logging as one of the most important parts of the app, not a secondary feature.
- Allow notes at both the workout level and exercise level.
- Help users decide whether to increase weight, repeat the same load, or stay conservative based on previous performance.
- Warn users when they try to increase weight after failing to complete the planned sets or reps last time.
- Support exercise and workout badges such as `improve form`, `felt great`, or `feeling weak`.
- Track actual rest time between sets, even when the app provides suggested timers.
- Make logged training details useful for the next time the user performs the same exercise.

### Original Prompt 1

> I am wanting to create a workout app using React. This app will make use of AI. I plan to start off with two different workout routines. The 1st workout routine is to get the body in good shape and use more hypertrophy exercises. The second workout routine will be more for strength gain. Both of these workouts will be based heavily on progressive overload. I am not asking you to create these workout routines, i will give them to you later. When a user first comes to the app they will need to create an account and then login. THey will be presented with a getting started screen upon first logging in that will ask for basic knowledge of there goals and body measurements. This information can be edited at anytime later if needed. Right now i am mainly asking for other suggestions for features for this app or any thoughts based on the information i have provided you so far.

### Original Prompt 2

> I think one of the more important parts of the app will be the workout logging. workout log will allow the user to right notes next to every exercise and a overall workout note. the ability to decide if the user wants to go up in weight on the next time they perform the exercise or current exercise(if the user was not able to perform the correct sets at the required weight to proceed in increasing the weight a popup will show asking the user to confirm and let them know they did not finish all the sets with the current weight last time they did the exercise and urge them to remain at current weight until they can perform all the reps and sets before increasing weight.) Allow users to attach badges to each exercise and workout(example: improve form, felt great!, feeling weak, etc..). the log should allow the user to record the rest time the user actually used between sets and reps even though the app will automatically set these timers based on workout and exercise automatically. In my opinion one of the biggest steps to success when trying to gain muscle is recording every workout and exercise in great detail to better inform you on how you should attack you next workout or the next time you perform a specific exercise. do you have any additional thoughts on this?

## Current Functionality

- Google authentication through Firebase.
- Protected routing for onboarding, workout review, and dashboard pages.
- Public-only routing for landing and login screens once a user is authenticated.
- Onboarding flow for goals, experience, equipment, units, and anchor lifts.
- Generated workout preview based on onboarding answers.
- Editable workout preview before the program is accepted.
- Dashboard routing based on workout plan state:
  - no plan and no onboarding draft: first-run welcome
  - no plan with onboarding draft: onboarding
  - plan not reviewed: workout review
  - reviewed plan: dashboard
- Workout session API foundation for in-progress and completed workout logs.
- Mongo-backed user profiles and workout plans.
- API-disabled localStorage fallback for local development without the server.

## Current Data Model

### Firebase Identity

Firebase is the source of truth for authenticated identity. The client sends Firebase ID tokens to the API as bearer tokens. The API verifies tokens with Firebase Admin and maps the Firebase UID to the app `clientId`.

### `userProfiles`

Mongo collection for app user identity and profile metadata. A profile is created or updated when `/api/profile/current` is called after verified auth.

Current profile fields include:

- `clientId`: Firebase UID for authenticated users.
- `authProvider`: currently `firebase` or `anonymous`.
- `authUserId`: Firebase UID.
- `email`
- `emailVerified`
- `displayName`
- `photoUrl`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### `WorkoutPlan`

Mongo collection for a user's accepted starter program state.

Current plan fields include:

- `clientId`: ties the plan to the profile/Firebase UID.
- `onboardingAnswers`: submitted onboarding data.
- `suggestedPreview`: generated plan from onboarding answers.
- `editedPreview`: optional user-edited version of the plan.
- `workoutReviewed`: controls whether the user can enter the dashboard.
- `createdAt`
- `updatedAt`

### `workoutSessions`

Mongo collection for actual performed workout history. Sessions are separate from `WorkoutPlan` so the plan can evolve while completed logs remain historically accurate.

Current session fields include:

- `clientId`: ties the session to the profile/Firebase UID.
- `workoutPlanId`: references the plan used when the session started.
- `programId`, `programDayId`, `programDayLabel`
- `scheduledFor`, `startedAt`, `completedAt`
- `status`: `in_progress`, `completed`, or `abandoned`
- `workoutSnapshot`: copy of the workout day and planned exercises at start time
- `completionPercentage`, `completedExerciseCount`, `totalExerciseCount`
- workout-level `notes`, `badgeIds`, `durationSeconds`
- `exerciseLogs`: detailed performed exercise and set data

### Local Storage

Local storage is used for API-disabled development and draft onboarding state. It should not be treated as canonical account data when the API is enabled.

Current local storage responsibilities:

- onboarding draft answers
- onboarding draft step index
- submitted onboarding answers for API-disabled mode
- edited workout preview for API-disabled mode
- workout reviewed flag for API-disabled mode
- anonymous local client id for smoke-test/pre-auth fallback

## How Data Fits Together

1. User authenticates with Google.
2. Client stores a Firebase token provider.
3. Client calls `/api/profile/current`.
4. Server verifies the token and upserts `userProfiles` by Firebase UID/clientId.
5. Server returns the profile and current `WorkoutPlan`.
6. Client routes based on the plan:
   - missing plan and no onboarding draft -> first-run welcome
   - missing plan with onboarding draft -> onboarding
   - unreviewed plan -> workout review
   - reviewed plan -> dashboard
7. Onboarding submission creates or replaces the user's `WorkoutPlan`.
8. Workout review marks `workoutReviewed` true.
9. Dashboard reads the reviewed plan and derives the first plan-based UI from it.
10. Workout session endpoints save in-progress and completed workout logs for future dashboard, calendar, and trends features.

## Dashboard Milestones

### Current Dashboard Slice

- Mobile-first app shell.
- Profile header using profile name and avatar.
- Bottom navigation.
- Weekly selector derived locally.
- Today's workout card derived from the reviewed plan.
- Placeholder pages for calendar, trends, setup, and workout logging.

### Next Planned Functionality

- Workout logging:
  - active workout page
  - set, rep, weight, and completion logging
  - connect the workout page UI to the workout session API
- Progressive overload guidance:
  - compare today's targets against the user's previous performance
  - recommend when to increase weight, add reps, repeat the same load, or reduce load
  - explain the recommendation in plain language
  - account for missed sets, failed reps, skipped movements, notes, and user feedback
- Calendar and workout history:
  - planned workout dates
  - completed-day indicators
  - per-date workout logs
  - week/month/year views
- Trends:
  - activity and consistency graphs
  - strength progression
  - volume or performance summaries
  - stalled-lift and improving-lift callouts
  - muscle-group or movement-pattern progress summaries
- Settings/setup:
  - profile name and avatar controls
  - weight unit preference
  - redo onboarding flow
  - account/session controls

## Suggested Future Data Models

### Exercise Logs

Exercise logs are currently nested inside workout sessions. They are the foundation for progressive overload recommendations and should capture enough detail to reconstruct what happened in a workout later.

They capture:

- `exerciseId`
- `exerciseLabel`
- `sets`
- `reps`
- `weight`
- `weightUnit`
- `completed`
- `notes`

Future exercise log improvements:

- per-set difficulty or RPE
- failed reps or missed target reason
- pain/discomfort flags
- exercise substitutions made during the session
- whether the user wants to avoid or keep an exercise next time
- recommendation outcome, such as `increase_weight`, `add_reps`, `repeat`, or `reduce_load`

### User Preferences

Can live in `userProfiles` initially, then move out if it grows.

Likely fields:

- `weightUnit`
- `displayName`
- `avatarPreference`
- `onboardingVersion`
- `notificationPreferences`

### Trend Aggregates

Prefer deriving trends from workout sessions first. Add stored aggregates only if runtime queries become expensive.

Likely aggregate examples:

- weekly workout count
- completed sets
- total volume
- exercise estimated strength
- consistency streaks
- progression streaks by exercise
- stalled lifts
- skipped or disliked exercises
- muscle-group volume over time

## Development Workflow

- Start work from latest `main`.
- Use short-lived branches such as `Dashboard`, `codex/<task-name>`, or `feature/<task-name>`.
- Keep PRs focused enough to review.
- Run validation before pushing:

```bash
npm --prefix client run build
npm --prefix server run build
```

- Open a pull request into `main`.
- Include a PR description covering what changed, why it changed, and how it was validated.
