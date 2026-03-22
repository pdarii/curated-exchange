import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { Pet, Breed } from '../models/domain';
import { EventsGateway } from '../events/events.gateway';
import petDictionary from '../config/pet-dictionary.json';

@Injectable()
export class PetsService {
  private readonly breeds: Map<string, Breed>;

  constructor(
    @Inject('FIRESTORE') private firestore: admin.firestore.Firestore,
    private eventsGateway: EventsGateway,
  ) {
    this.breeds = new Map((petDictionary as any).map((b: Breed) => [b.name, b]));
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePetLifecycle() {
    const petsCol = this.firestore.collection('pets');
    const snapshot = await petsCol.get();
    
    const batch = this.firestore.batch();
    const updatedPets: any[] = [];

    snapshot.forEach((doc) => {
      try {
        const pet = doc.data() as Pet;
        
        // Ensure required fields exist for calculation
        if (!pet.lifespan || !pet.basePrice || pet.desirability === undefined) {
          console.warn(`Pet ${pet.id} is missing core fields, skipping update.`);
          return;
        }

        // 1. Age increases
        pet.age = +(pet.age + 0.01).toFixed(3);
        
        // 2. Health fluctuations ±5%
        const healthDelta = (Math.random() - 0.5) * 10;
        pet.health = Math.min(100, Math.max(0, pet.health + healthDelta));
        
        // 3. Check expiration
        pet.expired = pet.age >= pet.lifespan;
        
        // 4. Recalculate intrinsic value
        pet.intrinsicValue = pet.expired ? 0 : this.calculateIntrinsicValue(pet);

        batch.update(doc.ref, {
          age: pet.age,
          health: pet.health,
          expired: pet.expired,
          intrinsicValue: pet.intrinsicValue,
        });

        updatedPets.push({
          id: pet.id,
          age: pet.age,
          health: pet.health,
          intrinsicValue: pet.intrinsicValue,
          expired: pet.expired,
        });
      } catch (err) {
        console.error(`Error updating pet ${doc.id}:`, err);
      }
    });

    await batch.commit();

    // 5. Broadcast updates via WebSocket
    this.eventsGateway.broadcast('pet_stats_update', {
      type: 'pet_stats_update',
      pets: updatedPets,
    });
  }

  private calculateIntrinsicValue(pet: Pet): number {
    const ageFactor = Math.max(0, 1 - pet.age / pet.lifespan);
    return +(pet.basePrice * (pet.health / 100) * (pet.desirability / 10) * ageFactor).toFixed(2);
  }

  async getPet(id: string): Promise<Pet | null> {
    const doc = await this.firestore.collection('pets').doc(id).get();
    return doc.exists ? (doc.data() as Pet) : null;
  }

  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    const snapshot = await this.firestore.collection('pets').where('ownerId', '==', ownerId).get();
    const pets: Pet[] = [];
    snapshot.forEach((doc) => pets.push(doc.data() as Pet));
    return pets;
  }
}
