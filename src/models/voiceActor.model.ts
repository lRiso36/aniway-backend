import mongoose, { Schema } from 'mongoose';

export interface VoiceActor {
  anilistId: number;
  name: string;
  image?: string;
}

const voiceActorSchema = new Schema<VoiceActor>({
  anilistId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
});

const VoiceActorModel = mongoose.model<VoiceActor>(
  'VoiceActor',
  voiceActorSchema
);

export default VoiceActorModel;
