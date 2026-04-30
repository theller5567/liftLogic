import AppShell from "../components/app/AppShell";
import styles from "../styles/pages/appPlaceholder.module.scss";

const Calendar = () => (
  <AppShell>
    <section className={styles.placeholder}>
      <p className={styles.eyebrow}>Calendar</p>
      <h1>Workout calendar is coming next.</h1>
      <p>
        This view will show planned sessions, completed days, and workout logs
        once logging data exists.
      </p>
    </section>
  </AppShell>
);

export default Calendar;
