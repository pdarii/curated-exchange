const PET_NAMES: Record<string, string> = {
  'pet-a1': 'Max',
  'pet-a2': 'Luna',
  'pet-a3': 'Bubbles',
  'pet-b1': 'Miso',
  'pet-b2': 'Rio',
  'pet-c1': 'Snoopy',
  'pet-c2': 'Cleo',
  'pet-c3': 'Kiwi',
  'pet-c4': 'Finn',
};

/**
 * Returns the best available name for a pet:
 * 1. The pet's own name from the API (if not empty)
 * 2. A hardcoded nickname by ID (for mock data)
 * 3. The fallback (typically breedName)
 */
export function getPetName(petId: string, fallback: string = 'Pet', apiName?: string): string {
  if (apiName) return apiName;
  return PET_NAMES[petId] ?? fallback;
}
