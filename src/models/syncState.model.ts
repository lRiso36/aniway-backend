// src/models/syncState.model.ts
import { Schema, model } from 'mongoose';

interface ISyncState {
  key: string;
  lastSyncedAt: Date | null;
}

const syncStateSchema = new Schema<ISyncState>({
  key: { type: String, required: true, unique: true },
  lastSyncedAt: { type: Date, default: null },
});

export const SyncState = model<ISyncState>('SyncState', syncStateSchema);