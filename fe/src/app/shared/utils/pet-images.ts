const BREED_IMAGES: Record<string, string> = {
  Labrador: 'images/pets/labrador.jpg',
  Beagle: 'images/pets/beagle.jpg',
  Poodle: 'images/pets/poodle.jpg',
  Bulldog: 'images/pets/bulldog.jpg',
  'Pit Bull': 'images/pets/pitbull.jpg',
  Siamese: 'images/pets/siamese.jpg',
  Persian: 'images/pets/persian.jpg',
  'Maine Coon': 'images/pets/maine-coon.jpg',
  Bengal: 'images/pets/bengal.jpg',
  Sphynx: 'images/pets/sphynx.jpg',
  Parakeet: 'images/pets/parakeet.jpg',
  Canary: 'images/pets/canary.jpg',
  Cockatiel: 'images/pets/cockatiel.jpg',
  Macaw: 'images/pets/macaw.jpg',
  Lovebird: 'images/pets/lovebird.jpg',
  Goldfish: 'images/pets/goldfish.jpg',
  Betta: 'images/pets/betta.jpg',
  Guppy: 'images/pets/guppy.jpg',
  Angelfish: 'images/pets/angelfish.jpg',
  Clownfish: 'images/pets/clownfish.jpg',
};

export function getPetImage(breedName: string): string {
  return BREED_IMAGES[breedName] ?? 'images/pets/labrador.jpg';
}
