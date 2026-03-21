import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface InventoryBreed {
  name: string;
  priority: 'High' | 'Elite' | 'Mid';
  retailSupply: number;
  totalStock: number;
}

interface InjectItem {
  name: string;
  subtitle: string;
  stock: number;
  status: 'Pending' | 'Injected';
}

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, MatIconModule, MatButtonModule, MatSliderModule, MatProgressBarModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings {
  timeDilation = signal(5);
  healthFluctuation = signal(12.4);
  metabolicCurve = signal('Stable');

  readonly inventory: InventoryBreed[] = [
    { name: 'Golden Retriever', priority: 'High', retailSupply: 12, totalStock: 250 },
    { name: 'Siamese Traditional', priority: 'Elite', retailSupply: 4, totalStock: 85 },
    { name: 'French Bulldog', priority: 'Mid', retailSupply: 28, totalStock: 412 },
    { name: 'Border Collie', priority: 'High', retailSupply: 15, totalStock: 195 },
  ];

  readonly injectItems: InjectItem[] = [
    { name: 'Golden Retriever', subtitle: 'PREMIER HRN · STOCK: 12', stock: 12, status: 'Pending' },
    { name: 'Siamese Traditional', subtitle: 'PREMIER ELITE · STOCK: 4', stock: 4, status: 'Pending' },
    { name: 'French Bulldog', subtitle: 'PREMIER MID · STOCK: 28', stock: 28, status: 'Pending' },
    { name: 'Border Collie', subtitle: 'PREMIER HRN · STOCK: 8', stock: 8, status: 'Pending' },
  ];

  priorityClass(p: string): string {
    const map: Record<string, string> = { High: 'priority--high', Elite: 'priority--elite', Mid: 'priority--mid' };
    return map[p] ?? '';
  }
}
