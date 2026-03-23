import { Component, Inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { getPetImage } from '../../shared/utils/pet-images';

export interface BidOffer {
  bidderName: string;
  amount: number;
  timeAgo: string;
}

export interface AcceptBidDialogData {
  petName: string;
  petBreed: string;
  petHealth: number;
  petAge: number;
  intrinsicValue: number;
  highestBid: BidOffer;
  otherOffers: BidOffer[];
  listingId: string;
}

export interface AcceptBidDialogResult {
  action: 'accept' | 'reject';
  listingId: string;
  bidderName: string;
  amount: number;
}

@Component({
  selector: 'app-accept-bid-dialog',
  imports: [CurrencyPipe, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './accept-bid-dialog.html',
  styleUrl: './accept-bid-dialog.scss',
})
export class AcceptBidDialog {
  showOtherOffers = false;

  readonly petName: string;
  readonly petBreed: string;
  readonly petHealth: number;
  readonly petAge: number;
  readonly intrinsicValue: number;
  readonly highestBid: BidOffer;
  readonly otherOffers: BidOffer[];
  readonly listingId: string;

  readonly marketPremium: number;
  readonly projectedGain: number;
  readonly returnPct: number;

  constructor(
    private dialogRef: MatDialogRef<AcceptBidDialog, AcceptBidDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: AcceptBidDialogData,
  ) {
    this.petName = data.petName;
    this.petBreed = data.petBreed;
    this.petHealth = data.petHealth;
    this.petAge = data.petAge;
    this.intrinsicValue = data.intrinsicValue;
    this.highestBid = data.highestBid;
    this.otherOffers = data.otherOffers;
    this.listingId = data.listingId;

    this.marketPremium = +(data.highestBid.amount - data.intrinsicValue).toFixed(2);
    this.projectedGain = this.marketPremium;
    this.returnPct = data.intrinsicValue > 0
      ? +((this.marketPremium / data.intrinsicValue) * 100).toFixed(1)
      : 0;
  }

  get petImage(): string {
    return getPetImage(this.petBreed);
  }

  toggleOffers(): void {
    this.showOtherOffers = !this.showOtherOffers;
  }

  accept(): void {
    this.dialogRef.close({
      action: 'accept',
      listingId: this.listingId,
      bidderName: this.highestBid.bidderName,
      amount: this.highestBid.amount,
    });
  }

  reject(): void {
    this.dialogRef.close({
      action: 'reject',
      listingId: this.listingId,
      bidderName: this.highestBid.bidderName,
      amount: this.highestBid.amount,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
