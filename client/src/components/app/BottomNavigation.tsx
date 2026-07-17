import clsx from "clsx";
import { BookOpen, ClipboardList, Home, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";

import styles from "../../styles/components/appShell.module.scss";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Plan", path: "/plan", icon: ClipboardList },
  { label: "Library", path: "/exercise-library", icon: BookOpen },
  { label: "Trends", path: "/trends", icon: TrendingUp },
];

const BottomNavigation = () => (
  <nav className={styles.bottomNavigation} aria-label="Primary app navigation">
    {navItems.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.path}
          className={({ isActive }) =>
            clsx(styles.navItem, isActive && styles.navItemActive)
          }
          to={item.path}
        >
          <Icon aria-hidden="true" strokeWidth={2.7} />
          <span>{item.label}</span>
        </NavLink>
      );
    })}
  </nav>
);

export default BottomNavigation;
