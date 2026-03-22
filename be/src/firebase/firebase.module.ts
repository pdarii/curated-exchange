import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
        if (!admin.apps.length) {
          return admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
          });
        }
        return admin.app();
      },
    },
    {
      provide: 'FIRESTORE',
      useFactory: (app: admin.app.App) => {
        const db = app.firestore();
        db.settings({ ignoreUndefinedProperties: true });
        return db;
      },
      inject: ['FIREBASE_ADMIN'],
    },
  ],
  exports: ['FIRESTORE', 'FIREBASE_ADMIN'],
})
export class FirebaseModule {}
