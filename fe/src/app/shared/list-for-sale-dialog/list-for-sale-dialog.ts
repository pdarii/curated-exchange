import { Component, Inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Pet } from '../../models/domain';

export interface ListForSaleDialogData {
  pet: Pet | null;
  pets: Pet[];
}

export interface ListForSaleDialogResult {
  petId: string;
  askingPrice: number;
}

@Component({
  selector: 'app-list-for-sale-dialog',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './list-for-sale-dialog.html',
  styleUrl: './list-for-sale-dialog.scss',
})
export class ListForSaleDialog {
  selectedPetId: string;
  askingPrice: number;
  readonly petLocked: boolean;
  readonly pets: Pet[];

  constructor(
    private dialogRef: MatDialogRef<ListForSaleDialog, ListForSaleDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ListForSaleDialogData,
  ) {
    this.pets = data.pets;
    this.petLocked = !!data.pet;
    this.selectedPetId = data.pet?.id ?? (data.pets[0]?.id ?? '');
    this.askingPrice = this.selectedPet?.intrinsicValue ?? 0;
  }

  get selectedPet(): Pet | undefined {
    return this.pets.find((p) => p.id === this.selectedPetId);
  }

  onPetChange(): void {
    this.askingPrice = this.selectedPet?.intrinsicValue ?? 0;
  }

  private readonly PET_NAMES: Record<string, string> = {
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

  petLabel(pet: Pet): string {
    const name = this.PET_NAMES[pet.id] ?? pet.breedName;
    return `${name} (${pet.breedName})`;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.selectedPetId || this.askingPrice <= 0) return;
    this.dialogRef.close({
      petId: this.selectedPetId,
      askingPrice: this.askingPrice,
    });
  }
}
