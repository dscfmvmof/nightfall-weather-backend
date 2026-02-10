const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cityName: { type: String, required: true },
    notes: { type: String, default: 'No tactical notes.' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);