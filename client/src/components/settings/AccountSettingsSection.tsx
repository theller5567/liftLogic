import AccountIcon from "../../assets/icons/013-user.svg?react";
import Button from "../Button";
import SectionAccordion from "../ui/SectionAccordion";
import styles from "../../styles/pages/settings.module.scss";

type AccountSettingsSectionProps = {
  accountLabel: string;
  emailLabel: string;
  onSignOut: () => void;
};

export const AccountSettingsSection = ({
  accountLabel,
  emailLabel,
  onSignOut,
}: AccountSettingsSectionProps) => (
  <SectionAccordion icon={<AccountIcon aria-hidden="true" />} title="Account">
    <div className={styles.summaryRow}>
      <span>Name</span>
      <strong>{accountLabel}</strong>
    </div>
    <div className={styles.summaryRow}>
      <span>Email</span>
      <strong>{emailLabel}</strong>
    </div>
    <Button
      icon="exit"
      label="Sign out"
      size="large"
      tone="danger"
      variant="outline"
      onClick={onSignOut}
    />
  </SectionAccordion>
);
