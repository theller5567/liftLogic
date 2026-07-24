# LiftLogic First-Run Intro Screen Plan

## Summary
Add a warm, animated intro screen after a new user signs in and before they enter onboarding questions. The goal is to make the app feel welcoming and intentional instead of immediately dropping the user into a questionnaire.

Recommended direction: combine a **Welcome screen** with a **two-path setup choice**.

Primary path:

- `Build my recommended plan`

Secondary path:

- `Browse plans myself`

Only after the user chooses one of those options should the onboarding questionnaire UI appear.

## Why This Matters
The current first authenticated screen for new users is the onboarding form. Functionally it works, but emotionally it asks for effort before the user has been oriented.

The new intro should:

- Create a smooth transition from login into the app.
- Explain what LiftLogic will do for the user.
- Let the user choose guided setup or plan browsing.
- Hide questionnaire progress UI until the user has intentionally started setup.
- Use motion to make first run feel polished, not heavy.

## Proposed User Flow

### First Visit
1. User lands on public login/splash.
2. User clicks `Continue with Google`.
3. App shows existing auth transition/loading state.
4. If the user has no workout plan, route them to the new intro screen instead of `/onboarding`.
5. Intro screen appears with a short branded animation.
6. User chooses:
   - `Build my recommended plan`
   - `Browse plans myself`
7. User enters onboarding with the chosen mode already selected.

### Returning User
1. User signs in.
2. Existing destination logic remains:
   - reviewed plan -> `/dashboard`
   - unreviewed plan -> `/workout-review`
   - redo onboarding -> `/onboarding?redo=1`

### Resume Draft User
If the user started onboarding but did not submit:

- Prefer resuming `/onboarding` directly if a draft exists.
- Keep the intro only for true first-run users who have not started setup.

## Route Strategy
Add a protected first-run route:

```text
/welcome
```

Update user-flow destinations:

```text
no submitted workout plan and no onboarding draft -> /welcome
no submitted workout plan but draft exists -> /onboarding
unreviewed workout plan -> /workout-review
reviewed workout plan -> /dashboard
```

This keeps `/onboarding` as the questionnaire route and avoids mixing intro content into the form itself.

## Intro Screen Content

### Hero Copy

```text
Welcome to LiftLogic
```

```text
Build a training plan around your schedule, equipment, goals, and experience.
```

### Feature Rows

```text
Smart plan matching
We recommend a program based on your goals, experience, schedule, and equipment.
```

```text
Flexible exercise swaps
If a movement or piece of equipment does not fit, LiftLogic helps you swap it.
```

```text
Progress that carries forward
Your workouts, starting weights, and plan edits stay connected as you train.
```

### Actions
Primary:

```text
Build my recommended plan
```

Secondary:

```text
Browse plans myself
```

Optional tertiary:

```text
Explore exercise library
```

I would skip the tertiary action in v1 unless the screen feels too empty. The main decision should stay focused.

## Animation Direction
Use a mix of Framer Motion and CSS transitions.

### Motion Goals
- Calm, premium, athletic.
- Fast enough that the screen does not feel like a forced splash.
- Useful sequencing: logo, value copy, feature rows, actions.
- Respect `prefers-reduced-motion`.

### Suggested Motion Sequence
1. App logo fades/slides in.
2. Thin blue-to-lime progress line sweeps across once.
3. Headline and subcopy fade upward.
4. Feature rows stagger in.
5. CTA buttons rise/fade in last.

### Suggested Durations
- Logo: 350-450ms
- Line sweep: 500-700ms
- Content stagger: 80-120ms per item
- Buttons: 250-350ms

Avoid long cinematic delays. The user should be able to act quickly.

## State/Data Requirements

### New Local Draft Signal
Use existing onboarding draft storage to decide whether to show intro:

- If no workout plan exists and no draft answers exist, show `/welcome`.
- If draft answers exist, show `/onboarding`.

### Starting Onboarding From Intro
When user selects `Build my recommended plan`:

- Start onboarding with `onboardingMode: "guided"`.
- Navigate to `/onboarding`.

When user selects `Browse plans myself`:

- Start onboarding with `onboardingMode: "browse"`.
- Navigate to `/onboarding`.

Implementation option:

- Pass route state to onboarding:

```ts
navigate("/onboarding", {
  state: { initialAnswers: { onboardingMode: "guided" } },
});
```

Then `Onboarding.tsx` can merge route-state initial answers with existing draft/submitted answers.

Alternative:

- Write a draft answer immediately before navigation.

Route state is cleaner because it avoids writing storage before the user has really begun answering.

## Phase Plan

### Phase 1: Routing And Flow
- Add `/welcome` route.
- Update `UserFlowDestination` to include `/welcome`.
- Update `getUserFlowDestination` and local fallback logic:
  - no plan + no draft -> `/welcome`
  - no plan + draft -> `/onboarding`
- Add tests for first-run, draft-resume, unreviewed-plan, and reviewed-plan destinations.

### Phase 2: Intro Screen Component
- Create `FirstRunWelcome.tsx`.
- Reuse existing app visual language and button component.
- Keep the screen focused on the two setup paths.
- Start onboarding with route state for selected mode.
- Add accessible headings and button labels.

### Phase 3: Animation Polish
- Add Framer Motion entrance sequencing.
- Add a CSS reduced-motion fallback.
- Add a short brand progress-line animation.
- Keep animation non-blocking so buttons are usable immediately.

### Phase 4: Onboarding Integration
- Update `Onboarding.tsx` to accept route-state initial answers.
- If route state includes `onboardingMode`, skip or preselect the first mode step.
- Decide whether the current first onboarding question should remain as a reviewable step or be hidden once mode is chosen from intro.

Recommended v1:

- Keep the question in config, but initialize the answer so the user can continue naturally.
- Later polish can skip the already answered mode step entirely if desired.

### Phase 5: Visual QA
- Check mobile 320px, 375px, and desktop shell width.
- Confirm no content is hidden behind bottom nav.
- Confirm intro does not show to returning users.
- Confirm draft users resume onboarding.
- Confirm redo onboarding from Settings still opens questionnaire directly.

## Test Plan
- Fresh authenticated user with no plan and no draft lands on `/welcome`.
- Fresh user clicking `Build my recommended plan` enters onboarding with guided mode selected.
- Fresh user clicking `Browse plans myself` enters onboarding with browse mode selected.
- User with draft onboarding data lands on `/onboarding`, not `/welcome`.
- User with unreviewed workout plan lands on `/workout-review`.
- User with reviewed workout plan lands on `/dashboard`.
- `/onboarding?redo=1` still works from Settings.
- Animations respect reduced-motion preferences.
- Run:
  - `npm --prefix client run lint`
  - `npm test`
  - `npm run build`

## Open Decisions
- Should the intro screen include the top app shell/header, or should it be a focused full-screen setup screen?
- Should selecting a mode skip the first onboarding mode question entirely?

## Phase 1-5 Execution Notes
- Added the protected `/welcome` route as the first-run destination for authenticated users who do not have a workout plan and do not have an onboarding draft.
- Updated user-flow destination logic so draft users resume `/onboarding`, unreviewed plans still go to `/workout-review`, and reviewed plans still go to `/dashboard`.
- Created `FirstRunWelcome.tsx` with a focused two-path intro: `Build my recommended plan` and `Browse plans myself`.
- Used Framer Motion for a short logo, progress-line, content, feature-row, and CTA entrance sequence while respecting reduced-motion preferences.
- Starting from the intro writes a small onboarding draft with the selected setup mode and skips the already-answered mode step. This prevents the route guard from bouncing a new user back to `/welcome` and keeps draft resume behavior simple.
- Updated onboarding initialization so API-backed first-run users can load draft answers and draft step position before submitting a workout plan.
- Added user-flow tests for first-run welcome routing and draft resume routing.
- Verified with `npm test -- userFlow`, `npm --prefix client run lint`, `npm test`, and `npm run build`.
- Should `Browse plans myself` go directly to the plan browser step, or simply preselect browse mode and continue through the remaining setup questions?

## Recommendation
For v1:

- Use a focused full-screen intro without bottom navigation.
- Preselect `onboardingMode` from the intro.
- Keep users inside the normal onboarding sequence after that.
- Do not jump directly to the plan browser yet, because schedule, experience, and equipment still improve plan browsing and substitutions.
