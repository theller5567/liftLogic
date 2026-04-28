import {
    weightEstimationRules,
    type ConfidenceLevel,
    type EquipmentType,
    type ExerciseKey,
    type ExperienceLevel,
    type WeightUnit,
  } from "../constants/weightEstimationRules";
  
  export interface EstimateDirectWeightParams {
    estimatedWeight: number;
    estimatedReps: number;
    experienceLevel: ExperienceLevel;
    confidence: ConfidenceLevel;
    weightUnit: WeightUnit;
    equipmentType: EquipmentType;
  }
  
  export interface DefaultWeightParams {
    exerciseKey: ExerciseKey;
    weightUnit: WeightUnit;
    experienceLevel: ExperienceLevel;
  }
  
  export interface DerivedWeightParams {
    exerciseKey: ExerciseKey;
    sourceWeight: number;
    weightUnit: WeightUnit;
  }
  
  export function getRepsMultiplier(reps: number): number {
    const range = weightEstimationRules.multipliers.reps.find(
      (entry) => reps >= entry.min && reps <= entry.max
    );
  
    return range?.multiplier ?? 0.9;
  }
  
  export function roundToIncrement(value: number, increment: number): number {
    return Math.round(value / increment) * increment;
  }
  
  export function applyMinimum(
    value: number,
    weightUnit: WeightUnit,
    equipmentType: EquipmentType
  ): number {
    const minimum = weightEstimationRules.minimums[weightUnit][equipmentType];
    return Math.max(value, minimum);
  }
  
  export function estimateStartingWeight({
    estimatedWeight,
    estimatedReps,
    experienceLevel,
    confidence,
    weightUnit,
    equipmentType,
  }: EstimateDirectWeightParams): number {
    const experienceMultiplier =
      weightEstimationRules.multipliers.experience[experienceLevel];
  
    const confidenceMultiplier =
      weightEstimationRules.multipliers.confidence[confidence];
  
    const repsMultiplier = getRepsMultiplier(estimatedReps);
  
    const increment = weightEstimationRules.rounding[weightUnit][equipmentType];
  
    const rawWeight =
      estimatedWeight *
      experienceMultiplier *
      confidenceMultiplier *
      repsMultiplier;
  
    const rounded = roundToIncrement(rawWeight, increment);
  
    return applyMinimum(rounded, weightUnit, equipmentType);
  }
  
  export function getDefaultStartingWeight({
    exerciseKey,
    weightUnit,
    experienceLevel,
  }: DefaultWeightParams): number {
    const defaultWeight =
      weightEstimationRules.defaults[weightUnit][exerciseKey][experienceLevel];
  
    const equipmentType =
      weightEstimationRules.exerciseMeta[exerciseKey].equipmentType;
  
    return applyMinimum(defaultWeight, weightUnit, equipmentType);
  }
  
export function deriveStartingWeight({
  exerciseKey,
  sourceWeight,
  weightUnit,
}: DerivedWeightParams): number | null {
  const derivedRules = weightEstimationRules.derivedFrom as Partial<
    Record<ExerciseKey, (typeof weightEstimationRules.derivedFrom)[keyof typeof weightEstimationRules.derivedFrom]>
  >;
  const rule = derivedRules[exerciseKey];

  if (!rule) {
    return null;
  }
  
    const increment = weightEstimationRules.rounding[weightUnit][rule.equipmentType];
    const rawWeight = sourceWeight * rule.multiplier;
    const rounded = roundToIncrement(rawWeight, increment);
  
    return applyMinimum(rounded, weightUnit, rule.equipmentType);
  }
  
  export function getExerciseEquipmentType(exerciseKey: ExerciseKey): EquipmentType {
    return weightEstimationRules.exerciseMeta[exerciseKey].equipmentType;
  }
  
  export function resolveStartingWeight(params: {
    exerciseKey: ExerciseKey;
    weightUnit: WeightUnit;
    experienceLevel: ExperienceLevel;
    directEstimate?: {
      estimatedWeight: number;
      estimatedReps: number;
      confidence: ConfidenceLevel;
    };
    derivedSourceWeight?: number;
  }): number {
    const {
      exerciseKey,
      weightUnit,
      experienceLevel,
      directEstimate,
      derivedSourceWeight,
    } = params;
  
    if (directEstimate) {
      return estimateStartingWeight({
        estimatedWeight: directEstimate.estimatedWeight,
        estimatedReps: directEstimate.estimatedReps,
        confidence: directEstimate.confidence,
        experienceLevel,
        weightUnit,
        equipmentType: getExerciseEquipmentType(exerciseKey),
      });
    }
  
    if (derivedSourceWeight !== undefined) {
      const derived = deriveStartingWeight({
        exerciseKey,
        sourceWeight: derivedSourceWeight,
        weightUnit,
      });
  
      if (derived !== null) {
        return derived;
      }
    }
  
    return getDefaultStartingWeight({
      exerciseKey,
      weightUnit,
      experienceLevel,
    });
  }
