import { Link } from "react-router-dom";
import styles from "../../styles/components/appShell.module.scss";

type AvatarProps = {
  name?: string;
  photoUrl?: string;
  linkToSettings?: boolean;
  ariaLabel?: string;
};

const getInitials = (name?: string) => {
  if (!name) {
    return "LL";
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "LL";
};

const avatarContent = (name?: string, photoUrl?: string) =>
  photoUrl ? (
    <img src={photoUrl} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span>{getInitials(name)}</span>
  );

const Avatar = ({
  ariaLabel,
  name,
  photoUrl,
  linkToSettings = false,
}: AvatarProps) =>
  linkToSettings ? (
    <Link
      to="/settings"
      className={styles.avatar}
      aria-label={ariaLabel ?? "Open settings"}
    >
      {avatarContent(name, photoUrl)}
    </Link>
  ) : (
    <div className={styles.avatar} aria-label={ariaLabel ?? (name ? `${name} avatar` : "User avatar")}>
      {avatarContent(name, photoUrl)}
    </div>
  );

export default Avatar;
