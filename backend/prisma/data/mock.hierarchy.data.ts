// prisma/data/mock.hierarchy.data.ts
// Shared location hierarchy (Region > Province > City/Municipality) reused
// as the HIERARCHY_SELECT field's tree across every benefit in the factory.

export interface HierarchyNodeDef {
  value: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  children?: HierarchyNodeDef[];
}

export interface HierarchyLevelDef {
  level: number;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

export const locationHierarchy: {
  englishName: string;
  tagalogName: string;
  levels: HierarchyLevelDef[];
  nodes: HierarchyNodeDef[];
} = {
  englishName: "Location",
  tagalogName: "Lokasyon",
  levels: [
    {
      level: 1,
      englishName: "Region",
      tagalogName: "Rehiyon",
      englishDescription: "Top-level administrative region.",
      tagalogDescription: "Pinakamataas na antas ng administratibong rehiyon.",
    },
    {
      level: 2,
      englishName: "Province",
      tagalogName: "Lalawigan",
      englishDescription: "Province within a region.",
      tagalogDescription: "Lalawigan sa loob ng isang rehiyon.",
    },
    {
      level: 3,
      englishName: "City / Municipality",
      tagalogName: "Lungsod / Bayan",
      englishDescription: "City or municipality within a province.",
      tagalogDescription: "Lungsod o bayan sa loob ng isang lalawigan.",
    },
  ],
  nodes: [
    {
      value: "NCR",
      englishName: "National Capital Region",
      tagalogName: "Pambansang Punong Rehiyon",
      englishDescription: "Metro Manila region.",
      tagalogDescription: "Rehiyon ng Metro Manila.",
      children: [
        {
          value: "MANILA",
          englishName: "Manila",
          tagalogName: "Maynila",
          englishDescription: "City of Manila.",
          tagalogDescription: "Lungsod ng Maynila.",
          children: [
            {
              value: "ERMITA",
              englishName: "Ermita",
              tagalogName: "Ermita",
              englishDescription: "Ermita, Manila.",
              tagalogDescription: "Ermita, Maynila.",
            },
            {
              value: "TONDO",
              englishName: "Tondo",
              tagalogName: "Tondo",
              englishDescription: "Tondo, Manila.",
              tagalogDescription: "Tondo, Maynila.",
            },
          ],
        },
        {
          value: "QUEZON_CITY",
          englishName: "Quezon City",
          tagalogName: "Lungsod Quezon",
          englishDescription: "Quezon City.",
          tagalogDescription: "Lungsod Quezon.",
          children: [
            {
              value: "DILIMAN",
              englishName: "Diliman",
              tagalogName: "Diliman",
              englishDescription: "Diliman, Quezon City.",
              tagalogDescription: "Diliman, Lungsod Quezon.",
            },
          ],
        },
      ],
    },
    {
      value: "REGION_IV_A",
      englishName: "CALABARZON",
      tagalogName: "CALABARZON",
      englishDescription: "Region IV-A.",
      tagalogDescription: "Rehiyon IV-A.",
      children: [
        {
          value: "CAVITE",
          englishName: "Cavite",
          tagalogName: "Cavite",
          englishDescription: "Province of Cavite.",
          tagalogDescription: "Lalawigan ng Cavite.",
          children: [
            {
              value: "DASMARINAS",
              englishName: "Dasmariñas",
              tagalogName: "Dasmariñas",
              englishDescription: "City of Dasmariñas, Cavite.",
              tagalogDescription: "Lungsod ng Dasmariñas, Cavite.",
            },
          ],
        },
      ],
    },
  ],
};
