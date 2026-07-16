import type { EquipmentType } from "./exercise-library";

export type EquipmentItemId =
  | "barbell"
  | "weight_plates"
  | "squat_rack"
  | "flat_bench"
  | "adjustable_bench"
  | "dumbbells"
  | "kettlebell"
  | "cable_machine"
  | "pull_up_bar"
  | "dip_station"
  | "smith_machine"
  | "leg_press"
  | "leg_curl_machine"
  | "calf_raise_machine"
  | "chest_press_machine"
  | "row_machine"
  | "lat_pulldown_machine"
  | "assisted_pull_up_machine"
  | "swiss_ball"
  | "bands"
  | "bodyweight_space";

export type EquipmentCategoryId =
  | "free_weights"
  | "racks_benches"
  | "cables"
  | "machines"
  | "bodyweight"
  | "accessories";

export type EquipmentPresetId =
  | "full_gym"
  | "home_gym"
  | "dumbbells_only"
  | "basic_equipment";

export type EquipmentCatalogItem = {
  id: EquipmentItemId;
  label: string;
  description?: string;
};

export type EquipmentCatalogCategory = {
  id: EquipmentCategoryId;
  label: string;
  items: EquipmentCatalogItem[];
};

export const equipmentCatalog: EquipmentCatalogCategory[] = [
  {
    id: "free_weights",
    label: "Free weights",
    items: [
      { id: "barbell", label: "Barbell" },
      { id: "weight_plates", label: "Weight plates" },
      { id: "dumbbells", label: "Dumbbells" },
      { id: "kettlebell", label: "Kettlebell" },
    ],
  },
  {
    id: "racks_benches",
    label: "Racks & benches",
    items: [
      { id: "squat_rack", label: "Squat rack or stands" },
      { id: "flat_bench", label: "Flat bench" },
      { id: "adjustable_bench", label: "Adjustable bench" },
    ],
  },
  {
    id: "cables",
    label: "Cables",
    items: [{ id: "cable_machine", label: "Cable or pulley machine" }],
  },
  {
    id: "machines",
    label: "Machines",
    items: [
      { id: "smith_machine", label: "Smith machine" },
      { id: "leg_press", label: "Leg press" },
      { id: "leg_curl_machine", label: "Leg curl machine" },
      { id: "calf_raise_machine", label: "Calf raise machine" },
      { id: "chest_press_machine", label: "Chest press machine" },
      { id: "row_machine", label: "Row machine" },
      { id: "lat_pulldown_machine", label: "Lat pulldown machine" },
      { id: "assisted_pull_up_machine", label: "Assisted pull-up machine" },
    ],
  },
  {
    id: "bodyweight",
    label: "Bodyweight",
    items: [
      { id: "bodyweight_space", label: "Bodyweight training space" },
      { id: "pull_up_bar", label: "Pull-up bar" },
      { id: "dip_station", label: "Dip station" },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    items: [
      { id: "bands", label: "Resistance bands" },
      { id: "swiss_ball", label: "Swiss ball" },
    ],
  },
];

export const equipmentItems = equipmentCatalog.flatMap((category) => category.items);

export const equipmentItemIds = equipmentItems.map((item) => item.id) as [
  EquipmentItemId,
  ...EquipmentItemId[],
];

export const equipmentLabelsById: Record<EquipmentItemId, string> =
  Object.fromEntries(equipmentItems.map((item) => [item.id, item.label])) as Record<
    EquipmentItemId,
    string
  >;

export const equipmentPresetLabels: Record<EquipmentPresetId, string> = {
  full_gym: "Full gym",
  home_gym: "Home gym",
  dumbbells_only: "Dumbbells only",
  basic_equipment: "Basic equipment",
};

export const equipmentPresetItems: Record<EquipmentPresetId, EquipmentItemId[]> = {
  full_gym: equipmentItems.map((item) => item.id),
  home_gym: [
    "barbell",
    "weight_plates",
    "squat_rack",
    "flat_bench",
    "adjustable_bench",
    "dumbbells",
    "kettlebell",
    "cable_machine",
    "pull_up_bar",
    "bodyweight_space",
    "bands",
  ],
  dumbbells_only: ["dumbbells", "flat_bench", "adjustable_bench", "bodyweight_space"],
  basic_equipment: [
    "bodyweight_space",
    "bands",
    "pull_up_bar",
    "flat_bench",
    "dumbbells",
  ],
};

export const fallbackEquipmentByType: Record<EquipmentType, EquipmentItemId[]> = {
  assisted_machine: ["assisted_pull_up_machine"],
  barbell: ["barbell", "weight_plates"],
  bench: ["flat_bench"],
  bodyweight: ["bodyweight_space"],
  cable: ["cable_machine"],
  dumbbell: ["dumbbells"],
  kettlebell: ["kettlebell"],
  machine: ["row_machine"],
  mixed: ["dumbbells"],
  other: ["bodyweight_space"],
  smith_machine: ["smith_machine"],
  swiss_ball: ["swiss_ball"],
};

export function getPresetEquipmentItems(
  preset: EquipmentPresetId | undefined
): EquipmentItemId[] {
  return preset ? equipmentPresetItems[preset] : equipmentPresetItems.full_gym;
}

export function normalizeEquipmentItems(
  items: EquipmentItemId[] | undefined
): EquipmentItemId[] {
  if (!items?.length) {
    return [];
  }

  const validItems = new Set(equipmentItems.map((item) => item.id));
  return [...new Set(items)].filter((item) => validItems.has(item));
}
