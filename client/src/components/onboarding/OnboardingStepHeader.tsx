import type { OnboardingStep } from "./types";

type OnboardingStepHeaderProps = {
  step: OnboardingStep;
  visibleSteps: OnboardingStep[];
};

const SECTION_ORDER = [
  "Plan",
  "Goals",
  "Profile",
  "Schedule",
  "Preferences",
  "Starting Weights",
] as const;
type OnboardingSection = (typeof SECTION_ORDER)[number];

const OnboardingStepHeader = ({
  step,
  visibleSteps,
}: OnboardingStepHeaderProps) => {
  const currentSection = step.section as OnboardingSection;
  const sectionSteps = visibleSteps.filter(
    (visibleStep) => visibleStep.section === currentSection
  );
  const currentSectionStepIndex = sectionSteps.findIndex(
    (visibleStep) => visibleStep.id === step.id
  );
  const completedSections = SECTION_ORDER.filter((section) => {
    const sectionIndex = SECTION_ORDER.indexOf(section);
    const currentSectionIndex = SECTION_ORDER.indexOf(currentSection);

    return sectionIndex < currentSectionIndex;
  });
  const sectionProgressValue =
    sectionSteps.length > 0
      ? ((currentSectionStepIndex + 1) / sectionSteps.length) * 100
      : 0;

  return (
    <div className="onboarding-header grid gap-3">
      <div className="onboarding-progress-meta grid gap-3">
        <p className="onboarding-progress-kicker">
          Section {SECTION_ORDER.indexOf(currentSection) + 1} of {SECTION_ORDER.length}
        </p>
        <div className="onboarding-progress-topline flex justify-between flex-wrap gap-4">
          <p className="onboarding-progress-section">{currentSection}</p>
          <p className="onboarding-progress-count">
            Step {currentSectionStepIndex + 1} of {sectionSteps.length} in this section
          </p>
        </div>
        <div
          className="onboarding-progress-bar"
          aria-label={`${currentSection} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sectionProgressValue)}
          role="progressbar"
        >
          <span
            className="onboarding-progress-bar-fill"
            style={{ width: `${sectionProgressValue}%` }}
          />
        </div>
        <div className="onboarding-section-pills flex flex-wrap" aria-label="Onboarding sections">
          {SECTION_ORDER.map((section) => {
            const isCurrent = section === currentSection;
            const isComplete = completedSections.includes(section);

            return (
              <span
                key={section}
                className={`onboarding-section-pill ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`}
              >
                {section}
              </span>
            );
          })}
        </div>
      </div>
      <h2>{step.title}</h2>
      {"body" in step && step.body ? <p>{step.body}</p> : null}
    </div>
  );
};

export default OnboardingStepHeader;
