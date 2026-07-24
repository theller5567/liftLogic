# LiftLogic Plate Inventory Settings Plan

## Summary

Move plate and barbell setup into Settings so the in-workout Plate Calculator can
become a fast, focused loading tool. The calculator should use the user's saved
barbell, unit, and available plate inventory by default, then show a clear link
back to Settings when the user needs to update equipment.

## Problems To Solve

### 1. Calculator Has Too Much Setup

The Plate Calculator currently asks for unit and barbell weight inside the
workout flow. During a workout, that is extra friction. The user usually wants
one thing:

```text
I need 185 lb. What plates go on each side?
```

### 2. Plate Inventory Belongs In Settings

The user's plates and bar type are durable preferences. They should live with
other equipment settings and sync with the user's profile/settings data.

### 3. Barbell Weight Needs Better Defaults

The default should be a 45 lb Olympic barbell. The user should also be able to
choose a women's Olympic barbell, which is 15 kg / about 33 lb, or manually enter
a custom bar weight.

## Proposed User Flow

### Settings Flow

Add a new Settings section called `Plate Loading` or `Barbell + Plates`.

The section should include:

- Preferred loading unit:
  - `lb`
  - `kg`
- Barbell preset:
  - `Olympic barbell` - 45 lb / 20 kg
  - `Women's Olympic barbell` - 33 lb / 15 kg
  - `Custom bar`
- Custom barbell weight input:
  - Visible only when `Custom bar` is selected.
  - Stores the value in the selected unit.
- Plate inventory editor:
  - Preset rows for common plates.
  - Stepper controls for counts.
  - Option to add a custom plate size.

Recommended default lb plates:

```text
45, 35, 25, 10, 5, 2.5
```

Recommended default kg plates:

```text
25, 20, 15, 10, 5, 2.5, 1.25
```

Counts should represent total plates on hand, not pairs. The calculator can
derive pairs with `Math.floor(count / 2)`.

### Workout Flow

When opened from an active set:

- Plate Calculator receives the set's current target weight.
- It reads saved settings for:
  - Unit.
  - Barbell weight.
  - Plate inventory.
- It calculates immediately when possible.
- It does not show unit or barbell inputs by default.
- It shows a small action link:

```text
Edit plates in Settings
```

That link should take the user directly to Settings with a plate-loading anchor,
for example:

```text
/settings#plate-loading
```

## Data Model

Extend `UserSettings` with a plate-loading configuration.

Suggested shared types:

```ts
export type PlateLoadingUnit = "lb" | "kg";

export type BarbellPreset = "olympic_mens" | "olympic_womens" | "custom";

export type PlateInventoryItem = {
  size: number;
  count: number;
};

export type PlateInventorySettings = {
  unit: PlateLoadingUnit;
  barbellPreset: BarbellPreset;
  customBarbellWeight?: number;
  plates: Record<PlateLoadingUnit, PlateInventoryItem[]>;
};
```

Default settings:

```ts
{
  unit: "lb",
  barbellPreset: "olympic_mens",
  plates: {
    lb: [
      { size: 45, count: 8 },
      { size: 35, count: 2 },
      { size: 25, count: 2 },
      { size: 10, count: 2 },
      { size: 5, count: 4 },
      { size: 2.5, count: 2 },
    ],
    kg: [
      { size: 25, count: 4 },
      { size: 20, count: 4 },
      { size: 15, count: 2 },
      { size: 10, count: 4 },
      { size: 5, count: 4 },
      { size: 2.5, count: 4 },
      { size: 1.25, count: 4 },
    ],
  },
}
```

Barbell preset weights:

```ts
{
  olympic_mens: { lb: 45, kg: 20 },
  olympic_womens: { lb: 33, kg: 15 },
}
```

## Plate Calculator Changes

The calculator should become more compact.

### Remove From Main Calculator UI

- Unit toggle.
- Barbell weight input.
- Inventory strip, unless useful as a collapsed details row.

### Keep In Main Calculator UI

- Target weight input, prefilled from the active set when opened from a workout.
- Plate breakdown result.
- Warning if exact loading is impossible with saved inventory.
- Link to Settings plate inventory.

### Optional Advanced Controls

Use a collapsed `Details` or small secondary action for:

- Temporarily override target weight.
- Temporarily override barbell weight.
- Show available plates.

This keeps the default workout experience sleek while still letting the user fix
edge cases without leaving the sheet.

## Algorithm Improvements

### Exact Match First

The current greedy algorithm is good for normal gym inventories, but it can miss
exact combinations in odd inventories. Add a bounded exact-combination search
before falling back to greedy.

Example:

```text
Target per side: 37.5 lb
Inventory: 25s, 10s, 2.5s
Exact result: 25 + 10 + 2.5
```

### Show Closest Load

If exact loading is impossible:

- Show closest load under target.
- Show closest load over target if available.
- Let the user choose.

Example copy:

```text
Exact loading is not possible with your saved plates.
Closest under: 182.5 lb
Closest over: 187.5 lb
```

### Pair Awareness

Continue calculating per side using pairs. If the user has an odd count of a
plate size, the extra single plate should not be used for normal balanced
barbell loading.

## Phase 1: Settings Types And Defaults

### Tasks

- Add `PlateInventorySettings` types to shared user settings.
- Add default plate-loading settings to `DEFAULT_USER_SETTINGS`.
- Add merge logic so older users receive defaults.
- Add utility helpers:
  - `getBarbellWeight(settings)`
  - `getPlateInventory(settings)`
  - `getPlateLoadingUnit(settings)`

### Done When

- Existing users can load the app without missing settings data.
- Unit tests cover default merging and barbell preset resolution.

### Phase 1 Notes

- Added shared plate-loading settings types, defaults, and helper functions in
  `shared/types/userSettings.types.ts`.
- Added deep merge support so older saved settings receive plate-loading
  defaults, including partially saved plate inventories.
- Added API validation and Mongo persistence support for `plateLoading`.
- Added focused tests for default plates, lb/kg unit defaults, barbell presets,
  custom bar fallback, and older settings migration.
- Verification: `npm test -- userSettingsPlateLoading` passes.

## Phase 2: Settings UI

### Tasks

- Add a `Plate Loading` settings section.
- Add unit segmented control.
- Add barbell preset segmented control or select.
- Add custom bar weight field.
- Add plate inventory count steppers.
- Add custom plate size row.
- Add `id="plate-loading"` so calculator links can route directly to it.

### Done When

- User can configure lb/kg plates and barbell type in Settings.
- Settings save locally and through the API like existing settings.

### Phase 2 Notes

- Added a `Plate Loading` settings accordion with the
  `/settings#plate-loading` anchor.
- Added preferred loading unit controls for `lb` and `kg`.
- Added barbell preset controls for Olympic, women's Olympic, and custom bar.
- Added a custom barbell weight input when custom bar is selected.
- Added plate inventory count steppers and custom plate-size entry.
- Mounted the section after Equipment so durable loading setup stays near other
  equipment preferences.
- Verification: `npm test`, `npm --prefix client run lint`, and
  `npm run build` pass.

## Phase 3: Calculator Data Refactor

### Tasks

- Move plate inventory types/defaults out of `PlateCalculator.tsx` into shared
  utilities.
- Make `PlateCalculator` accept:
  - `targetWeight`
  - `unit`
  - `barbellWeight`
  - `inventory`
  - optional `settingsHref`
- Remove unit and barbell inputs from the default calculator view.
- Add `Edit plates in Settings` link.

### Done When

- In-workout calculator opens with the current set weight and saved equipment.
- User can navigate from calculator to Settings plate inventory.

### Phase 3 Notes

- Refactored `PlateCalculator` to accept saved `unit`, `barbellWeight`,
  `inventory`, optional `targetWeight`, and optional `settingsHref`.
- Removed default unit and barbell inputs from the calculator surface.
- Added a compact saved-setup summary with an `Edit plates in Settings` link.
- Calculator now recalculates from the target input immediately instead of
  requiring a separate calculate button.
- Dashboard and workout calculator instances now read saved plate-loading
  settings through `useUserSettings`.
- Workout calculator opens with the active exercise target weight when
  available.
- Verification: `npm test`, `npm --prefix client run lint`, and
  `npm run build` pass.

## Phase 4: Workout Integration

### Tasks

- Read plate-loading settings through `useUserSettings`.
- Pass active set weight into the calculator bottom sheet.
- Use saved barbell and plates.
- Make the calculator recalculate immediately when opened.
- Keep a small target-weight override input for quick adjustments.
- only show plateCalculator button on exercises that use a barbell otherwise hide.

### Done When

- Tapping the calculator on an active set immediately shows plates per side for
  that set's current weight.

### Phase 4 Notes

- Workout set panels now only show the plate calculator action for barbell and
  Smith machine exercises.
- The workout page tracks which set opened the calculator and passes that set's
  current weight into the calculator.
- Closing the calculator clears the selected set so the next open uses fresh
  context.
- The calculator continues to read saved unit, barbell, and plate inventory from
  user settings.
- Verification: `npm test`, `npm --prefix client run lint`, and
  `npm run build` pass.

## Phase 5: Better Calculation Engine

### Tasks

- Extract plate calculation into a tested utility.
- Implement exact-combination search for realistic plate inventories.
- Keep greedy fallback for impossible exact matches.
- Return:
  - exact match status.
  - plates per side.
  - loaded total.
  - shortfall or overage.
  - closest under/over options.

### Done When

- Tests cover exact matches, odd plate counts, insufficient inventory, closest
  under/over, lb defaults, and kg defaults.

### Phase 5 Notes

- Extracted plate-loading math into `shared/utils/plateLoading.ts`.
- Added bounded exact-combination search across balanced plate pairs.
- Added closest-under and closest-over options when exact loading is not
  possible.
- Added result metadata for exact status, loaded total, shortfall, overage, and
  plates per side.
- Updated `PlateCalculator` to render exact vs closest loaded bar states and
  show closest-under/over choices.
- Added tests for exact combinations, odd plate counts, insufficient inventory,
  closest options, lb defaults, kg defaults, and below-bar invalid targets.
- Verification: `npm test`, `npm --prefix client run lint`, and
  `npm run build` pass.

## Phase 6: Polish And Validation

### Tasks

- Validate custom barbell weight is positive.
- Validate custom plate sizes are positive and unique per unit.
- Avoid layout shifts in the bottom sheet.
- Ensure mobile keyboard does not hide the result.
- Add empty state for no plates configured.

### Done When

- Calculator feels fast during workout use.
- Settings feel clear and durable.
- `npm test`, `npm --prefix client run lint`, and `npm run build` pass.

### Phase 6 Notes

- Added inline Settings validation for positive custom bar weights.
- Added custom plate validation for positive, unique plate sizes.
- Prevented invalid plate count input from saving `NaN` and clamped counts to a
  safe range.
- Added empty states for no saved plates in both Settings and the calculator.
- Simplified calculator setup display to a compact saved bar/unit line with a
  Settings link.
- Removed stale multi-field calculator layout styles to keep the target input
  stable and full width.
- Added mobile-friendly calculator spacing, safe-area padding, 16px input text,
  and result scroll margin to reduce keyboard overlap.
- Verification: `npm test`, `npm --prefix client run lint`, and
  `npm run build` pass.

## Additional Suggestions

- Add a `Save this as my setup` action if the user edits calculator details
  inline later.
- Add a `collars` option eventually, usually 5 lb total or 2.5 kg total, but
  keep it off by default because many lifters do not log collars.
- Add a `load each side` visual order from outside-in or inside-out. Most
  lifters expect largest plates closest to the sleeve collar/body side first.
- Keep the calculator available only for barbell-style exercises, or show a
  lighter message for dumbbell/machine exercises where plate math does not
  apply.
- If exact loading is impossible, offer one-tap set weight update to the closest
  load the user's plates can actually make.
