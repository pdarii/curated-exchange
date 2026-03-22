import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Auth,
  user,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@angular/fire/auth';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import { from, of, Observable, Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { Trader, TraderPortfolio, Notification as DomainNotification } from '../models/domain';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private apiService = inject(ApiService);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private readonly currentUser = signal<Trader | null>(null);
  private readonly currentPortfolio = signal<TraderPortfolio | null>(null);
  private readonly currentNotifications = signal<DomainNotification[]>([]);
  private readonly isInitialized = signal<boolean>(false);
  readonly user$ = user(this.auth);
  readonly user = this.currentUser.asReadonly();
  readonly portfolio = this.currentPortfolio.asReadonly();
  readonly notifications = this.currentNotifications.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly authInitialized = this.isInitialized.asReadonly();

  private socketSubscription?: Subscription;

  constructor() {
    // Listen to Firebase auth changes
    this.user$.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(fbUser => {
        if (fbUser) {
          // Reset initialized state if we just logged in
          // This ensures guards wait for the new profile
          if (this.isInitialized()) {
            this.isInitialized.set(false);
          }

          // Connect socket when user is available
          this.socketService.connect(fbUser.uid);
          this.setupSocketListeners(fbUser.uid);

          // Use 'me' endpoint to get current user portfolio securely
          return this.apiService.getMyPortfolio().pipe(
            catchError(err => {
              console.error('Failed to fetch profile', err);
              // Handle case where user exists in Firebase but not in our DB
              return of(null);
            })
          );
        }
        return of(null);
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.currentPortfolio.set(profile);
          const trader: Trader = {
            id: profile.id,
            name: profile.name,
            role: profile.role || 'trader',
            availableCash: profile.availableCash,
            lockedCash: profile.lockedCash,
            totalPortfolioValue: profile.totalPortfolioValue
          };
          this.currentUser.set(trader);
          // Fetch initial notifications
          this.apiService.getMyNotifications().pipe(
            catchError(err => {
              console.error('Failed to fetch notifications', err);
              return of([]);
            })
          ).subscribe(n => {
            this.currentNotifications.set(n);
          });
        } else {
          this.currentPortfolio.set(null);
          this.currentUser.set(null);
          this.currentNotifications.set([]);
        }
        this.isInitialized.set(true);
      },
      error: (err) => {
        console.error('Auth stream error', err);
        this.isInitialized.set(true);
      }
    });

    // Ensure initialization is set if subscription doesn't emit immediately (e.g. no user)
    // Actually user() observable from @angular/fire emits null if not logged in.
    // We add a safety timeout just in case the auth stream hangs.
    setTimeout(() => {
      if (!this.isInitialized()) {
        console.warn('Auth initialization timed out, forcing initialized state');
        this.isInitialized.set(true);
      }
    }, 5000);
  }

  async login(email: string, password: string): Promise<void> {
    this.isInitialized.set(false);
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(email: string, password: string, name: string): Promise<void> {
    this.isInitialized.set(false);
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    // Create trader profile in our backend
    await this.apiService.registerTrader(credential.user.uid, name, email).toPromise();
  }

  async logout(): Promise<void> {
    this.socketService.disconnect();
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
      this.socketSubscription = undefined;
    }
    await signOut(this.auth);
    this.currentUser.set(null);
    this.currentNotifications.set([]);
    this.router.navigate(['/login']);
  }

  addNotification(n: DomainNotification): void {
    this.currentNotifications.update(list => [n, ...list]);
  }

  private setupSocketListeners(userId: string): void {
    // Clean up previous subscription if any
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }

    this.socketSubscription = this.socketService
      .onNotification()
      .subscribe((event) => {
        if (event.notification.traderId === userId) {
          this.addNotification(event.notification);
        }
      });
  }

  refreshProfile(): void {
    this.apiService.getMyPortfolio().subscribe(profile => {
      if (profile) {
        this.currentPortfolio.set(profile);
        const trader: Trader = {
          id: profile.id,
          name: profile.name,
          role: profile.role || 'trader',
          availableCash: profile.availableCash,
          lockedCash: profile.lockedCash,
          totalPortfolioValue: profile.totalPortfolioValue
        };
        this.currentUser.set(trader);
      }
    });
  }
}
