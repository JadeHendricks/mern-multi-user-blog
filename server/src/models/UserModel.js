const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    avatar: {
        type: String,
        default: 'default.jpg'
    },
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    socials: {
        facebook: {
            type: String
        },
        linkedin: {
            type: String
        },
        twitter: {
            type: String
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Defaults to active so documents created before this field existed keep working
    status: {
        type: String,
        enum: ['pending', 'active'],
        default: 'active'
    },
    // Secrets and bookkeeping are select:false so no query can leak them by accident.
    resetPasswordLink: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    activationToken: {
        type: String,
        select: false
    },
    activationExpires: {
        type: Date,
        select: false
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    // Sessions issued before this moment are rejected by verifySession
    if (!this.isNew) this.passwordChangedAt = new Date();
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = User = mongoose.model('user', userSchema);