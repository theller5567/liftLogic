# LiftLogic Finishing Touches Roadmap

## Purpose
This roadmap captures final polish work for LiftLogic before adding more major features. The work should be executed in small sections, not all at once, so each pass can be reviewed, tested, and adjusted independently.

The goal is to make the app feel more reliable, consistent, and production-ready without changing the core product direction.

## Recommended Execution Approach
Use one phase per branch or pull request when possible. Each phase should include its own focused test pass and visual review.

Do not combine unrelated polish work just because it is small. A good finishing pass should be easy to understand, easy to test, and easy to revert if something feels off.

## Phase 1: Loading, Empty, Error, and Success State Consistency

### Goal
Make every loading, empty, error, retry, and success state feel like it belongs to the same app.

### Scope
- Replace remaining plain loading text with shared loading/skeleton components.
- Standardize page-level error states with clear retry actions.
- Standardize inline error messages for forms and panels.
- Standardize success messages for saved/synced actions.
- Use consistent copy patterns for:
  - Loading
  - Reconnecting
  - Saved locally
  - Synced
  - Sync failed
  - Retry

### Priority Areas
- Dashboard
- Plan
- Workout review
- Workout session pages
- Settings
- Exercise Library
- Exercise Details

### Acceptance Criteria
- No visible bare `Loading...` text remains.
- Retryable failures have a clear action.
- Cached-content refresh states do not blank the page.
- Success/error copy is short, specific, and user-friendly.

## Phase 2: Account and Sign-Out Polish

### Goal
Make account actions easy to find without making destructive actions too easy to trigger accidentally.

### Scope
- Keep the avatar account sheet as the primary quick account menu.
- Add sign-out confirmation before completing sign out.
- Keep Settings > Account as a secondary sign-out location.
- Confirm sign-out routes always return users to the public landing screen.
- Ensure the account sheet works cleanly on mobile and desktop shell widths.

### Acceptance Criteria
- Tapping Sign out opens confirmation.
- Accidental sign out is difficult.
- Confirmed sign out lands on `/`.
- `/login` remains only as a compatibility redirect unless removed in a later cleanup.

## Phase 3: Button, Icon, and Action Hierarchy Audit

### Goal
Make actions visually predictable across the entire app.

### Color Semantics
- Lime: primary action, brand, success/completed.
- Blue: active/current state, secondary action, data emphasis.
- Gray/white: neutral utility actions.
- Red: destructive actions, errors, warnings only.

### Scope
- Audit all `Button` usages.
- Ensure icon colors inherit button text color unless intentionally branded.
- Normalize icon sizes by context.
- Avoid mixing detailed filled icons with thin outline icons in the same row unless intentionally styled.
- Add or refine a danger/destructive button style only if needed.

### Acceptance Criteria
- Primary actions are consistently lime.
- Secondary/current states are consistently blue.
- Sign-out and other destructive actions are clearly distinct.
- Custom SVG icons do not unexpectedly render black.

### Phase 3 Pass Notes
- Added shared `danger`/`error` button tones for destructive and error actions.
- Updated sign-out actions to use the destructive red tone instead of neutral gray.
- Updated onboarding Next/Finish to use the primary lime action style.
- Kept blue for secondary/current-state actions and alternate navigation.

## Phase 2.5: Icon Asset Normalization

### Goal
Make imported SVG icons feel consistently sized before auditing every button and action.

### Scope
- Normalize the SVGs used by the shared `Button` component first.
- Remove fixed root `width` and `height` attributes where CSS should control sizing.
- Prefer clean `viewBox` values without extra invisible padding.
- Preserve intentional branded or two-tone icons, such as Google and circular plus/minus icons.
- Avoid a noisy bulk rewrite of every legacy icon until each usage context can be checked.

### Acceptance Criteria
- Button `iconSize` values produce visually consistent icons.
- Icons inherit button color without turning unexpectedly black.
- Two-tone icons keep their inner glyph contrast.
- SVG imports continue to compile through lint and build.

## Phase 4: Exercise Detail Navigation Polish

### Goal
Make exercise education feel integrated instead of feeling like the user was pulled away from their workflow.

### Scope
- Confirm detail-page return behavior from:
  - Exercise Library
  - Plan
  - Workout Review
  - Active Workout
- Ensure return labels are clear.
- Consider using a detail sheet for workout context later if full-page navigation still feels disruptive.
- Make sure exercise detail pages handle missing descriptions gracefully.

### Acceptance Criteria
- Users can inspect an exercise and return to exactly where they came from.
- Back/return behavior does not unexpectedly land users in the Exercise Library.
- Missing detail content does not break the page.

### Phase 4 Pass Notes
- Updated exercise detail return behavior to prefer explicit route state, then browser history, then the Exercise Library fallback.
- Exercise Library cards now pass their own return state so the detail page can label the return action clearly.
- Existing Plan, Workout Review, and Active Workout links continue passing workflow-specific return targets.

## Phase 5: Settings Information Architecture Pass

### Goal
Make Settings easier to scan and less overwhelming.

### Scope
- Keep most accordions closed by default.
- Consider moving high-value account and equipment actions closer to the top.
- Make equipment inventory easier to scan.
- Review form labels, helper copy, and disabled states.
- Ensure save button state clearly communicates:
  - No changes
  - Unsaved changes
  - Saving
  - Saved
  - Failed

### Acceptance Criteria
- Settings feels calm on mobile.
- Common actions are easy to find.
- Advanced controls do not dominate the page.
- Save state is obvious.

### Phase 5 Pass Notes
- Moved Account and Equipment above Program so common account access and plan-affecting equipment controls are easier to find.
- Added a compact settings overview and explicit save-state panel for clean, dirty, saving, and failed states.
- Made the disabled save button neutral so lime remains reserved for available primary actions.
- Softened selected equipment styling so inventory choices read as selected items instead of primary actions.

## Phase 6: Mobile Tap Target and Layout QA

### Goal
Make the app feel comfortable on real mobile screens.

### Scope
- Check tap targets for:
  - Bottom navigation
  - Icon buttons
  - Calendar days
  - Workout tabs
  - Exercise cards
  - Set cards
  - Accordions
- Review layouts at:
  - 320px width
  - 375px width
  - 430px width
  - Desktop shell width
- Confirm bottom navigation does not cover important content.

### Acceptance Criteria
- Primary controls are comfortable to tap.
- Text does not overflow or overlap.
- Horizontal scrolling areas clearly behave as scrollable where needed.
- Bottom nav feels integrated but does not visually overpower content.

### Phase 6 Pass Notes
- Raised compact button and icon-only minimum hit areas so small actions are easier to tap on mobile.
- Improved AppShell header and bottom navigation behavior at narrow widths, including safer avatar/name sizing.
- Added narrow-screen fallbacks for Calendar, Dashboard, Exercise Library, Workout Preview, Workout list, and active Workout Exercise layouts.
- Made horizontally scrollable workout tabs/set tiles more touch-friendly and less likely to obscure content.
- Added wrap-safe treatment for Exercise Library load actions and dashboard workout-switch controls.

## Phase 7: Production Sanity Pass

### Goal
Verify real user journeys before declaring the app polished.

### Test Scenarios
- Fresh user creates an account.
- Fresh user completes onboarding.
- Returning user logs in.
- User logs out and logs back in.
- User returns after idle time.
- Slow network or failed profile load.
- Empty workout history.
- No equipment selected.
- Equipment mismatch in generated plan.
- Exercise swap with alternatives.
- Exercise swap without alternatives.
- Workout completion.
- Settings save success and failure.

### Acceptance Criteria
- Each scenario has a clear path forward.
- No page traps the user.
- No action fails silently.
- The app feels coherent from first screen to active workout.

## Suggested Order
1. Phase 1: Loading, Empty, Error, and Success State Consistency
2. Phase 2: Account and Sign-Out Polish
3. Phase 2.5: Icon Asset Normalization
4. Phase 3: Button, Icon, and Action Hierarchy Audit
5. Phase 5: Settings Information Architecture Pass
6. Phase 4: Exercise Detail Navigation Polish
7. Phase 6: Mobile Tap Target and Layout QA
8. Phase 7: Production Sanity Pass

Phase 7 should happen after the major polish passes, but smaller sanity checks should still happen after each phase.
