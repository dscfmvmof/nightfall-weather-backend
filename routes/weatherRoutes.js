const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const auth = require('../middleware/authMiddleware');

// Public Search
router.get('/data/:city', weatherController.getCityWeather);

router.post('/favorites', auth, weatherController.addFavorite);
router.get('/favorites', auth, weatherController.getFavorites);
router.get('/favorites/:id', auth, weatherController.getOneFavorite);
router.put('/favorites/:id', auth, weatherController.updateFavorite);
router.delete('/favorites/:id', auth, weatherController.deleteFavorite);

module.exports = router;