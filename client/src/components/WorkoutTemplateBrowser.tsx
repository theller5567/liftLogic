import { useMemo, useState } from "react";

import type { OnboardingAnswers } from "../../../shared/types/onboarding.types";
import {
  getRankedWorkoutTemplateRecommendations,
  getTemplateGoal,
} from "../../../shared/utils/workoutTemplateRecommendations";
import "../styles/components/onboarding.scss";

type WorkoutTemplateBrowserProps = {
  answers: OnboardingAnswers;
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId?: string;
};

const goalLabels = {
  hybrid: "Muscle + strength",
  hypertrophy: "Muscle",
  strength: "Strength",
} as const;

const WorkoutTemplateBrowser = ({
  answers,
  onSelectTemplate,
  selectedTemplateId,
}: WorkoutTemplateBrowserProps) => {
  const [goalFilter, setGoalFilter] = useState<"all" | keyof typeof goalLabels>("all");
  const [levelFilter, setLevelFilter] = useState<
    "all" | "beginner" | "intermediate" | "advanced"
  >("all");
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
            setGoalFilter(event.currentTarget.value as typeof goalFilter)
          }
        >
          <option value="all">All goals</option>
          <option value="hypertrophy">Muscle</option>
          <option value="strength">Strength</option>
          <option value="hybrid">Muscle + strength</option>
        </select>
        <select
          aria-label="Filter by experience"
          value={levelFilter}
          onChange={(event) =>
            setLevelFilter(event.currentTarget.value as typeof levelFilter)
          }
        >
          <option value="all">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="workout-template-list">
        {filteredRecommendations.map(
          ({ isRecommended, matchReasons, tags, template, warnings }) => {
            const isSelected = selectedTemplateId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                className={`workout-template-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <span className="workout-template-card-topline">
                  <span>{template.daysRequired} days</span>
                  <span>{template.experienceLevel}</span>
                  {isRecommended ? <span>Best match</span> : null}
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
                <span className="workout-template-reasons">
                  {matchReasons.slice(0, 3).map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </span>
                {warnings.length > 0 ? (
                  <span className="workout-template-warnings">
                    {warnings.map((warning) => (
                      <span key={warning}>{warning}</span>
                    ))}
                  </span>
                ) : null}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplateBrowser;
