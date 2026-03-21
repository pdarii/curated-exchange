import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, MatIconModule, MatProgressBarModule, MatButtonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  readonly stats = {
    totalVolume: 1248500,
    avgTradePrice: 4120,
    activeListings: 842,
    systemUptime: 99.9,
  };

  readonly activityFeed = [
    { avatar: 'A', color: '#004d99', text: 'Trader A submitted a bid on <b>Persian Elite</b>', time: '2 minutes ago', tag: 'Pending Bid', tagColor: '#f89c00', amount: 1150 },
    { avatar: 'B', color: '#f89c00', text: 'Trader B listed a <b>Bengal Club</b> for trade', time: '14 minutes ago', tag: null, tagColor: null, amount: null },
    { avatar: '', color: '#727783', text: 'Trader C completed identity verification', time: '1 hour ago', tag: 'KYC Cleared', tagColor: '#007367', amount: null },
    { avatar: 'A', color: '#004d99', text: 'Trader A cancelled bid on <b>Husky Pups</b>', time: '3 hours ago', tag: null, tagColor: null, amount: null },
  ];
}
