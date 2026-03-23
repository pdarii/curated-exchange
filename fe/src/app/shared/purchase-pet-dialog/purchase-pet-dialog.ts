import { Component, Inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Breed } from '../../models/domain';
import { getPetImage } from '../../shared/utils/pet-images';

export interface PurchasePetDialogData {
  breed: Breed;
  supply: number;
  availableCash: number;
}

export interface PurchasePetDialogResult {
  breedName: string;
  quantity: number;
}

@Component({
  selector: 'app-purchase-pet-dialog',
  imports: [CurrencyPipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './purchase-pet-dialog.html',
  styleUrl: './purchase-pet-dialog.scss',
})
export class PurchasePetDialog {
  quantity = 1;

  readonly breed: Breed;
  readonly supply: number;
  readonly availableCash: number;

  constructor(
    private dialogRef: MatDialogRef<PurchasePetDialog, PurchasePetDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: PurchasePetDialogData,
  ) {
    this.breed = data.breed;
    this.supply = data.supply;
    this.availableCash = data.availableCash;
  }

  get breedImage(): string {
    return getPetImage(this.breed.name);
  }

  get totalCost(): number {
    return this.breed.basePrice * this.quantity;
  }

  get maxQuantity(): number {
    return Math.min(this.supply, Math.floor(this.availableCash / this.breed.basePrice));
  }

  get canConfirm(): boolean {
    return this.quantity > 0 && this.quantity <= this.maxQuantity && this.totalCost <= this.availableCash;
  }

  decrement(): void {
    if (this.quantity > 1) this.quantity--;
  }

  increment(): void {
    if (this.quantity < this.maxQuantity) this.quantity++;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.canConfirm) return;
    this.dialogRef.close({ breedName: this.breed.name, quantity: this.quantity });
  }
}
