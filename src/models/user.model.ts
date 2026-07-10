import mongoose from "mongoose";
import bcrypt from 'bcrypt';

//avatar defaults to default avatar on frontend
//display name defaults to username on frotnend if empty

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        avatar: {
            type: String,
            default: '',
        },
        displayName: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const saltRounds = 10;

//should there be try catch?
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, saltRounds);
});

const User = mongoose.model('User', userSchema);

export default User;