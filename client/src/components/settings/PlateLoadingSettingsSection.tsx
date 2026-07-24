import { useState } from "react";
import { CircleDot, Minus, Plus } from "lucide-react";

import type { UserSettings } from "../../../../shared/types/userSettings.types";
import Button from "../Button";
import FormField, { TextInput } from "../ui/FormField";
import SectionAccordion from "../ui/SectionAccordion";
import type { SettingsUpdate } from "./settingsSectionTypes";
import {
  barbellPresetOptions,
  parsePositiveNumber,
  plateLoadingUnitOptions,
  sortPlateInventory,
  toNumberInputValue,
} from "./settingsSectionUtils";
import styles from "../../styles/pages/settings.module.scss";

type PlateLoadingSettingsSectionProps = {
  draftSettings: UserSettings;
  onUpdateDraft: SettingsUpdate;
};

export const PlateLoadingSettingsSection = ({
  draftSettings,
  onUpdateDraft,
}: PlateLoadingSettingsSectionProps) => {
  const [customPlateSize, setCustomPlateSize] = useState("");
  const [customPlateError, setCustomPlateError] = useState<string | null>(null);
  const unit = draftSettings.plateLoading.unit;
  const activePlates = sortPlateInventory(draftSettings.plateLoading.plates[unit]);
  const customBarWeight = draftSettings.plateLoading.customBarbellWeight;
  const customBarError =
    draftSettings.plateLoading.barbellPreset === "custom" &&
    (!customBarWeight || customBarWeight <= 0)
      ? "Enter a positive bar weight before using a custom bar."
      : null;

  const updatePlateLoading = (
    updater: (plateLoading: UserSettings["plateLoading"]) => UserSettings["plateLoading"]
  ) => {
    onUpdateDraft((current) => ({
      ...current,
      plateLoading: updater(current.plateLoading),
    }));
  };

  const updatePlateCount = (size: number, count: number) => {
    const nextCount = Number.isFinite(count)
      ? Math.max(0, Math.min(100, Math.floor(count)))
      : 0;

    updatePlateLoading((plateLoading) => ({
      ...plateLoading,
      plates: {
        ...plateLoading.plates,
        [unit]: sortPlateInventory(
          plateLoading.plates[unit].map((plate) =>
            plate.size === size
              ? { ...plate, count: nextCount }
              : plate
          )
        ),
      },
    }));
  };

  const handleAddCustomPlate = () => {
    const size = parsePositiveNumber(customPlateSize);
    const existingPlate = activePlates.find((plate) => plate.size === size);

    if (!size) {
      setCustomPlateError("Enter a positive plate size.");
      return;
    }

    if (existingPlate) {
      setCustomPlateError("That plate size already exists. Update its count above.");
      return;
    }

    updatePlateLoading((plateLoading) => {
      const existingPlates = plateLoading.plates[unit];
      const nextPlates = [...existingPlates, { count: 2, size }];

      return {
        ...plateLoading,
        plates: {
          ...plateLoading.plates,
          [unit]: sortPlateInventory(nextPlates),
        },
      };
    });
    setCustomPlateSize("");
    setCustomPlateError(null);
  };

  const handleRemovePlate = (size: number) => {
    updatePlateLoading((plateLoading) => ({
      ...plateLoading,
      plates: {
        ...plateLoading.plates,
        [unit]: plateLoading.plates[unit].filter((plate) => plate.size !== size),
      },
    }));
  };

  return (
    <SectionAccordion
      icon={<CircleDot size={18} />}
      title="Plate Loading"
      id="plate-loading"
    >
      <p className={styles.focusDescription}>
        Save the bar and plates you normally train with so the workout calculator
        can open ready to load the next set.
      </p>

      <div className={styles.plateControlGroup}>
        <span>Loading unit</span>
        <div className={styles.segmentedControl}>
          {plateLoadingUnitOptions.map((option) => (
            <button
              key={option.value}
              aria-pressed={unit === option.value}
              type="button"
              onClick={() =>
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  unit: option.value,
                }))
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.plateControlGroup}>
        <span>Barbell</span>
        <div className={styles.barbellPresetGrid}>
          {barbellPresetOptions.map((option) => (
            <button
              key={option.value}
              aria-pressed={draftSettings.plateLoading.barbellPreset === option.value}
              type="button"
              onClick={() =>
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  barbellPreset: option.value,
                }))
              }
            >
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </div>

      {draftSettings.plateLoading.barbellPreset === "custom" ? (
        <div className={styles.validationGroup}>
          <FormField label={`Custom bar weight (${unit})`}>
            <TextInput
              min="1"
              step={unit === "kg" ? "0.5" : "1"}
              type="number"
              value={toNumberInputValue(
                draftSettings.plateLoading.customBarbellWeight
              )}
              onChange={(event) => {
                const nextValue = parsePositiveNumber(event.target.value);
                updatePlateLoading((plateLoading) => ({
                  ...plateLoading,
                  customBarbellWeight: nextValue,
                }));
              }}
            />
          </FormField>
          {customBarError ? (
            <p className={styles.inputError}>{customBarError}</p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.plateInventoryHeader}>
        <div>
          <strong>Plate inventory</strong>
          <span>Total plates on hand</span>
        </div>
        <span>{unit}</span>
      </div>

      <div className={styles.plateInventoryList}>
        {activePlates.length > 0 ? (
          activePlates.map((plate) => (
            <div key={`${unit}-${plate.size}`} className={styles.plateInventoryRow}>
              <div>
                <strong>
                  {plate.size}
                  {unit}
                </strong>
                <span>{Math.floor(plate.count / 2)} balanced pairs</span>
              </div>
              <div className={styles.plateStepper}>
                <button
                  aria-label={`Remove one ${plate.size}${unit} plate`}
                  type="button"
                  onClick={() => updatePlateCount(plate.size, plate.count - 1)}
                >
                  <Minus size={16} />
                </button>
                <input
                  min="0"
                  max="100"
                  step="1"
                  type="number"
                  value={plate.count}
                  aria-label={`${plate.size}${unit} plate count`}
                  onChange={(event) =>
                    updatePlateCount(plate.size, Number(event.target.value))
                  }
                />
                <button
                  aria-label={`Add one ${plate.size}${unit} plate`}
                  type="button"
                  onClick={() => updatePlateCount(plate.size, plate.count + 1)}
                >
                  <Plus size={16} />
                </button>
                <button
                  className={styles.removePlateButton}
                  type="button"
                  onClick={() => handleRemovePlate(plate.size)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.plateEmptyState}>
            No {unit} plates saved yet. Add your first plate below.
          </p>
        )}
      </div>

      <div className={styles.customPlateRow}>
        <FormField label={`Add custom ${unit} plate`}>
          <TextInput
            min="0"
            step={unit === "kg" ? "0.25" : "0.5"}
            type="number"
            value={customPlateSize}
            onChange={(event) => {
              setCustomPlateSize(event.target.value);
              setCustomPlateError(null);
            }}
          />
        </FormField>
        <Button
          label="Add plate"
          size="medium"
          tone="secondary"
          variant="outline"
          onClick={handleAddCustomPlate}
        />
      </div>
      {customPlateError ? (
        <p className={styles.inputError}>{customPlateError}</p>
      ) : null}
    </SectionAccordion>
  );
};
