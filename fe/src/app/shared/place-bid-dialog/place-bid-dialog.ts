import { Component, Inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { getPetImage } from '../../shared/utils/pet-images';

export interface PlaceBidDialogData {
  petBreed: string;
  seller: string;
  askingPrice: number;
  intrinsicValue: number;
  currentHighestBid: number;
  availableCash: number;
  listingId: string;
  previousBid?: number;
}

export interface PlaceBidDialogResult {
  listingId: string;
  amount: number;
}

@Component({
  selector: 'app-place-bid-dialog',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './place-bid-dialog.html',
  styleUrl: './place-bid-dialog.scss',
})
export class PlaceBidDialog {
  bidAmount = 0;
  isUpdate = false;

  readonly petBreed: string;
  readonly seller: string;
  readonly askingPrice: number;
  readonly intrinsicValue: number;
  readonly currentHighestBid: number;
  readonly availableCash: number;
  readonly listingId: string;

  constructor(
    private dialogRef: MatDialogRef<PlaceBidDialog, PlaceBidDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: PlaceBidDialogData,
  ) {
    this.petBreed = data.petBreed;
    this.seller = data.seller;
    this.askingPrice = data.askingPrice;
    this.intrinsicValue = data.intrinsicValue;
    this.currentHighestBid = data.currentHighestBid;
    this.availableCash = data.availableCash;
    this.listingId = data.listingId;
    this.bidAmount = data.previousBid ?? 0;
    this.isUpdate = !!data.previousBid;
  }

  get petImage(): string {
    return getPetImage(this.petBreed);
  }

  get insufficientFunds(): boolean {
    return this.bidAmount > this.availableCash;
  }

  get bidTooLow(): boolean {
    return this.bidAmount > 0 && this.bidAmount <= this.currentHighestBid;
  }

  get canConfirm(): boolean {
    return this.bidAmount > 0 && !this.insufficientFunds;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.canConfirm) return;
    this.dialogRef.close({
      listingId: this.listingId,
      amount: this.bidAmount,
    });
  }
}
