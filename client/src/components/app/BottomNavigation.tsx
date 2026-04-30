import clsx from "clsx";
import { CalendarDays, Dumbbell, SlidersHorizontal, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";

import styles from "../../styles/components/appShell.module.scss";

const navItems = [
  { label: "Workouts", path: "/dashboard", icon: Dumbbell },
  { label: "Trends", path: "/trends", icon: TrendingUp },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Set Up", path: "/settings", icon: SlidersHorizontal },
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
