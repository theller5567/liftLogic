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
  | "scapular_stabilizers";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "smith_machine"
  | "cable"
  | "bodyweight"
  | "assisted_machine"
  | "swiss_ball"
  | "bench"
  | "mixed"
  | "other";

export type MovementPattern =
  | "squat"
  | "lunge"
  | "hinge"
  | "hip_thrust"
  | "calf_raise"
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
  | "pullover";

export interface ExerciseAlternativeRef {
  exerciseId: string;
  note?: string;
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
  notes?: string[];
}

export interface WorkoutTemplateReference {
  id: string;
  label: string;
  exerciseIds: string[];
}

export interface ExerciseLibrary {
  muscleGroups: MuscleGroup[];
  equipmentTypes: EquipmentType[];
  movementPatterns: MovementPattern[];
  exercises: ExerciseDefinition[];
  workoutTemplates: WorkoutTemplateReference[];
}

export const exerciseLibrary: ExerciseLibrary = {
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
    "scapular_stabilizers"
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
    "other"
  ],
  "movementPatterns": [
    "squat",
    "lunge",
    "hinge",
    "hip_thrust",
    "calf_raise",
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
    "pullover"
  ],
  "exercises": [
    {
      "id": "back_squat",
      "name": "Back Squat",
      "aliases": [
        "Barbell Back Squat"
      ],
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
      ]
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
          "exerciseId": "reverse_lunge"
        },
        {
          "exerciseId": "walking_lunge"
        },
        {
          "exerciseId": "smith_machine_stationary_lunge"
        }
      ]
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
      ]
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
      ]
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
      ]
    },
    {
      "id": "front_squat",
      "name": "Front Squat",
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
      ]
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
      ]
    },
    {
      "id": "barbell_hip_thrust",
      "name": "Barbell Hip Thrust",
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
      ]
    },
    {
      "id": "single_leg_weighted_calf_raise",
      "name": "Single Leg Weighted Calf Raise",
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
      ]
    },
    {
      "id": "leg_press_calf_raise",
      "name": "Leg Press Calf Raise",
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
        }
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
          "exerciseId": "flat_dumbbell_press"
        },
        {
          "exerciseId": "flat_hammer_machine_press"
        },
        {
          "exerciseId": "flat_smith_machine_bench_press"
        }
      ]
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
          "exerciseId": "barbell_row"
        },
        {
          "exerciseId": "dumbbell_row"
        },
        {
          "exerciseId": "t_bar_row",
          "note": "Not chest-supported"
        }
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
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
      "alternatives": []
    }
  ],
  "workoutTemplates": [
    {
      "id": "legs_workout_lower_2",
      "label": "Legs Workout (Lower 2)",
      "exerciseIds": [
        "back_squat",
        "bulgarian_split_squat",
        "glute_ham_raise",
        "smith_machine_calf_raise",
        "seated_weighted_calf_raise"
      ]
    },
    {
      "id": "lower_1_workout",
      "label": "Lower 1 Workout",
      "exerciseIds": [
        "front_squat",
        "deadlift",
        "barbell_hip_thrust",
        "single_leg_weighted_calf_raise",
        "leg_press_calf_raise"
      ]
    },
    {
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
      "id": "upper_workout",
      "label": "Upper Workout",
      "exerciseIds": [
        "barbell_bench_press",
        "chest_supported_row",
        "standing_overhead_press",
        "lat_pulldown",
        "high_to_low_cable_fly",
        "lying_face_pull"
      ]
    }
  ]
};
