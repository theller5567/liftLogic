import type { ExerciseKey } from "./weightEstimationRules";

export type MuscleGroup =
  | "chest"
  | "upper_chest"
  | "lower_chest"
  | "lats"
  | "upper_back"
  | "rear_delts"
  | "lateral_delts"
  | "front_delts"
  | "triceps"
  | "biceps"
  | "forearms"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "lower_back"
  | "scapular_stabilizers"
  | "abductors"
  | "adductors"
  | "core"
  | "hip_flexors"
  | "obliques"
  | "shoulders"
  | "tibialis_anterior"
  | "traps";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "smith_machine"
  | "cable"
  | "bodyweight"
  | "assisted_machine"
  | "swiss_ball"
  | "kettlebell"
  | "bench"
  | "mixed"
  | "other";

export type MovementPattern =
  | "squat"
  | "lunge"
  | "step_up"
  | "hinge"
  | "hip_thrust"
  | "calf_raise"
  | "carry"
  | "vertical_pull"
  | "horizontal_pull"
  | "scapular_control"
  | "horizontal_press"
  | "vertical_press"
  | "lateral_raise"
  | "push_up"
  | "triceps_extension"
  | "triceps_pushdown"
  | "curl"
  | "fly"
  | "pullover"
  | "anti_extension"
  | "anti_rotation"
  | "conditioning"
  | "front_raise"
  | "get_up"
  | "hip_abduction"
  | "hip_adduction"
  | "hip_extension"
  | "isometric_hold"
  | "jump"
  | "olympic_lift"
  | "rotation"
  | "sled"
  | "tibialis_raise"
  | "trunk_flexion"
  | "wrist_extension"
  | "wrist_flexion"
  | "other";

export type ExerciseCategory =
  | "chest"
  | "back"
  | "shoulders"
  | "legs"
  | "arms"
  | "core"
  | "conditioning"
  | "olympic"
  | "mobility"
  | "other";

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";
export type ExerciseLaterality = "bilateral" | "unilateral";
export type ExerciseLoadType =
  | "bodyweight"
  | "weighted"
  | "assisted"
  | "machine"
  | "timed";
export type ExerciseTargetType = "reps" | "time" | "distance" | "calories";

export interface ExerciseAlternativeRef {
  exerciseId: string;
  note?: string;
}

export interface ExerciseDescription {
  overview: string;
  primaryTarget: string;
  secondaryTargets?: string;
  setup: string[];
  execution: string[];
  coachingCues: string[];
  commonMistakes: string[];
  safetyNotes?: string[];
  breathing?: string;
  tempo?: string;
  rangeOfMotion?: string;
  difficultyNotes?: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  aliases?: string[];
  canonicalEstimatorKey?: ExerciseKey;
  displayName?: string;
  pluralDisplayName?: string;
  verbPhrase?: string;
  equipmentType: EquipmentType;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  alternatives: ExerciseAlternativeRef[];
  description?: ExerciseDescription;
  notes?: string[];
  category?: ExerciseCategory;
  difficulty?: ExerciseDifficulty;
  laterality?: ExerciseLaterality;
  loadType?: ExerciseLoadType;
  targetType?: ExerciseTargetType;
  isCompound?: boolean;
  primaryEquipment?: string;
  secondaryEquipment?: string[];
}

export interface WorkoutTemplateWorkoutDay {
  id: string;
  day: number;
  type: "workout";
  label: string;
  exerciseIds: string[];
}

export interface WorkoutTemplateRestDay {
  day: number;
  type: "rest";
  label: string;
}

export type WorkoutExperienceLevel = "beginner" | "intermediate" | "advanced";

export type WorkoutTemplateDay = WorkoutTemplateWorkoutDay | WorkoutTemplateRestDay;

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  focus: string;
  experienceLevel: WorkoutExperienceLevel;
  daysRequired: number;
  primaryGoal: string;
  workoutDays: WorkoutTemplateDay[];
}

export interface ExerciseLibrary {
  schemaVersion?: number;
  categories?: ExerciseCategory[];
  difficultyLevels?: ExerciseDifficulty[];
  lateralityOptions?: ExerciseLaterality[];
  loadTypes?: ExerciseLoadType[];
  targetTypes?: ExerciseTargetType[];
  muscleGroups: MuscleGroup[];
  equipmentTypes: EquipmentType[];
  movementPatterns: MovementPattern[];
  exercises: ExerciseDefinition[];
  workoutTemplates: WorkoutTemplate[];
}

export const exerciseLibrary: ExerciseLibrary = {
  "schemaVersion": 2,
  "categories": [
    "chest",
    "back",
    "shoulders",
    "legs",
    "arms",
    "core",
    "conditioning",
    "olympic",
    "mobility",
    "other"
  ],
  "difficultyLevels": [
    "beginner",
    "intermediate",
    "advanced"
  ],
  "lateralityOptions": [
    "bilateral",
    "unilateral"
  ],
  "loadTypes": [
    "bodyweight",
    "weighted",
    "assisted",
    "machine",
    "timed"
  ],
  "targetTypes": [
    "reps",
    "time",
    "distance",
    "calories"
  ],
  "muscleGroups": [
    "chest",
    "upper_chest",
    "lower_chest",
    "lats",
    "upper_back",
    "rear_delts",
    "lateral_delts",
    "front_delts",
    "triceps",
    "biceps",
    "forearms",
    "quadriceps",
    "hamstrings",
    "glutes",
    "calves",
    "lower_back",
    "scapular_stabilizers",
    "traps",
    "core",
    "adductors",
    "abductors",
    "tibialis_anterior",
    "shoulders",
    "obliques",
    "hip_flexors"
  ],
  "equipmentTypes": [
    "barbell",
    "dumbbell",
    "machine",
    "smith_machine",
    "cable",
    "bodyweight",
    "assisted_machine",
    "swiss_ball",
    "bench",
    "mixed",
    "other",
    "kettlebell"
  ],
  "movementPatterns": [
    "squat",
    "lunge",
    "step_up",
    "hinge",
    "hip_thrust",
    "calf_raise",
    "carry",
    "vertical_pull",
    "horizontal_pull",
    "scapular_control",
    "horizontal_press",
    "vertical_press",
    "lateral_raise",
    "push_up",
    "triceps_extension",
    "triceps_pushdown",
    "curl",
    "fly",
    "pullover",
    "olympic_lift",
    "front_raise",
    "hip_extension",
    "hip_abduction",
    "hip_adduction",
    "tibialis_raise",
    "wrist_flexion",
    "wrist_extension",
    "isometric_hold",
    "anti_extension",
    "anti_rotation",
    "trunk_flexion",
    "rotation",
    "get_up",
    "conditioning",
    "sled",
    "jump"
  ],
  "exercises": [
    {
      "id": "back_squat",
      "name": "Back Squat",
      "aliases": [
        "Barbell Back Squat"
      ],
      "canonicalEstimatorKey": "squat",
      "displayName": "Back Squat",
      "pluralDisplayName": "Back Squats",
      "verbPhrase": "Back Squat",
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "lower_back"
      ],
      "alternatives": [
        {
          "exerciseId": "box_squat",
          "note": "Easier on the knees if that’s an issue"
        },
        {
          "exerciseId": "leg_press"
        },
        {
          "exerciseId": "hack_squat"
        },
        {
          "exerciseId": "goblet_squat",
          "note": "Easier on the lower back if that’s an issue"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "bulgarian_split_squat",
      "name": "Bulgarian Split Squat",
      "equipmentType": "dumbbell",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [
        {
          "exerciseId": "dumbbell_lunge"
        },
        {
          "exerciseId": "barbell_lunge"
        },
        {
          "exerciseId": "glute_focused_step_up",
          "note": "More glute-focused if using a higher box and slight forward torso lean"
        },
        {
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "walking_lunge"
        },
        {
          "exerciseId": "smith_machine_stationary_lunge"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_lunge",
      "name": "Dumbbell Lunge",
      "aliases": [
        "DB Lunge"
      ],
      "equipmentType": "dumbbell",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "calves"
      ],
      "alternatives": [
        {
          "exerciseId": "barbell_lunge"
        },
        {
          "exerciseId": "walking_lunge"
        },
        {
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "bulgarian_split_squat"
        }
      ],
      "notes": [
        "Use paired dumbbells or a goblet hold depending on balance and equipment."
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_lunge",
      "name": "Barbell Lunge",
      "equipmentType": "barbell",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "calves",
        "lower_back"
      ],
      "alternatives": [
        {
          "exerciseId": "dumbbell_lunge",
          "note": "Easier to bail out and easier on balance"
        },
        {
          "exerciseId": "smith_machine_stationary_lunge"
        },
        {
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "bulgarian_split_squat"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "glute_focused_step_up",
      "name": "Glute-Focused Step-Up",
      "aliases": [
        "Glute Step-Up",
        "Dumbbell Step-Up"
      ],
      "equipmentType": "dumbbell",
      "movementPattern": "step_up",
      "primaryMuscles": [
        "glutes",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "calves"
      ],
      "alternatives": [
        {
          "exerciseId": "bulgarian_split_squat"
        },
        {
          "exerciseId": "dumbbell_lunge"
        },
        {
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "barbell_hip_thrust",
          "note": "More direct glute loading"
        }
      ],
      "notes": [
        "Use a box height that lets the front leg do most of the work.",
        "Slightly lean forward and drive through the whole foot to bias glutes."
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "farmer_carry",
      "name": "Farmer Carry",
      "aliases": [
        "Farmer's Carry",
        "Farmer Walk",
        "Dumbbell Farmer Carry"
      ],
      "equipmentType": "mixed",
      "movementPattern": "carry",
      "primaryMuscles": [
        "forearms",
        "upper_back"
      ],
      "secondaryMuscles": [
        "glutes",
        "lower_back",
        "scapular_stabilizers"
      ],
      "alternatives": [],
      "notes": [
        "Use dumbbells, kettlebells, trap bar handles, or farmer handles.",
        "Track distance or time alongside load when logging carries."
      ],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "mixed",
      "secondaryEquipment": []
    },
    {
      "id": "glute_ham_raise",
      "name": "Glute Ham Raise",
      "equipmentType": "machine",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [
        "glutes",
        "lower_back"
      ],
      "alternatives": [
        {
          "exerciseId": "swiss_ball_leg_curl"
        },
        {
          "exerciseId": "lying_leg_curl"
        },
        {
          "exerciseId": "seated_leg_curl"
        },
        {
          "exerciseId": "back_extension_hamstring_focused"
        }
      ],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "smith_machine_calf_raise",
      "name": "Smith Machine Calf Raise",
      "equipmentType": "smith_machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "standing_calf_raise_machine"
        },
        {
          "exerciseId": "standing_dumbbell_calf_raise",
          "note": "Ideally with toes on an elevated platform"
        },
        {
          "exerciseId": "leg_press_calf_raise"
        }
      ],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "seated_weighted_calf_raise",
      "name": "Seated Weighted Calf Raise",
      "equipmentType": "mixed",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "dumbbell_seated_calf_raise",
          "note": "Hold dumbbells on top of knees"
        },
        {
          "exerciseId": "weighted_smith_machine_calf_raise"
        },
        {
          "exerciseId": "standing_calf_raise_machine"
        },
        {
          "exerciseId": "leg_press_calf_raise"
        }
      ],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "mixed",
      "secondaryEquipment": []
    },
    {
      "id": "front_squat",
      "name": "Front Squat",
      "canonicalEstimatorKey": "front_squat",
      "displayName": "Front Squat",
      "pluralDisplayName": "Front Squats",
      "verbPhrase": "Front Squat",
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "upper_back"
      ],
      "alternatives": [
        {
          "exerciseId": "leg_press"
        },
        {
          "exerciseId": "goblet_squat"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "deadlift",
      "name": "Deadlift",
      "aliases": [
        "Conventional Deadlift",
        "Deadlifts"
      ],
      "canonicalEstimatorKey": "deadlift",
      "displayName": "Barbell Deadlift",
      "pluralDisplayName": "Barbell Deadlifts",
      "verbPhrase": "Barbell Deadlift",
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes",
        "lower_back"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [
        {
          "exerciseId": "sumo_deadlift",
          "note": "Easier on the lower back if that’s an issue"
        },
        {
          "exerciseId": "trap_bar_deadlift",
          "note": "Easier on the lower back if that’s an issue"
        },
        {
          "exerciseId": "below_knee_rack_pull"
        },
        {
          "exerciseId": "dumbbell_romanian_deadlift"
        },
        {
          "exerciseId": "back_extension"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_hip_thrust",
      "name": "Barbell Hip Thrust",
      "canonicalEstimatorKey": "barbell_hip_thrust",
      "displayName": "Barbell Hip Thrust",
      "pluralDisplayName": "Barbell Hip Thrusts",
      "verbPhrase": "Barbell Hip Thrust",
      "equipmentType": "barbell",
      "movementPattern": "hip_thrust",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [
        {
          "exerciseId": "smith_machine_hip_thrust"
        },
        {
          "exerciseId": "single_leg_hip_thrust",
          "note": "Add weight by holding weight on planted leg"
        },
        {
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "cable_pull_through"
        }
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "single_leg_weighted_calf_raise",
      "name": "Single Leg Weighted Calf Raise",
      "canonicalEstimatorKey": "single_leg_weighted_calf_raise",
      "displayName": "Single Leg Weighted Calf Raise",
      "pluralDisplayName": "Single Leg Weighted Calf Raises",
      "verbPhrase": "Single Leg Weighted Calf Raise",
      "equipmentType": "dumbbell",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "standing_calf_raise_machine"
        },
        {
          "exerciseId": "standing_dumbbell_calf_raise",
          "note": "Ideally with toes on an elevated platform"
        }
      ],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "leg_press_calf_raise",
      "name": "Leg Press Calf Raise",
      "canonicalEstimatorKey": "leg_press_calf_raise",
      "displayName": "Leg Press Calf Raise",
      "pluralDisplayName": "Leg Press Calf Raises",
      "verbPhrase": "Leg Press Calf Raise",
      "equipmentType": "machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "standing_calf_raise_machine"
        },
        {
          "exerciseId": "standing_dumbbell_calf_raise",
          "note": "Ideally with toes on an elevated platform"
        }
      ],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "pull_up",
      "name": "Pull-Up",
      "aliases": [
        "Pull-Ups"
      ],
      "equipmentType": "bodyweight",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps",
        "scapular_stabilizers"
      ],
      "alternatives": [
        {
          "exerciseId": "chin_up"
        },
        {
          "exerciseId": "assisted_pull_up_machine"
        }
      ],
      "notes": [
        "Original source also referenced non-exercise 'Exercise suggestions from chapter x', omitted from normalized library."
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "seated_row",
      "name": "Seated Row",
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "t_bar_row"
        },
        {
          "exerciseId": "barbell_row"
        },
        {
          "exerciseId": "dumbbell_row"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "reverse_pec_deck",
      "name": "Reverse Pec Deck",
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [
        {
          "exerciseId": "bent_over_reverse_dumbbell_fly"
        },
        {
          "exerciseId": "standing_cable_reverse_fly"
        },
        {
          "exerciseId": "wide_grip_seated_row"
        }
      ],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "standing_kneeling_face_pull",
      "name": "Standing/Kneeling Face Pulls",
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts",
        "upper_back"
      ],
      "secondaryMuscles": [
        "scapular_stabilizers"
      ],
      "alternatives": [
        {
          "exerciseId": "bent_over_reverse_dumbbell_fly"
        },
        {
          "exerciseId": "standing_cable_reverse_fly"
        },
        {
          "exerciseId": "wide_grip_seated_row"
        }
      ],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "incline_dumbbell_curl",
      "name": "Incline Dumbbell Curl",
      "aliases": [
        "Incline Dumbbell Curls"
      ],
      "equipmentType": "dumbbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": [
        {
          "exerciseId": "behind_body_cable_curl"
        },
        {
          "exerciseId": "narrow_grip_bar_curl"
        },
        {
          "exerciseId": "bayesian_curl"
        }
      ],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "hammer_curl",
      "name": "Hammer Curl",
      "aliases": [
        "Hammer Curls"
      ],
      "equipmentType": "dumbbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps",
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "reverse_grip_curl"
        },
        {
          "exerciseId": "rope_cable_curl_neutral"
        }
      ],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "scapular_pull_up",
      "name": "Scapular Pull-Up",
      "aliases": [
        "Scapular Pull-Ups"
      ],
      "equipmentType": "bodyweight",
      "movementPattern": "scapular_control",
      "primaryMuscles": [
        "scapular_stabilizers",
        "upper_back"
      ],
      "secondaryMuscles": [
        "lats"
      ],
      "alternatives": [
        {
          "exerciseId": "prone_y_raise"
        },
        {
          "exerciseId": "wall_slide"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "incline_dumbbell_press",
      "name": "Incline Dumbbell Press",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "upper_chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [
        {
          "exerciseId": "incline_bench_press"
        },
        {
          "exerciseId": "incline_hammer_press"
        },
        {
          "exerciseId": "incline_smith_machine_press"
        }
      ],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "flat_dumbbell_press",
      "name": "Flat Dumbbell Press",
      "canonicalEstimatorKey": "dumbbell_bench_press",
      "displayName": "Dumbbell Bench Press",
      "pluralDisplayName": "Dumbbell Bench Presses",
      "verbPhrase": "Dumbbell Bench Press",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [
        {
          "exerciseId": "neutral_grip_flat_dumbbell_press",
          "note": "Easier on shoulder if that’s an issue"
        },
        {
          "exerciseId": "flat_hammer_machine_press"
        }
      ],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "cable_dumbbell_lateral_raise",
      "name": "Cable/Dumbbell Lateral Raises",
      "equipmentType": "mixed",
      "movementPattern": "lateral_raise",
      "primaryMuscles": [
        "lateral_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [
        {
          "exerciseId": "machine_lateral_raise"
        },
        {
          "exerciseId": "lying_incline_dumbbell_lateral_raise"
        },
        {
          "exerciseId": "leaning_weighted_bar_lateral_raise"
        },
        {
          "exerciseId": "seated_dumbbell_press"
        },
        {
          "exerciseId": "dumbbell_upright_row_external_rotation"
        }
      ],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "mixed",
      "secondaryEquipment": []
    },
    {
      "id": "banded_push_up",
      "name": "Banded Push-Up",
      "aliases": [
        "Banded Push-Ups"
      ],
      "equipmentType": "bodyweight",
      "movementPattern": "push_up",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "standing_seated_cable_crossover"
        },
        {
          "exerciseId": "triangle_push_up",
          "note": "Change to incline/decline for added difficulty if needed"
        }
      ],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "overhead_rope_extension",
      "name": "Overhead Rope Extension",
      "aliases": [
        "Overhead Rope Extensions"
      ],
      "equipmentType": "cable",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "incline_overhead_dumbbell_extension"
        },
        {
          "exerciseId": "lying_incline_dumbbell_tricep_kickback"
        },
        {
          "exerciseId": "incline_lying_skullcrusher_barbell"
        }
      ],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "bar_tricep_pushdown",
      "name": "Bar Tricep Pushdown",
      "aliases": [
        "Bar Tricep Pushdowns"
      ],
      "canonicalEstimatorKey": "tricep_pushdown",
      "equipmentType": "cable",
      "movementPattern": "triceps_pushdown",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "rope_pushdown"
        },
        {
          "exerciseId": "tricep_dip"
        },
        {
          "exerciseId": "tricep_kickback"
        }
      ],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_bench_press",
      "name": "Barbell Bench Press",
      "canonicalEstimatorKey": "bench_press",
      "displayName": "Bench Press (Barbell)",
      "pluralDisplayName": "Bench Presses",
      "verbPhrase": "Bench Press",
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [
        {
          "exerciseId": "flat_dumbbell_press",
          "note": "Easier on shoulder if that’s an issue"
        },
        {
          "exerciseId": "flat_smith_machine_bench_press",
          "note": "Fixed path. Beginner friendly. Easier on shoulder if that’s an issue"
        }
      ],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "chest_supported_row",
      "name": "Chest-Supported Row",
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "barbell_seal_row"
        },
        {
          "exerciseId": "dumbbell_seal_row"
        },
        {
          "exerciseId": "barbell_row"
        },
        {
          "exerciseId": "dumbbell_row"
        },
        {
          "exerciseId": "t_bar_row",
          "note": "Not chest-supported"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "standing_overhead_press",
      "name": "Standing Overhead Press",
      "canonicalEstimatorKey": "overhead_press",
      "displayName": "Overhead Press",
      "pluralDisplayName": "Overhead Presses",
      "verbPhrase": "Overhead Press",
      "equipmentType": "barbell",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "triceps",
        "lateral_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "seated_dumbbell_barbell_overhead_press"
        },
        {
          "exerciseId": "seated_smith_machine_overhead_press"
        },
        {
          "exerciseId": "machine_shoulder_press"
        }
      ],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "lat_pulldown",
      "name": "Lat Pulldown",
      "canonicalEstimatorKey": "lat_pulldown",
      "displayName": "Lat Pulldown",
      "pluralDisplayName": "Lat Pulldowns",
      "verbPhrase": "Lat Pulldown",
      "equipmentType": "cable",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "upper_back"
      ],
      "alternatives": [
        {
          "exerciseId": "weighted_chin_up"
        },
        {
          "exerciseId": "straight_bar_pulldown"
        },
        {
          "exerciseId": "dumbbell_pullover"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "high_to_low_cable_fly",
      "name": "High to Low Cable Fly",
      "aliases": [
        "High to Low Cable Flies"
      ],
      "equipmentType": "cable",
      "movementPattern": "fly",
      "primaryMuscles": [
        "lower_chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "decline_dumbbell_press"
        },
        {
          "exerciseId": "dip"
        },
        {
          "exerciseId": "decline_machine_press"
        },
        {
          "exerciseId": "decline_push_up"
        }
      ],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "lying_face_pull",
      "name": "Lying Face Pull",
      "aliases": [
        "Lying Face Pulls"
      ],
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts",
        "upper_back"
      ],
      "secondaryMuscles": [
        "scapular_stabilizers"
      ],
      "alternatives": [
        {
          "exerciseId": "bent_over_reverse_dumbbell_fly"
        },
        {
          "exerciseId": "standing_cable_reverse_fly"
        },
        {
          "exerciseId": "wide_grip_seated_row"
        }
      ],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "box_squat",
      "name": "Box Squat",
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "leg_press",
      "name": "Leg Press",
      "canonicalEstimatorKey": "leg_press",
      "displayName": "Leg Press",
      "pluralDisplayName": "Leg Presses",
      "verbPhrase": "Leg Press",
      "equipmentType": "machine",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "hack_squat",
      "name": "Hack Squat",
      "equipmentType": "machine",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "goblet_squat",
      "name": "Goblet Squat",
      "canonicalEstimatorKey": "goblet_squat",
      "displayName": "Goblet Squat",
      "pluralDisplayName": "Goblet Squats",
      "verbPhrase": "Goblet Squat",
      "equipmentType": "dumbbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "reverse_lunge",
      "name": "Reverse Lunge",
      "equipmentType": "dumbbell",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "walking_lunge",
      "name": "Walking Lunge",
      "equipmentType": "dumbbell",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "smith_machine_stationary_lunge",
      "name": "Smith Machine Weighted Lunge (Stationary)",
      "equipmentType": "smith_machine",
      "movementPattern": "lunge",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "swiss_ball_leg_curl",
      "name": "Swiss Ball Leg Curl",
      "equipmentType": "swiss_ball",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [
        "glutes"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "swiss_ball",
      "secondaryEquipment": []
    },
    {
      "id": "lying_leg_curl",
      "name": "Lying Leg Curl",
      "equipmentType": "machine",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "seated_leg_curl",
      "name": "Seated Leg Curl",
      "equipmentType": "machine",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "back_extension_hamstring_focused",
      "name": "Back Extension (Hamstrings-Focused)",
      "equipmentType": "other",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": [
        {"exerciseId": "barbell_romanian_deadlift"},
        {"exerciseId": "dumbbell_romanian_deadlift"},
      ],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": []
    },
    {
      "id": "standing_calf_raise_machine",
      "name": "Standing Calf Raise Machine",
      "equipmentType": "machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "standing_dumbbell_calf_raise",
      "name": "Standing Calf Raise (Dumbbells)",
      "equipmentType": "dumbbell",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_seated_calf_raise",
      "name": "Dumbbell Seated Calf Raise",
      "equipmentType": "dumbbell",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "weighted_smith_machine_calf_raise",
      "name": "Weighted Smith Machine Calf Raise",
      "equipmentType": "smith_machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "sumo_deadlift",
      "name": "Sumo Deadlift",
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "secondaryMuscles": [
        "quadriceps",
        "lower_back"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "trap_bar_deadlift",
      "name": "Trap Bar Deadlift",
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "below_knee_rack_pull",
      "name": "Below-the-Knee Rack Pull",
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "lower_back"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_romanian_deadlift",
      "name": "Dumbbell Romanian Deadlift",
      "equipmentType": "dumbbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_romanian_deadlift",
      "name": "Barbell Romanian Deadlift",
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "back_extension",
      "name": "Back Extension",
      "equipmentType": "other",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "lower_back",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": []
    },
    {
      "id": "smith_machine_hip_thrust",
      "name": "Smith Machine Hip Thrust",
      "equipmentType": "smith_machine",
      "movementPattern": "hip_thrust",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "single_leg_hip_thrust",
      "name": "Single-Leg Hip Thrust",
      "equipmentType": "bodyweight",
      "movementPattern": "hip_thrust",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "cable_pull_through",
      "name": "Cable Pull-Through",
      "equipmentType": "cable",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "chin_up",
      "name": "Chin-Up",
      "equipmentType": "bodyweight",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats",
        "biceps"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "assisted_pull_up_machine",
      "name": "Assisted Pull-Up Machine",
      "equipmentType": "assisted_machine",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "assisted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "assisted_machine",
      "secondaryEquipment": []
    },
    {
      "id": "t_bar_row",
      "name": "T-Bar Row",
      "equipmentType": "barbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_row",
      "name": "Barbell Row",
      "canonicalEstimatorKey": "barbell_row",
      "displayName": "Barbell Row",
      "pluralDisplayName": "Barbell Rows",
      "verbPhrase": "Barbell Row",
      "equipmentType": "barbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "barbell_seal_row",
          "note": "Chest-supported variation with less lower-back demand"
        },
        {
          "exerciseId": "dumbbell_seal_row",
          "note": "Chest-supported dumbbell variation"
        },
        {
          "exerciseId": "chest_supported_row"
        },
        {
          "exerciseId": "t_bar_row"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_row",
      "name": "Dumbbell Row",
      "canonicalEstimatorKey": "dumbbell_row",
      "displayName": "Dumbbell Row",
      "pluralDisplayName": "Dumbbell Rows",
      "verbPhrase": "Dumbbell Row",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps"
      ],
      "alternatives": [
        {
          "exerciseId": "dumbbell_seal_row",
          "note": "Chest-supported variation with stricter form"
        },
        {
          "exerciseId": "barbell_seal_row"
        },
        {
          "exerciseId": "chest_supported_row"
        },
        {
          "exerciseId": "barbell_row"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "bent_over_reverse_dumbbell_fly",
      "name": "Bent-Over Reverse Dumbbell Fly",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "standing_cable_reverse_fly",
      "name": "Standing Cable Reverse Fly",
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "wide_grip_seated_row",
      "name": "Wide-Grip Seated Row",
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "rear_delts"
      ],
      "secondaryMuscles": [
        "lats",
        "biceps"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "behind_body_cable_curl",
      "name": "Behind-the-Body Cable Curl",
      "equipmentType": "cable",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "narrow_grip_bar_curl",
      "name": "Narrow-Grip Bar Curl",
      "equipmentType": "barbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "reverse_grip_curl",
      "name": "Reverse Grip Curl",
      "equipmentType": "mixed",
      "movementPattern": "curl",
      "primaryMuscles": [
        "forearms"
      ],
      "secondaryMuscles": [
        "biceps"
      ],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "mixed",
      "secondaryEquipment": []
    },
    {
      "id": "rope_cable_curl_neutral",
      "name": "Rope Cable Curl (Neutral Grip)",
      "equipmentType": "cable",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps",
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "prone_y_raise",
      "name": "Prone Y Raise",
      "equipmentType": "dumbbell",
      "movementPattern": "scapular_control",
      "primaryMuscles": [
        "scapular_stabilizers",
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "wall_slide",
      "name": "Wall Slide",
      "equipmentType": "bodyweight",
      "movementPattern": "scapular_control",
      "primaryMuscles": [
        "scapular_stabilizers"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "incline_bench_press",
      "name": "Incline Bench Press",
      "canonicalEstimatorKey": "incline_bench_press",
      "displayName": "Incline Bench Press",
      "pluralDisplayName": "Incline Bench Presses",
      "verbPhrase": "Incline Bench Press",
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "upper_chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "incline_hammer_press",
      "name": "Incline Hammer Press",
      "equipmentType": "machine",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "upper_chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "incline_smith_machine_press",
      "name": "Incline Smith Machine Press",
      "equipmentType": "smith_machine",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "upper_chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "neutral_grip_flat_dumbbell_press",
      "name": "Neutral Grip Flat Dumbbell Press",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "flat_hammer_machine_press",
      "name": "Flat Hammer (Machine) Press",
      "canonicalEstimatorKey": "chest_press_machine",
      "equipmentType": "machine",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "machine_lateral_raise",
      "name": "Machine Lateral Raise",
      "equipmentType": "machine",
      "movementPattern": "lateral_raise",
      "primaryMuscles": [
        "lateral_delts"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "lying_incline_dumbbell_lateral_raise",
      "name": "Lying Incline Dumbbell Lateral Raise",
      "equipmentType": "dumbbell",
      "movementPattern": "lateral_raise",
      "primaryMuscles": [
        "lateral_delts"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "leaning_weighted_bar_lateral_raise",
      "name": "Weighted Bar Lateral Raise (Leaning)",
      "equipmentType": "other",
      "movementPattern": "lateral_raise",
      "primaryMuscles": [
        "lateral_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "other",
      "secondaryEquipment": []
    },
    {
      "id": "seated_dumbbell_press",
      "name": "Seated Dumbbell Press",
      "equipmentType": "dumbbell",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "triceps",
        "lateral_delts"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_upright_row_external_rotation",
      "name": "Dumbbell Upright Row with External Rotation",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lateral_delts",
        "upper_back"
      ],
      "secondaryMuscles": [
        "rear_delts"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "standing_seated_cable_crossover",
      "name": "Standing/Seated Cable Crossover",
      "equipmentType": "cable",
      "movementPattern": "fly",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "triangle_push_up",
      "name": "Triangle Push-Up",
      "equipmentType": "bodyweight",
      "movementPattern": "push_up",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "chest",
        "front_delts"
      ],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "incline_overhead_dumbbell_extension",
      "name": "Incline Overhead Dumbbell Extension",
      "equipmentType": "dumbbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "lying_incline_dumbbell_tricep_kickback",
      "name": "Lying Incline Dumbbell Tricep Kickback",
      "equipmentType": "dumbbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "incline_lying_skullcrusher_barbell",
      "name": "Incline Lying Skullcrusher (Barbell)",
      "equipmentType": "barbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "rope_pushdown",
      "name": "Rope Pushdown",
      "equipmentType": "cable",
      "movementPattern": "triceps_pushdown",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "tricep_dip",
      "name": "Tricep Dip",
      "equipmentType": "bodyweight",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "chest",
        "front_delts"
      ],
      "alternatives": [],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "tricep_kickback",
      "name": "Tricep Kickback",
      "equipmentType": "dumbbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": [],
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "flat_smith_machine_bench_press",
      "name": "Flat Smith Machine Bench Press",
      "equipmentType": "smith_machine",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "barbell_seal_row",
      "name": "Barbell Seal Row",
      "equipmentType": "barbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "dumbbell_seal_row",
          "note": "More independent arm path"
        },
        {
          "exerciseId": "chest_supported_row"
        },
        {
          "exerciseId": "barbell_row",
          "note": "Not chest-supported"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_seal_row",
      "name": "Dumbbell Seal Row",
      "aliases": [
        "DB Seal Row"
      ],
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": [
        {
          "exerciseId": "barbell_seal_row",
          "note": "Easier to load heavier"
        },
        {
          "exerciseId": "chest_supported_row"
        },
        {
          "exerciseId": "dumbbell_row",
          "note": "Not chest-supported"
        }
      ],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "seated_dumbbell_barbell_overhead_press",
      "name": "Seated Dumbbell/Barbell Overhead Press",
      "equipmentType": "mixed",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "triceps",
        "lateral_delts"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "mixed",
      "secondaryEquipment": []
    },
    {
      "id": "seated_smith_machine_overhead_press",
      "name": "Seated Smith Machine Overhead Press",
      "equipmentType": "smith_machine",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "triceps",
        "lateral_delts"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": []
    },
    {
      "id": "machine_shoulder_press",
      "name": "Machine Shoulder Press",
      "equipmentType": "machine",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "triceps",
        "lateral_delts"
      ],
      "alternatives": [],
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "weighted_chin_up",
      "name": "Weighted Chin-Up",
      "equipmentType": "bodyweight",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats",
        "biceps"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "straight_bar_pulldown",
      "name": "Straight-Bar Pulldown",
      "equipmentType": "cable",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": []
    },
    {
      "id": "dumbbell_pullover",
      "name": "Dumbbell Pullover",
      "equipmentType": "dumbbell",
      "movementPattern": "pullover",
      "primaryMuscles": [
        "lats",
        "chest"
      ],
      "secondaryMuscles": [
        "triceps"
      ],
      "alternatives": [],
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "decline_dumbbell_press",
      "name": "Decline Dumbbell Press",
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "lower_chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": []
    },
    {
      "id": "dip",
      "name": "Dip",
      "equipmentType": "bodyweight",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "lower_chest",
        "triceps"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "decline_machine_press",
      "name": "Decline Machine Press",
      "equipmentType": "machine",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "lower_chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "machine",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": []
    },
    {
      "id": "decline_push_up",
      "name": "Decline Push-Up",
      "equipmentType": "bodyweight",
      "movementPattern": "push_up",
      "primaryMuscles": [
        "upper_chest",
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": [],
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": []
    },
    {
      "id": "power_clean",
      "name": "Power Clean",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "upper_back",
        "traps",
        "forearms"
      ],
      "alternatives": [
        {
          "exerciseId": "hang_power_clean"
        },
        {
          "exerciseId": "clean"
        },
        {
          "exerciseId": "high_pull"
        }
      ]
    },
    {
      "id": "hang_power_clean",
      "name": "Hang Power Clean",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "upper_back",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "hang_clean",
      "name": "Hang Clean",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "upper_back",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "clean",
      "name": "Clean",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "upper_back",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "clean_and_jerk",
      "name": "Clean and Jerk",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps",
        "front_delts"
      ],
      "secondaryMuscles": [
        "upper_back",
        "triceps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "split_jerk",
      "name": "Split Jerk",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "front_delts",
        "triceps",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "push_press",
      "name": "Push Press",
      "category": "olympic",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "secondaryMuscles": [
        "quadriceps",
        "glutes",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "push_jerk",
      "name": "Push Jerk",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "front_delts",
        "triceps",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "power_snatch",
      "name": "Power Snatch",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps",
        "upper_back"
      ],
      "secondaryMuscles": [
        "front_delts",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "hang_snatch",
      "name": "Hang Snatch",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "quadriceps",
        "upper_back"
      ],
      "secondaryMuscles": [
        "front_delts",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "snatch_pull",
      "name": "Snatch Pull",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "glutes",
        "hamstrings",
        "upper_back"
      ],
      "secondaryMuscles": [
        "quadriceps",
        "traps",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "high_pull",
      "name": "High Pull",
      "category": "olympic",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "olympic_lift",
      "primaryMuscles": [
        "upper_back",
        "traps"
      ],
      "secondaryMuscles": [
        "glutes",
        "hamstrings",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "close_grip_bench_press",
      "name": "Close-Grip Bench Press",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "triceps",
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "paused_bench_press",
      "name": "Paused Bench Press",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "spoto_press",
      "name": "Spoto Press",
      "category": "chest",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "floor_press",
      "name": "Floor Press",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "triceps",
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "board_press",
      "name": "Board Press",
      "category": "chest",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "triceps",
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "pin_press",
      "name": "Pin Press",
      "category": "chest",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "triceps",
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "feet_up_bench_press",
      "name": "Feet-Up Bench Press",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "reverse_grip_bench_press",
      "name": "Reverse-Grip Bench Press",
      "category": "chest",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "upper_chest",
        "triceps"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "cable_fly",
      "name": "Cable Fly",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "fly",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "low_to_high_cable_fly",
      "name": "Low-to-High Cable Fly",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "fly",
      "primaryMuscles": [
        "upper_chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "machine_chest_fly",
      "name": "Machine Chest Fly",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "fly",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "pec_deck",
      "name": "Pec Deck",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "fly",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "svend_press",
      "name": "Svend Press",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "front_delts",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "plate_press",
      "name": "Plate Press",
      "category": "chest",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "decline_bench_press",
      "name": "Decline Bench Press",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_press",
      "primaryMuscles": [
        "lower_chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "weighted_push_up",
      "name": "Weighted Push-Up",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "push_up",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "ring_push_up",
      "name": "Ring Push-Up",
      "category": "chest",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "push_up",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "front_delts",
        "scapular_stabilizers"
      ],
      "alternatives": []
    },
    {
      "id": "arnold_press",
      "name": "Arnold Press",
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [
        "lateral_delts",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "cable_lateral_raise",
      "name": "Cable Lateral Raise",
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "lateral_raise",
      "primaryMuscles": [
        "lateral_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "machine_rear_delt_fly",
      "name": "Machine Rear Delt Fly",
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "cable_front_raise",
      "name": "Cable Front Raise",
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "front_raise",
      "primaryMuscles": [
        "front_delts"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "landmine_press",
      "name": "Landmine Press",
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "front_delts",
        "upper_chest"
      ],
      "secondaryMuscles": [
        "triceps",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "cuban_press",
      "name": "Cuban Press",
      "category": "shoulders",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "vertical_press",
      "primaryMuscles": [
        "rear_delts",
        "scapular_stabilizers"
      ],
      "secondaryMuscles": [
        "front_delts",
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "y_raise",
      "name": "Y Raise",
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "scapular_control",
      "primaryMuscles": [
        "scapular_stabilizers",
        "rear_delts"
      ],
      "secondaryMuscles": [
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "face_pull",
      "name": "Face Pull",
      "category": "shoulders",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "rear_delts",
        "upper_back"
      ],
      "secondaryMuscles": [
        "scapular_stabilizers"
      ],
      "alternatives": []
    },
    {
      "id": "meadows_row",
      "name": "Meadows Row",
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": []
    },
    {
      "id": "pendlay_row",
      "name": "Pendlay Row",
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts",
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "chest_supported_t_bar_row",
      "name": "Chest-Supported T-Bar Row",
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": []
    },
    {
      "id": "machine_row",
      "name": "Machine Row",
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": []
    },
    {
      "id": "hammer_strength_row",
      "name": "Hammer Strength Row",
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": []
    },
    {
      "id": "single_arm_cable_row",
      "name": "Single-Arm Cable Row",
      "category": "back",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "biceps"
      ],
      "alternatives": []
    },
    {
      "id": "straight_arm_pulldown",
      "name": "Straight-Arm Pulldown",
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "vertical_pull",
      "primaryMuscles": [
        "lats"
      ],
      "secondaryMuscles": [
        "upper_back",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "inverted_row",
      "name": "Inverted Row",
      "category": "back",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "upper_back",
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "rear_delts"
      ],
      "alternatives": []
    },
    {
      "id": "renegade_row",
      "name": "Renegade Row",
      "category": "back",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "horizontal_pull",
      "primaryMuscles": [
        "lats",
        "upper_back"
      ],
      "secondaryMuscles": [
        "core",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "romanian_deadlift",
      "name": "Romanian Deadlift",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": [
        {
          "exerciseId": "dumbbell_romanian_deadlift"
        },
        {
          "exerciseId": "stiff_leg_deadlift"
        },
        {
          "exerciseId": "good_morning"
        }
      ]
    },
    {
      "id": "stiff_leg_deadlift",
      "name": "Stiff-Leg Deadlift",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "good_morning",
      "name": "Good Morning",
      "category": "legs",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "zercher_squat",
      "name": "Zercher Squat",
      "category": "legs",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "upper_back",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "safety_bar_squat",
      "name": "Safety Bar Squat",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "upper_back",
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "pause_squat",
      "name": "Pause Squat",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "belt_squat",
      "name": "Belt Squat",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "jefferson_squat",
      "name": "Jefferson Squat",
      "category": "legs",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "glutes",
        "adductors"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "step_up",
      "name": "Step-Up",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "step_up",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "calves"
      ],
      "alternatives": []
    },
    {
      "id": "cossack_squat",
      "name": "Cossack Squat",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps",
        "adductors"
      ],
      "secondaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "nordic_curl",
      "name": "Nordic Curl",
      "category": "legs",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "reverse_hyperextension",
      "name": "Reverse Hyperextension",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "sissy_squat",
      "name": "Sissy Squat",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "spanish_squat",
      "name": "Spanish Squat",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "squat",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "cable_kickback",
      "name": "Cable Kickback",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "hip_extension",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "45_degree_back_extension",
      "name": "45-Degree Back Extension",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "frog_pump",
      "name": "Frog Pump",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "hip_thrust",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "single_leg_romanian_deadlift",
      "name": "Single-Leg Romanian Deadlift",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "b_stance_romanian_deadlift",
      "name": "B-Stance Romanian Deadlift",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "hinge",
      "primaryMuscles": [
        "hamstrings",
        "glutes"
      ],
      "secondaryMuscles": [
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "cable_hip_abduction",
      "name": "Cable Hip Abduction",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "hip_abduction",
      "primaryMuscles": [
        "abductors",
        "glutes"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "cable_hip_adduction",
      "name": "Cable Hip Adduction",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "hip_adduction",
      "primaryMuscles": [
        "adductors"
      ],
      "secondaryMuscles": [
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "donkey_calf_raise",
      "name": "Donkey Calf Raise",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "single_leg_smith_calf_raise",
      "name": "Single-Leg Smith Calf Raise",
      "category": "legs",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "smith_machine",
      "secondaryEquipment": [],
      "equipmentType": "smith_machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "donkey_calf_raise_machine",
      "name": "Donkey Calf Raise Machine",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "calf_raise",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "tibialis_raise",
      "name": "Tibialis Raise",
      "category": "legs",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "tibialis_raise",
      "primaryMuscles": [
        "tibialis_anterior"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "bayesian_curl",
      "name": "Bayesian Curl",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": [
        {
          "exerciseId": "behind_body_cable_curl"
        },
        {
          "exerciseId": "incline_dumbbell_curl"
        },
        {
          "exerciseId": "cable_curl"
        }
      ]
    },
    {
      "id": "spider_curl",
      "name": "Spider Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "preacher_curl",
      "name": "Preacher Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "mixed",
      "secondaryEquipment": [],
      "equipmentType": "mixed",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "machine_curl",
      "name": "Machine Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "ez_bar_curl",
      "name": "EZ-Bar Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "cable_curl",
      "name": "Cable Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "concentration_curl",
      "name": "Concentration Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "cross_body_hammer_curl",
      "name": "Cross-Body Hammer Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps",
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "drag_curl",
      "name": "Drag Curl",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "high_cable_curl",
      "name": "High Cable Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "curl",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "jm_press",
      "name": "JM Press",
      "category": "arms",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "chest",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "rolling_dumbbell_extension",
      "name": "Rolling Dumbbell Extension",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "skull_crusher",
      "name": "Skull Crusher",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "cable_skull_crusher",
      "name": "Cable Skull Crusher",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "reverse_grip_pushdown",
      "name": "Reverse-Grip Pushdown",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "triceps_pushdown",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "single_arm_pushdown",
      "name": "Single-Arm Pushdown",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "triceps_pushdown",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "dip_machine",
      "name": "Dip Machine",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "chest",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "bench_dip",
      "name": "Bench Dip",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "triceps_extension",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [
        "chest",
        "front_delts"
      ],
      "alternatives": []
    },
    {
      "id": "wrist_curl",
      "name": "Wrist Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "wrist_flexion",
      "primaryMuscles": [
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "reverse_wrist_curl",
      "name": "Reverse Wrist Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "wrist_extension",
      "primaryMuscles": [
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "plate_pinch_hold",
      "name": "Plate Pinch Hold",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "behind_the_back_wrist_curl",
      "name": "Behind-the-Back Wrist Curl",
      "category": "arms",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "barbell",
      "secondaryEquipment": [],
      "equipmentType": "barbell",
      "movementPattern": "wrist_flexion",
      "primaryMuscles": [
        "forearms"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "fat_grip_carry",
      "name": "Fat-Grip Carry",
      "category": "arms",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "mixed",
      "secondaryEquipment": [],
      "equipmentType": "mixed",
      "movementPattern": "carry",
      "primaryMuscles": [
        "forearms",
        "upper_back"
      ],
      "secondaryMuscles": [
        "core",
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "ab_wheel_rollout",
      "name": "Ab Wheel Rollout",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "anti_extension",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "lats",
        "shoulders"
      ],
      "alternatives": [
        {
          "exerciseId": "plank"
        },
        {
          "exerciseId": "hollow_hold"
        },
        {
          "exerciseId": "dead_bug"
        }
      ]
    },
    {
      "id": "plank",
      "name": "Plank",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "glutes",
        "shoulders"
      ],
      "alternatives": [
        {
          "exerciseId": "rkc_plank"
        },
        {
          "exerciseId": "hollow_hold"
        },
        {
          "exerciseId": "dead_bug"
        }
      ]
    },
    {
      "id": "side_plank",
      "name": "Side Plank",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "obliques",
        "core"
      ],
      "secondaryMuscles": [
        "glutes",
        "shoulders"
      ],
      "alternatives": []
    },
    {
      "id": "rkc_plank",
      "name": "RKC Plank",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "glutes",
        "shoulders"
      ],
      "alternatives": []
    },
    {
      "id": "hollow_hold",
      "name": "Hollow Hold",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "dead_bug",
      "name": "Dead Bug",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "anti_extension",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "bird_dog",
      "name": "Bird Dog",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "unilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "anti_rotation",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "glutes",
        "lower_back"
      ],
      "alternatives": []
    },
    {
      "id": "v_up",
      "name": "V-Up",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [],
      "alternatives": [
        {
          "exerciseId": "hanging_leg_raise"
        },
        {
          "exerciseId": "reverse_crunch"
        },
        {
          "exerciseId": "toe_touch"
        }
      ]
    },
    {
      "id": "toe_touch",
      "name": "Toe Touch",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "crunch",
      "name": "Crunch",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "reverse_crunch",
      "name": "Reverse Crunch",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "cable_crunch",
      "name": "Cable Crunch",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [],
      "alternatives": []
    },
    {
      "id": "decline_sit_up",
      "name": "Decline Sit-Up",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "dragon_flag",
      "name": "Dragon Flag",
      "category": "core",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "anti_extension",
      "primaryMuscles": [
        "core"
      ],
      "secondaryMuscles": [
        "lats",
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "l_sit",
      "name": "L-Sit",
      "category": "core",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "isometric_hold",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "hanging_knee_raise",
      "name": "Hanging Knee Raise",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "hanging_leg_raise",
      "name": "Hanging Leg Raise",
      "category": "core",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "toes_to_bar",
      "name": "Toes-to-Bar",
      "category": "core",
      "difficulty": "advanced",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "trunk_flexion",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [
        "lats",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "russian_twist",
      "name": "Russian Twist",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "bodyweight",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "rotation",
      "primaryMuscles": [
        "obliques",
        "core"
      ],
      "secondaryMuscles": [
        "hip_flexors"
      ],
      "alternatives": []
    },
    {
      "id": "pallof_press",
      "name": "Pallof Press",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "anti_rotation",
      "primaryMuscles": [
        "core",
        "obliques"
      ],
      "secondaryMuscles": [
        "shoulders"
      ],
      "alternatives": []
    },
    {
      "id": "suitcase_carry",
      "name": "Suitcase Carry",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "dumbbell",
      "secondaryEquipment": [],
      "equipmentType": "dumbbell",
      "movementPattern": "carry",
      "primaryMuscles": [
        "obliques",
        "core"
      ],
      "secondaryMuscles": [
        "forearms",
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "turkish_get_up",
      "name": "Turkish Get-Up",
      "category": "core",
      "difficulty": "advanced",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "kettlebell",
      "secondaryEquipment": [],
      "equipmentType": "kettlebell",
      "movementPattern": "get_up",
      "primaryMuscles": [
        "core",
        "shoulders",
        "glutes"
      ],
      "secondaryMuscles": [
        "quadriceps",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "wood_chop",
      "name": "Wood Chop",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "rotation",
      "primaryMuscles": [
        "obliques",
        "core"
      ],
      "secondaryMuscles": [
        "shoulders",
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "reverse_wood_chop",
      "name": "Reverse Wood Chop",
      "category": "core",
      "difficulty": "intermediate",
      "laterality": "unilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": false,
      "primaryEquipment": "cable",
      "secondaryEquipment": [],
      "equipmentType": "cable",
      "movementPattern": "rotation",
      "primaryMuscles": [
        "obliques",
        "core"
      ],
      "secondaryMuscles": [
        "shoulders",
        "glutes"
      ],
      "alternatives": []
    },
    {
      "id": "mountain_climber",
      "name": "Mountain Climber",
      "category": "core",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": false,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "core",
        "hip_flexors"
      ],
      "secondaryMuscles": [
        "shoulders",
        "quadriceps"
      ],
      "alternatives": []
    },
    {
      "id": "sled_push",
      "name": "Sled Push",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "sled",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "calves",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "sled_pull",
      "name": "Sled Pull",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "sled",
      "primaryMuscles": [
        "upper_back",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "forearms"
      ],
      "alternatives": []
    },
    {
      "id": "battle_ropes",
      "name": "Battle Ropes",
      "category": "conditioning",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "shoulders",
        "forearms"
      ],
      "secondaryMuscles": [
        "core",
        "upper_back"
      ],
      "alternatives": []
    },
    {
      "id": "row_erg",
      "name": "Row Erg",
      "category": "conditioning",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "upper_back",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "biceps",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "bike_erg",
      "name": "Bike Erg",
      "category": "conditioning",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "calves"
      ],
      "alternatives": []
    },
    {
      "id": "assault_bike",
      "name": "Assault Bike",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": true,
      "primaryEquipment": "machine",
      "secondaryEquipment": [],
      "equipmentType": "machine",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "quadriceps",
        "shoulders"
      ],
      "secondaryMuscles": [
        "glutes",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "jump_rope",
      "name": "Jump Rope",
      "category": "conditioning",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "timed",
      "targetType": "time",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [
        "shoulders",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "box_jump",
      "name": "Box Jump",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "jump",
      "primaryMuscles": [
        "quadriceps",
        "glutes"
      ],
      "secondaryMuscles": [
        "calves",
        "hamstrings"
      ],
      "alternatives": []
    },
    {
      "id": "broad_jump",
      "name": "Broad Jump",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "jump",
      "primaryMuscles": [
        "glutes",
        "quadriceps"
      ],
      "secondaryMuscles": [
        "hamstrings",
        "calves"
      ],
      "alternatives": []
    },
    {
      "id": "burpee",
      "name": "Burpee",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "bodyweight",
      "secondaryEquipment": [],
      "equipmentType": "bodyweight",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "quadriceps",
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps",
        "core"
      ],
      "alternatives": []
    },
    {
      "id": "medicine_ball_slam",
      "name": "Medicine Ball Slam",
      "category": "conditioning",
      "difficulty": "beginner",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "reps",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "conditioning",
      "primaryMuscles": [
        "core",
        "lats",
        "shoulders"
      ],
      "secondaryMuscles": [
        "glutes",
        "triceps"
      ],
      "alternatives": []
    },
    {
      "id": "sandbag_carry",
      "name": "Sandbag Carry",
      "category": "conditioning",
      "difficulty": "intermediate",
      "laterality": "bilateral",
      "loadType": "weighted",
      "targetType": "distance",
      "isCompound": true,
      "primaryEquipment": "other",
      "secondaryEquipment": [],
      "equipmentType": "other",
      "movementPattern": "carry",
      "primaryMuscles": [
        "upper_back",
        "forearms"
      ],
      "secondaryMuscles": [
        "core",
        "glutes"
      ],
      "alternatives": []
    }
  ],
  "workoutTemplates": [
    {
      "id": "strength_hypertrophy_5_day",
      "name": "5-Day Strength & Hypertrophy Plan",
      "description": "A balanced weekly training plan using upper, lower, push, pull, and leg-focused sessions with rest days for recovery.",
      "focus": "Full body split with upper/lower and push/pull emphasis",
      "experienceLevel": "intermediate",
      "daysRequired": 5,
      "primaryGoal": "Build muscle and strength",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "lower_1_workout",
          "label": "Lower Body",
          "exerciseIds": [
            "front_squat",
            "deadlift",
            "barbell_hip_thrust",
            "single_leg_weighted_calf_raise",
            "leg_press_calf_raise"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "upper_1_workout",
          "label": "Upper Body",
          "exerciseIds": [
            "incline_dumbbell_press",
            "flat_dumbbell_press",
            "cable_dumbbell_lateral_raise",
            "banded_push_up",
            "overhead_rope_extension",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 3,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 4,
          "type": "workout",
          "id": "pull_workout",
          "label": "Pull Workout",
          "exerciseIds": [
            "pull_up",
            "seated_row",
            "reverse_pec_deck",
            "standing_kneeling_face_pull",
            "incline_dumbbell_curl",
            "hammer_curl",
            "scapular_pull_up"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "push_workout",
          "label": "Push Workout",
          "exerciseIds": [
            "incline_dumbbell_press",
            "flat_dumbbell_press",
            "cable_dumbbell_lateral_raise",
            "banded_push_up",
            "overhead_rope_extension",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 6,
          "type": "workout",
          "id": "legs_workout_lower_2",
          "label": "Legs Workout",
          "exerciseIds": [
            "back_squat",
            "bulgarian_split_squat",
            "glute_ham_raise",
            "smith_machine_calf_raise",
            "seated_weighted_calf_raise"
          ]
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "starting_strength",
      "name": "Starting Strength",
      "description": "A simple novice strength program built around squat, press, bench, deadlift, and row variations with linear progression each workout.",
      "focus": "Beginner barbell strength and movement practice",
      "experienceLevel": "beginner",
      "daysRequired": 3,
      "primaryGoal": "Strength",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "starting_strength_a",
          "label": "Workout A",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "deadlift"
          ]
        },
        {
          "day": 2,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 3,
          "type": "workout",
          "id": "starting_strength_b",
          "label": "Workout B",
          "exerciseIds": [
            "back_squat",
            "standing_overhead_press",
            "barbell_row"
          ]
        },
        {
          "day": 4,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 5,
          "type": "workout",
          "id": "starting_strength_a_repeat",
          "label": "Workout A",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "deadlift"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "stronglifts_5x5",
      "name": "StrongLifts 5x5",
      "description": "A beginner strength plan alternating two full-body barbell workouts with high practice volume on the main lifts.",
      "focus": "Linear progression on foundational compound lifts",
      "experienceLevel": "beginner",
      "daysRequired": 3,
      "primaryGoal": "General strength",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "stronglifts_5x5_a",
          "label": "Workout A",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "barbell_row"
          ]
        },
        {
          "day": 2,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 3,
          "type": "workout",
          "id": "stronglifts_5x5_b",
          "label": "Workout B",
          "exerciseIds": [
            "back_squat",
            "standing_overhead_press",
            "deadlift"
          ]
        },
        {
          "day": 4,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 5,
          "type": "workout",
          "id": "stronglifts_5x5_a_repeat",
          "label": "Workout A",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "barbell_row"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "full_body_3_day",
      "name": "Full Body 3-Day Routine",
      "description": "A balanced beginner-friendly three-day plan for learning major movement patterns while building muscle, strength, and general fitness.",
      "focus": "Full-body training with compound lifts and accessory work",
      "experienceLevel": "beginner",
      "daysRequired": 3,
      "primaryGoal": "Muscle growth and general fitness",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "full_body_3_day_monday",
          "label": "Monday Full Body",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "lat_pulldown",
            "dumbbell_romanian_deadlift",
            "seated_dumbbell_press",
            "narrow_grip_bar_curl",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 2,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 3,
          "type": "workout",
          "id": "full_body_3_day_wednesday",
          "label": "Wednesday Full Body",
          "exerciseIds": [
            "deadlift",
            "incline_bench_press",
            "seated_row",
            "bulgarian_split_squat",
            "cable_dumbbell_lateral_raise",
            "hammer_curl",
            "overhead_rope_extension"
          ]
        },
        {
          "day": 4,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 5,
          "type": "workout",
          "id": "full_body_3_day_friday",
          "label": "Friday Full Body",
          "exerciseIds": [
            "front_squat",
            "flat_dumbbell_press",
            "pull_up",
            "barbell_hip_thrust",
            "standing_kneeling_face_pull",
            "incline_dumbbell_curl",
            "incline_lying_skullcrusher_barbell"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "upper_lower_split",
      "name": "Upper / Lower Split",
      "description": "A four-day intermediate split that separates upper and lower body training for better weekly volume and recovery.",
      "focus": "Upper/lower strength and hypertrophy",
      "experienceLevel": "intermediate",
      "daysRequired": 4,
      "primaryGoal": "General fitness",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "upper_lower_upper_1",
          "label": "Upper 1",
          "exerciseIds": [
            "barbell_bench_press",
            "barbell_row",
            "incline_dumbbell_press",
            "pull_up",
            "cable_dumbbell_lateral_raise",
            "bar_tricep_pushdown",
            "narrow_grip_bar_curl"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "upper_lower_lower_1",
          "label": "Lower 1",
          "exerciseIds": [
            "back_squat",
            "dumbbell_romanian_deadlift",
            "leg_press",
            "seated_leg_curl",
            "standing_dumbbell_calf_raise"
          ]
        },
        {
          "day": 3,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 4,
          "type": "workout",
          "id": "upper_lower_upper_2",
          "label": "Upper 2",
          "exerciseIds": [
            "standing_overhead_press",
            "pull_up",
            "flat_dumbbell_press",
            "seated_row",
            "reverse_pec_deck",
            "overhead_rope_extension",
            "hammer_curl"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "upper_lower_lower_2",
          "label": "Lower 2",
          "exerciseIds": [
            "deadlift",
            "front_squat",
            "bulgarian_split_squat",
            "lying_leg_curl",
            "seated_weighted_calf_raise"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "push_pull_legs_3_day",
      "name": "Push Pull Legs",
      "description": "A popular hypertrophy split organized by pushing muscles, pulling muscles, and legs.",
      "focus": "Bodybuilding split for chest, shoulders, triceps, back, biceps, and legs",
      "experienceLevel": "intermediate",
      "daysRequired": 3,
      "primaryGoal": "Muscle growth",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "ppl_3_day_push",
          "label": "Push",
          "exerciseIds": [
            "barbell_bench_press",
            "incline_dumbbell_press",
            "standing_overhead_press",
            "cable_dumbbell_lateral_raise",
            "overhead_rope_extension",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "ppl_3_day_pull",
          "label": "Pull",
          "exerciseIds": [
            "pull_up",
            "barbell_row",
            "seated_row",
            "reverse_pec_deck",
            "incline_dumbbell_curl",
            "hammer_curl"
          ]
        },
        {
          "day": 3,
          "type": "workout",
          "id": "ppl_3_day_legs",
          "label": "Legs",
          "exerciseIds": [
            "back_squat",
            "dumbbell_romanian_deadlift",
            "leg_press",
            "barbell_hip_thrust",
            "seated_leg_curl",
            "standing_dumbbell_calf_raise"
          ]
        },
        {
          "day": 4,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 5,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "phul",
      "name": "PHUL",
      "description": "Power Hypertrophy Upper Lower combines heavy strength work early in the week with higher-volume bodybuilding sessions later in the week.",
      "focus": "Power and hypertrophy upper/lower split",
      "experienceLevel": "intermediate",
      "daysRequired": 4,
      "primaryGoal": "Muscle and strength",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "phul_power_upper",
          "label": "Power Upper",
          "exerciseIds": [
            "barbell_bench_press",
            "barbell_row",
            "standing_overhead_press",
            "weighted_chin_up",
            "bar_tricep_pushdown",
            "narrow_grip_bar_curl"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "phul_power_lower",
          "label": "Power Lower",
          "exerciseIds": [
            "back_squat",
            "deadlift",
            "leg_press",
            "seated_leg_curl",
            "standing_calf_raise_machine"
          ]
        },
        {
          "day": 3,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 4,
          "type": "workout",
          "id": "phul_hypertrophy_upper",
          "label": "Hypertrophy Upper",
          "exerciseIds": [
            "incline_dumbbell_press",
            "seated_row",
            "lat_pulldown",
            "high_to_low_cable_fly",
            "cable_dumbbell_lateral_raise",
            "overhead_rope_extension",
            "hammer_curl"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "phul_hypertrophy_lower",
          "label": "Hypertrophy Lower",
          "exerciseIds": [
            "front_squat",
            "dumbbell_romanian_deadlift",
            "bulgarian_split_squat",
            "barbell_hip_thrust",
            "lying_leg_curl",
            "seated_weighted_calf_raise"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "wendler_531",
      "name": "5/3/1",
      "description": "A long-term strength program organized around squat, bench, deadlift, and overhead press with percentage-based progression and planned deloading.",
      "focus": "Long-term strength progression on the four main lifts",
      "experienceLevel": "intermediate",
      "daysRequired": 4,
      "primaryGoal": "Long-term strength",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "wendler_531_squat",
          "label": "Squat Day",
          "exerciseIds": [
            "back_squat",
            "dumbbell_romanian_deadlift",
            "leg_press",
            "standing_dumbbell_calf_raise"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "wendler_531_bench",
          "label": "Bench Day",
          "exerciseIds": [
            "barbell_bench_press",
            "incline_dumbbell_press",
            "seated_row",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 3,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 4,
          "type": "workout",
          "id": "wendler_531_deadlift",
          "label": "Deadlift Day",
          "exerciseIds": [
            "deadlift",
            "front_squat",
            "barbell_hip_thrust",
            "seated_leg_curl"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "wendler_531_press",
          "label": "Press Day",
          "exerciseIds": [
            "standing_overhead_press",
            "pull_up",
            "cable_dumbbell_lateral_raise",
            "overhead_rope_extension"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "push_pull_legs_6_day",
      "name": "Push Pull Legs x2",
      "description": "A high-frequency six-day push, pull, legs split for advanced hypertrophy with repeated weekly exposure.",
      "focus": "Advanced bodybuilding volume across two push, pull, legs cycles",
      "experienceLevel": "advanced",
      "daysRequired": 6,
      "primaryGoal": "Advanced hypertrophy",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "ppl_6_day_push_1",
          "label": "Push 1",
          "exerciseIds": [
            "barbell_bench_press",
            "incline_dumbbell_press",
            "standing_overhead_press",
            "cable_dumbbell_lateral_raise",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "ppl_6_day_pull_1",
          "label": "Pull 1",
          "exerciseIds": [
            "pull_up",
            "barbell_row",
            "seated_row",
            "reverse_pec_deck",
            "incline_dumbbell_curl"
          ]
        },
        {
          "day": 3,
          "type": "workout",
          "id": "ppl_6_day_legs_1",
          "label": "Legs 1",
          "exerciseIds": [
            "back_squat",
            "dumbbell_romanian_deadlift",
            "leg_press",
            "seated_leg_curl",
            "standing_dumbbell_calf_raise"
          ]
        },
        {
          "day": 4,
          "type": "workout",
          "id": "ppl_6_day_push_2",
          "label": "Push 2",
          "exerciseIds": [
            "incline_bench_press",
            "flat_dumbbell_press",
            "seated_dumbbell_press",
            "machine_lateral_raise",
            "overhead_rope_extension"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "ppl_6_day_pull_2",
          "label": "Pull 2",
          "exerciseIds": [
            "weighted_chin_up",
            "chest_supported_row",
            "lat_pulldown",
            "standing_kneeling_face_pull",
            "hammer_curl"
          ]
        },
        {
          "day": 6,
          "type": "workout",
          "id": "ppl_6_day_legs_2",
          "label": "Legs 2",
          "exerciseIds": [
            "front_squat",
            "barbell_hip_thrust",
            "bulgarian_split_squat",
            "lying_leg_curl",
            "seated_weighted_calf_raise"
          ]
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "arnold_split",
      "name": "Arnold Split",
      "description": "A classic high-volume bodybuilding split pairing chest and back, shoulders and arms, and legs, then repeating the cycle.",
      "focus": "High-volume bodybuilding specialization",
      "experienceLevel": "advanced",
      "daysRequired": 6,
      "primaryGoal": "Bodybuilding",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "arnold_chest_back_1",
          "label": "Chest / Back",
          "exerciseIds": [
            "barbell_bench_press",
            "incline_dumbbell_press",
            "high_to_low_cable_fly",
            "pull_up",
            "barbell_row",
            "seated_row"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "arnold_shoulders_arms_1",
          "label": "Shoulders / Arms",
          "exerciseIds": [
            "standing_overhead_press",
            "cable_dumbbell_lateral_raise",
            "reverse_pec_deck",
            "narrow_grip_bar_curl",
            "hammer_curl",
            "overhead_rope_extension",
            "bar_tricep_pushdown"
          ]
        },
        {
          "day": 3,
          "type": "workout",
          "id": "arnold_legs_1",
          "label": "Legs",
          "exerciseIds": [
            "back_squat",
            "leg_press",
            "dumbbell_romanian_deadlift",
            "barbell_hip_thrust",
            "seated_leg_curl",
            "standing_calf_raise_machine"
          ]
        },
        {
          "day": 4,
          "type": "workout",
          "id": "arnold_chest_back_2",
          "label": "Chest / Back",
          "exerciseIds": [
            "incline_bench_press",
            "flat_dumbbell_press",
            "standing_seated_cable_crossover",
            "weighted_chin_up",
            "chest_supported_row",
            "lat_pulldown"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "arnold_shoulders_arms_2",
          "label": "Shoulders / Arms",
          "exerciseIds": [
            "seated_dumbbell_press",
            "machine_lateral_raise",
            "standing_kneeling_face_pull",
            "incline_dumbbell_curl",
            "rope_cable_curl_neutral",
            "incline_overhead_dumbbell_extension",
            "rope_pushdown"
          ]
        },
        {
          "day": 6,
          "type": "workout",
          "id": "arnold_legs_2",
          "label": "Legs",
          "exerciseIds": [
            "front_squat",
            "bulgarian_split_squat",
            "glute_ham_raise",
            "smith_machine_hip_thrust",
            "lying_leg_curl",
            "seated_weighted_calf_raise"
          ]
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "bro_split",
      "name": "Bro Split",
      "description": "A traditional one-body-part-per-day bodybuilding split for experienced lifters training with high effort and focused volume.",
      "focus": "Single-muscle-group bodybuilding days",
      "experienceLevel": "advanced",
      "daysRequired": 5,
      "primaryGoal": "Bodybuilding",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "bro_split_chest",
          "label": "Chest",
          "exerciseIds": [
            "barbell_bench_press",
            "incline_dumbbell_press",
            "flat_dumbbell_press",
            "high_to_low_cable_fly",
            "dip"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "bro_split_back",
          "label": "Back",
          "exerciseIds": [
            "pull_up",
            "barbell_row",
            "seated_row",
            "lat_pulldown",
            "dumbbell_pullover"
          ]
        },
        {
          "day": 3,
          "type": "workout",
          "id": "bro_split_legs",
          "label": "Legs",
          "exerciseIds": [
            "back_squat",
            "leg_press",
            "dumbbell_romanian_deadlift",
            "barbell_hip_thrust",
            "lying_leg_curl",
            "standing_calf_raise_machine"
          ]
        },
        {
          "day": 4,
          "type": "workout",
          "id": "bro_split_shoulders",
          "label": "Shoulders",
          "exerciseIds": [
            "standing_overhead_press",
            "seated_dumbbell_press",
            "cable_dumbbell_lateral_raise",
            "reverse_pec_deck",
            "standing_kneeling_face_pull"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "bro_split_arms",
          "label": "Arms",
          "exerciseIds": [
            "narrow_grip_bar_curl",
            "incline_dumbbell_curl",
            "hammer_curl",
            "overhead_rope_extension",
            "bar_tricep_pushdown",
            "tricep_dip"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "texas_method",
      "name": "Texas Method",
      "description": "An advanced strength program using a high-volume day, a recovery day, and a heavy intensity day each week.",
      "focus": "Weekly strength periodization with volume, recovery, and intensity exposures",
      "experienceLevel": "advanced",
      "daysRequired": 3,
      "primaryGoal": "Powerlifting",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "texas_method_volume",
          "label": "High Volume",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "barbell_row",
            "dumbbell_romanian_deadlift"
          ]
        },
        {
          "day": 2,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 3,
          "type": "workout",
          "id": "texas_method_recovery",
          "label": "Recovery",
          "exerciseIds": [
            "front_squat",
            "standing_overhead_press",
            "chin_up",
            "back_extension"
          ]
        },
        {
          "day": 4,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 5,
          "type": "workout",
          "id": "texas_method_intensity",
          "label": "Heavy Intensity",
          "exerciseIds": [
            "back_squat",
            "barbell_bench_press",
            "deadlift",
            "weighted_chin_up"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    },
    {
      "id": "conjugate",
      "name": "Conjugate",
      "description": "An advanced powerlifting framework rotating max effort, dynamic effort, and repetition effort work across lower and upper body sessions.",
      "focus": "Advanced strength specialization with rotating effort methods",
      "experienceLevel": "advanced",
      "daysRequired": 4,
      "primaryGoal": "Powerlifting",
      "workoutDays": [
        {
          "day": 1,
          "type": "workout",
          "id": "conjugate_max_effort_lower",
          "label": "Max Effort Lower",
          "exerciseIds": [
            "back_squat",
            "deadlift",
            "bulgarian_split_squat",
            "glute_ham_raise",
            "back_extension"
          ]
        },
        {
          "day": 2,
          "type": "workout",
          "id": "conjugate_max_effort_upper",
          "label": "Max Effort Upper",
          "exerciseIds": [
            "barbell_bench_press",
            "standing_overhead_press",
            "barbell_row",
            "overhead_rope_extension",
            "narrow_grip_bar_curl"
          ]
        },
        {
          "day": 3,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 4,
          "type": "workout",
          "id": "conjugate_dynamic_effort_lower",
          "label": "Dynamic Effort Lower",
          "exerciseIds": [
            "box_squat",
            "sumo_deadlift",
            "dumbbell_romanian_deadlift",
            "barbell_hip_thrust",
            "standing_calf_raise_machine"
          ]
        },
        {
          "day": 5,
          "type": "workout",
          "id": "conjugate_dynamic_effort_upper",
          "label": "Dynamic Effort Upper",
          "exerciseIds": [
            "flat_dumbbell_press",
            "chest_supported_row",
            "lat_pulldown",
            "cable_dumbbell_lateral_raise",
            "rope_pushdown",
            "hammer_curl"
          ]
        },
        {
          "day": 6,
          "type": "rest",
          "label": "Rest Day"
        },
        {
          "day": 7,
          "type": "rest",
          "label": "Rest Day"
        }
      ]
    }
  ]
};
