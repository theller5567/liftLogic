# LiftLogic Workout Recommendation Scoring

## Purpose
LiftLogic recommends workout plans by ranking every template in `exerciseLibrary.workoutTemplates` against the user's onboarding answers. The system is intentionally a soft scoring model, not a strict rules engine. That means a plan can still be recommended even if it has a warning, but warnings are shown separately so the user understands what to check.

The main scoring code lives in:

- `shared/utils/workoutTemplateRecommendations.ts`
- `shared/utils/exerciseIntelligence.ts`
- `shared/utils/equipmentRequirements.ts`

## Current Inputs
The recommendation system looks at these user answers:

- `availableTrainingDays`
- `experienceLevel`
- `goalPriority` or `goal`
- `equipmentAccess`
- `availableEquipment`
- `ageRange`
- `selectedWorkoutTemplateId`

It also looks at these workout template fields:

- `daysRequired`
- `experienceLevel`
- `primaryGoal`
- `focus`
- `workoutDays`
- exercise ids inside each workout day

And these exercise metadata fields:

- `difficulty`
- `isCompound`
- `movementPattern`
- `equipmentType`
- `primaryEquipment`
- `secondaryEquipment`
- `loadType`
- `targetType`
- `primaryMuscles`
- `secondaryMuscles`

## Recommendation Flow
1. Read all workout templates from `exerciseLibrary.workoutTemplates`.
2. Score each template with `getTemplateRecommendationScore`.
3. Sort templates from highest score to lowest score.
4. Pick the top template as the recommended plan.
5. Generate reasons with `getWorkoutTemplateMatchReasons`.
6. Generate warnings with `getWorkoutTemplateWarnings`.
7. If `selectedWorkoutTemplateId` exists, use that selected template instead of the top recommendation.

## Score Breakdown
The final score is a sum of several weighted factors.

### 1. Weekly Schedule Fit
This is the biggest factor.

Exact day match:

```ts
+1000
```

Template requires fewer days than the user can train:

```ts
+700 - dayDifference * 80
```

Template requires more days than the user can train:

```ts
+250 - dayDifference * 120
```

This means a 3-day user should usually see 3-day plans first. A plan with fewer days is preferred over one that requires more days than the user selected.

### 2. Experience Level Fit
Exact experience match:

```ts
+280
```

Advanced user matched with intermediate plan:

```ts
+120
```

Intermediate user matched with beginner plan:

```ts
+80
```

Beginner users do not get bonus points for intermediate or advanced plans.

### 3. Goal Fit
Exact goal match:

```ts
+220
```

Hybrid overlap:

```ts
+120
```

The template goal is inferred from `primaryGoal` and `focus`. For example:

- text containing strength or powerlifting becomes `strength`
- text containing muscle and strength, strength and hypertrophy, or general fitness becomes `hybrid`
- everything else defaults to `hypertrophy`

### 4. Equipment Fit
The app calculates how many exercises in a plan can be performed with the user's equipment.

Template-level equipment compatibility:

```ts
equipmentScore * 270
```

Exercise-profile equipment compatibility:

```ts
equipmentFitRatio * 140
```

So equipment affects the score twice:

- once as broad plan compatibility
- once as part of the exercise-level profile

If `availableEquipment` exists, it is preferred. If not, the app falls back to the older `equipmentAccess` preset.

### 5. Exercise Difficulty Fit
Each exercise is scored against the user's experience level.

Same or easier difficulty:

```ts
1
```

One level too hard:

```ts
0.55
```

Two levels too hard:

```ts
0.15
```

The average difficulty fit is then added:

```ts
difficultyFitAverage * 220
```

### 6. Exercise Goal Fit
Each exercise gets a goal-fit score.

For strength:

- compound exercises score `1`
- isolation/accessory exercises score `0.42`

For hypertrophy:

- isolation/accessory exercises score `1`
- compound exercises score `0.78`

For hybrid:

- compound exercises score `0.95`
- isolation/accessory exercises score `0.82`

The average is added:

```ts
goalFitAverage * 180
```

### 7. Compound vs Accessory Bias
Strength users get extra credit for compound-heavy plans:

```ts
compoundRatio * 170
```

Hypertrophy users get extra credit for accessory work:

```ts
accessoryRatio * 170
```

Hypertrophy plans also get a small bonus if they still include enough compounds:

```ts
+70 if compoundRatio > 0.35
```

Hybrid plans get bonuses for a balance of both:

```ts
+80 if compoundRatio > 0.4
+80 if accessoryRatio > 0.25
```

### 8. Beginner Protection
If the user is a beginner and more than 15% of the template exercises are advanced:

```ts
-advancedRatio * 350
```

This is a penalty, not a hard block.

### 9. Age Guidance
Age is used conservatively. It does not hard-exclude plans.

For `7_15`:

- beginner templates get `+350`
- strength-focused templates get `-120`
- templates above 3 days get `-300`

For `40_49` and `50_plus`:

- advanced templates get `-260`
- strength templates with 4+ days get `-160`
- templates requiring more days than selected get `-200`

## Warnings Are Separate From Score
Warnings do not block selection. They are generated after scoring.

Examples:

- `Requires 6 days per week`
- `More advanced than your experience level`
- `Advanced plan`
- `Includes advanced exercise options`
- `May need: Leg press, Cable machine`
- `Strength-heavy plan; recovery may need extra attention`

This is important because a plan may score well overall but still need the user's attention.

## Match Reasons
The app turns score factors into friendly explanation bullets. Examples:

- `Matches your 5-day weekly schedule`
- `Fits within your 6-day weekly availability`
- `Matches your hypertrophy goal`
- `Matches your intermediate experience level`
- `Fits most of your equipment access`
- `Strong equipment match`
- `Mostly beginner-friendly exercises`
- `Compound-heavy strength structure`
- `Balances compound lifts with accessory volume`
- `Keeps recovery demands reasonable`

These reasons are not raw score math. They are human-readable explanations generated from the same inputs.

## Current Strengths
- Days per week is weighted heavily, which matches real-world adherence.
- Equipment inventory is included, and exact equipment is preferred over broad presets.
- Beginner users are protected from plans with too many advanced exercises.
- Exercise-level metadata now influences plan scoring, not just template labels.
- Warnings are advisory rather than blocking, so users can still choose manually.
- Manual plan selection is respected through `selectedWorkoutTemplateId`.

## Current Weaknesses
- The score weights are hardcoded, so tuning requires code edits.
- Template goal is inferred from text in `primaryGoal` and `focus`, which can be brittle.
- Exercise descriptions are not currently used in scoring.
- Muscle volume balance is still rough. The system knows primary and secondary muscles, but it does not deeply calculate weekly set volume per muscle.
- Recovery cost is approximate. Age and strength-heavy plans are considered, but the app does not yet estimate fatigue by lift type, muscle overlap, or weekly intensity.
- Equipment fit counts availability, but it does not yet account for quality of substitution. A plan may score decently even if several important movements need swapping.
- The scoring system does not explain tradeoffs like “this plan fits your days perfectly but has weaker equipment fit.”

## Suggestions To Improve The Algorithm

### 1. Make Template Goals Explicit
Instead of inferring goals from `primaryGoal` and `focus`, add structured fields to each workout template:

```ts
goals: Array<"strength" | "hypertrophy" | "hybrid" | "general_fitness">
goalWeights?: {
  strength: number;
  hypertrophy: number;
  endurance?: number;
  skill?: number;
}
```

This would make scoring more reliable and easier to tune.

### 2. Add Weekly Muscle Volume Scoring
Use `primaryMuscles`, `secondaryMuscles`, `sets`, and exercise role to estimate weekly volume per muscle.

Example scoring:

- primary muscle set = `1.0` effective set
- secondary muscle set = `0.5` effective set
- isolation exercise for target muscle = `1.1` effective set
- compound exercise = distribute volume across involved muscles

Then compare against the user's goal:

- hypertrophy: reward balanced weekly volume
- specialization: reward extra volume for focus muscles and maintenance volume elsewhere
- strength: reward enough practice volume for main lift patterns without too much junk volume

### 3. Use Description Data For Safety And Education
Now that exercises have descriptions, the app can use fields like:

- setup complexity
- common mistakes
- safety notes
- beginner cues
- range of motion guidance

Possible uses:

- Penalize exercises with many safety cautions for brand-new beginners.
- Prefer exercises with clearer beginner setup instructions during onboarding.
- Add recommendation copy like “This plan uses movements with clear setup instructions for newer lifters.”
- Show “form-first” warnings for exercises that require more technical skill.

### 4. Add Exercise Complexity Score
Create a derived `complexityScore` from metadata and descriptions.

Possible inputs:

- `difficulty`
- `isCompound`
- `movementPattern`
- setup instruction count
- safety note count
- whether the lift is loaded axially, free-weight, unilateral, or explosive

Then beginners and younger users can be guided toward lower-complexity exercises even when the official difficulty is only `intermediate`.

### 5. Improve Recovery Scoring
Add a recovery cost per exercise and per workout day.

Examples:

- heavy squat/deadlift patterns: high recovery cost
- isolation curls/extensions: low recovery cost
- spinal loading: extra recovery cost
- high overlap between adjacent days: penalty

Then templates can be scored for weekly recovery quality, not just days per week.

### 6. Add Movement Pattern Coverage
Score whether a template covers foundational patterns:

- squat
- hinge
- horizontal press
- horizontal pull
- vertical press
- vertical pull
- loaded carry or core

For beginners and general fitness users, reward balanced coverage. For specialization plans, allow imbalance intentionally but show why.

### 7. Improve Equipment Fit With Substitution Quality
Right now equipment scoring mostly checks whether exercises can be performed. A better model would score:

- how many original exercises fit
- how many need substitutions
- how similar each substitution is
- whether substitutions preserve primary muscle, movement pattern, difficulty, and load type

This would prevent a plan from scoring too high when it technically can be patched but loses the original intent.

### 8. Add Score Explanation Tradeoffs
Instead of only positive reasons and warnings, add a “Tradeoffs” section:

- `Great schedule match, but 3 exercises may need substitutions.`
- `Strong hypertrophy fit, but slightly above your selected experience level.`
- `Fits your equipment well, but uses fewer weekly training days than you selected.`

This would make the recommendation feel more transparent.

### 9. Store Score Components
Return structured score details instead of only one number:

```ts
scoreBreakdown: {
  schedule: number;
  experience: number;
  goal: number;
  equipment: number;
  difficulty: number;
  exerciseGoalFit: number;
  recovery: number;
  muscleBalance: number;
}
```

This would make debugging recommendations much easier.

### 10. Move Weights To A Tuning Config
Create a config file like:

```ts
workoutRecommendationWeights = {
  exactDayMatch: 1000,
  experienceMatch: 280,
  goalMatch: 220,
  equipmentCompatibility: 270,
  difficultyFit: 220,
}
```

This keeps the algorithm readable and makes future tuning less risky.

### 11. Add Height And Body Weight As Soft Guidance
Add optional onboarding fields for:

```ts
height
bodyWeight
```

These fields can improve recommendations, but they should be used carefully. Height and body weight can estimate BMI, but BMI is not the same as body fat percentage. It can be misleading for muscular users, athletic users, and people with unusual body proportions.

Recommended usage:

- use body weight to scale bodyweight exercise difficulty
- use height/body weight to provide conservative starting guidance
- use BMI only as a rough safety context
- use these fields for warnings, substitutions, and education rather than hard blocks

Avoid:

- presenting BMI as a diagnosis
- estimating body fat percentage from height and weight alone
- blocking users from a plan only because of BMI
- using shaming labels or language

Helpful recommendation behavior:

- If a beginner user has a higher body weight, prefer controlled and joint-friendly options over high-impact conditioning.
- Favor supported movements when appropriate, such as machines, incline push-ups, assisted pull-ups, bikes, sled pushes, rowing, or incline walking.
- Add advisory copy for high-impact or advanced bodyweight exercises, especially jumping, burpees, plyometrics, or advanced calisthenics.
- For bodyweight exercises, account for body weight as the load. A push-up, pull-up, dip, or split squat can be a very different challenge depending on the user.

Example warning:

```text
This plan includes higher-impact movements. Based on your profile, consider lower-impact substitutions while you build strength and conditioning.
```

Example positive reason:

```text
Prioritizes controlled, joint-friendly movements while you build consistency.
```

Optional future fields:

```ts
bodyCompositionGoal:
  | "lose_fat"
  | "maintain"
  | "gain_muscle"
  | "gain_strength"
  | "recomposition";

movementLimitations?: string[];
jointConcerns?: Array<"knees" | "hips" | "lower_back" | "shoulders" | "wrists" | "ankles">;
```

These would be more useful than BMI alone because they help the app understand what the user is trying to accomplish and what movements may need extra care.

### 12. Add Better Onboarding Inputs For Program Fit
The current onboarding flow captures the major basics, but program selection would improve if the app understood more about consistency, time, limitations, confidence, and exercise preference.

Recommended future onboarding fields:

```ts
sessionLength:
  | "20_30_minutes"
  | "30_45_minutes"
  | "45_60_minutes"
  | "60_90_minutes";

recentTrainingConsistency:
  | "brand_new"
  | "inconsistent_lately"
  | "1_2_days_per_week"
  | "3_4_days_per_week"
  | "5_plus_days_per_week";

bodyCompositionGoal:
  | "lose_fat"
  | "maintain"
  | "gain_muscle"
  | "gain_strength"
  | "recomposition";

jointConcerns?: Array<
  "knees" | "hips" | "lower_back" | "shoulders" | "wrists" | "elbows" | "ankles"
>;

movementConfidence?: {
  squat?: "low" | "medium" | "high";
  hinge?: "low" | "medium" | "high";
  horizontalPress?: "low" | "medium" | "high";
  verticalPress?: "low" | "medium" | "high";
  horizontalPull?: "low" | "medium" | "high";
  verticalPull?: "low" | "medium" | "high";
  singleLeg?: "low" | "medium" | "high";
};

dislikedExerciseIds?: string[];
dislikedMovementPatterns?: string[];
preferredExerciseIds?: string[];
preferredEquipment?: EquipmentItemId[];
```

#### Session Length
Available days tells the app how often a user can train, but session length tells the app how much work can realistically fit into each workout.

Examples:

- A 3-day plan with 90-minute sessions can support more volume.
- A 5-day plan with 25-minute sessions should be more focused and efficient.
- A user with short sessions may need fewer accessories, supersets, or lower setup-complexity exercises.

Scoring idea:

- reward templates whose estimated workout time fits the selected session length
- penalize templates where most workouts exceed the selected time window
- prefer lower setup-complexity exercises for short sessions

#### Recent Training Consistency
Years of experience and current consistency are different. A user may have trained for 5 years but taken the last year off.

Scoring idea:

- inconsistent users should be nudged toward lower-volume re-entry plans
- consistent users can tolerate higher frequency and volume
- brand-new users should get more form-first beginner plans

#### Body Composition Goal
This helps distinguish between users who both choose hypertrophy but need different plan styles.

Examples:

- `lose_fat`: favor sustainable frequency, conditioning options, and joint-friendly volume
- `recomposition`: favor strength progression plus moderate hypertrophy volume
- `gain_muscle`: favor enough weekly muscle volume
- `gain_strength`: favor compound lifts and longer rest

#### Joint Concerns
Joint concerns should not automatically block exercises, but they should influence warnings and substitutions.

Examples:

- knee concerns: warn on high-impact jumping and high-volume knee-dominant work
- lower-back concerns: be careful with heavy hinges, unsupported rows, and excessive spinal loading
- shoulder concerns: be careful with high-volume overhead pressing, dips, and deep fly variations

This works best if exercises eventually include fields like:

```ts
jointStress?: Array<"knees" | "hips" | "lower_back" | "shoulders" | "wrists" | "elbows" | "ankles">;
impactLevel?: "none" | "low" | "medium" | "high";
technicalComplexity?: "low" | "medium" | "high";
recoveryCost?: "low" | "medium" | "high";
```

#### Movement Confidence
Movement confidence helps the app choose safer variations before a user gets frustrated or intimidated.

Examples:

- low squat confidence: prefer goblet squat, leg press, box squat, or split squat regressions
- low hinge confidence: prefer Romanian deadlift instruction, hip thrusts, cable pull-throughs, or back extensions
- low vertical pull confidence: prefer assisted pull-up, lat pulldown, or band-assisted variations

Scoring idea:

- if confidence is low, penalize advanced or technically complex movements in that pattern
- prefer beginner-friendly variations with clear setup and coaching cues
- use descriptions to surface helpful form guidance in the preview

#### Disliked Exercises
This is one of the most valuable onboarding questions because adherence matters. A technically perfect plan is not useful if the user hates doing it.

Recommended question:

```text
Are there any exercises you strongly dislike or prefer to avoid?
```

The user could search/select exercises from the library, plus optionally choose movement categories:

- squats
- deadlifts/hinges
- lunges
- overhead pressing
- pull-ups
- running/jumping
- machines
- barbell lifts

How to use this:

- avoid disliked exercises when reasonable alternatives exist
- do not hard-block a plan only because one disliked exercise appears
- show a warning if a disliked exercise remains because no good replacement exists
- learn from swaps over time: if a user repeatedly swaps an exercise away, treat it as disliked

Scoring idea:

```ts
dislikedExercisePenalty = dislikedExerciseCount * 120;
dislikedPatternPenalty = dislikedPatternMatchCount * 60;
```

If an alternative exists with similar muscles, movement pattern, difficulty, and equipment, the app should substitute automatically.

Example warning:

```text
This plan includes 2 exercises you prefer to avoid. We found alternatives for one of them.
```

Example positive reason:

```text
Avoids the exercises you said you dislike while keeping the same muscle targets.
```

#### Preferred Equipment And Exercises
Preferences can also be positive.

Examples:

- user prefers dumbbells
- user prefers machines
- user likes barbell training
- user likes bodyweight work

This should be a smaller score influence than safety, equipment availability, and schedule fit, but it can make the plan feel more personal.

## Recommended Next Implementation Order
1. Add score breakdown output for debugging.
2. Move scoring weights into a config object.
3. Add explicit structured goals to workout templates.
4. Add weekly muscle volume scoring.
5. Add recovery cost scoring.
6. Add height and body weight as soft guidance inputs.
7. Add session length, recent consistency, body composition goal, joint concerns, and movement confidence.
8. Add disliked exercise and disliked movement-pattern inputs.
9. Add exercise description-derived complexity/safety scoring.
10. Improve recommendation UI with tradeoff explanations.

This order improves transparency first, then improves recommendation quality.
