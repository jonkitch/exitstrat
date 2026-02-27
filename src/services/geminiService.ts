import { Fund } from "../constants";

export async function fetchTopFunds(): Promise<Fund[]> {
  try {
    const response = await fetch("/.netlify/functions/fetch-funds");
    if (!response.ok) {
      return [];
    }
    const funds: Fund[] = await response.json();
    return funds;
  } catch (error) {
    console.error("Error fetching funds:", error);
  }
  return [];
}
