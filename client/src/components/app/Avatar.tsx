import styles from "../../styles/components/appShell.module.scss";

type AvatarProps = {
  name?: string;
  photoUrl?: string;
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

const Avatar = ({ name, photoUrl }: AvatarProps) => (
  <div className={styles.avatar} aria-label={name ? `${name} avatar` : "User avatar"}>
    {photoUrl ? (
      <img src={photoUrl} alt="" referrerPolicy="no-referrer" />
    ) : (
      <span>{getInitials(name)}</span>
    )}
  </div>
);

export default Avatar;
