import type {
  PlateInventoryItem,
  PlateLoadingUnit,
} from "../types/userSettings.types";

export type PlateLoadingBreakdown = Record<string, number>;

export type PlateLoadingOption = {
  differenceFromTarget: number;
  loadedTotalWeight: number;
  platesPerSide: PlateLoadingBreakdown;
};

export type PlateLoadingResult = {
  barbellWeight: number;
  closestOver?: PlateLoadingOption;
  closestUnder?: PlateLoadingOption;
  isExact: boolean;
  loadedTotalWeight: number | null;
  overage: number;
  platesPerSide: PlateLoadingBreakdown | null;
  shortfall: number;
  status: "empty" | "exact" | "invalid" | "nearest";
  targetWeight: number;
  unit: PlateLoadingUnit;
};

type ScaledPlate = {
  count: number;
  scaledSize: number;
  size: number;
};

const SCALE = 100;

const toScaledWeight = (value: number) => Math.round(value * SCALE);

const fromScaledWeight = (value: number) => Math.round(value) / SCALE;

const cloneBreakdown = (breakdown: PlateLoadingBreakdown) => ({
  ...breakdown,
});

const getBreakdownPlateCount = (breakdown: PlateLoadingBreakdown) =>
  Object.values(breakdown).reduce((total, count) => total + count, 0);

const isCleanerBreakdown = (
  candidate: PlateLoadingBreakdown,
  current: PlateLoadingBreakdown
) => {
  const candidatePlateCount = getBreakdownPlateCount(candidate);
  const currentPlateCount = getBreakdownPlateCount(current);

  if (candidatePlateCount !== currentPlateCount) {
    return candidatePlateCount < currentPlateCount;
  }

  const candidateDistinctSizes = Object.keys(candidate).length;
  const currentDistinctSizes = Object.keys(current).length;

  if (candidateDistinctSizes !== currentDistinctSizes) {
    return candidateDistinctSizes < currentDistinctSizes;
  }

  return (
    Math.max(...Object.keys(candidate).map(Number), 0) >
    Math.max(...Object.keys(current).map(Number), 0)
  );
};

const normalizeInventory = (inventory: PlateInventoryItem[]) =>
  inventory
    .filter((plate) => plate.size > 0 && plate.count >= 2)
    .map<ScaledPlate>((plate) => ({
      count: Math.floor(plate.count / 2),
      scaledSize: toScaledWeight(plate.size),
      size: plate.size,
    }))
    .sort((left, right) => right.size - left.size);

const buildOption = ({
  barbellWeight,
  platesPerSide,
  targetWeight,
  totalPlateWeightPerSide,
}: {
  barbellWeight: number;
  platesPerSide: PlateLoadingBreakdown;
  targetWeight: number;
  totalPlateWeightPerSide: number;
}): PlateLoadingOption => {
  const loadedTotalWeight = fromScaledWeight(
    toScaledWeight(barbellWeight) + totalPlateWeightPerSide * 2
  );

  return {
    differenceFromTarget: fromScaledWeight(
      toScaledWeight(loadedTotalWeight - targetWeight)
    ),
    loadedTotalWeight,
    platesPerSide: cloneBreakdown(platesPerSide),
  };
};

const findPlateLoadingOptions = ({
  barbellWeight,
  inventory,
  targetWeight,
}: {
  barbellWeight: number;
  inventory: PlateInventoryItem[];
  targetWeight: number;
}) => {
  const plates = normalizeInventory(inventory);
  const targetPerSide = toScaledWeight((targetWeight - barbellWeight) / 2);
  let exact: PlateLoadingOption | undefined;
  let closestUnder: PlateLoadingOption | undefined;
  let closestOver: PlateLoadingOption | undefined;

  const visit = (
    plateIndex: number,
    currentPerSide: number,
    platesPerSide: PlateLoadingBreakdown
  ) => {
    if (plateIndex >= plates.length) {
      const option = buildOption({
        barbellWeight,
        platesPerSide,
        targetWeight,
        totalPlateWeightPerSide: currentPerSide,
      });

      if (currentPerSide === targetPerSide) {
        if (!exact || isCleanerBreakdown(option.platesPerSide, exact.platesPerSide)) {
          exact = option;
        }
        closestUnder = option;
        closestOver = option;
        return;
      }

      if (currentPerSide < targetPerSide) {
        if (
          !closestUnder ||
          option.loadedTotalWeight > closestUnder.loadedTotalWeight
        ) {
          closestUnder = option;
        }
        return;
      }

      if (
        !closestOver ||
        option.loadedTotalWeight < closestOver.loadedTotalWeight
      ) {
        closestOver = option;
      }
      return;
    }

    const plate = plates[plateIndex];

    for (let count = 0; count <= plate.count; count += 1) {
      const nextBreakdown =
        count > 0
          ? {
              ...platesPerSide,
              [String(plate.size)]: count,
            }
          : platesPerSide;

      visit(
        plateIndex + 1,
        currentPerSide + count * plate.scaledSize,
        nextBreakdown
      );
    }
  };

  visit(0, 0, {});

  return {
    closestOver,
    closestUnder,
    exact,
  };
};

export const calculatePlateLoading = ({
  barbellWeight,
  inventory,
  targetWeight,
  unit,
}: {
  barbellWeight: number;
  inventory: PlateInventoryItem[];
  targetWeight: number;
  unit: PlateLoadingUnit;
}): PlateLoadingResult => {
  if (!Number.isFinite(targetWeight)) {
    return {
      barbellWeight,
      isExact: false,
      loadedTotalWeight: null,
      overage: 0,
      platesPerSide: null,
      shortfall: 0,
      status: "empty",
      targetWeight,
      unit,
    };
  }

  if (
    !Number.isFinite(barbellWeight) ||
    barbellWeight <= 0 ||
    targetWeight < barbellWeight
  ) {
    return {
      barbellWeight,
      isExact: false,
      loadedTotalWeight: null,
      overage: 0,
      platesPerSide: null,
      shortfall: Math.max(0, fromScaledWeight(barbellWeight - targetWeight)),
      status: "invalid",
      targetWeight,
      unit,
    };
  }

  const { closestOver, closestUnder, exact } = findPlateLoadingOptions({
    barbellWeight,
    inventory,
    targetWeight,
  });
  const selectedOption = exact ?? closestUnder ?? closestOver;

  if (!selectedOption) {
    return {
      barbellWeight,
      isExact: false,
      loadedTotalWeight: null,
      overage: 0,
      platesPerSide: null,
      shortfall: fromScaledWeight(targetWeight - barbellWeight),
      status: "nearest",
      targetWeight,
      unit,
    };
  }

  const difference = selectedOption.differenceFromTarget;

  return {
    barbellWeight,
    closestOver,
    closestUnder,
    isExact: Boolean(exact),
    loadedTotalWeight: selectedOption.loadedTotalWeight,
    overage: difference > 0 ? difference : 0,
    platesPerSide: selectedOption.platesPerSide,
    shortfall: difference < 0 ? Math.abs(difference) : 0,
    status: exact ? "exact" : "nearest",
    targetWeight,
    unit,
  };
};
