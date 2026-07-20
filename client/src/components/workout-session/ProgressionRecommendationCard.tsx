import clsx from "clsx";

import Button from "../Button";
import type {
  ProgressiveOverloadRecommendation,
  ProgressiveOverloadState,
} from "../../utils/workoutAdvisory";
import styles from "../../styles/pages/exercisePage.module.scss";

type ProgressionRecommendationCardProps = {
  applyLoading?: boolean;
  onApply?: () => void;
  onDismiss: () => void;
  recommendation: ProgressiveOverloadRecommendation;
};

const titleByState: Record<ProgressiveOverloadState, string> = {
  no_history: "First tracked session",
  ready_to_increase: "Ready to increase",
  repeat_weight: "Repeat this weight",
  hold_steady: "Hold steady",
  reduce_or_modify: "Reduce or modify",
};

const eyebrowByState: Record<ProgressiveOverloadState, string> = {
  no_history: "Progression",
  ready_to_increase: "Progression earned",
  repeat_weight: "Technique first",
  hold_steady: "Build the base",
  reduce_or_modify: "Safety check",
};

const getStateClassName = (state: ProgressiveOverloadState) =>
  styles[`progressionCard--${state}`];

const formatWeight = (weight?: number, unit?: string) => {
  if (weight === undefined || !unit) {
    return null;
  }

  return `${weight} ${unit}`;
};

const ProgressionRecommendationCard = ({
  applyLoading = false,
  onApply,
  onDismiss,
  recommendation,
}: ProgressionRecommendationCardProps) => {
  const previousWeight = formatWeight(
    recommendation.previousWeight,
    recommendation.weightUnit
  );
  const recommendedWeight = formatWeight(
    recommendation.recommendedWeight,
    recommendation.weightUnit
  );

  return (
    <aside
      className={clsx(
        styles.progressionCard,
        getStateClassName(recommendation.state)
      )}
      aria-label="Progressive overload recommendation"
    >
      <div className={styles.progressionCardHeader}>
        <div>
          <p>{eyebrowByState[recommendation.state]}</p>
          <h2>{titleByState[recommendation.state]}</h2>
        </div>

        {recommendedWeight ? (
          <strong>{recommendedWeight}</strong>
        ) : previousWeight ? (
          <strong>{previousWeight}</strong>
        ) : null}
      </div>

      <p className={styles.progressionReason}>{recommendation.reason}</p>

      {recommendation.historySource === "previous_program" ? (
        <p className={styles.progressionContext}>
          Based on exercise history from a previous program.
        </p>
      ) : null}

      {previousWeight || recommendedWeight ? (
        <dl className={styles.progressionMeta}>
          {previousWeight ? (
            <div>
              <dt>Last time</dt>
              <dd>{previousWeight}</dd>
            </div>
          ) : null}

          {recommendedWeight ? (
            <div>
              <dt>Suggested today</dt>
              <dd>{recommendedWeight}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className={styles.progressionActions}>
        {recommendation.canApplyWeight && onApply ? (
          <Button
            label="Use recommendation"
            loading={applyLoading}
            tone="secondary"
            size="small"
            onClick={onApply}
          />
        ) : null}

        <Button
          label="Stay here"
          tone="gray"
          variant="outline"
          size="small"
          onClick={onDismiss}
        />
      </div>
    </aside>
  );
};

export default ProgressionRecommendationCard;
