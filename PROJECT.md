# LiftLogic Project Map

## Purpose

LiftLogic helps users create, review, and follow personalized strength training programs. The app starts with Google auth, collects onboarding details, generates a starter program, lets the user review or edit it, and then routes them into a dashboard for following the plan.

## Current Functionality

- Google authentication through Firebase.
- Protected routing for onboarding, workout review, and dashboard pages.
- Public-only routing for landing and login screens once a user is authenticated.
- Onboarding flow for goals, experience, equipment, units, and anchor lifts.
- Generated workout preview based on onboarding answers.
- Editable workout preview before the program is accepted.
- Dashboard routing based on workout plan state:
  - no plan: onboarding
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
   - missing plan -> onboarding
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
- Calendar and workout history:
  - planned workout dates
  - completed-day indicators
  - per-date workout logs
  - week/month/year views
- Trends:
  - activity and consistency graphs
  - strength progression
  - volume or performance summaries
- Settings/setup:
  - profile name and avatar controls
  - weight unit preference
  - redo onboarding flow
  - account/session controls

## Suggested Future Data Models

### Exercise Logs

Exercise logs are currently nested inside workout sessions. They capture:

- `exerciseId`
- `exerciseLabel`
- `sets`
- `reps`
- `weight`
- `weightUnit`
- `completed`
- `notes`

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
