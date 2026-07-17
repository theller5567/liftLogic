import Button from "../components/Button";
import Pill from "../components/Pill";
import styles from "../styles/pages/design.module.scss";

type ButtonPreview = {
  disabled?: boolean;
  rounded?: boolean;
  size: "small" | "medium" | "large";
  variant?: "outline" | "ghost";
};

type ButtonGroup = {
  tone: "primary" | "white" | "gray" | "black" | "secondary" | "danger";
  variants: ButtonPreview[];
};

const colorTokens = [
  { label: "Primary", value: "var(--clr-primary-500)" },
  { label: "Secondary", value: "var(--clr-secondary-500)" },
  { label: "Page", value: "var(--surface-page)" },
  { label: "Panel", value: "var(--surface-panel)" },
  { label: "Neutral 0", value: "var(--clr-neutral-0)" },
  { label: "Neutral 700", value: "var(--clr-neutral-700)" },
];

const typeSamples = [
  { label: "Display", className: styles.typeDisplay },
  { label: "Heading", className: styles.typeHeading },
  { label: "Body", className: styles.typeBody },
  { label: "Meta", className: styles.typeMeta },
];

const buttonGroups: ButtonGroup[] = [
  {
    tone: "primary",
    variants: [
      { size: "large" },
      { size: "medium" },
      { size: "small" },
      { size: "medium", variant: "outline" },
    ],
  },
  {
    tone: "secondary",
    variants: [
      { size: "large" },
      { size: "medium" },
      { size: "small" },
      { size: "medium", variant: "outline" },
    ],
  },
  {
    tone: "black",
    variants: [
      { size: "large" },
      { size: "medium" },
      { size: "small" },
      { size: "medium", variant: "ghost" },
    ],
  },
  {
    tone: "gray",
    variants: [
      { size: "large", disabled: true },
      { size: "medium", disabled: true },
      { size: "small", disabled: true },
    ],
  },
  {
    tone: "danger",
    variants: [
      { size: "large" },
      { size: "medium" },
      { size: "small" },
      { size: "medium", variant: "outline" },
      { size: "medium", variant: "ghost" },
    ],
  },
];

const Design = () => (
  <section className={styles.designPage}>
    <header className={styles.hero}>
      <p>LiftLogic UI</p>
      <h1>Design System Reference</h1>
      <span>Reusable tokens, controls, cards, and workout states.</span>
    </header>

    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>Foundations</p>
        <h2>Color Tokens</h2>
      </div>
      <div className={styles.swatchGrid}>
        {colorTokens.map((token) => (
          <article key={token.label} className={styles.swatch}>
            <span style={{ background: token.value }} />
            <strong>{token.label}</strong>
            <code>{token.value}</code>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>Foundations</p>
        <h2>Typography</h2>
      </div>
      <div className={styles.typeStack}>
        {typeSamples.map((sample) => (
          <article key={sample.label}>
            <span>{sample.label}</span>
            <p className={sample.className}>Upper Body Strength Session</p>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>Controls</p>
        <h2>Buttons</h2>
      </div>
      <div className={styles.buttonMatrix}>
        {buttonGroups.map((group) => (
          <div key={group.tone} className={styles.buttonColumn}>
            <h3>{group.tone}</h3>
            {group.variants.map(({ variant, size, disabled, rounded }) => (
              <Button
                key={`${group.tone}-${variant ?? "solid"}-${size}`}
                label={disabled ? "Disabled" : "Action"}
                tone={group.tone}
                variant={variant}
                rounded={rounded}
                size={size}
                disabled={disabled}
              />
            ))}
          </div>
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>Components</p>
        <h2>Pills And Status Dots</h2>
      </div>
      <div className={styles.componentRow}>
        <Pill label="Active" state="active" />
        <Pill label="Completed" state="completed" />
        <Pill label="Inactive" state="inactive" />
        <Pill label="Muted" state="muted" />
        <span className={styles.statusCompleted}>Completed</span>
        <span className={styles.statusStarted}>Started</span>
        <span className={styles.statusEmpty}>Empty</span>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>Patterns</p>
        <h2>Cards And States</h2>
      </div>
      <div className={styles.patternGrid}>
        <article className={styles.panelPreview}>
          <p>Workout card</p>
          <h3>Upper A</h3>
          <span>100% complete. Summary ready.</span>
        </article>
        <article className={styles.emptyPreview}>
          <h3>Empty state</h3>
          <p>No workout logged for this date.</p>
        </article>
        <article className={styles.errorPreview}>
          <h3>Error state</h3>
          <p>We could not load this data yet.</p>
        </article>
      </div>
    </section>
  </section>
);

export default Design;
