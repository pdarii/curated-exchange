import { PetsService } from '../pets.service';

describe('PetsService', () => {
  let service: PetsService;

  beforeEach(() => {
    service = new PetsService(null, null);
  });

  describe('calculateIntrinsicValue', () => {
    it('should calculate value correctly based on the formula from PDF', () => {
      // Formula: Base Value × (Health / 100) × (Desirability / 10) × (1 - Age / Lifespan)
      const pet: any = {
        basePrice: 100,
        health: 100,
        desirability: 10,
        age: 0,
        lifespan: 10,
      };

      // @ts-ignore
      const value = service.calculateIntrinsicValue(pet);
      expect(value).toBe(100);

      const pet2: any = {
        basePrice: 100,
        health: 50,
        desirability: 5,
        age: 2,
        lifespan: 10,
      };
      // 100 * (50/100) * (5/10) * (1 - 2/10)
      // 100 * 0.5 * 0.5 * 0.8 = 20
      // @ts-ignore
      const value2 = service.calculateIntrinsicValue(pet2);
      expect(value2).toBe(20);
    });

    it('should return 0 if age >= lifespan', () => {
       const pet: any = {
        basePrice: 100,
        health: 100,
        desirability: 10,
        age: 10,
        lifespan: 10,
      };
      // @ts-ignore
      const value = service.calculateIntrinsicValue(pet);
      expect(value).toBe(0);
    });
  });
});
