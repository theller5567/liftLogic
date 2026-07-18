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
  scapular_control: [
    "Start with the arms extended and shoulder blades relaxed.",
    "Pull the shoulder blades together and down without using the arms to cheat the movement.",
  ],
  push_up: [
    "Lower your chest toward the floor while keeping your body in a straight line.",
    "Press back up by extending the elbows without letting the hips sag or pike.",
  ],
  pullover: [
    "Start with the arms extended overhead and the ribs controlled.",
    "Pull the load in an arc over the chest while keeping the ribs from flaring.",
  ],
  conditioning: [
    "Maintain a pace or effort level you can sustain for the full prescribed work.",
    "Keep your technique consistent as fatigue builds rather than letting form break down.",
  ],
  front_raise: [
    "Raise the load in front of you with a slight bend in the elbows.",
    "Stop around shoulder height and lower with control.",
  ],
  get_up: [
    "Move through each position of the sequence deliberately, keeping the loaded arm vertical.",
    "Return through the same checkpoints in reverse to finish the rep under control.",
  ],
  hip_abduction: [
    "Brace your torso and move the working leg out to the side against resistance.",
    "Return with control without letting the hips rock or rotate.",
  ],
  hip_adduction: [
    "Brace your torso and bring the working leg in against resistance.",
    "Return with control while keeping the hips square.",
  ],
  hip_extension: [
    "Brace your core and drive the hips into extension by squeezing the glutes.",
    "Lower with control without overextending the lower back.",
  ],
  jump: [
    "Load into a quarter- or half-squat position before driving upward explosively.",
    "Land softly with bent knees and reset your position before the next rep.",
  ],
  olympic_lift: [
    "Initiate the pull by driving through the floor while keeping the bar close to the body.",
    "Extend explosively through the hips and receive the load in a stable, braced position.",
  ],
  rotation: [
    "Brace your core and rotate through the torso while keeping the hips relatively stable.",
    "Control the return to center rather than letting momentum swing you back.",
  ],
  sled: [
    "Drive through the legs with a forward lean and a consistent stride.",
    "Keep steady tension on the load without jerking or pausing mid-push.",
  ],
  tibialis_raise: [
    "Keep the heel planted and lift the toes and forefoot upward.",
    "Lower with control back to the starting position.",
  ],
  trunk_flexion: [
    "Curl or flex the spine to bring the ribcage toward the pelvis under control.",
    "Lower back down without letting momentum carry the movement.",
  ],
  wrist_extension: [
    "Support the forearm and extend the wrist upward against the load.",
    "Lower with control through the full range the wrist allows.",
  ],
  wrist_flexion: [
    "Support the forearm and curl the wrist upward against the load.",
    "Lower with control through the full range the wrist allows.",
  ],
  other: [
    "Move through the exercise's full range with deliberate, controlled reps.",
    "Keep the target muscles under tension throughout rather than relying on momentum.",
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
  lunge: ["Stay tall through the torso.", "Knee tracks over the foot.", "Push evenly through the whole foot."],
  step_up: ["Drive through the working foot.", "Avoid pushing off the trailing leg.", "Stand fully tall at the top."],
  hip_thrust: ["Chin tucked, ribs down.", "Squeeze the glutes hard at the top.", "Drive through the heels."],
  calf_raise: ["Get a full stretch at the bottom.", "Pause briefly at the top.", "Control the lowering phase."],
  carry: ["Stay tall throughout.", "Braced core, steady steps.", "Shoulders packed, not shrugged."],
  lateral_raise: ["Lead with the elbows.", "Stop around shoulder height.", "Control the lowering phase."],
  fly: ["Keep a soft bend in the elbows.", "Lead with the chest, not the hands.", "Control the stretch at the bottom."],
  anti_extension: ["Keep the ribs down.", "Brace like expecting a punch.", "Move only as far as control allows."],
  anti_rotation: ["Resist the pull, don't chase it.", "Keep hips and shoulders square.", "Move slowly and deliberately."],
  isometric_hold: ["Brace and breathe steadily.", "Keep joints stacked.", "Hold the position, don't just survive it."],
  scapular_control: ["Squeeze the shoulder blades together.", "Avoid using the arms to cheat the pull.", "Keep the movement slow and controlled."],
  push_up: ["Keep the body in one straight line.", "Elbows track at a moderate angle.", "Use the full range without sagging hips."],
  pullover: ["Keep the ribs from flaring.", "Move through the shoulders, not the low back.", "Control the stretch overhead."],
  conditioning: ["Pace yourself for the full set.", "Keep breathing rhythmic.", "Hold your technique as fatigue builds."],
  front_raise: ["Lead with a controlled arm path.", "Avoid using momentum from the hips.", "Stop around shoulder height."],
  get_up: ["Move deliberately through each checkpoint.", "Keep the loaded arm vertical.", "Stay tight through the torso."],
  hip_abduction: ["Move from the hip, not the low back.", "Keep the torso still.", "Control the return."],
  hip_adduction: ["Keep the hips square.", "Move through a full comfortable range.", "Control the return."],
  hip_extension: ["Squeeze the glutes at the top.", "Avoid overextending the low back.", "Control the lowering phase."],
  jump: ["Land soft and quiet.", "Reset before every rep.", "Absorb through the knees and hips."],
  olympic_lift: ["Keep the bar close to the body.", "Extend fully before pulling under.", "Receive the load in a stable position."],
  rotation: ["Rotate through the torso, not just the arms.", "Keep the hips relatively stable.", "Control the return to center."],
  sled: ["Lean forward and drive through the legs.", "Keep consistent tension on the strap or bar.", "Take short, powerful strides."],
  tibialis_raise: ["Keep the heel planted.", "Lift through the shin, not just the toes.", "Control the lowering phase."],
  trunk_flexion: ["Lead with the ribcage, not the neck.", "Exhale as you flex.", "Control the lowering phase."],
  wrist_extension: ["Keep the forearm supported and still.", "Move only through the wrist.", "Control the lowering phase."],
  wrist_flexion: ["Keep the forearm supported and still.", "Move only through the wrist.", "Control the lowering phase."],
  other: ["Stay controlled throughout.", "Keep tension on the target muscles.", "Avoid rushing the rep."],
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
  lunge: ["Letting the front knee cave inward.", "Taking too short or too long a step.", "Losing balance and rushing the rep."],
  step_up: ["Pushing off the trailing leg.", "Using momentum to get to the top.", "Stepping onto an unstable surface."],
  hip_thrust: ["Overextending the lower back at the top.", "Pushing through the toes instead of the heels.", "Losing the chin-tuck position."],
  calf_raise: ["Bouncing at the bottom.", "Cutting the range of motion short.", "Rushing through without a pause at the top."],
  carry: ["Letting the shoulders round forward.", "Taking uneven or rushed steps.", "Letting the load swing side to side."],
  lateral_raise: ["Using momentum to swing the load up.", "Shrugging the shoulders instead of raising the arms.", "Raising too high and involving the traps."],
  fly: ["Bending the elbows too much and turning it into a press.", "Overstretching the shoulder joint.", "Rushing the squeeze at the top."],
  anti_extension: ["Letting the low back arch under load.", "Moving faster than control allows.", "Holding the breath instead of bracing properly."],
  anti_rotation: ["Letting the hips or shoulders rotate with the load.", "Moving too quickly through the range.", "Losing the brace midway through."],
  isometric_hold: ["Holding the breath instead of breathing steadily.", "Letting the hips sag or pike.", "Losing joint alignment as fatigue sets in."],
  scapular_control: ["Using the arms and momentum to fake the movement.", "Shrugging the shoulders toward the ears.", "Rushing through without a real squeeze."],
  push_up: ["Letting the hips sag or pike up.", "Flaring the elbows out to 90 degrees.", "Cutting the range of motion short."],
  pullover: ["Flaring the ribs excessively.", "Using too much weight and losing control overhead.", "Moving from the low back instead of the shoulders."],
  conditioning: ["Starting too fast and fading before the work is done.", "Letting technique break down as fatigue builds.", "Holding the breath instead of maintaining a rhythm."],
  front_raise: ["Swinging the load using the hips.", "Raising past shoulder height and involving the traps.", "Using too much weight and losing control."],
  get_up: ["Rushing through the checkpoints.", "Letting the loaded arm drift from vertical.", "Losing tension through the torso mid-rep."],
  hip_abduction: ["Rocking the torso to generate momentum.", "Using a partial range of motion.", "Letting the working leg rotate instead of abducting cleanly."],
  hip_adduction: ["Letting the torso twist during the movement.", "Rushing the return phase.", "Using momentum instead of control."],
  hip_extension: ["Overextending the lower back instead of the hips.", "Using momentum to swing through the rep.", "Cutting the range of motion short."],
  jump: ["Landing stiff-legged.", "Rushing the next rep without resetting.", "Losing control of the landing position."],
  olympic_lift: ["Letting the bar drift away from the body.", "Pulling early with the arms instead of the legs.", "Rushing the catch and losing position."],
  rotation: ["Letting the hips lead instead of the torso.", "Using momentum instead of controlled rotation.", "Overrotating past a stable range."],
  sled: ["Standing too upright and losing drive.", "Taking choppy, unstable steps.", "Letting tension go slack between strides."],
  tibialis_raise: ["Lifting the heel off the ground.", "Using momentum instead of a controlled lift.", "Cutting the range of motion short."],
  trunk_flexion: ["Pulling on the neck instead of using the abs.", "Using momentum to swing through the rep.", "Cutting the range of motion short."],
  wrist_extension: ["Letting the forearm shift instead of staying still.", "Using too much weight and losing range.", "Rushing the lowering phase."],
  wrist_flexion: ["Letting the forearm shift instead of staying still.", "Using too much weight and losing range.", "Rushing the lowering phase."],
  other: ["Using more load than can be controlled.", "Rushing the movement.", "Letting posture break down before the set ends."],
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
  front_squat: {
    overview:
      "A squat variation with the barbell held across the front of the shoulders, which shifts more of the demand onto the quadriceps and upper back while keeping the torso more upright than a back squat.",
    primaryTarget: "Quadriceps",
    secondaryTargets: "Glutes and upper back",
    setup: [
      "Set the bar in a rack around chest height.",
      "Rest the bar on your front shoulders, elbows lifted high and upper arms roughly parallel to the floor.",
      "Take a clean grip - front rack, crossed-arm, or straps - that lets your elbows stay up.",
      "Unrack the bar, step back, and set your feet about shoulder-width apart.",
    ],
    execution: [
      "Brace hard before starting the descent, since the upright torso relies on core tension to stay stable.",
      "Bend at the hips and knees together, keeping the elbows high so the bar stays supported.",
      "Lower until you reach a depth you can control without the elbows dropping or the torso folding forward.",
      "Drive through the mid-foot and stand tall, keeping the bar path vertical.",
    ],
    coachingCues: [
      "Elbows up throughout the rep.",
      "Stay tall through the torso.",
      "Brace before every rep.",
      "Drive the floor away evenly through both feet.",
    ],
    commonMistakes: [
      "Letting the elbows drop, which tips the bar forward.",
      "Leaning the torso forward on the way up.",
      "Letting the knees cave inward.",
      "Using a grip that's uncomfortable enough to compromise the rack position.",
    ],
    safetyNotes: [
      "Use safety pins or spotter arms when training near failure.",
      "Build wrist and shoulder mobility gradually if the front-rack position feels restricted.",
      "Stop the set if pain changes your movement or you cannot maintain control.",
    ],
    breathing:
      "Inhale and brace before lowering. Exhale after passing the hardest part of the ascent or once standing tall.",
    tempo:
      "Use a controlled descent, a brief stable bottom position, and a steady drive upward without rushing.",
    rangeOfMotion:
      "Squat as deep as you can while keeping the elbows high, torso upright, and feet planted.",
    difficultyNotes:
      "Best for lifters with reasonable wrist, shoulder, and ankle mobility. The front-rack position often takes longer to feel comfortable than a back squat.",
  },
  deadlift: {
    overview:
      "A foundational hinge lift where the bar is pulled from the floor to hip level. It builds posterior-chain strength and full-body pulling capacity more than almost any other exercise.",
    primaryTarget: "Hamstrings, glutes, and lower back",
    secondaryTargets: "Upper back",
    setup: [
      "Set the bar over your mid-foot, close enough that your shins nearly touch it.",
      "Hinge down and grip the bar just outside your legs.",
      "Drop your hips until your shins touch the bar, flatten your back, and pull your shoulder blades together.",
      "Take the slack out of the bar before the rep starts.",
    ],
    execution: [
      "Brace fully, then drive through the floor with your legs while keeping the bar close to your shins.",
      "Keep your hips and shoulders rising together rather than letting the hips shoot up first.",
      "Finish by standing tall with the hips fully extended, not by leaning back excessively.",
      "Lower the bar by pushing the hips back first, keeping it close to your body the entire way down.",
    ],
    coachingCues: [
      "Keep the bar dragging up the shins.",
      "Hips and shoulders rise together.",
      "Brace before you break the floor.",
      "Stand tall, don't lean back at lockout.",
    ],
    commonMistakes: [
      "Letting the hips shoot up before the shoulders.",
      "Rounding the lower back to start the pull.",
      "Letting the bar drift away from the shins.",
      "Hyperextending the lower back at the top.",
    ],
    safetyNotes: [
      "Use a lighter load until your setup and bar path are consistent.",
      "Stop the set if your lower back rounds under load or pain changes your movement.",
      "Reset your setup between reps rather than bouncing the bar off the floor.",
    ],
    breathing:
      "Inhale and brace before breaking the bar from the floor. Exhale after the hardest part of the pull or once standing tall.",
    tempo:
      "Pull with a strong, deliberate effort and lower with more control than the lift itself, avoiding a free-fall descent.",
    rangeOfMotion:
      "Pull from the floor to full hip extension at the top, without hyperextending the lower back.",
    difficultyNotes:
      "Best for lifters who can maintain a flat back through the full pull. Beginners often benefit from learning the hip hinge with a lighter implement first.",
  },
  sumo_deadlift: {
    overview:
      "A deadlift variation performed with a wide stance and hands inside the knees. The upright torso and wider stance shift more of the work onto the glutes and inner thighs while shortening the pulling distance.",
    primaryTarget: "Glutes and hamstrings",
    secondaryTargets: "Quadriceps and lower back",
    setup: [
      "Set up with a wide stance, toes turned out, and the bar over your mid-foot.",
      "Hinge down and grip the bar with your hands inside your knees.",
      "Drop your hips, push your knees out over your toes, and flatten your back.",
      "Pull your shoulder blades together and take the slack out of the bar.",
    ],
    execution: [
      "Brace fully, then drive your knees out and push through the floor to start the pull.",
      "Keep your torso angle relatively upright and the bar close to your body throughout.",
      "Finish by standing tall with the hips fully extended.",
      "Lower the bar by pushing the hips back and bending the knees together, keeping the bar close.",
    ],
    coachingCues: [
      "Knees track out over the toes.",
      "Keep the torso upright throughout the pull.",
      "Bar stays close to the body.",
      "Stand tall, don't lean back at lockout.",
    ],
    commonMistakes: [
      "Letting the knees collapse inward during the pull.",
      "Rounding the lower back to start the lift.",
      "Setting the stance too wide or too narrow for your hip mobility.",
      "Letting the bar drift forward away from the body.",
    ],
    safetyNotes: [
      "Use a lighter load until your stance and bar path are consistent.",
      "Stop the set if your lower back rounds under load or pain changes your movement.",
      "Reset your setup between reps rather than bouncing the bar off the floor.",
    ],
    breathing:
      "Inhale and brace before breaking the bar from the floor. Exhale after the hardest part of the pull or once standing tall.",
    tempo:
      "Pull with a strong, deliberate effort and lower with more control than the lift itself, avoiding a free-fall descent.",
    rangeOfMotion:
      "Pull from the floor to full hip extension at the top, without hyperextending the lower back.",
    difficultyNotes:
      "Best for lifters with good hip mobility to support the wider stance. Beginners may need to adjust stance width to find a comfortable position.",
  },
  barbell_bench_press: {
    overview:
      "A horizontal pressing staple performed lying on a bench, widely used to build chest, shoulder, and triceps strength and size.",
    primaryTarget: "Chest",
    secondaryTargets: "Front delts and triceps",
    setup: [
      "Lie on the bench with your eyes roughly under the bar.",
      "Plant your feet firmly, arch your upper back slightly, and pull your shoulder blades together.",
      "Grip the bar slightly wider than shoulder-width.",
      "Unrack the bar and position it directly over your shoulders before starting the first rep.",
    ],
    execution: [
      "Brace and lower the bar under control toward your lower chest.",
      "Keep your elbows at a moderate angle rather than flaring them straight out.",
      "Touch or nearly touch your chest, then press the bar back up in a slight arc toward over your shoulders.",
      "Keep your shoulder blades pulled together and your feet planted throughout the rep.",
    ],
    coachingCues: [
      "Shoulder blades stay packed together.",
      "Elbows at a moderate angle, not flared to 90 degrees.",
      "Drive your feet into the floor for stability.",
      "Press the bar in a slight arc back toward the shoulders.",
    ],
    commonMistakes: [
      "Flaring the elbows out aggressively.",
      "Bouncing the bar off the chest.",
      "Losing the shoulder blade position mid-set.",
      "Lifting the hips off the bench to complete the rep.",
    ],
    safetyNotes: [
      "Use a spotter or safety pins when training near failure.",
      "Start with a lighter load until your bar path and shoulder position are consistent.",
      "Stop the set if shoulder pain changes your movement.",
    ],
    breathing:
      "Inhale and brace before lowering the bar. Exhale as you press through the hardest part of the rep.",
    tempo:
      "Lower with control over about two seconds, then press back up with a strong, steady effort.",
    rangeOfMotion:
      "Lower until the bar touches or nearly touches your chest, then press to full elbow extension without losing shoulder position.",
    difficultyNotes:
      "Best for lifters who can maintain a stable shoulder position under load. Beginners may want to build pressing strength with dumbbells or a lighter bar first.",
  },
  incline_bench_press: {
    overview:
      "A bench press variation performed on an inclined bench, which shifts more emphasis onto the upper chest while still training the shoulders and triceps.",
    primaryTarget: "Upper chest",
    secondaryTargets: "Front delts and triceps",
    setup: [
      "Set the bench to a moderate incline, typically 15 to 30 degrees.",
      "Lie back with your eyes roughly under the bar and plant your feet firmly.",
      "Pull your shoulder blades together and grip the bar slightly wider than shoulder-width.",
      "Unrack the bar and position it over your upper chest before starting the first rep.",
    ],
    execution: [
      "Brace and lower the bar under control toward your upper chest.",
      "Keep your elbows at a moderate angle rather than flaring them straight out.",
      "Touch or nearly touch your upper chest, then press the bar back up over your shoulders.",
      "Keep your shoulder blades pulled together and feet planted throughout the rep.",
    ],
    coachingCues: [
      "Shoulder blades stay packed together.",
      "Bar path targets the upper chest, not the neck.",
      "Elbows at a moderate angle, not flared to 90 degrees.",
      "Drive your feet into the floor for stability.",
    ],
    commonMistakes: [
      "Setting the incline too steep, which turns it into more of a shoulder press.",
      "Flaring the elbows out aggressively.",
      "Bouncing the bar at the bottom.",
      "Losing the shoulder blade position mid-set.",
    ],
    safetyNotes: [
      "Use a spotter or safety pins when training near failure.",
      "Start with a lighter load until your bar path and shoulder position are consistent.",
      "Stop the set if shoulder pain changes your movement.",
    ],
    breathing:
      "Inhale and brace before lowering the bar. Exhale as you press through the hardest part of the rep.",
    tempo:
      "Lower with control over about two seconds, then press back up with a strong, steady effort.",
    rangeOfMotion:
      "Lower until the bar touches or nearly touches your upper chest, then press to full elbow extension without losing shoulder position.",
    difficultyNotes:
      "Best for lifters who already have a comfortable flat bench press pattern, since the incline adds a shoulder-stability demand.",
  },
  standing_overhead_press: {
    overview:
      "A standing vertical press with a barbell that builds shoulder strength and full-body bracing, since the lift requires stabilizing the load without back support.",
    primaryTarget: "Front delts",
    secondaryTargets: "Triceps and side delts",
    setup: [
      "Set the bar in a rack around shoulder height.",
      "Grip the bar just outside shoulder-width and rest it on your front shoulders.",
      "Unrack the bar, step back, and set your feet about hip-width apart.",
      "Brace your torso and squeeze your glutes before starting the first rep.",
    ],
    execution: [
      "Brace hard, then press the bar straight up, moving your head back slightly to let it pass.",
      "Once the bar clears your head, drive it directly overhead and finish with your biceps near your ears.",
      "Keep your ribs down throughout to avoid overarching your lower back.",
      "Lower the bar back to your shoulders under control, keeping the same vertical path.",
    ],
    coachingCues: [
      "Ribs down, glutes squeezed.",
      "Press in a straight line overhead.",
      "Head moves back slightly, then through at the top.",
      "Avoid leaning back to press the bar up.",
    ],
    commonMistakes: [
      "Overarching the lower back to help the bar clear the face.",
      "Pressing the bar forward instead of straight overhead.",
      "Using leg drive to turn it into a push press unintentionally.",
      "Rushing the lowering phase.",
    ],
    safetyNotes: [
      "Use a lighter load until your bracing and bar path are consistent.",
      "Stop the set if lower-back or shoulder pain changes your movement.",
      "Build shoulder mobility gradually if overhead lockout feels restricted.",
    ],
    breathing:
      "Inhale and brace before pressing. Exhale once the bar passes your head or as you lock out overhead.",
    tempo:
      "Press with a strong, deliberate effort and lower with control, avoiding a rushed or bouncing descent.",
    rangeOfMotion:
      "Press from shoulder height to full overhead lockout without overarching the lower back.",
    difficultyNotes:
      "Best for lifters who can brace the torso well while standing. Beginners may want to build the pattern seated or with dumbbells first.",
  },
  seated_dumbbell_press: {
    overview:
      "A seated vertical press using dumbbells, which allows each arm to move independently and removes some of the balance demand of a standing barbell press.",
    primaryTarget: "Front delts",
    secondaryTargets: "Triceps and side delts",
    setup: [
      "Sit on a bench with back support, dumbbells resting on your thighs.",
      "Kick the dumbbells up to shoulder height one at a time as you sit back.",
      "Set your feet flat on the floor and brace your torso against the bench.",
      "Position the dumbbells just outside your shoulders before starting the first rep.",
    ],
    execution: [
      "Brace and press the dumbbells up and slightly inward until your arms are extended overhead.",
      "Avoid locking the elbows aggressively or flaring them out at the top.",
      "Lower the dumbbells back to shoulder height under control, keeping your torso stable against the bench.",
      "Keep your ribs down throughout to avoid overarching your lower back.",
    ],
    coachingCues: [
      "Ribs down, back supported.",
      "Press up and slightly in toward the midline.",
      "Keep wrists stacked over the elbows.",
      "Control the lowering phase.",
    ],
    commonMistakes: [
      "Overarching the lower back to press the weight up.",
      "Letting the dumbbells drift too far forward or back.",
      "Using momentum from the legs or torso to start the press.",
      "Rushing the lowering phase.",
    ],
    safetyNotes: [
      "Use a load you can control through the full range without shoulder pinching.",
      "Stop the set if shoulder or lower-back pain changes your movement.",
      "Have a plan to safely rack or drop the dumbbells if you fail a rep.",
    ],
    breathing:
      "Inhale and brace before pressing. Exhale as you pass the hardest part of the press near the top.",
    tempo:
      "Press with a controlled, steady effort and lower with a slightly slower, deliberate motion.",
    rangeOfMotion:
      "Press from shoulder height to near-full overhead extension without overarching the lower back.",
    difficultyNotes:
      "A good entry point into overhead pressing since the bench provides back support and each arm moves independently.",
  },
  barbell_row: {
    overview:
      "A bent-over horizontal pulling exercise using a barbell, commonly used to build back thickness and pulling strength while also challenging posterior-chain stability.",
    primaryTarget: "Upper back and lats",
    secondaryTargets: "Biceps and rear delts",
    setup: [
      "Set up with the bar on the floor or in a rack at a comfortable starting height.",
      "Hinge at the hips until your torso is at roughly a 45-degree angle, keeping your back flat.",
      "Grip the bar just outside shoulder-width and let it hang with arms extended.",
      "Brace your torso and pull your shoulder blades back slightly before starting the first rep.",
    ],
    execution: [
      "Row the bar toward your lower ribs by driving your elbows back.",
      "Squeeze your upper back at the top of the row without shrugging your shoulders.",
      "Lower the bar back to a full arm extension under control.",
      "Keep your torso angle steady throughout the set rather than letting it rise and fall with each rep.",
    ],
    coachingCues: [
      "Row with the elbows, not the hands.",
      "Squeeze the shoulder blades together at the top.",
      "Keep the torso angle steady.",
      "Control the lowering phase.",
    ],
    commonMistakes: [
      "Using body momentum or torso swing to move the weight.",
      "Letting the torso rise toward vertical as the set fatigues.",
      "Shrugging the shoulders instead of engaging the upper back.",
      "Rounding the lower back under load.",
    ],
    safetyNotes: [
      "Use a load you can control without your torso angle collapsing.",
      "Stop the set if your lower back rounds or pain changes your movement.",
      "Build hip-hinge comfort before adding heavier loads.",
    ],
    breathing:
      "Inhale and brace before rowing. Exhale as you pull the bar toward your torso.",
    tempo:
      "Row with a controlled but purposeful pull, then lower with a slightly slower, deliberate motion.",
    rangeOfMotion:
      "Pull from a full arm extension to the bar contacting your lower ribs, without shrugging the shoulders.",
    difficultyNotes:
      "Best for lifters who can maintain a flat back in a hinged position under load. Beginners may prefer a chest-supported row first.",
  },
  pull_up: {
    overview:
      "A vertical pulling exercise using an overhand grip and bodyweight, widely considered one of the most effective builders of lat and upper-back strength.",
    primaryTarget: "Lats and upper back",
    secondaryTargets: "Biceps and scapular stabilizers",
    setup: [
      "Grip the bar slightly wider than shoulder-width with an overhand grip.",
      "Hang with your arms fully extended and shoulder blades relaxed.",
      "Brace your torso and avoid excessive swinging before starting the first rep.",
      "Engage your shoulder blades slightly to set a stable starting position.",
    ],
    execution: [
      "Pull your elbows down and back to bring your chin over the bar.",
      "Keep your torso fairly rigid rather than kipping or swinging to generate momentum.",
      "Lower yourself back to a full arm extension under control.",
      "Reset your shoulder position slightly between reps rather than fully relaxing.",
    ],
    coachingCues: [
      "Pull the elbows down and back.",
      "Keep the torso controlled, minimal swing.",
      "Chin clears the bar at the top.",
      "Lower with control, don't just drop.",
    ],
    commonMistakes: [
      "Using momentum or kipping to get the chin over the bar.",
      "Only performing a partial range of motion.",
      "Shrugging the shoulders up toward the ears at the top.",
      "Dropping quickly instead of lowering with control.",
    ],
    safetyNotes: [
      "Use an assisted machine or bands if you cannot yet complete a full-range rep with control.",
      "Stop the set if shoulder pain changes your movement.",
      "Build grip and shoulder-stability strength progressively before adding external load.",
    ],
    breathing:
      "Inhale before pulling. Exhale as you pull yourself up toward the bar.",
    tempo:
      "Pull with a strong, deliberate effort and lower with a slower, controlled descent.",
    rangeOfMotion:
      "Move from a full arm extension at the bottom to the chin clearing the bar at the top.",
    difficultyNotes:
      "A challenging bodyweight movement. Beginners often build toward it using assisted machines, bands, or negatives.",
  },
  chin_up: {
    overview:
      "A vertical pull performed with an underhand grip, which brings the biceps into a more prominent role alongside the lats compared to a standard pull-up.",
    primaryTarget: "Lats and biceps",
    secondaryTargets: "Upper back",
    setup: [
      "Grip the bar at shoulder-width with an underhand grip.",
      "Hang with your arms fully extended and shoulder blades relaxed.",
      "Brace your torso and avoid excessive swinging before starting the first rep.",
      "Engage your shoulder blades slightly to set a stable starting position.",
    ],
    execution: [
      "Pull your elbows down and in close to your sides to bring your chin over the bar.",
      "Keep your torso fairly rigid rather than kipping or swinging to generate momentum.",
      "Lower yourself back to a full arm extension under control.",
      "Reset your shoulder position slightly between reps rather than fully relaxing.",
    ],
    coachingCues: [
      "Pull the elbows down and close to the body.",
      "Keep the torso controlled, minimal swing.",
      "Chin clears the bar at the top.",
      "Lower with control, don't just drop.",
    ],
    commonMistakes: [
      "Using momentum or kipping to get the chin over the bar.",
      "Only performing a partial range of motion.",
      "Letting the elbows flare wide instead of tracking close to the body.",
      "Dropping quickly instead of lowering with control.",
    ],
    safetyNotes: [
      "Use an assisted machine or bands if you cannot yet complete a full-range rep with control.",
      "Stop the set if elbow or shoulder pain changes your movement.",
      "Build grip and elbow-tendon tolerance progressively before adding external load.",
    ],
    breathing:
      "Inhale before pulling. Exhale as you pull yourself up toward the bar.",
    tempo:
      "Pull with a strong, deliberate effort and lower with a slower, controlled descent.",
    rangeOfMotion:
      "Move from a full arm extension at the bottom to the chin clearing the bar at the top.",
    difficultyNotes:
      "Often slightly more approachable than a pull-up due to greater bicep involvement. Beginners can build toward it with assisted machines or negatives.",
  },
  lat_pulldown: {
    overview:
      "A machine-based vertical pull using a cable stack, useful for training the same pattern as a pull-up with adjustable resistance.",
    primaryTarget: "Lats",
    secondaryTargets: "Biceps and upper back",
    setup: [
      "Set the thigh pad snug against your legs and grip the bar just outside shoulder-width.",
      "Sit tall with your torso close to vertical and your shoulder blades relaxed.",
      "Select a load you can control through the full range without swinging.",
      "Brace your torso before starting the first rep.",
    ],
    execution: [
      "Pull the bar down toward your upper chest by driving your elbows down and back.",
      "Avoid leaning back excessively to help move the weight.",
      "Let the bar rise back to a full arm extension under control.",
      "Keep your torso position steady throughout the set.",
    ],
    coachingCues: [
      "Pull the elbows down and back.",
      "Keep the torso mostly upright.",
      "Bring the bar to the upper chest, not the neck.",
      "Control the return to full extension.",
    ],
    commonMistakes: [
      "Leaning back excessively to muscle the weight down.",
      "Using momentum instead of a controlled pull.",
      "Only performing a partial range of motion.",
      "Shrugging the shoulders up toward the ears.",
    ],
    safetyNotes: [
      "Use a load you can control through the full range of motion.",
      "Stop the set if shoulder pain changes your movement.",
      "Keep the descent controlled rather than letting the stack drop suddenly.",
    ],
    breathing:
      "Inhale before pulling. Exhale as you pull the bar down toward your chest.",
    tempo:
      "Pull with a controlled, purposeful effort and let the weight rise with a slightly slower, deliberate motion.",
    rangeOfMotion:
      "Move from a full arm extension at the top to the bar reaching your upper chest.",
    difficultyNotes:
      "A good entry point for building toward pull-ups, since the resistance can be scaled precisely.",
  },
  chest_supported_row: {
    overview:
      "A horizontal pulling exercise performed with the chest braced against a pad, which removes lower-back involvement and lets you focus purely on pulling with the back.",
    primaryTarget: "Upper back and lats",
    secondaryTargets: "Biceps and rear delts",
    setup: [
      "Adjust the pad height so your chest is fully supported and your arms hang naturally.",
      "Grip the handles with a stable, comfortable grip width.",
      "Brace your torso against the pad before starting the first rep.",
      "Set a load you can control through the full range of motion.",
    ],
    execution: [
      "Row by driving your elbows back and squeezing your shoulder blades together.",
      "Keep your chest pressed into the pad throughout the movement.",
      "Lower back to a full arm extension under control.",
      "Avoid using momentum or jerking the weight to complete the row.",
    ],
    coachingCues: [
      "Chest stays pinned to the pad.",
      "Row with the elbows, not the hands.",
      "Squeeze the shoulder blades at the top.",
      "Control the lowering phase.",
    ],
    commonMistakes: [
      "Lifting the chest off the pad to add momentum.",
      "Shrugging the shoulders instead of engaging the upper back.",
      "Using a partial range of motion.",
      "Rushing the return phase.",
    ],
    safetyNotes: [
      "Use a load you can control through the full range without lifting off the pad.",
      "Stop the set if shoulder pain changes your movement.",
    ],
    breathing:
      "Inhale before rowing. Exhale as you pull the handles toward your torso.",
    tempo:
      "Row with a controlled, purposeful pull and lower with a slightly slower, deliberate motion.",
    rangeOfMotion:
      "Pull from a full arm extension to the handles reaching your torso, without shrugging the shoulders.",
    difficultyNotes:
      "A back-friendly rowing option since the pad removes the need to stabilize the torso in a hinge.",
  },
  dumbbell_romanian_deadlift: {
    overview:
      "A hip-hinge exercise performed with dumbbells that emphasizes the hamstrings and glutes through a controlled stretch, commonly used to build posterior-chain strength and hip-hinge technique.",
    primaryTarget: "Hamstrings and glutes",
    secondaryTargets: "Lower back",
    setup: [
      "Stand holding a dumbbell in each hand in front of your thighs.",
      "Set your feet about hip-width apart with a slight bend in the knees.",
      "Brace your torso and pull your shoulder blades together slightly.",
      "Keep the dumbbells close to your legs before starting the first rep.",
    ],
    execution: [
      "Push your hips back while keeping a flat back and a soft bend in the knees.",
      "Lower the dumbbells along your legs until you feel a stretch through the hamstrings.",
      "Stand back up by driving your hips forward and squeezing your glutes.",
      "Keep the dumbbells close to your body throughout the entire rep.",
    ],
    coachingCues: [
      "Push the hips back, not down.",
      "Keep the dumbbells close to your legs.",
      "Maintain a soft knee bend throughout.",
      "Stand by driving the hips through.",
    ],
    commonMistakes: [
      "Rounding the lower back as the hips travel back.",
      "Bending the knees too much and turning it into a squat.",
      "Letting the dumbbells drift away from the legs.",
      "Overextending the lower back at the top.",
    ],
    safetyNotes: [
      "Use a load you can control while keeping your back flat.",
      "Stop the set if your lower back rounds or pain changes your movement.",
      "Only lower as far as your hamstring flexibility allows while maintaining a flat back.",
    ],
    breathing:
      "Inhale and brace before hinging down. Exhale as you drive the hips forward to stand.",
    tempo:
      "Lower with a slow, controlled hinge and stand back up with a steady, deliberate drive.",
    rangeOfMotion:
      "Hinge until you feel a firm hamstring stretch while keeping the back flat, then return to standing.",
    difficultyNotes:
      "Best for lifters who already understand the hip-hinge pattern. Beginners may want to practice the hinge with lighter loads or no load first.",
  },
  barbell_hip_thrust: {
    overview:
      "A hip-extension exercise performed with the upper back supported on a bench and a barbell across the hips, one of the most direct exercises for building glute strength.",
    primaryTarget: "Glutes",
    secondaryTargets: "Hamstrings",
    setup: [
      "Sit on the floor with your upper back against a bench and the bar positioned over your hips, using a pad for comfort.",
      "Plant your feet flat on the floor, roughly under your knees.",
      "Roll the bar over your hips and brace your torso.",
      "Set your shoulder blades on the edge of the bench before starting the first rep.",
    ],
    execution: [
      "Drive through your feet and extend your hips upward, squeezing your glutes hard at the top.",
      "Keep your chin tucked and ribs down rather than overarching your lower back.",
      "Pause briefly at the top in a fully extended position.",
      "Lower your hips back down under control without losing tension.",
    ],
    coachingCues: [
      "Chin tucked, ribs down.",
      "Drive through the heels.",
      "Squeeze the glutes hard at the top.",
      "Control the lowering phase.",
    ],
    commonMistakes: [
      "Overextending the lower back instead of the hips at the top.",
      "Pushing through the toes instead of the heels.",
      "Letting the bar roll or shift during the set.",
      "Rushing the lowering phase.",
    ],
    safetyNotes: [
      "Pad the bar to protect your hips from discomfort.",
      "Use a load you can control without overextending your lower back.",
      "Stop the set if lower-back pain changes your movement.",
    ],
    breathing:
      "Inhale and brace before driving up. Exhale as you extend your hips through the hardest part of the rep.",
    tempo:
      "Drive up with a strong, deliberate effort, pause briefly at the top, and lower with control.",
    rangeOfMotion:
      "Extend the hips fully at the top without overarching the lower back, then lower until your hips are just short of the floor.",
    difficultyNotes:
      "Approachable for most lifters, though bar comfort and finding a stable foot position often take a session or two to dial in.",
  },
  bulgarian_split_squat: {
    overview:
      "A single-leg squat variation with the rear foot elevated behind you, which challenges balance and unilateral strength while heavily loading the front leg's quadriceps and glutes.",
    primaryTarget: "Quadriceps and glutes",
    secondaryTargets: "Hamstrings",
    setup: [
      "Stand a couple of feet in front of a bench and rest the top of your rear foot on it.",
      "Hold a dumbbell in each hand at your sides.",
      "Set your front foot far enough forward that your knee can track well over it.",
      "Brace your torso before starting the first rep.",
    ],
    execution: [
      "Lower straight down by bending your front knee and hip, keeping most of your weight on the front leg.",
      "Descend until your rear knee approaches the floor or you reach a depth you can control.",
      "Drive through your front foot to stand back up.",
      "Keep your torso fairly upright throughout the rep.",
    ],
    coachingCues: [
      "Most of the weight stays on the front leg.",
      "Front knee tracks over the front foot.",
      "Stay tall through the torso.",
      "Push evenly through the whole front foot.",
    ],
    commonMistakes: [
      "Letting the front knee cave inward.",
      "Placing the front foot too close, which restricts the range of motion.",
      "Pushing off the rear foot excessively to assist the lift.",
      "Losing balance and rushing through the rep.",
    ],
    safetyNotes: [
      "Use a stable bench height and secure footing before adding load.",
      "Start with bodyweight or light dumbbells until your balance is consistent.",
      "Stop the set if knee pain changes your movement.",
    ],
    breathing:
      "Inhale and brace before lowering. Exhale as you drive back up to standing.",
    tempo:
      "Lower with a controlled descent and drive back up with a steady, deliberate effort.",
    rangeOfMotion:
      "Lower until the rear knee approaches the floor while keeping the front knee stable, then return to standing.",
    difficultyNotes:
      "A demanding unilateral exercise. Beginners may want to master the position with no added load before progressing to dumbbells.",
  },
  dip: {
    overview:
      "A bodyweight pressing exercise performed on parallel bars or a dip station, which builds pressing strength through the chest and triceps using a longer range of motion than most press variations.",
    primaryTarget: "Lower chest and triceps",
    secondaryTargets: "Front delts",
    setup: [
      "Grip the parallel bars and support your body with arms extended.",
      "Lean your torso slightly forward if targeting the chest, or keep it more upright to bias the triceps.",
      "Brace your torso and cross your ankles behind you.",
      "Set your shoulder position before starting the first rep.",
    ],
    execution: [
      "Lower your body under control by bending your elbows.",
      "Descend until you feel a stretch through the chest and shoulders, without going so deep that it strains the joint.",
      "Press back up by extending your elbows and returning to the starting position.",
      "Keep your torso lean angle consistent throughout the set.",
    ],
    coachingCues: [
      "Control the descent, don't drop.",
      "Keep the torso lean consistent.",
      "Elbows track back, not flared wide.",
      "Press to full extension at the top.",
    ],
    commonMistakes: [
      "Descending too deep and straining the shoulder joint.",
      "Letting the elbows flare out excessively.",
      "Using momentum or bouncing at the bottom.",
      "Rushing through a partial range of motion.",
    ],
    safetyNotes: [
      "Use an assisted machine or bands if a full-range dip is not yet controlled.",
      "Stop the set if shoulder pain changes your movement.",
      "Limit depth if you feel pinching or discomfort in the front of the shoulder.",
    ],
    breathing:
      "Inhale before lowering. Exhale as you press back up through the hardest part of the rep.",
    tempo:
      "Lower with a controlled descent and press back up with a strong, deliberate effort.",
    rangeOfMotion:
      "Lower until you feel a comfortable stretch through the chest and shoulders, then press to full elbow extension.",
    difficultyNotes:
      "A demanding bodyweight movement. Beginners often build toward it using assisted machines or partial-range reps.",
  },
  leg_press: {
    overview:
      "A machine-based squat pattern where you press a weighted sled away from your body while seated or reclined, allowing heavy loading of the quadriceps and glutes with less balance and bracing demand than a barbell squat.",
    primaryTarget: "Quadriceps and glutes",
    secondaryTargets: "Hamstrings",
    setup: [
      "Sit in the machine with your back flat against the pad and feet placed shoulder-width on the platform.",
      "Release the safety catches and set your knees to a comfortable starting bend.",
      "Brace your torso against the pad before starting the first rep.",
      "Select a load you can control through the full range of motion.",
    ],
    execution: [
      "Lower the platform under control by bending your knees toward your chest.",
      "Lower until your knees reach a comfortable depth without your lower back rounding off the pad.",
      "Drive through your feet to press the platform back to the starting position.",
      "Avoid locking your knees aggressively at the top of the rep.",
    ],
    coachingCues: [
      "Keep your lower back flat against the pad.",
      "Knees track in line with your toes.",
      "Drive evenly through the whole foot.",
      "Avoid slamming the knees straight at the top.",
    ],
    commonMistakes: [
      "Letting the lower back round off the pad at the bottom.",
      "Using a partial range of motion.",
      "Locking the knees out hard at the top of each rep.",
      "Letting the knees cave inward under load.",
    ],
    safetyNotes: [
      "Use the safety catches whenever resetting or ending a set.",
      "Avoid excessive depth if your lower back lifts off the pad.",
      "Stop the set if knee or lower-back pain changes your movement.",
    ],
    breathing:
      "Inhale and brace before lowering the platform. Exhale as you press through the hardest part of the rep.",
    tempo:
      "Lower with a controlled descent and press back up with a steady, deliberate effort.",
    rangeOfMotion:
      "Lower until your knees reach a comfortable depth while your lower back stays flat, then press to just short of locking out.",
    difficultyNotes:
      "A joint-friendly way to load the legs heavily. Approachable for most lifters, including those newer to loaded squatting patterns.",
  },
  farmer_carry: {
    overview:
      "A loaded carry performed by walking a set distance while holding a heavy implement in each hand, which builds grip strength, trunk stability, and overall work capacity.",
    primaryTarget: "Forearms and upper back",
    secondaryTargets: "Glutes, lower back, and scapular stabilizers",
    setup: [
      "Stand between the implements with feet hip-width apart.",
      "Hinge down, grip the handles firmly, and brace your torso.",
      "Stand up by driving through your legs, keeping the implements at your sides.",
      "Set your shoulders back and down before taking the first step.",
    ],
    execution: [
      "Walk with controlled, even steps while keeping your torso tall.",
      "Keep the implements steady at your sides without letting them swing.",
      "Maintain a firm grip and packed shoulders for the entire distance.",
      "Set the implements down under control at the end of the carry rather than dropping them.",
    ],
    coachingCues: [
      "Stay tall throughout the walk.",
      "Braced core, steady steps.",
      "Shoulders packed, not shrugged.",
      "Grip firmly the entire distance.",
    ],
    commonMistakes: [
      "Letting the shoulders round forward as grip fatigues.",
      "Taking uneven or rushed steps.",
      "Letting the implements swing side to side.",
      "Leaning to one side to compensate for grip fatigue.",
    ],
    safetyNotes: [
      "Choose a walking path clear of obstacles before starting.",
      "Use a load you can carry with stable posture for the full distance.",
      "Set the implements down carefully rather than dropping them near your feet.",
    ],
    breathing:
      "Brace and breathe steadily throughout the carry rather than holding your breath the entire distance.",
    tempo:
      "Walk at a controlled, steady pace rather than rushing or shuffling.",
    rangeOfMotion:
      "Not applicable in the traditional sense - maintain a tall, stable posture for the full distance of the carry.",
    difficultyNotes:
      "Approachable for most lifters, though grip strength is often the limiting factor before the legs or back.",
  },
  power_clean: {
    overview:
      "An Olympic-lift derivative where the bar is pulled explosively from the floor to the shoulders in one motion, developing power, speed, and full-body coordination more than most other barbell lifts.",
    primaryTarget: "Glutes, hamstrings, and quadriceps",
    secondaryTargets: "Upper back, traps, and forearms",
    setup: [
      "Set up over the bar with your shins close to it and feet about hip-width apart.",
      "Grip the bar just outside your legs and set your hips at a hinge position with a flat back.",
      "Pull your shoulder blades together and position your shoulders slightly ahead of the bar.",
      "Brace your torso before starting the pull.",
    ],
    execution: [
      "Drive through the floor to lift the bar past the knees while keeping it close to your body.",
      "Extend explosively through the hips, ankles, and knees once the bar passes mid-thigh.",
      "Pull yourself under the bar quickly and receive it on your front shoulders in a front-rack position.",
      "Stand tall to complete the rep, then lower the bar back to the floor under control.",
    ],
    coachingCues: [
      "Bar stays close to the body throughout the pull.",
      "Extend fully before pulling under.",
      "Receive the bar in a stable front-rack position.",
      "Stand tall to finish the rep.",
    ],
    commonMistakes: [
      "Letting the bar drift away from the body during the pull.",
      "Pulling early with the arms instead of finishing the leg and hip drive.",
      "Rushing the catch and losing the front-rack position.",
      "Failing to fully extend the hips before pulling under the bar.",
    ],
    safetyNotes: [
      "Learn the movement with a lighter load or training bar before adding significant weight.",
      "Use a platform or area with enough space to safely drop or lower the bar if needed.",
      "Stop the set if you cannot maintain a stable catch position.",
    ],
    breathing:
      "Inhale and brace before starting the pull. Exhale after receiving the bar in the front-rack position.",
    tempo:
      "Pull explosively from the floor through full extension, then transition quickly into the catch.",
    rangeOfMotion:
      "Pull from the floor to full hip extension, then receive the bar on the shoulders in a front-rack position.",
    difficultyNotes:
      "A technical lift that benefits from coaching or guided practice before adding load. Best introduced with lighter weights while learning the pull and catch sequence.",
  },
  plank: {
    overview:
      "An isometric core-stability exercise performed by holding a straight-body position supported on the forearms and toes, widely used to build trunk bracing and anti-extension strength.",
    primaryTarget: "Core",
    secondaryTargets: "Glutes and shoulders",
    setup: [
      "Set your forearms on the floor with elbows under your shoulders.",
      "Extend your legs behind you with your toes on the floor.",
      "Set your body in a straight line from head to heels.",
      "Brace your core and squeeze your glutes before starting the hold.",
    ],
    execution: [
      "Hold the straight-body position while breathing steadily.",
      "Keep your hips level, avoiding sagging down or piking up.",
      "Maintain tension through the core and glutes for the full duration.",
      "Release the position under control once the time is complete.",
    ],
    coachingCues: [
      "Keep a straight line from head to heels.",
      "Brace and breathe steadily.",
      "Squeeze the glutes to help stabilize the hips.",
      "Hold the position, don't just survive it.",
    ],
    commonMistakes: [
      "Letting the hips sag toward the floor.",
      "Piking the hips up too high.",
      "Holding the breath instead of breathing steadily.",
      "Losing position as fatigue sets in near the end of the hold.",
    ],
    safetyNotes: [
      "Stop the hold if lower-back pain develops or your position breaks down significantly.",
      "Shorten the hold time rather than sacrificing form.",
    ],
    breathing:
      "Breathe steadily and evenly throughout the hold rather than holding your breath.",
    tempo:
      "Not applicable - maintain a steady, unmoving position for the prescribed time.",
    rangeOfMotion:
      "Hold the straight-body position without letting the hips sag or pike for the full prescribed time.",
    difficultyNotes:
      "A beginner-friendly core exercise. Progress by increasing hold time before adding more advanced variations.",
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