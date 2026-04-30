import AppShell from "../components/app/AppShell";
import styles from "../styles/pages/appPlaceholder.module.scss";

const Settings = () => (
  <AppShell>
    <section className={styles.placeholder}>
      <p className={styles.eyebrow}>Set Up</p>
      <h1>Settings are coming soon.</h1>
      <p>
        This page will manage profile details, units, avatar preferences, and
        the future redo-onboarding flow.
      </p>
    </section>
  </AppShell>
);

export default Settings;
