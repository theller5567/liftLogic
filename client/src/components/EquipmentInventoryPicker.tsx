import {
  equipmentCatalog,
  equipmentLabelsById,
  equipmentPresetItems,
  equipmentPresetLabels,
  type EquipmentItemId,
  type EquipmentPresetId,
} from "../../../shared/constants/equipmentCatalog";

type EquipmentInventoryPickerProps = {
  selectedEquipment: EquipmentItemId[];
  onChange: (equipment: EquipmentItemId[]) => void;
};

const presetIds = Object.keys(equipmentPresetItems) as EquipmentPresetId[];

const EquipmentInventoryPicker = ({
  selectedEquipment,
  onChange,
}: EquipmentInventoryPickerProps) => {
  const selectedSet = new Set(selectedEquipment);

  const toggleEquipment = (equipmentId: EquipmentItemId) => {
    const nextEquipment = selectedSet.has(equipmentId)
      ? selectedEquipment.filter((item) => item !== equipmentId)
      : [...selectedEquipment, equipmentId];

    onChange(nextEquipment);
  };

  return (
    <div className="equipment-picker">
      <div className="equipment-picker-header">
        <strong>{selectedEquipment.length} selected</strong>
        <span>
          {selectedEquipment.length
            ? selectedEquipment.map((item) => equipmentLabelsById[item]).join(", ")
            : "Choose the equipment you can use."}
        </span>
      </div>

      <div className="equipment-preset-grid">
        {presetIds.map((presetId) => (
          <button
            key={presetId}
            type="button"
            className="equipment-preset-button"
            onClick={() => onChange(equipmentPresetItems[presetId])}
          >
            {equipmentPresetLabels[presetId]}
          </button>
        ))}
      </div>

      <div className="equipment-category-list">
        {equipmentCatalog.map((category) => (
          <section key={category.id} className="equipment-category">
            <h3>{category.label}</h3>
            <div className="equipment-item-grid">
              {category.items.map((item) => {
                const selected = selectedSet.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`equipment-item ${selected ? "is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleEquipment(item.id)}
                  >
                    <span>{item.label}</span>
                    {item.description ? <small>{item.description}</small> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default EquipmentInventoryPicker;
