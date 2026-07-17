# LiftLogic Animation and Motion Roadmap

## Purpose
Add motion throughout LiftLogic so the app feels smoother, more responsive, and easier to follow while users navigate, load content, change tabs, open sheets, and complete workout actions.

The goal is not to make the app flashy. Motion should feel athletic, fast, and useful. It should guide attention, confirm actions, and reduce the feeling of abrupt screen changes.

## Motion Principles
- Fast and functional: Most transitions should complete in 120-260ms.
- Directional: Navigation should imply where the user is going, especially forward/back flows.
- Lightweight: Prefer opacity, transform, and scale over layout-heavy animation.
- Consistent: Similar interactions should move the same way across the app.
- Respectful: Support `prefers-reduced-motion` and keep critical flows usable without animation.
- Never block: Animation should not delay saving, logging, navigation, or data loading.

## Shared Motion Tokens

### Suggested Durations
- Micro interaction: `120ms`
- Standard transition: `180ms`
- Page/content transition: `240ms`
- Sheet/modal transition: `260ms`

### Suggested Easings
- Standard: `ease-out`
- Enter: `cubic-bezier(0.16, 1, 0.3, 1)`
- Exit: `cubic-bezier(0.7, 0, 0.84, 0)`
- Press/tap feedback: `cubic-bezier(0.2, 0, 0, 1)`

### Suggested Patterns
- Page enter: fade + slight upward movement.
- Page exit: quick fade.
- Cards/lists: small stagger only where it helps scanability.
- Buttons: subtle press scale, hover lift only on pointer devices.
- Bottom sheets: slide up + fade overlay.
- Tabs/day changes: horizontal slide or fade depending on context.

## Phase 1: Motion Foundations

### Goal
Create a shared motion system before adding animations page by page.

### Scope
- Add shared CSS motion tokens for duration, easing, distance, and reduced-motion behavior.
- Add reusable utility classes or SCSS mixins for:
  - fade in
  - slide up
  - press feedback
  - skeleton shimmer or loader motion
  - reduced-motion override
- Audit existing Framer Motion usage and decide where it should remain.
- Confirm whether app-wide route transitions should use Framer Motion or CSS-only transitions.

### Acceptance Criteria
- Motion tokens exist in one shared place.
- Reduced-motion behavior is centralized.
- Existing animations still work.
- No page has custom one-off timing unless there is a clear reason.

## Phase 2: Route and Page Transitions

### Goal
Make moving between main app pages feel intentional instead of abrupt.

### Scope
- Add transitions for primary routes:
  - Dashboard
  - Plan
  - Library
  - Trends
  - Settings
  - Calendar
- Keep transitions subtle: fade and small vertical movement.
- Avoid animating the AppShell header and bottom navigation on every route change.
- Preserve scroll behavior and avoid weird jumps.
- Add reduced-motion fallback.

### Acceptance Criteria
- Main page content transitions smoothly.
- Header and bottom nav remain stable.
- Back/forward navigation does not feel disorienting.
- Reduced-motion users see instant page changes.

## Phase 3: Loading and Empty-State Motion

### Goal
Make loading content feel alive without making the app feel slower.

### Scope
- Add consistent motion to shared loading states:
  - page loader
  - inline loading state
  - button saving/loading states
  - load-more exercises state
- Consider lightweight skeleton states for content-heavy areas:
  - Dashboard workout card
  - Exercise Library results
  - WorkoutPreview cards
- Animate empty/error/success states with subtle fade-in.

### Acceptance Criteria
- Loading states feel consistent across the app.
- Motion does not hide real loading delays.
- Users can clearly tell when something is still loading.
- Error states remain readable and accessible.

## Phase 4: Navigation and Selection Feedback

### Goal
Improve feedback when users choose tabs, days, filters, and navigation items.

### Scope
- Add active-state motion for:
  - bottom navigation
  - dashboard week selector
  - calendar selected day
  - workout preview day tabs
  - plan workout tabs
  - exercise library filters
- Add subtle button press feedback for tappable controls.
- Keep active-state motion consistent: blue active states should feel related across pages.

### Acceptance Criteria
- Selection changes are easy to follow.
- Tap/click feedback feels immediate.
- No controls shift layout when selected.
- Focus-visible states remain obvious.

## Phase 5: Workout Flow Motion

### Goal
Make active workout interactions feel satisfying and clear.

### Scope
- Add motion for:
  - logging a set
  - current set expanding/collapsing
  - completed set state
  - next exercise transition
  - rest timer appearing
  - progress bar changes
- Keep the workout flow fast; no animation should slow down logging.
- Consider small completion feedback when an exercise or workout is finished.

### Acceptance Criteria
- Set logging gives clear feedback.
- Completed/current/inactive set states are visually distinct.
- Progress changes feel responsive.
- Users can rapidly log sets without fighting animation.

### Phase 5 Pass Notes
- Added token-driven motion to active workout progress bars, today set tiles, active set panels, completed set states, and rest timer reveal.
- Added quick press feedback to workout steppers so weight/reps changes feel immediate without delaying the action.
- Smoothed workout list progress and completed-exercise feedback with small completion pulses and check icon motion.
- Added reduced-motion fallbacks so workout actions remain clear without nonessential animation.

## Phase 6: Sheets, Modals, and Editors

### Goal
Make overlays feel consistent and easier to follow.

### Scope
- Standardize BottomSheet open/close animation.
- Add consistent editor transitions for:
  - account sheet
  - sign-out confirmation
  - workout review swap sheet
  - weight editor
  - focus block review choices
- Ensure overlay animation does not trap focus or delay close actions.

### Acceptance Criteria
- Sheets open and close consistently.
- Overlay transitions feel connected to the triggering action.
- Keyboard and screen-reader behavior remains correct.
- Reduced-motion users are not forced through slide animations.

### Phase 6 Pass Notes
- Standardized `BottomSheet` motion with a shared overlay fade, sheet slide/scale entrance, and subtle content/action reveal.
- Improved sheet keyboard behavior by focusing the dialog on open, preserving Escape-to-close, locking background scroll, and restoring the previously focused control on close.
- Added reduced-motion-safe sheet behavior so overlays appear instantly without forced slide motion.
- Smoothed workout-review editor sections and exercise swap option selection with token-driven reveal/selection feedback.

## Phase 7: Exercise Library and Detail Polish

### Goal
Make browsing and reading exercise information feel smoother.

### Scope
- Animate exercise cards entering after search/filter/load-more changes.
- Add subtle card hover/press feedback.
- Animate filter drawer/panel open and close.
- Add detail-page content reveal for description sections.
- Avoid heavy stagger animations for large result sets.

### Acceptance Criteria
- Search/filter updates feel responsive.
- Load-more results appear smoothly.
- Exercise details feel less abrupt.
- Performance stays good with the full exercise library.

### Phase 7 Pass Notes
- Added lightweight result reveal motion to the Exercise Library after search, filter, and load-more changes, capped to the first visible cards so large result sets stay fast.
- Updated exercise card hover, press, and chevron motion to use shared motion tokens.
- Added staggered detail-page section reveals for summary and description panels so exercise information appears less abruptly.
- Added reduced-motion fallbacks for library cards, detail sections, and loading spinner motion.

## Phase 8: Motion QA and Performance Pass

### Goal
Verify that motion improves feel without hurting performance or accessibility.

### Test Scenarios
- Fresh login to Dashboard.
- Main nav between Dashboard, Plan, Library, Trends.
- Open and close account sheet.
- Open Settings and expand accordions.
- Search and filter Exercise Library.
- Load more Exercise Library results.
- Open exercise detail and return.
- Start workout.
- Log multiple sets quickly.
- Finish an exercise.
- Finish a workout.
- Simulate slow network/loading states.
- Test with `prefers-reduced-motion`.

### Acceptance Criteria
- Animations feel smooth on mobile.
- No layout shift or content overlap is introduced.
- No important action is delayed by animation.
- Reduced-motion mode removes nonessential motion.
- Lint, tests, and build pass.

### Phase 8 Pass Notes
- Audited motion usage for large-list performance, reduced-motion behavior, layout-shift risk, and one-off timing values.
- Standardized remaining accordion and onboarding progress transitions around the shared motion tokens.
- Added explicit reduced-motion handling for local loading spinners in buttons, page loaders, and inline status components.
- Verified the motion pass with lint, unit tests, and production build.

## Implementation Notes
- Prefer CSS transitions for simple hover, press, focus, active, and reveal effects.
- Use Framer Motion only where component enter/exit sequencing is genuinely useful.
- Avoid animating height when possible; use opacity/transform or measured layouts sparingly.
- Avoid large staggered animations on long lists.
- Do not animate critical save/auth state in a way that hides errors or delays navigation.
- Keep route animation inside the content area, not the full AppShell.

## Suggested Execution Order
1. Phase 1: Motion Foundations
2. Phase 2: Route and Page Transitions
3. Phase 3: Loading and Empty-State Motion
4. Phase 4: Navigation and Selection Feedback
5. Phase 6: Sheets, Modals, and Editors
6. Phase 5: Workout Flow Motion
7. Phase 7: Exercise Library and Detail Polish
8. Phase 8: Motion QA and Performance Pass

## Phase Pass Notes
Add notes here after each phase is completed. Keep them short and focused on what changed, why it changed, and any follow-up work discovered.

### Phase 1 Pass Notes
- Added shared CSS motion tokens for timing, easing, distance, shimmer, fade, slide-up, press feedback, and reduced-motion behavior.
- Added `client/src/utils/motion.ts` so Framer Motion components can share the same durations, easings, transitions, and variants.
- Standardized existing BottomSheet and WorkoutPreview Framer Motion transitions around the shared helpers.
- Updated the shared Button transition timing to use the new motion tokens.
- Existing Framer Motion usage remains appropriate for BottomSheet, WorkoutPreview day changes, and the public landing page.

### Phase 2 Pass Notes
- Added AppShell content-area route transitions with Framer Motion so page content fades/slides while the header and bottom navigation stay visually steady.
- Keyed transitions by `location.pathname` to animate route changes without reacting to every query-string update.
- Used the shared page transition and reduced-motion helpers from `client/src/utils/motion.ts`.
- Kept the implementation scoped to the AppShell content area instead of refactoring the full route layout in this pass.

### Phase 3 Pass Notes
- Added shared fade/slide motion to `LoadingSpinner`, `PageLoadingState`, and `InlineStatus` so loading, empty, and error states enter consistently.
- Added subtle shimmer support to inline loading states and kept reduced-motion behavior controlled by the global motion utilities.
- Added an optional `loading` prop to the shared `Button` component with a consistent inline spinner and `aria-busy` state.
- Wired button loading feedback into high-friction pending actions: dashboard workout start, settings save, workout review completion choices, active set logging, exercise completion, and workout completion.
- Polished Exercise Library load-more loading feedback with shared fade-in motion.

### Phase 4 Pass Notes
- Added animated active indicators and press feedback to the bottom navigation while keeping nav item layout stable.
- Standardized selected-day feedback across Dashboard and Calendar with token-based transitions, subtle glow, and tap scaling.
- Added active underline/press feedback to WorkoutPreview day tabs used by Plan and Workout Review.
- Improved Exercise Library search/filter feedback with focus glow, animated filter panel reveal, active filter fade-in, and selected filter-menu styling.
- Added shared button active feedback so common controls respond consistently to touch/click.
