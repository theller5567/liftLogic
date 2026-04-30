import AppShell from "../components/app/AppShell";
import styles from "../styles/pages/appPlaceholder.module.scss";

const Workout = () => (
  <AppShell>
    <section className={styles.placeholder}>
      <p className={styles.eyebrow}>Workout</p>
      <h1>Workout logging is coming next.</h1>
      <p>
        This screen will guide active sessions and save sets, reps, weight, and
        completion state.
      </p>
    </section>
  </AppShell>
);

export default Workout;
