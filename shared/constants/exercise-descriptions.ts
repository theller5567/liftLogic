import {
  exerciseLibrary,
  type EquipmentType,
  type ExerciseDefinition,
  type ExerciseDescription,
  type MuscleGroup,
  type MovementPattern,
} from "./exercise-library";

const muscleLabels: Record<MuscleGroup, string> = {
  chest: "chest",
  upper_chest: "upper chest",
  lower_chest: "lower chest",
  lats: "lats",
  upper_back: "upper back",
  rear_delts: "rear delts",
  lateral_delts: "side delts",
  front_delts: "front delts",
  triceps: "triceps",
  biceps: "biceps",
  forearms: "forearms",
  quadriceps: "quadriceps",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
  lower_back: "lower back",
  scapular_stabilizers: "scapular stabilizers",
  abductors: "abductors",
  adductors: "adductors",
  core: "core",
  hip_flexors: "hip flexors",
  obliques: "obliques",
  shoulders: "shoulders",
  tibialis_anterior: "tibialis anterior",
  traps: "traps",
};

const movementLabels: Record<MovementPattern, string> = {
  squat: "squat",
  lunge: "lunge",
  step_up: "step-up",
  hinge: "hip hinge",
  hip_thrust: "hip thrust",
  calf_raise: "calf raise",
  carry: "loaded carry",
  vertical_pull: "vertical pull",
  horizontal_pull: "horizontal pull",
  scapular_control: "scapular control",
  horizontal_press: "horizontal press",
  vertical_press: "vertical press",
  lateral_raise: "lateral raise",
  push_up: "push-up",
  triceps_extension: "triceps extension",
  triceps_pushdown: "triceps pushdown",
  curl: "curl",
  fly: "fly",
  pullover: "pullover",
  anti_extension: "anti-extension",
  anti_rotation: "anti-rotation",
  conditioning: "conditioning",
  front_raise: "front raise",
  get_up: "get-up",
  hip_abduction: "hip abduction",
  hip_adduction: "hip adduction",
  hip_extension: "hip extension",
  isometric_hold: "isometric hold",
  jump: "jump",
  olympic_lift: "Olympic lift",
  rotation: "rotation",
  sled: "sled",
  tibialis_raise: "tibialis raise",
  trunk_flexion: "trunk flexion",
  wrist_extension: "wrist extension",
  wrist_flexion: "wrist flexion",
  other: "strength",
};

const equipmentLabels: Record<EquipmentType, string> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  machine: "machine",
  smith_machine: "Smith machine",
  cable: "cable",
  bodyweight: "bodyweight",
  assisted_machine: "assisted machine",
  swiss_ball: "Swiss ball",
  kettlebell: "kettlebell",
  bench: "bench",
  mixed: "mixed-equipment",
  other: "equipment-specific",
};

const setupByEquipment: Record<EquipmentType, string[]> = {
  barbell: [
    "Set the bar and plates so the lift starts from a stable position.",
    "Grip the bar evenly and create full-body tension before starting.",
  ],
  dumbbell: [
    "Choose dumbbells you can control through the full range of motion.",
    "Set your stance or bench position before beginning the first rep.",
  ],
  machine: [
    "Adjust the seat, pad, or handles so the machine lines up with your joints.",
    "Select a load that lets you move smoothly without bouncing the weight.",
  ],
  smith_machine: [
    "Set the Smith machine hooks and safety stops before loading the bar.",
    "Position your body so the fixed bar path matches the exercise pattern.",
  ],
  cable: [
    "Set the pulley height and attachment for the exercise.",
    "Stand far enough from the stack to keep tension through the full rep.",
  ],
  bodyweight: [
    "Set up on a stable surface with enough room to move freely.",
    "Brace your torso and find a starting position you can control.",
  ],
  assisted_machine: [
    "Adjust the machine and assistance level before starting.",
    "Use enough assistance to complete clean reps without rushing.",
  ],
  swiss_ball: [
    "Use a properly inflated ball on a non-slip surface.",
    "Find a balanced starting position before adding movement.",
  ],
  kettlebell: [
    "Place the kettlebell where you can reach it without losing posture.",
    "Grip the handle firmly and brace before initiating the movement.",
  ],
  bench: [
    "Set the bench angle or position needed for the exercise.",
    "Keep your points of contact stable before starting each rep.",
  ],
  mixed: [
    "Set up all required equipment before the first working set.",
    "Confirm each station or implement is stable and within reach.",
  ],
  other: [
    "Set up the exercise space and equipment so you can move safely.",
    "Start from a balanced, controlled position.",
  ],
};

const executionByPattern: Partial<Record<MovementPattern, string[]>> = {
  squat: [
    "Brace your core, bend at the knees and hips, and lower under control.",
    "Drive through the mid-foot to stand tall while keeping the knees tracking well.",
  ],
  lunge: [
    "Step or position one leg forward and lower with control.",
    "Drive through the working leg to return to a strong, balanced position.",
  ],
  step_up: [
    "Place the working foot fully on the step or box.",
    "Drive through that foot and stand tall without pushing excessively from the trailing leg.",
  ],
  hinge: [
    "Push the hips back while keeping the spine controlled.",
    "Stand by driving the hips forward and keeping the load close.",
  ],
  hip_thrust: [
    "Start with the hips lowered and the torso supported.",
    "Drive through the feet and squeeze the glutes at the top without overextending the low back.",
  ],
  calf_raise: [
    "Start with the foot stable and heel lowered under control.",
    "Rise onto the ball of the foot, pause briefly, then lower smoothly.",
  ],
  carry: [
    "Pick up the load with a braced torso and tall posture.",
    "Walk with controlled steps while keeping the load steady.",
  ],
  vertical_pull: [
    "Start with the arms extended and shoulders controlled.",
    "Pull the elbows down toward the ribs, then return with control.",
  ],
  horizontal_pull: [
    "Start with the arms extended and torso stable.",
    "Row the elbows back, squeeze the upper back, and return under control.",
  ],
  horizontal_press: [
    "Brace and lower the load toward the chest or pressing position.",
    "Press away smoothly while keeping the shoulders stable.",
  ],
  vertical_press: [
    "Start with the load near shoulder level and brace the torso.",
    "Press overhead without leaning back, then lower with control.",
  ],
  curl: [
    "Keep the upper arm controlled as you curl the load.",
    "Squeeze briefly at the top, then lower without swinging.",
  ],
  triceps_extension: [
    "Keep the upper arm controlled as you bend at the elbow.",
    "Extend the elbow fully while keeping the shoulder position steady.",
  ],
  triceps_pushdown: [
    "Set the elbows close to your sides.",
    "Press the attachment down by extending the elbows, then return with control.",
  ],
  lateral_raise: [
    "Raise the arms out to the sides with a slight bend in the elbows.",
    "Stop around shoulder height and lower slowly.",
  ],
  fly: [
    "Open the arms with a controlled arc and a soft elbow bend.",
    "Bring the arms together by squeezing the target muscles.",
  ],
  anti_extension: [
    "Brace the torso and resist letting the low back arch.",
    "Hold or move only as far as you can maintain a stable trunk.",
  ],
  anti_rotation: [
    "Brace the torso and resist rotation from the load or cable.",
    "Move slowly while keeping the ribs and pelvis controlled.",
  ],
  isometric_hold: [
    "Move into the target position with control.",
    "Hold steady while maintaining posture and breathing.",
  ],
};

const cuesByPattern: Partial<Record<MovementPattern, string[]>> = {
  squat: ["Brace before each rep.", "Knees track with toes.", "Keep pressure through the mid-foot."],
  hinge: ["Hips back.", "Keep the load close.", "Stand by driving the hips through."],
  horizontal_press: ["Shoulders stay packed.", "Press smoothly.", "Keep wrists stacked."],
  vertical_press: ["Ribs down.", "Press overhead in a controlled path.", "Avoid leaning back."],
  vertical_pull: ["Pull elbows down.", "Keep shoulders controlled.", "Avoid shrugging into the neck."],
  horizontal_pull: ["Row with the elbows.", "Squeeze the upper back.", "Keep the torso quiet."],
  curl: ["Elbows stay controlled.", "No swinging.", "Lower slowly."],
  triceps_extension: ["Control the elbows.", "Reach full extension.", "Keep shoulders steady."],
  triceps_pushdown: ["Elbows pinned.", "Press down and back.", "Control the return."],
};

const mistakesByPattern: Partial<Record<MovementPattern, string[]>> = {
  squat: ["Letting the knees collapse inward.", "Shifting onto the toes.", "Losing core tension."],
  hinge: ["Rounding the low back.", "Squatting instead of hinging.", "Letting the load drift away."],
  horizontal_press: ["Flaring the elbows aggressively.", "Bouncing the load.", "Losing shoulder control."],
  vertical_press: ["Overarching the low back.", "Pressing forward instead of overhead.", "Rushing the lowering phase."],
  vertical_pull: ["Pulling with only the arms.", "Shrugging at the top.", "Using uncontrolled momentum."],
  horizontal_pull: ["Jerking the torso.", "Letting shoulders roll forward.", "Cutting the range short."],
  curl: ["Swinging the torso.", "Letting elbows drift too far forward.", "Dropping the weight quickly."],
  triceps_extension: ["Flaring the elbows.", "Moving from the shoulder instead of the elbow.", "Using too much weight."],
  triceps_pushdown: ["Letting elbows drift forward.", "Leaning bodyweight into the movement.", "Snapping the return."],
};

const curatedDescriptions: Record<string, ExerciseDescription> = {
  back_squat: {
    overview:
      "A compound lower-body lift that trains the squat pattern with a barbell across the upper back. It is commonly used to build leg strength, lower-body muscle, and full-body bracing skill.",
    primaryTarget: "Quadriceps and glutes",
    secondaryTargets: "Hamstrings, lower back, adductors, upper back, and core",
    setup: [
      "Set the bar in a rack around upper-chest height.",
      "Step under the bar and place it securely across your upper back, not on your neck.",
      "Grip the bar evenly, pull your shoulder blades together, and brace your torso.",
      "Unrack the bar, take one or two controlled steps back, and set your feet about shoulder-width apart.",
    ],
    execution: [
      "Take a breath in and brace before starting the rep.",
      "Bend at the knees and hips together while keeping the bar over your mid-foot.",
      "Lower under control until you reach a depth you can maintain with stable posture.",
      "Drive through the mid-foot and stand tall without letting your knees cave inward.",
    ],
    coachingCues: [
      "Brace before every rep.",
      "Keep the bar over the mid-foot.",
      "Knees track in line with toes.",
      "Drive the floor away on the way up.",
    ],
    commonMistakes: [
      "Letting the knees collapse inward.",
      "Shifting onto the toes.",
      "Rounding the lower back at the bottom.",
      "Rushing the descent and losing control.",
    ],
    safetyNotes: [
      "Use safety pins or spotter arms when training near failure.",
      "Start with a lighter load until your depth and bracing are consistent.",
      "Stop the set if pain changes your movement or you cannot maintain control.",
    ],
    breathing:
      "Inhale and brace before lowering. Exhale after passing the hardest part of the ascent or once standing tall.",
    tempo:
      "Use a controlled descent, a brief stable bottom position, and a strong but balanced drive upward.",
    rangeOfMotion:
      "Squat as deep as you can while keeping your feet planted, knees tracking well, and torso controlled.",
    difficultyNotes:
      "Best for lifters who can brace well and control a loaded squat pattern. Beginners may learn the pattern first with goblet squats or box squats.",
  },
};

const capitalize = (value: string) =>
  value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;

const formatList = (values: string[]) => {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const getExerciseName = (exercise: ExerciseDefinition) =>
  exercise.displayName ?? exercise.name;

const getMuscleList = (muscles: MuscleGroup[]) =>
  formatList(muscles.map((muscle) => muscleLabels[muscle]));

const getDefaultExecution = () => [
  "Move through the exercise with control and keep the target muscles engaged.",
  "Return to the starting position without losing posture or rushing the rep.",
];

const getDefaultCues = (exercise: ExerciseDefinition) => [
  "Brace and stay controlled.",
  `Keep tension on the ${getMuscleList(exercise.primaryMuscles)}.`,
  "Use a smooth range of motion.",
];

const getDefaultMistakes = () => [
  "Using more load than you can control.",
  "Rushing the movement.",
  "Letting posture break down before the set is finished.",
];

const getSafetyNotes = (exercise: ExerciseDefinition) => {
  const notes = [
    "Use a load and range of motion you can control.",
    "Stop the set if pain changes your technique.",
  ];

  if (exercise.equipmentType === "barbell" || exercise.equipmentType === "smith_machine") {
    notes.unshift("Use safeties or a spotter when training heavy or near failure.");
  }

  if (exercise.difficulty === "advanced") {
    notes.push("Practice with conservative loading before pushing intensity.");
  }

  return notes;
};

const getBreathing = (exercise: ExerciseDefinition) =>
  exercise.isCompound
    ? "Inhale and brace before the rep. Exhale after the hardest part of the movement or once you return to a stable position."
    : "Exhale during the effort phase and inhale as you return with control.";

const getTempo = (targetType: ExerciseDefinition["targetType"]) =>
  targetType === "time"
    ? "Hold steady tension for the prescribed time while keeping breathing controlled."
    : "Use a controlled lowering phase, a brief stable position, and a smooth effort phase.";

const getRangeOfMotion = (exercise: ExerciseDefinition) =>
  exercise.targetType === "time"
    ? "Use the position you can hold without compensation for the full prescribed time."
    : "Use the largest pain-free range you can control while keeping the target muscles loaded.";

export const buildExerciseDescription = (
  exercise: ExerciseDefinition
): ExerciseDescription => {
  const curatedDescription = curatedDescriptions[exercise.id];

  if (curatedDescription) {
    return curatedDescription;
  }

  const name = getExerciseName(exercise);
  const primaryTarget = capitalize(getMuscleList(exercise.primaryMuscles));
  const secondaryTargets = exercise.secondaryMuscles.length
    ? capitalize(getMuscleList(exercise.secondaryMuscles))
    : undefined;
  const movementLabel = movementLabels[exercise.movementPattern];
  const equipmentLabel =
    exercise.primaryEquipment ?? equipmentLabels[exercise.equipmentType];
  const exerciseRole = exercise.isCompound ? "compound" : "targeted";

  return {
    overview: `${name} is a ${exerciseRole} ${movementLabel} exercise that primarily trains the ${getMuscleList(exercise.primaryMuscles)} using ${equipmentLabel}.`,
    primaryTarget,
    ...(secondaryTargets ? { secondaryTargets } : {}),
    setup: [
      ...setupByEquipment[exercise.equipmentType],
      `Set your body position so the ${getMuscleList(exercise.primaryMuscles)} can do most of the work.`,
    ],
    execution:
      executionByPattern[exercise.movementPattern] ?? getDefaultExecution(),
    coachingCues: cuesByPattern[exercise.movementPattern] ?? getDefaultCues(exercise),
    commonMistakes:
      mistakesByPattern[exercise.movementPattern] ?? getDefaultMistakes(),
    safetyNotes: getSafetyNotes(exercise),
    breathing: getBreathing(exercise),
    tempo: getTempo(exercise.targetType),
    rangeOfMotion: getRangeOfMotion(exercise),
    difficultyNotes: `${capitalize(exercise.difficulty ?? "beginner")} difficulty. Prioritize clean technique before increasing load, speed, or volume.`,
  };
};

export const exerciseDescriptions: Record<string, ExerciseDescription> =
  Object.fromEntries(
    exerciseLibrary.exercises.map((exercise) => [
      exercise.id,
      buildExerciseDescription(exercise),
    ])
  );

export const getExerciseDescription = (exerciseId: string) =>
  exerciseDescriptions[exerciseId] ?? null;
