import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalculatorIcon, DumbbellIcon } from "lucide-react";

import FormField, { TextInput } from "./ui/FormField";
import {
  DEFAULT_PLATE_LOADING_SETTINGS,
  type PlateInventoryItem,
  type PlateLoadingUnit,
} from "../../../shared/types/userSettings.types";
import {
  calculatePlateLoading,
  type PlateLoadingBreakdown,
  type PlateLoadingOption,
} from "../../../shared/utils/plateLoading";
import styles from "../styles/components/plateCalculator.module.scss";

type PlateCalculatorProps = {
  barbellWeight?: number;
  inventory?: PlateInventoryItem[];
  settingsHref?: string;
  targetWeight?: number;
  unit?: PlateLoadingUnit;
};

const getFallbackBarbellWeight = (unit: PlateLoadingUnit) =>
  unit === "kg" ? 20 : 45;

const getFallbackInventory = (unit: PlateLoadingUnit) =>
  DEFAULT_PLATE_LOADING_SETTINGS.plates[unit];

const getResultMessage = ({
  barbellWeight,
  result,
  unit,
}: {
  barbellWeight: number;
  result: ReturnType<typeof calculatePlateLoading>;
  unit: PlateLoadingUnit;
}) => {
  if (result.status === "invalid") {
    return `Weight must be at least the barbell weight (${barbellWeight} ${unit}).`;
  }

  if (result.status === "nearest") {
    if (result.shortfall > 0) {
      return `Exact loading is not possible with your saved plates. Closest load is short by ${result.shortfall} ${unit}.`;
    }

    if (result.overage > 0) {
      return `Exact loading is not possible with your saved plates. Closest load is over by ${result.overage} ${unit}.`;
    }
  }

  return "";
};

const PlateBreakdownList = ({
  breakdown,
  unit,
}: {
  breakdown: PlateLoadingBreakdown;
  unit: PlateLoadingUnit;
}) => {
  const entries = Object.entries(breakdown).sort(
    ([leftSize], [rightSize]) => Number(rightSize) - Number(leftSize)
  );

  if (entries.length === 0) {
    return <p className={styles.emptyResult}>No extra plates needed. Just the bar.</p>;
  }

  return (
    <ul className={styles.list}>
      {entries.map(([size, count]) => (
        <li key={size} className={styles.listItem}>
          <span className={styles.plateDisc}>{size}</span>
          <strong>
            {count} {count > 1 ? "plates" : "plate"} per side
          </strong>{" "}
          <span>
            {size}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  );
};

const ClosestOption = ({
  label,
  option,
  unit,
}: {
  label: string;
  option: PlateLoadingOption | undefined;
  unit: PlateLoadingUnit;
}) =>
  option ? (
    <div className={styles.closestOption}>
      <span>{label}</span>
      <strong>
        {option.loadedTotalWeight} {unit}
      </strong>
    </div>
  ) : null;

const PlateCalculator = ({
  barbellWeight,
  inventory,
  settingsHref = "/settings#plate-loading",
  targetWeight,
  unit = "lb",
}: PlateCalculatorProps) => {
  const resolvedBarbellWeight = barbellWeight ?? getFallbackBarbellWeight(unit);
  const inventoryForUnit = inventory ?? getFallbackInventory(unit);
  const hasSavedPlates = inventoryForUnit.some((plate) => plate.count >= 2);
  const [totalWeight, setTotalWeight] = useState(
    targetWeight === undefined ? "" : String(targetWeight)
  );

  const target = Number(totalWeight);
  const result = useMemo(() => {
    if (totalWeight.trim() === "") {
      return null;
    }

    return calculatePlateLoading({
      barbellWeight: resolvedBarbellWeight,
      inventory: inventoryForUnit,
      targetWeight: target,
      unit,
    });
  }, [inventoryForUnit, resolvedBarbellWeight, target, totalWeight, unit]);

  const warning = result
    ? getResultMessage({
        barbellWeight: resolvedBarbellWeight,
        result,
        unit,
      })
    : "";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.iconBadge} aria-hidden="true">
          <CalculatorIcon />
        </span>
        <div>
          <p className={styles.eyebrow}>Loading Tool</p>
          <h2>Plate Calculator</h2>
          <span className={styles.setupMeta}>
            {resolvedBarbellWeight} {unit} bar • {unit} plates
          </span>
        </div>
      </header>

      <div className={styles.setupSummary}>
        <Link to={settingsHref}>Edit plates in Settings</Link>
      </div>

      {!hasSavedPlates ? (
        <div className={styles.emptyInventory}>
          No saved plate pairs yet. Add plates in Settings so LiftLogic can
          calculate a real loaded bar.
        </div>
      ) : null}

      <div className={styles.form}>
        <FormField label={`Target Weight (${unit})`}>
          <TextInput
            type="number"
            step="any"
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
            placeholder={`Total weight in ${unit}`}
          />
        </FormField>
      </div>

      {warning ? <div className={styles.warning}>{warning}</div> : null}

      {result?.platesPerSide && result.loadedTotalWeight !== null ? (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultIcon} aria-hidden="true">
              <DumbbellIcon />
            </span>
            <div>
              <p>{result.isExact ? "Exact loaded bar" : "Closest loaded bar"}</p>
              <h3>
                {result.loadedTotalWeight} {unit}
              </h3>
            </div>
          </div>

          <PlateBreakdownList breakdown={result.platesPerSide} unit={unit} />

          {!result.isExact ? (
            <div className={styles.closestGrid}>
              <ClosestOption
                label="Closest under"
                option={result.closestUnder}
                unit={unit}
              />
              <ClosestOption
                label="Closest over"
                option={result.closestOver}
                unit={unit}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {inventoryForUnit.length > 0 ? (
        <div
          className={styles.inventoryStrip}
          aria-label={`Available ${unit} plates`}
        >
          {inventoryForUnit.map((plate) => (
            <span key={`${unit}-${plate.size}`}>
              {plate.count}x {plate.size}
              {unit}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default PlateCalculator;
