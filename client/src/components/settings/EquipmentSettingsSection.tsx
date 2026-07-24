import { Dumbbell } from "lucide-react";

import type { EquipmentItemId } from "../../../../shared/constants/equipmentCatalog";
import EquipmentInventoryPicker from "../EquipmentInventoryPicker";
import SectionAccordion from "../ui/SectionAccordion";
import styles from "../../styles/pages/settings.module.scss";

type EquipmentSettingsSectionProps = {
  equipmentInventory: EquipmentItemId[];
  onEquipmentChange: (equipment: EquipmentItemId[]) => void;
};

export const EquipmentSettingsSection = ({
  equipmentInventory,
  onEquipmentChange,
}: EquipmentSettingsSectionProps) => (
  <SectionAccordion icon={<Dumbbell size={18} />} title="Equipment">
    <p className={styles.focusDescription}>
      Update the equipment you can use. Future plan recommendations and exercise
      substitutions will prefer this list.
    </p>
    <EquipmentInventoryPicker
      selectedEquipment={equipmentInventory}
      onChange={onEquipmentChange}
    />
  </SectionAccordion>
);
