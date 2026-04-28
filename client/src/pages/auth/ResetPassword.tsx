import { Link } from "react-router-dom";

import styles from "../../styles/pages/auth.module.scss";

const ResetPassword = () => {
  return (
    <section className={styles.authShell}>
      <div className={styles.splash}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Password reset</p>
          <h1 className={styles.title}>Google sign-in does not need a LiftLogic password.</h1>
          <p className={styles.body}>
            Email and password login will arrive later. For now, use Google to access your account.
          </p>
        </div>
        <Link className="text-secondary" to="/">
          Return to sign in
        </Link>
      </div>
    </section>
  );
};

export default ResetPassword;
