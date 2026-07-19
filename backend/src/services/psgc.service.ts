import axios from "axios";

const PSGC_API = "https://psgc.gitlab.io/api";

export const getPsgcLocation = async (psgcCode: string) => {
  // Ordered by specificity to find the object
  const endpoints = [
    "/barangays",
    "/cities-municipalities",
    "/provinces",
    "/districts",
    "/regions",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${PSGC_API}${endpoint}/${psgcCode}`);
      if (response.data) return response.data;
    } catch (error) {
      continue;
    }
  }
  return null;
};
