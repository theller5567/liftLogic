import { describe, expect, it } from "vitest";

import { generateWorkoutPreview } from "../../../shared/utils/generateWorkoutPreview";
import {
  getExerciseMetadata,
  summarizeExercisePool,
} from "../../../shared/utils/exerciseIntelligence";
import {
  getBodyMassIndex,
  getRankedWorkoutTemplateRecommendations,
  getTemplateExerciseProfile,
  getTemplateRecommendationScore,
  getTemplateRecommendationScoreBreakdown,
  getWorkoutTemplateExplanation,
  workoutRecommendationWeights,
} from "../../../shared/utils/workoutTemplateRecommendations";
import { exerciseLibrary } from "../../../shared/constants/exercise-library";

describe("exercise intelligence recommendations", () => {
  it("adds exercise-level match reasons to workout recommendations", () => {
    const recommendations = getRankedWorkoutTemplateRecommendations({
      ageRange: "19_29",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      goal: "hypertrophy",
      weightUnit: "lb",
    });

    expect(recommendations[0].matchReasons).toEqual(
      expect.arrayContaining([
        "Strong equipment match",
        "Mostly beginner-friendly exercises",
      ])
    );
  });

  it("profiles template exercise makeup for goal-aware scoring", () => {
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "starting_strength"
    );

    expect(template).toBeDefined();

    const profile = getTemplateExerciseProfile(template!, {
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "strength",
      weightUnit: "lb",
    });

    expect(profile.compoundRatio).toBeGreaterThan(0.8);
    expect(profile.goalFitAverage).toBeGreaterThan(0.8);
  });

  it("derives metadata for high-skill and low-impact exercises", () => {
    const powerClean = exerciseLibrary.exercises.find(
      (exercise) => exercise.id === "power_clean"
    );
    const plank = exerciseLibrary.exercises.find(
      (exercise) => exercise.id === "plank"
    );

    expect(powerClean).toBeDefined();
    expect(plank).toBeDefined();

    expect(getExerciseMetadata(powerClean!)).toEqual(
      expect.objectContaining({
        recoveryCost: "high",
        technicalComplexity: "high",
        impactLevel: "low",
        setupComplexity: "high",
        timeCost: "long",
        bestForGoals: expect.arrayContaining(["skill", "strength"]),
      })
    );
    expect(getExerciseMetadata(plank!)).toEqual(
      expect.objectContaining({
        recoveryCost: "low",
        impactLevel: "none",
        setupComplexity: "low",
        timeCost: "short",
      })
    );
  });

  it("tracks joint-concern and complexity profile data across an exercise pool", () => {
    const exercises = ["barbell_bench_press", "standing_overhead_press", "plank"]
      .map((exerciseId) =>
        exerciseLibrary.exercises.find((exercise) => exercise.id === exerciseId)
      )
      .filter((exercise): exercise is NonNullable<typeof exercise> =>
        Boolean(exercise)
      );

    const profile = summarizeExercisePool(
      exercises,
      {
        experienceLevel: "beginner",
        goal: "hypertrophy",
        jointConcerns: ["shoulders"],
        weightUnit: "lb",
      },
      []
    );

    expect(profile.jointConcernMatchRatio).toBeGreaterThan(0);
    expect(profile.jointStressAverage).toBeGreaterThan(1);
    expect(profile.technicalComplexityAverage).toBeGreaterThan(1);
  });

  it("returns a score breakdown that adds up to the final recommendation score", () => {
    const answers = {
      ageRange: "19_29",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      goal: "strength",
      weightUnit: "lb",
    } as const;
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "starting_strength"
    );

    expect(template).toBeDefined();

    const breakdown = getTemplateRecommendationScoreBreakdown(
      template!,
      answers
    );
    const total = Object.values(breakdown).reduce(
      (currentTotal, value) => currentTotal + value,
      0
    );

    expect(breakdown.schedule).toBe(
      workoutRecommendationWeights.exactDayMatch
    );
    expect(breakdown.experience).toBe(
      workoutRecommendationWeights.exactExperienceMatch
    );
    expect(total).toBeCloseTo(getTemplateRecommendationScore(template!, answers));
  });

  it("includes score breakdowns on ranked recommendations", () => {
    const recommendations = getRankedWorkoutTemplateRecommendations({
      ageRange: "40_49",
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      gender: "male",
      goal: "hypertrophy",
      weightUnit: "lb",
    });
    const firstRecommendation = recommendations[0];
    const breakdownTotal = Object.values(firstRecommendation.scoreBreakdown).reduce(
      (currentTotal, value) => currentTotal + value,
      0
    );

    expect(firstRecommendation.scoreBreakdown).toEqual(
      expect.objectContaining({
        ageGuidance: expect.any(Number),
        bodyComposition: expect.any(Number),
        bodySizeGuidance: expect.any(Number),
        difficulty: expect.any(Number),
        equipment: expect.any(Number),
        exerciseGoalFit: expect.any(Number),
        exerciseStructure: expect.any(Number),
        experience: expect.any(Number),
        goal: expect.any(Number),
        jointConcernCompatibility: expect.any(Number),
        movementPatternCoverage: expect.any(Number),
        muscleVolumeBalance: expect.any(Number),
        preferenceFit: expect.any(Number),
        recentConsistency: expect.any(Number),
        recoveryQuality: expect.any(Number),
        schedule: expect.any(Number),
        sessionLength: expect.any(Number),
        substitutionQuality: expect.any(Number),
      })
    );
    expect(breakdownTotal).toBeCloseTo(firstRecommendation.score);
  });

  it("rewards beginner lower-frequency plans for brand new users", () => {
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "starting_strength"
    );

    expect(template).toBeDefined();

    const breakdown = getTemplateRecommendationScoreBreakdown(template!, {
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "strength",
      recentTrainingConsistency: "brand_new",
      weightUnit: "lb",
    });

    expect(breakdown.recentConsistency).toBeGreaterThan(0);
  });

  it("penalizes longer templates for short workout windows", () => {
    const template = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "bro_split"
    );

    expect(template).toBeDefined();

    const breakdown = getTemplateRecommendationScoreBreakdown(template!, {
      availableTrainingDays: 5,
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      goal: "hypertrophy",
      sessionLength: "20_30",
      weightUnit: "lb",
    });

    expect(breakdown.sessionLength).toBeLessThan(0);
  });

  it("calculates body mass index from optional height and weight answers", () => {
    expect(
      getBodyMassIndex({
        bodyWeight: 200,
        heightInches: 70,
        weightUnit: "lb",
      })
    ).toBeCloseTo(28.69, 2);
  });

  it("adds soft body-size guidance for higher body size users", () => {
    const beginnerTemplate = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "full_body_3_day"
    );
    const advancedTemplate = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "push_pull_legs_6_day"
    );

    expect(beginnerTemplate).toBeDefined();
    expect(advancedTemplate).toBeDefined();

    const answers = {
      availableTrainingDays: 3,
      bodyWeight: 260,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "hypertrophy",
      heightInches: 68,
      weightUnit: "lb",
    } as const;

    expect(
      getTemplateRecommendationScoreBreakdown(beginnerTemplate!, answers)
        .bodySizeGuidance
    ).toBeGreaterThan(0);
    expect(
      getTemplateRecommendationScoreBreakdown(advancedTemplate!, answers)
      .bodySizeGuidance
    ).toBeLessThan(0);
  });

  it("penalizes templates that include exercises the user dislikes", () => {
    const broSplit = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "bro_split"
    );

    expect(broSplit).toBeDefined();

    const neutralBreakdown = getTemplateRecommendationScoreBreakdown(broSplit!, {
      availableTrainingDays: 5,
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      goal: "hypertrophy",
      weightUnit: "lb",
    });
    const dislikedBreakdown = getTemplateRecommendationScoreBreakdown(broSplit!, {
      availableTrainingDays: 5,
      dislikedExerciseIds: ["barbell_bench_press"],
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      goal: "hypertrophy",
      weightUnit: "lb",
    });

    expect(dislikedBreakdown.preferenceFit).toBeLessThan(
      neutralBreakdown.preferenceFit
    );
  });

  it("adds joint concern penalties and warnings for matching movement patterns", () => {
    const broSplit = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "bro_split"
    );
    const recommendation = getRankedWorkoutTemplateRecommendations({
      availableTrainingDays: 5,
      equipmentAccess: "full_gym",
      experienceLevel: "advanced",
      goal: "hypertrophy",
      jointConcerns: ["shoulders"],
      selectedWorkoutTemplateId: "bro_split",
      weightUnit: "lb",
    }).find((candidate) => candidate.template.id === broSplit?.id);

    expect(broSplit).toBeDefined();
    expect(recommendation).toBeDefined();
    expect(recommendation!.scoreBreakdown.jointConcernCompatibility).toBeLessThan(0);
    expect(recommendation!.warnings).toContain(
      "Includes movements to review for your joint concerns"
    );
  });

  it("uses metadata to penalize high recovery and complexity for brand new users", () => {
    const advancedTemplate = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "push_pull_legs_6_day"
    );

    expect(advancedTemplate).toBeDefined();

    const breakdown = getTemplateRecommendationScoreBreakdown(advancedTemplate!, {
      availableTrainingDays: 6,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "hypertrophy",
      recentTrainingConsistency: "brand_new",
      weightUnit: "lb",
    });

    expect(breakdown.recoveryQuality).toBeLessThan(0);
  });

  it("groups recommendation explanations into reasons, tradeoffs, checks, and substitutions", () => {
    const broSplit = exerciseLibrary.workoutTemplates.find(
      (workoutTemplate) => workoutTemplate.id === "bro_split"
    );

    expect(broSplit).toBeDefined();

    const explanation = getWorkoutTemplateExplanation(broSplit!, {
      availableTrainingDays: 3,
      dislikedExerciseIds: ["barbell_bench_press"],
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "hypertrophy",
      jointConcerns: ["shoulders"],
      sessionLength: "20_30",
      weightUnit: "lb",
    });

    expect(explanation.whyThisPlan.length).toBeGreaterThan(0);
    expect(explanation.tradeoffs.length).toBeGreaterThan(0);
    expect(explanation.thingsToCheck).toEqual(
      expect.arrayContaining([
        "More advanced than your experience level",
        "Includes 1 exercise you marked as disliked",
        "Includes movements to review for your joint concerns",
      ])
    );
    expect(explanation.suggestedSubstitutions.some((suggestion) =>
      suggestion.includes("Bench Press")
    )).toBe(true);
  });

  it("adds compact metadata tags to generated exercise previews", () => {
    const preview = generateWorkoutPreview({
      availableTrainingDays: 3,
      equipmentAccess: "full_gym",
      experienceLevel: "beginner",
      goal: "strength",
      selectedWorkoutTemplateId: "starting_strength",
      weightUnit: "lb",
    });

    expect(preview.days[0].exercises[0].detailTags).toEqual(
      expect.arrayContaining(["Intermediate", "Compound", "Barbell"])
    );
  });
});
