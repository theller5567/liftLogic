# LiftLogic Workout Recommendation Improvement Plan

## Summary
Improve workout recommendations by using richer user context and richer exercise metadata without making onboarding feel like an interrogation. The core product principle is:

> Ask the minimum needed to recommend a good first plan, then progressively personalize as the user reviews, trains, and edits.

This plan is based on the ideas in `WORKOUT_RECOMMENDATION_SCORING.md`, especially schedule fit, equipment fit, experience level, goals, height/body weight guidance, joint concerns, movement confidence, disliked exercises, recovery, and exercise description metadata.

## Product Principles
- First onboarding should feel quick, helpful, and confidence-building.
- Do not ask every possible question before the user sees value.
- Separate required recommendation questions from optional personalization questions.
- Use plain language instead of fitness-science jargon.
- Let users skip sensitive or uncertain questions.
- Use height, weight, age, and gender cautiously for guidance, never as guarantees or shame-based labels.
- Prefer soft warnings, substitutions, and education over hard blocks.
- Learn from user behavior over time, especially swaps, skipped exercises, and completed workouts.

## Recommended Onboarding Shape
Use a layered flow:

1. **Quick Start**
   Ask only what is needed to recommend a reasonable first plan.

2. **Plan Review**
   Show the recommendation, explain why, and allow browsing alternatives.

3. **Personalization**
   Ask a few targeted questions that improve safety, equipment fit, and starting weights.

4. **Optional Fine-Tuning**
   Let users add preferences, disliked exercises, joint concerns, and focus areas without blocking the normal path.

5. **Ongoing Learning**
   Improve recommendations from actual app behavior after onboarding.

## Ideal First-Run Flow

### Section 1: Choose Path
Goal: give control immediately.

Questions:

- `Help me choose a plan`
- `Browse workout plans`

Why this matters:

- Guided users get help.
- Confident users can choose manually.
- Nobody feels trapped.

Implementation notes:

- Keep this as the first step.
- If user chooses browse, still ask a short set of personalization questions afterward.
- Manual selection should override the recommendation score, but still show warnings.

### Section 2: Goal And Availability
Goal: get the highest-signal recommendation inputs first.

Questions:

- Main goal:
  - Build muscle
  - Build strength
  - Muscle and strength
  - Lose fat / improve body composition
  - General fitness
  - Return to training
- Days per week:
  - 1-6 days
- Session length:
  - 20-30 minutes
  - 30-45 minutes
  - 45-60 minutes
  - 60-90 minutes

Why this should be early:

- Goal determines plan style.
- Days per week determines adherence.
- Session length prevents recommending a plan that technically fits the week but not the user's real schedule.

Recommendation logic updates:

- Exact day match remains heavily weighted.
- Add session-length fit scoring.
- Penalize templates whose estimated workout time regularly exceeds the user's selected session length.
- Prefer lower setup-complexity plans for short sessions.

### Section 3: Experience And Recent Consistency
Goal: separate training knowledge from current readiness.

Questions:

- Experience level:
  - Brand new to lifting
  - Some experience
  - Very experienced
- Recent training consistency:
  - Brand new
  - Inconsistent lately
  - 1-2 days per week recently
  - 3-4 days per week recently
  - 5+ days per week recently

Why this matters:

- Someone may have trained for years but be returning after a long break.
- Current consistency is often a better predictor of recovery and adherence than lifetime experience.

Recommendation logic updates:

- Keep experience-level scoring.
- Add consistency modifier:
  - inconsistent users get lower-volume re-entry plans
  - consistent users can tolerate more frequency and volume
  - brand-new users get form-first beginner plans

### Section 4: Equipment
Goal: prevent bad recommendations caused by missing equipment.

Questions:

- Equipment preset:
  - Full gym
  - Home gym
  - Dumbbells only
  - Basic equipment
- Confirm exact equipment:
  - Use existing `EquipmentInventoryPicker`

Why this matters:

- Equipment has direct impact on exercise substitutions.
- Exact equipment is much better than broad presets.

Recommendation logic updates:

- Continue preferring `availableEquipment` over `equipmentAccess`.
- Penalize plans with many unavailable exercises.
- Score substitution quality, not just whether a plan can be patched.

Substitution quality should consider:

- same primary muscle
- same movement pattern
- same or easier difficulty
- compatible equipment
- same load type when possible
- same target type when possible

### Section 5: Profile Guidance
Goal: collect useful context without making it feel medical.

Questions:

- Age range
- Gender
- Height
- Body weight

Recommended copy:

```text
This helps us keep starting weights and exercise suggestions reasonable. LiftLogic uses this as general guidance, not as a limit on what you can do.
```

Why this should not be too early:

- Height and weight can feel sensitive.
- Ask after the user has already answered value-focused questions like goals and schedule.

Recommendation logic updates:

- Use height/body weight as soft guidance.
- Use BMI only as rough context.
- Do not estimate body fat percentage from height and weight alone.
- Do not block plans based only on BMI.
- Use body weight to scale bodyweight exercise difficulty.

Examples:

- Heavier beginner users may get lower-impact conditioning options.
- Bodyweight pull-ups, dips, push-ups, lunges, and jumps can be scaled more carefully.

### Section 6: Movement Confidence
Goal: find safer variations without asking about every exercise.

Question style:

```text
How confident do you feel with these movement types?
```

Use a compact grid:

- Squats
- Deadlifts / hinges
- Pressing
- Pulling
- Single-leg exercises

Options:

- Not confident
- Somewhat confident
- Confident

Why this works:

- It is faster than asking about every lift.
- It helps the app choose variations.
- It makes the app feel supportive, not judgmental.

Recommendation logic updates:

- Penalize technical or advanced exercises in low-confidence patterns.
- Prefer beginner-friendly variations with clearer setup.
- Use exercise descriptions to surface cues on review.

### Section 7: Joint Concerns
Goal: provide safer warnings and substitutions.

Question:

```text
Anything we should be careful with?
```

Options:

- Knees
- Hips
- Lower back
- Shoulders
- Elbows / wrists
- Ankles
- No concerns
- Prefer to skip

Why this should be optional:

- It can feel personal.
- Some users may not know how to answer.
- The app should still work without it.

Recommendation logic updates:

- Add warnings for exercises that may stress selected joints.
- Prefer lower-impact or supported variations when appropriate.
- Avoid hard blocks unless the user explicitly chooses strict avoidance later.

Exercise metadata needed:

```ts
jointStress?: Array<
  "knees" | "hips" | "lower_back" | "shoulders" | "wrists" | "elbows" | "ankles"
>;
impactLevel?: "none" | "low" | "medium" | "high";
technicalComplexity?: "low" | "medium" | "high";
recoveryCost?: "low" | "medium" | "high";
```

### Section 8: Disliked Exercises
Goal: improve adherence by avoiding exercises the user strongly dislikes.

Question:

```text
Are there any exercises you strongly dislike or prefer to avoid?
```

UX recommendation:

- Do not show a giant list immediately.
- Start with a simple choice:
  - Skip for now
  - Choose exercises to avoid
- If they choose exercises to avoid, open a searchable exercise picker.
- Also allow broad categories:
  - Squats
  - Deadlifts / hinges
  - Lunges
  - Overhead pressing
  - Pull-ups
  - Running / jumping
  - Machines
  - Barbell lifts

Why this is valuable:

- Adherence matters as much as theoretical plan quality.
- If a user hates an exercise, they are more likely to skip it, swap it, or abandon the plan.

Recommendation logic updates:

- Penalize templates with disliked exercises.
- Penalize templates with disliked movement patterns, but less strongly.
- Automatically substitute disliked exercises when a good alternative exists.
- Show a warning if a disliked exercise remains.

Example scoring:

```ts
dislikedExercisePenalty = dislikedExerciseCount * 120;
dislikedPatternPenalty = dislikedPatternMatchCount * 60;
```

Example reason:

```text
Avoids the exercises you said you dislike while keeping the same muscle targets.
```

Example warning:

```text
This plan includes 2 exercises you prefer to avoid. We found alternatives for one of them.
```

### Section 9: Starting Weights
Goal: personalize loads only after the base recommendation is close.

Questions:

- Bench press or dumbbell press estimate
- Row estimate
- Squat estimate
- Deadlift estimate

Keep current logic:

- Ask only relevant anchors based on equipment.
- Use confidence.
- Apply conservative age/gender guidance.

Future improvement:

- Use body weight and movement confidence to add starting-weight guardrails.
- For low-confidence patterns, reduce starting load or add a form-first note.

## What Should Be Required?
Required for first recommendation:

- onboarding mode
- goal
- days per week
- experience level
- equipment preset

Strongly recommended but skippable:

- session length
- recent consistency
- exact equipment
- age range
- height/body weight

Optional fine-tuning:

- joint concerns
- movement confidence
- disliked exercises
- preferred exercises/equipment
- body composition goal

## Progressive Disclosure Strategy

### Keep First Recommendation Fast
The user should be able to get to a recommended plan in roughly 60-90 seconds.

Recommended first pass:

1. Choose path
2. Goal
3. Days per week
4. Session length
5. Experience
6. Recent consistency
7. Equipment preset
8. Confirm equipment
9. Plan review

Then ask optional safety/preference questions after the user sees value:

- height/body weight
- joint concerns
- movement confidence
- disliked exercises
- starting weights

### Use “Improve My Recommendation” Cards
After plan review, show optional cards:

```text
Improve this recommendation
Answer 3 quick questions about movement confidence, joint concerns, and exercises you dislike.
```

This lets the user opt in instead of feeling forced.

### Use Settings For Later Refinement
Every optional onboarding field should also be editable later in Settings.

Settings sections:

- Training profile
- Equipment
- Movement confidence
- Exercise preferences
- Body profile
- Joint concerns

### Learn From Behavior
The app should treat behavior as feedback:

- repeated swaps away from an exercise = possible dislike
- skipped exercises = possible dislike or poor fit
- consistently reduced weight = starting estimate too aggressive
- consistently exceeded reps = starting estimate too conservative
- missed workouts = schedule may be too demanding

Future UX:

```text
You often swap out barbell lunges. Should LiftLogic avoid these in future plans?
```

## Recommendation Engine Implementation Plan

### Phase 1: Score Transparency
Add structured score breakdowns without changing recommendations.

New return shape:

```ts
scoreBreakdown: {
  schedule: number;
  sessionLength: number;
  experience: number;
  recentConsistency: number;
  goal: number;
  equipment: number;
  difficulty: number;
  exerciseGoalFit: number;
  muscleBalance: number;
  recovery: number;
  preferences: number;
  safetyGuidance: number;
}
```

Benefits:

- easier debugging
- clearer review UI
- easier scoring tuning later

#### Phase 1 Pass Notes
- Added `scoreBreakdown` to ranked workout template recommendations.
- Preserved current recommendation behavior by grouping the existing scoring factors into named categories instead of changing the final score.
- Current implemented categories are `schedule`, `experience`, `goal`, `equipment`, `difficulty`, `exerciseGoalFit`, `exerciseStructure`, and `ageGuidance`.
- Added tests that confirm score breakdown totals match final recommendation scores.
- UI behavior is unchanged in this phase; the breakdown is ready for future debugging, tuning, and clearer recommendation explanations.

### Phase 2: Scoring Config
Move hardcoded scoring values into a config object.

Example:

```ts
workoutRecommendationWeights = {
  exactDayMatch: 1000,
  experienceMatch: 280,
  goalMatch: 220,
  equipmentCompatibility: 270,
  dislikedExercisePenalty: 120,
}
```

Benefits:

- easier tuning
- easier tests
- easier explanation docs

#### Phase 2 Pass Notes
- Added an exported `workoutRecommendationWeights` config in the shared recommendation helper.
- Replaced hardcoded scoring numbers with named weights for schedule, experience, goal, equipment, exercise fit, structure, and age guidance.
- Kept recommendation rankings unchanged; this phase only made the scoring values easier to understand and tune.
- Updated tests to verify score breakdown values against the named config instead of raw numbers.

### Phase 3: Add Minimal New Onboarding Fields
Add:

- `sessionLength`
- `recentTrainingConsistency`
- `bodyCompositionGoal`

Keep these lightweight and friendly.

Do not add joint concerns, movement confidence, disliked exercises, height, and body weight all in the same release unless the flow is carefully staged.

#### Phase 3 Pass Notes
- Added `sessionLength`, `recentTrainingConsistency`, and `bodyCompositionGoal` to shared onboarding answer types.
- Added API validation for the new fields while keeping them optional for older saved onboarding answers.
- Added friendly onboarding steps for body composition goal, recent training consistency, and typical workout length.
- Added soft recommendation scoring for the new fields:
  - session length rewards plans that fit the user's available workout window and penalizes sessions that run long
  - recent consistency favors lower-volume re-entry plans for brand-new or inconsistent users and higher-frequency plans for users already training often
  - body composition goal nudges plan style without overriding schedule, equipment, experience, or primary goal
- Added tests for the new score breakdown fields and the first-pass consistency/session-length scoring behavior.

### Phase 4: Add Optional Safety And Preference Branch
Add optional cards after plan review:

- Movement confidence
- Joint concerns
- Disliked exercises

Default behavior:

- Skip is easy.
- User can continue without answering.
- The plan remains valid.

#### Phase 4 Pass Notes
- Added optional preference fields to onboarding answers:
  - `wantsRecommendationFineTuning`
  - `movementConfidence`
  - `jointConcerns`
  - `dislikedExerciseIds`
- Added API validation for the new optional preference fields while keeping older saved answers compatible.
- Added a reusable `MultiSelectStep` onboarding control for optional list-style answers.
- Added a new `Preferences` onboarding section with an easy `Skip for now` path.
- Follow-up preference questions only appear when the user opts into fine-tuning.
- Added tests that confirm optional preference questions stay hidden unless the user chooses to fine-tune.

### Phase 5: Add Height And Body Weight
Add height and body weight after the user understands why it helps.

Recommended placement:

- after plan review
- before starting-weight questions
- with clear “Skip” option

Use for:

- bodyweight exercise scaling
- low-impact warnings
- starting-weight conservatism

Do not use for:

- hard exclusions
- body fat percentage claims
- shame-based feedback

#### Phase 5 Pass Notes
- Added optional `heightInches` to onboarding answers and API validation.
- Kept `bodyWeight` optional and improved the onboarding copy so users understand it is used only as broad guidance.
- Added a height question with plain inch-based input copy, including an example conversion.
- Added `getBodyMassIndex` as a shared helper for broad height/body-weight context.
- Added soft `bodySizeGuidance` to recommendation score breakdowns:
  - nudges higher body-size users toward moderate-frequency plans
  - lightly penalizes advanced/high-frequency defaults when recovery fit may need more caution
  - gives a small muscle-gain nudge for lower body-size users who selected muscle gain
- Added mild starting-weight conservatism for beginner or returning users when height/body-weight context suggests extra caution.
- Added tests for body-mass calculation, body-size scoring nudges, and starting-weight conservatism.

### Phase 5.5: Exercise Description Quality Upgrade
Merge the expanded exercise-description file before adding metadata so Phase 6 can build from stronger coaching content.

#### Phase 5.5 Pass Notes
- Replaced the smaller generated-description file with the expanded version from the review attachment.
- Kept the same public API:
  - `buildExerciseDescription`
  - `exerciseDescriptions`
  - `getExerciseDescription`
- Expanded movement-pattern fallbacks so more exercises get specific setup, execution, cues, and mistake guidance instead of generic copy.
- Added curated descriptions for several major movements, including squat, hinge, press, pull, carry, Olympic-lift, and core examples.
- Normalized pasted em dashes to plain hyphens for repo style consistency.
- Confirmed `ExerciseDetails` still lazy-loads descriptions as a separate production chunk.
- Verified with targeted description tests, lint, full tests, and production build.

### Phase 6: Exercise Metadata Expansion
Add metadata fields:

- `recoveryCost`
- `technicalComplexity`
- `jointStress`
- `impactLevel`
- `setupComplexity`
- `timeCost`
- `bestForGoals`
- `avoidIfJointConcern`

Use exercise descriptions to help populate or derive some of these fields.

#### Phase 6 Pass Notes
- Added optional metadata fields to `ExerciseDefinition` so exercises can be hand-curated over time without requiring a full library migration.
- Added derived exercise metadata through `getExerciseMetadata`, giving every current exercise usable values for:
  - recovery cost
  - technical complexity
  - joint stress
  - impact level
  - setup complexity
  - time cost
  - best-fit goals
  - joint-concern cautions
- Kept the metadata intentionally broad and non-clinical. These fields should guide recommendations and warnings, not diagnose risk or hard-block users.
- Expanded `summarizeExercisePool` with metadata-aware profile values for Phase 7 scoring:
  - `highImpactRatio`
  - `highRecoveryRatio`
  - `jointConcernMatchRatio`
  - `jointStressAverage`
  - `longTimeCostRatio`
  - `technicalComplexityAverage`
- Added tests for high-skill metadata, low-impact metadata, and joint-concern exercise-pool profiling.
- Verified with targeted recommendation tests, lint, full tests, and production build.

### Phase 7: Better Plan Scoring
Add scoring for:

- session length fit
- muscle volume balance
- recovery quality
- movement pattern coverage
- disliked exercises
- joint concern compatibility
- bodyweight exercise scaling
- substitution quality

#### Phase 7 Pass Notes
- Expanded recommendation score breakdowns with new dedicated buckets:
  - `movementPatternCoverage`
  - `muscleVolumeBalance`
  - `recoveryQuality`
  - `preferenceFit`
  - `jointConcernCompatibility`
  - `substitutionQuality`
- Connected Phase 6 exercise metadata to scoring so beginner, brand-new, and inconsistent users are nudged away from plans with too much high-recovery, high-impact, or high-complexity exercise exposure.
- Added broad movement-pattern coverage scoring so strength/hybrid recommendations value well-rounded squat, hinge, press, and pull coverage.
- Added muscle-balance scoring so hybrid plans can be rewarded for a better upper/lower mix.
- Added disliked-exercise scoring:
  - direct matches receive the strongest penalty
  - similar movement-pattern matches receive a smaller soft penalty
- Added joint-concern compatibility scoring and warnings when a plan includes movements that should be reviewed for the user's selected joint concerns.
- Added substitution-quality scoring so plans get partial credit when concerning or disliked exercises have compatible alternatives.
- Added mild bodyweight/impact scoring for higher body-size context without hard-blocking movements.
- Added recommendation tests for disliked exercises, joint-concern warnings, and recovery/complexity penalties.
- Verified with targeted recommendation tests, lint, full tests, and production build.

### Phase 8: Better Recommendation UI
Split plan explanation into:

- Why this plan
- Tradeoffs
- Things to check
- Suggested substitutions

Example:

```text
Why this plan
- Matches your 4-day schedule
- Fits your equipment well
- Balanced strength and hypertrophy structure

Tradeoffs
- Includes two exercises that may need substitutions
- Slightly longer sessions than your selected preference

Things to check
- You mentioned shoulder concerns, so overhead pressing should stay controlled.
```

#### Phase 8 Pass Notes
- Added a reusable `WorkoutTemplateExplanation` shape with:
  - `whyThisPlan`
  - `tradeoffs`
  - `thingsToCheck`
  - `suggestedSubstitutions`
- Added `getWorkoutTemplateExplanation` so review screens and plan comparison screens can render the same explanation groups.
- Added tradeoff generation for schedule mismatch, session length overage, experience mismatch, goal structure bias, and longer setup/execution demands.
- Added suggested substitutions for exercises that are disliked, conflict with joint concerns, or may require missing equipment when a compatible alternative exists.
- Updated `WorkoutReview` to show separate plan sections instead of blending positive reasons and warnings together.
- Updated `WorkoutTemplateBrowser` cards to show grouped explanation blocks for faster comparison.
- Added neutral, warning, and substitution visual treatments for the new explanation sections.
- Added tests that verify recommendation explanations include reasons, tradeoffs, things to check, and substitution suggestions.
- Verified with targeted recommendation tests, lint, full tests, and production build.

## Suggested Final Onboarding Flow

### Required Core
1. Choose guided or browse
2. Goal
3. Days per week
4. Session length
5. Experience
6. Recent consistency
7. Equipment preset
8. Confirm equipment
9. Recommended plan review

### Optional Personalization
10. Improve recommendation?
11. Movement confidence
12. Joint concerns
13. Disliked exercises
14. Height/body weight
15. Starting weights

### Final Review
16. Review plan
17. Show reasons, tradeoffs, warnings, and substitutions
18. Start plan

## Copy Guidelines
Use encouraging copy:

```text
These questions help us make your plan easier to stick with.
```

Avoid heavy copy:

```text
We need to assess your risk before recommending exercises.
```

Use optional language:

```text
Skip for now
```

```text
You can update this later in Settings.
```

For disliked exercises:

```text
A plan you enjoy is easier to follow. Tell us if there are movements you strongly dislike.
```

For height/body weight:

```text
This helps us scale bodyweight exercises and starting weights. It is optional and only used as general guidance.
```

## Test Plan
- Users can complete onboarding without optional questions.
- Guided users receive a recommendation after the required core flow.
- Browse users can choose a plan early and still personalize later.
- Session length affects plan ranking.
- Recent consistency affects volume/frequency recommendations.
- Disliked exercises reduce plan score or trigger substitutions.
- Joint concerns create warnings but do not block plan selection.
- Height/body weight can be skipped.
- Existing saved onboarding answers still load.
- Score breakdown tests explain why templates ranked as they did.
- Recommendation UI separates reasons, tradeoffs, and warnings.

## Success Criteria
- First recommendation still feels quick.
- Users understand why a plan was recommended.
- Users can avoid exercises they strongly dislike.
- Equipment mismatches are reduced.
- Beginner and returning users receive more conservative plans.
- Users with joint concerns see clearer warnings and better substitutions.
- The scoring system is easier to debug and tune.
