import AppShell from "../components/app/AppShell";
import styles from "../styles/pages/appPlaceholder.module.scss";

const Trends = () => (
  <AppShell>
    <section className={styles.placeholder}>
      <p className={styles.eyebrow}>Trends</p>
      <h1>Progress trends are coming soon.</h1>
      <p>
        Activity, consistency, and strength graphs will be powered by workout
        logs in a later milestone.
      </p>
    </section>
  </AppShell>
);

export default Trends;
