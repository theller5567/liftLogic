import { useMemo, useState } from "react";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import {
  getRankedWorkoutTemplateRecommendations,
  getTemplateGoal,
  type WorkoutGoal,
} from "../../../shared/utils/workoutTemplateRecommendations";
import "../styles/components/onboarding.scss";

type WorkoutTemplateBrowserProps = {
  answers: OnboardingAnswers;
  disabled?: boolean;
  onSelectTemplate: (templateId: string) => void;
  pendingTemplateId?: string | null;
  selectedTemplateId?: string;
};

type GoalFilter = "all" | WorkoutGoal;
type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

const goalFilterOptions: Array<{ label: string; value: GoalFilter }> = [
  { label: "All goals", value: "all" },
  { label: "Muscle", value: "hypertrophy" },
  { label: "Strength", value: "strength" },
  { label: "Muscle + strength", value: "hybrid" },
];

const levelFilterOptions: Array<{ label: string; value: LevelFilter }> = [
  { label: "All levels", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const WorkoutTemplateBrowser = ({
  answers,
  disabled = false,
  onSelectTemplate,
  pendingTemplateId,
  selectedTemplateId,
}: WorkoutTemplateBrowserProps) => {
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [query, setQuery] = useState("");
  const recommendations = useMemo(
    () => getRankedWorkoutTemplateRecommendations(answers),
    [answers]
  );
  const filteredRecommendations = recommendations.filter(({ template }) => {
    const goal = getTemplateGoal(template);
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${template.name} ${template.description} ${template.focus} ${template.primaryGoal}`
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesGoal = goalFilter === "all" || goal === goalFilter;
    const matchesLevel =
      levelFilter === "all" || template.experienceLevel === levelFilter;

    return matchesQuery && matchesGoal && matchesLevel;
  });

  return (
    <div className="workout-template-browser">
      <div className="workout-template-filters">
        <input
          aria-label="Search plans"
          placeholder="Search plans"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <select
          aria-label="Filter by goal"
          value={goalFilter}
          onChange={(event) =>
            setGoalFilter(event.currentTarget.value as GoalFilter)
          }
        >
          {goalFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by experience"
          value={levelFilter}
          onChange={(event) =>
            setLevelFilter(event.currentTarget.value as LevelFilter)
          }
        >
          {levelFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="workout-template-list">
        {filteredRecommendations.map(
          ({ explanation, isRecommended, tags, template }) => {
            const isSelected = selectedTemplateId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                className={`workout-template-card ${isSelected ? "is-selected" : ""}`}
                disabled={disabled}
                onClick={() => onSelectTemplate(template.id)}
              >
                <span className="workout-template-card-topline">
                  <span>{template.daysRequired} days</span>
                  <span>{template.experienceLevel}</span>
                  {isRecommended ? <span>Best match</span> : null}
                  {pendingTemplateId === template.id ? (
                    <span>Updating...</span>
                  ) : null}
                </span>
                <strong>{template.name}</strong>
                <span>{template.description}</span>
                <span className="workout-template-focus">{template.focus}</span>
                <span className="workout-template-tags">
                  {tags.slice(0, 5).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
                <span className="workout-template-week">
                  {template.workoutDays.map((day) => (
                    <span key={`${template.id}-${day.day}`}>
                      Day {day.day}: {day.label}
                    </span>
                  ))}
                </span>
                <span className="workout-template-explanation">
                  {explanation.whyThisPlan.length > 0 ? (
                    <span>
                      <strong>Why this plan</strong>
                      {explanation.whyThisPlan.slice(0, 3).map((reason) => (
                        <small key={reason}>{reason}</small>
                      ))}
                    </span>
                  ) : null}
                  {explanation.tradeoffs.length > 0 ? (
                    <span>
                      <strong>Tradeoffs</strong>
                      {explanation.tradeoffs.slice(0, 2).map((tradeoff) => (
                        <small key={tradeoff}>{tradeoff}</small>
                      ))}
                    </span>
                  ) : null}
                  {explanation.thingsToCheck.length > 0 ? (
                    <span className="is-warning">
                      <strong>Things to check</strong>
                      {explanation.thingsToCheck.slice(0, 2).map((warning) => (
                        <small key={warning}>{warning}</small>
                      ))}
                    </span>
                  ) : null}
                  {explanation.suggestedSubstitutions.length > 0 ? (
                    <span className="is-substitution">
                      <strong>Suggested substitutions</strong>
                      {explanation.suggestedSubstitutions
                        .slice(0, 2)
                        .map((suggestion) => (
                          <small key={suggestion}>{suggestion}</small>
                        ))}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplateBrowser;
