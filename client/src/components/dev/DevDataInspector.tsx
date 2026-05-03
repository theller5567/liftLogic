import { Database } from "lucide-react";
import { useMemo, useState } from "react";

import BottomSheet from "../BottomSheet";
import styles from "../../styles/components/devDataInspector.module.scss";

type DevDataItem = {
  label: string;
  value: unknown;
};

type DevDataInspectorProps = {
  items: DevDataItem[];
  title?: string;
};

const stringifyData = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, itemValue) => {
      if (typeof itemValue === "function") {
        return `[Function ${itemValue.name || "anonymous"}]`;
      }

      if (itemValue instanceof Date) {
        return itemValue.toISOString();
      }

      return itemValue;
    },
    2
  );

const getDataType = (value: unknown) => {
  if (Array.isArray(value)) {
    return `array(${value.length})`;
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
};

const DevDataInspector = ({
  items,
  title = "Available page data",
}: DevDataInspectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(items[0]?.label ?? "");
  const selectedItem =
    items.find((item) => item.label === selectedLabel) ?? items[0] ?? null;
  const selectedData = useMemo(
    () => stringifyData(selectedItem?.value),
    [selectedItem]
  );

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Open dev data inspector"
        onClick={() => setIsOpen(true)}
      >
        <Database size={16} />
      </button>

      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description="Development-only view of the data available on this screen."
        variant="full"
      >
        <div className={styles.inspector}>
          <div className={styles.tabs} role="tablist" aria-label="Data sets">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={
                  item.label === selectedItem?.label
                    ? styles.tabActive
                    : styles.tab
                }
                onClick={() => setSelectedLabel(item.label)}
              >
                <span>{item.label}</span>
                <small>{getDataType(item.value)}</small>
              </button>
            ))}
          </div>

          <pre className={styles.output}>
            <code>{selectedData}</code>
          </pre>
        </div>
      </BottomSheet>
    </>
  );
};

export default DevDataInspector;
