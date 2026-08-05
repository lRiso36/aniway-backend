import mongoose, { Schema } from 'mongoose';

export interface Studio {
  anilistId: number;
  name: string;
}

const studioSchema = new Schema<Studio>({
  anilistId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
});

const StudioModel = mongoose.model<Studio>('Studio', studioSchema);

export default StudioModel;
