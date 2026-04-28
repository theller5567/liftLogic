import {
  getPluralDisplayNameForCanonicalKey,
  getVerbPhraseForCanonicalKey,
} from "../../../shared/utils/exerciseLibraryAdapter";

const benchPressPluralLabel = getPluralDisplayNameForCanonicalKey("bench_press");
const benchPressVerbPhrase = getVerbPhraseForCanonicalKey("bench_press");
const dumbbellRowPluralLabel = getPluralDisplayNameForCanonicalKey("dumbbell_row");
const dumbbellRowVerbPhrase = getVerbPhraseForCanonicalKey("dumbbell_row");
const deadliftPluralLabel = getPluralDisplayNameForCanonicalKey("deadlift");
const deadliftVerbPhrase = getVerbPhraseForCanonicalKey("deadlift");

export const onboardingConfig = {
  id: "liftlogic-onboarding-v1",
  version: 1,
  steps: [
    {
      id: "goal",
      section: "Goals",
      type: "single_select",
      title: "What is your main goal right now?",
      field: "goal",
      options: [
        { label: "Build muscle", value: "hypertrophy" },
        { label: "Build strength", value: "strength" },
        { label: "Build muscle and strength", value: "hybrid" },
      ],
      required: true,
    },
    {
      id: "goal_priority",
      section: "Goals",
      type: "single_select",
      title: "Which should we prioritize first?",
      field: "goalPriority",
      options: [
        { label: "Muscle growth", value: "hypertrophy" },
        { label: "Strength gain", value: "strength" },
      ],
      required: true,
      showIf: {
        field: "goal",
        equals: "hybrid",
      },
    },
    {
      id: "experience",
      section: "Profile",
      type: "single_select",
      title: "How would you describe your lifting experience?",
      field: "experienceLevel",
      options: [
        { label: "Brand new to lifting", value: "beginner" },
        { label: "Some experience", value: "intermediate" },
        { label: "Very experienced", value: "advanced" },
      ],
      required: true,
    },
    {
      id: "equipment",
      section: "Profile",
      type: "single_select",
      title: "What equipment do you have access to?",
      field: "equipmentAccess",
      options: [
        { label: "Full gym", value: "full_gym" },
        { label: "Home gym", value: "home_gym" },
        { label: "Dumbbells only", value: "dumbbells_only" },
        { label: "Basic equipment", value: "basic_equipment" },
      ],
      required: true,
    },
    {
      id: "units",
      section: "Profile",
      type: "single_select",
      title: "Which unit do you want to use?",
      field: "weightUnit",
      options: [
        { label: "Pounds (lb)", value: "lb" },
        { label: "Kilograms (kg)", value: "kg" },
      ],
      required: true,
    },
    {
      id: "body_weight",
      section: "Profile",
      type: "number",
      title: "What is your current body weight?",
      field: "bodyWeight",
      required: false,
      min: 0,
      max: 1000,
    },
    {
      id: "core_lifts_intro",
      section: "Starting Weights",
      type: "info",
      title: "Let’s set your starting weights",
      body: "We’ll ask about a few core exercises. If you’re unsure, no problem — we’ll start conservatively and adjust from your first workouts.",
    },
  
    {
      id: "bench_familiarity",
      section: "Starting Weights",
      type: "single_select",
      title: `Have you done ${benchPressPluralLabel} before?`,
      field: "benchPress.familiarity",
      options: [
        { label: "Never", value: "never" },
        { label: "A little", value: "some" },
        { label: "Often", value: "often" },
      ],
      required: true,
      showIf: {
        field: "equipmentAccess",
        in: ["full_gym", "home_gym"],
      },
    },
    {
      id: "bench_knows_weight",
      section: "Starting Weights",
      type: "single_select",
      title: `Do you know a weight you can ${benchPressVerbPhrase} with good form for about 5–8 reps?`,
      field: "benchPress.knowsWorkingWeight",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: true,
      showIf: {
        all: [
          { field: "equipmentAccess", in: ["full_gym", "home_gym"] },
          { field: "benchPress.familiarity", in: ["some", "often"] },
        ],
      },
    },
    {
      id: "bench_weight",
      section: "Starting Weights",
      type: "number",
      title: `What weight can you ${benchPressVerbPhrase} with good form for about 5–8 reps?`,
      field: "benchPress.estimatedWeight",
      required: true,
      min: 0,
      max: 2000,
      showIf: {
        all: [
          { field: "equipmentAccess", in: ["full_gym", "home_gym"] },
          { field: "benchPress.knowsWorkingWeight", equals: true },
        ],
      },
    },
    {
      id: "bench_reps",
      section: "Starting Weights",
      type: "number",
      title: "How many clean reps can you do with that weight before form starts to break down?",
      field: "benchPress.estimatedReps",
      required: true,
      min: 1,
      max: 30,
      showIf: {
        all: [
          { field: "equipmentAccess", in: ["full_gym", "home_gym"] },
          { field: "benchPress.knowsWorkingWeight", equals: true },
        ],
      },
    },
    {
      id: "bench_confidence",
      section: "Starting Weights",
      type: "single_select",
      title: "How confident are you in that estimate?",
      field: "benchPress.confidence",
      options: [
        { label: "Very confident", value: "high" },
        { label: "Somewhat confident", value: "medium" },
        { label: "Not very confident", value: "low" },
      ],
      required: true,
      showIf: {
        field: "benchPress.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "dumbbell_row_familiarity",
      section: "Starting Weights",
      type: "single_select",
      title: `Have you done ${dumbbellRowPluralLabel} before?`,
      field: "dumbbellRow.familiarity",
      options: [
        { label: "Never", value: "never" },
        { label: "A little", value: "some" },
        { label: "Often", value: "often" },
      ],
      required: true,
      showIf: {
        field: "equipmentAccess",
        in: ["full_gym", "home_gym", "dumbbells_only", "basic_equipment"],
      },
    },
    {
      id: "dumbbell_row_knows_weight",
      section: "Starting Weights",
      type: "single_select",
      title: `Do you know a weight you can ${dumbbellRowVerbPhrase} with good form for about 5–8 reps?`,
      field: "dumbbellRow.knowsWorkingWeight",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: true,
      showIf: {
        all: [
          {
            field: "equipmentAccess",
            in: ["full_gym", "home_gym", "dumbbells_only", "basic_equipment"],
          },
          { field: "dumbbellRow.familiarity", in: ["some", "often"] },
        ],
      },
    },
    {
      id: "dumbbell_row_weight",
      section: "Starting Weights",
      type: "number",
      title: `What weight can you ${dumbbellRowVerbPhrase} with good form for about 5–8 reps?`,
      field: "dumbbellRow.estimatedWeight",
      required: true,
      min: 0,
      max: 2000,
      showIf: {
        field: "dumbbellRow.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "dumbbell_row_reps",
      section: "Starting Weights",
      type: "number",
      title: "How many clean reps can you do with that weight before form starts to break down?",
      field: "dumbbellRow.estimatedReps",
      required: true,
      min: 1,
      max: 30,
      showIf: {
        field: "dumbbellRow.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "dumbbell_row_confidence",
      section: "Starting Weights",
      type: "single_select",
      title: "How confident are you in that estimate?",
      field: "dumbbellRow.confidence",
      options: [
        { label: "Very confident", value: "high" },
        { label: "Somewhat confident", value: "medium" },
        { label: "Not very confident", value: "low" },
      ],
      required: true,
      showIf: {
        field: "dumbbellRow.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "squat_familiarity",
      section: "Starting Weights",
      type: "single_select",
      title: "Have you done Squats before?",
      field: "squat.familiarity",
      options: [
        { label: "Never", value: "never" },
        { label: "A little", value: "some" },
        { label: "Often", value: "often" },
      ],
      required: true,
      showIf: {
        field: "equipmentAccess",
        in: ["full_gym", "home_gym"],
      },
    },
    {
      id: "squat_knows_weight",
      section: "Starting Weights",
      type: "single_select",
      title: "Do you know a weight you can squat with good form for about 5–8 reps?",
      field: "squat.knowsWorkingWeight",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: true,
      showIf: {
        all: [
          { field: "equipmentAccess", in: ["full_gym", "home_gym"] },
          { field: "squat.familiarity", in: ["some", "often"] },
        ],
      },
    },
    {
      id: "squat_weight",
      section: "Starting Weights",
      type: "number",
      title: "What weight can you squat with good form for about 5–8 reps?",
      field: "squat.estimatedWeight",
      required: true,
      min: 0,
      max: 2000,
      showIf: {
        field: "squat.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "squat_reps",
      section: "Starting Weights",
      type: "number",
      title: "How many clean reps can you do with that weight before form starts to break down?",
      field: "squat.estimatedReps",
      required: true,
      min: 1,
      max: 30,
      showIf: {
        field: "squat.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "squat_confidence",
      section: "Starting Weights",
      type: "single_select",
      title: "How confident are you in that estimate?",
      field: "squat.confidence",
      options: [
        { label: "Very confident", value: "high" },
        { label: "Somewhat confident", value: "medium" },
        { label: "Not very confident", value: "low" },
      ],
      required: true,
      showIf: {
        field: "squat.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "barbell_deadlift_familiarity",
      section: "Starting Weights",
      type: "single_select",
      title: `Have you done ${deadliftPluralLabel} before?`,
      field: "barbellDeadlift.familiarity",
      options: [
        { label: "Never", value: "never" },
        { label: "A little", value: "some" },
        { label: "Often", value: "often" },
      ],
      required: true,
      showIf: {
        field: "equipmentAccess",
        in: ["full_gym", "home_gym"],
      },
    },
    {
      id: "barbell_deadlift_knows_weight",
      section: "Starting Weights",
      type: "single_select",
      title: `Do you know a weight you can ${deadliftVerbPhrase} with good form for about 5–8 reps?`,
      field: "barbellDeadlift.knowsWorkingWeight",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
      required: true,
      showIf: {
        all: [
          { field: "equipmentAccess", in: ["full_gym", "home_gym"] },
          { field: "barbellDeadlift.familiarity", in: ["some", "often"] },
        ],
      },
    },
    {
      id: "barbell_deadlift_weight",
      section: "Starting Weights",
      type: "number",
      title: `What weight can you ${deadliftVerbPhrase} with good form for about 5–8 reps?`,
      field: "barbellDeadlift.estimatedWeight",
      required: true,
      min: 0,
      max: 2000,
      showIf: {
        field: "barbellDeadlift.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "barbell_deadlift_reps",
      section: "Starting Weights",
      type: "number",
      title: "How many clean reps can you do with that weight before form starts to break down?",
      field: "barbellDeadlift.estimatedReps",
      required: true,
      min: 1,
      max: 30,
      showIf: {
        field: "barbellDeadlift.knowsWorkingWeight",
        equals: true,
      },
    },
    {
      id: "barbell_deadlift_confidence",
      section: "Starting Weights",
      type: "single_select",
      title: "How confident are you in that estimate?",
      field: "barbellDeadlift.confidence",
      options: [
        { label: "Very confident", value: "high" },
        { label: "Somewhat confident", value: "medium" },
        { label: "Not very confident", value: "low" },
      ],
      required: true,
      showIf: {
        field: "barbellDeadlift.knowsWorkingWeight",
        equals: true,
      },
    },
  ],
};
