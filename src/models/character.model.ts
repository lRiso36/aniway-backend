import mongoose, { Schema } from 'mongoose';

export interface Character {
  anilistId: number;
  name: string;
  image?: string;
}

const characterSchema = new Schema<Character>({
  anilistId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
});

const CharacterModel = mongoose.model<Character>('Character', characterSchema);

export default CharacterModel;
