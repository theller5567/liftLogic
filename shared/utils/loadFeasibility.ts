import {
  type ConfidenceLevel,
  type EquipmentType,
  type WeightUnit,
  weightEstimationRules,
} from "../constants/weightEstimationRules";
import { applyMinimum, roundToIncrement } from "./weightEstimation";

const EPLEY_REP_COEFFICIENT = 1 / 30;
const DEFAULT_FATIGUE_FACTOR_PER_ADDITIONAL_SET = 0.015;
const NEW_EXERCISE_BUFFER = 0.95;
const LOW_CONFIDENCE_BUFFER = 0.95;

export type LoadFeasibilityStatus =
  | "safe"
  | "challenging"
  | "limit"
  | "too_heavy"
  | "unknown";

export type LoadFeasibilitySource =
  | "onboarding"
  | "recent_performance"
  | "manual"
  | "default"
  | "unknown";

export type LoadFeasibilityResult = {
  assignedWeight?: number;
  confidence: ConfidenceLevel;
  feasibilityRatio?: number;
  feasibleWeight?: number;
  reason: string;
  source: LoadFeasibilitySource;
  status: LoadFeasibilityStatus;
  suggestedWeight?: number;
  targetReps?: number;
};

export type LoadFeasibilityCapacity =
  | {
      oneRepMax: number;
      source: LoadFeasibilitySource;
    }
  | {
      reps: number;
      source: LoadFeasibilitySource;
      weight: number;
    };

export type LoadFeasibilityParams = {
  assignedWeight?: number;
  capacity?: LoadFeasibilityCapacity;
  confidence?: ConfidenceLevel;
  equipmentType: EquipmentType;
  fatigueFactorPerAdditionalSet?: number;
  isNewExercise?: boolean;
  reps: number | string;
  sets: number;
  weightUnit: WeightUnit;
};

export const estimateOneRepMax = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) {
    return null;
  }

  return weight * (1 + reps * EPLEY_REP_COEFFICIENT);
};

export const parsePrescriptionTopReps = (reps: number | string) => {
  if (typeof reps === "number") {
    return Number.isFinite(reps) && reps > 0 ? reps : null;
  }

  const repValues = reps.match(/\d+/g)?.map(Number) ?? [];

  if (repValues.length === 0) {
    return null;
  }

  return Math.max(...repValues);
};

export const getSingleSetCapacity = (
  oneRepMax: number,
  targetReps: number
) => {
  if (oneRepMax <= 0 || targetReps <= 0) {
    return null;
  }

  return oneRepMax / (1 + targetReps * EPLEY_REP_COEFFICIENT);
};

export const getVolumeAdjustedCapacity = ({
  fatigueFactorPerAdditionalSet = DEFAULT_FATIGUE_FACTOR_PER_ADDITIONAL_SET,
  oneRepMax,
  reps,
  sets,
}: {
  fatigueFactorPerAdditionalSet?: number;
  oneRepMax: number;
  reps: number;
  sets: number;
}) => {
  const singleSetCapacity = getSingleSetCapacity(oneRepMax, reps);

  if (singleSetCapacity === null || sets <= 0) {
    return null;
  }

  const additionalSets = Math.max(0, sets - 1);
  const fatigueMultiplier = Math.max(
    0,
    1 - additionalSets * fatigueFactorPerAdditionalSet
  );

  return singleSetCapacity * fatigueMultiplier;
};

const getStatusForRatio = (ratio: number): LoadFeasibilityStatus => {
  if (ratio > 1.05) {
    return "too_heavy";
  }

  if (ratio > 1) {
    return "limit";
  }

  if (ratio > 0.92) {
    return "challenging";
  }

  return "safe";
};

const getReasonForStatus = (status: LoadFeasibilityStatus) => {
  switch (status) {
    case "safe":
      return "This load fits the target volume.";
    case "challenging":
      return "This is close to your estimated capacity for this rep target.";
    case "limit":
      return "This may be at your limit for all planned sets.";
    case "too_heavy":
      return "This looks too heavy for the planned sets and reps. Consider reducing before you start.";
    case "unknown":
    default:
      return "Not enough history yet. Choose a load you can control.";
  }
};

const getCapacityOneRepMax = (capacity: LoadFeasibilityCapacity) => {
  if ("oneRepMax" in capacity) {
    return capacity.oneRepMax > 0 ? capacity.oneRepMax : null;
  }

  return estimateOneRepMax(capacity.weight, capacity.reps);
};

export const getLoadFeasibility = ({
  assignedWeight,
  capacity,
  confidence = "medium",
  equipmentType,
  fatigueFactorPerAdditionalSet,
  isNewExercise = false,
  reps,
  sets,
  weightUnit,
}: LoadFeasibilityParams): LoadFeasibilityResult => {
  const source = capacity?.source ?? "unknown";
  const targetReps = parsePrescriptionTopReps(reps);

  if (
    assignedWeight === undefined ||
    assignedWeight <= 0 ||
    !capacity ||
    !targetReps
  ) {
    return {
      assignedWeight,
      confidence,
      reason: getReasonForStatus("unknown"),
      source,
      status: "unknown",
      targetReps: targetReps ?? undefined,
    };
  }

  const oneRepMax = getCapacityOneRepMax(capacity);

  if (oneRepMax === null) {
    return {
      assignedWeight,
      confidence,
      reason: getReasonForStatus("unknown"),
      source,
      status: "unknown",
      targetReps,
    };
  }

  const volumeAdjustedCapacity = getVolumeAdjustedCapacity({
    fatigueFactorPerAdditionalSet,
    oneRepMax,
    reps: targetReps,
    sets,
  });

  if (volumeAdjustedCapacity === null || volumeAdjustedCapacity <= 0) {
    return {
      assignedWeight,
      confidence,
      reason: getReasonForStatus("unknown"),
      source,
      status: "unknown",
      targetReps,
    };
  }

  const contextBuffer =
    (isNewExercise ? NEW_EXERCISE_BUFFER : 1) *
    (confidence === "low" ? LOW_CONFIDENCE_BUFFER : 1);
  const rawFeasibleWeight = volumeAdjustedCapacity * contextBuffer;
  const increment = weightEstimationRules.rounding[weightUnit][equipmentType];
  const feasibleWeight = applyMinimum(
    roundToIncrement(rawFeasibleWeight, increment),
    weightUnit,
    equipmentType
  );
  const feasibilityRatio = assignedWeight / feasibleWeight;
  const status = getStatusForRatio(feasibilityRatio);

  return {
    assignedWeight,
    confidence,
    feasibilityRatio,
    feasibleWeight,
    reason: getReasonForStatus(status),
    source,
    status,
    suggestedWeight: feasibleWeight,
    targetReps,
  };
};
