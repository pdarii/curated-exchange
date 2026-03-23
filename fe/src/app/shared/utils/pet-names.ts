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

export function getPetName(petId: string, fallback: string = 'Pet'): string {
  return PET_NAMES[petId] ?? fallback;
}
