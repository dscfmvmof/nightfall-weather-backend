const Favorite = require('../models/Favorite');
const axios = require('axios');

exports.getCityWeather = async (req, res) => {
    const { city } = req.params;
    try {
        const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        if (!geo.data.results) return res.status(404).json({ message: "City not found" });

        const { latitude, longitude, name, country } = geo.data.results[0];
        const weather = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);

        res.json({
            name, sys: { country },
            main: { temp: weather.data.current.temperature_2m },
            weather: [{ description: "Retrieved via Open-Meteo" }]
        });
    } catch (err) { res.status(500).json({ message: "Weather API Error" }); }
};

exports.addFavorite = async (req, res) => {
    try {
        const newFav = new Favorite({ user: req.user.id, cityName: req.body.cityName });
        await newFav.save();
        res.status(201).json(newFav);
    } catch (err) { res.status(400).json({ message: "Save failed" }); }
};

exports.getFavorites = async (req, res) => {
    const data = await Favorite.find({ user: req.user.id });
    res.json(data);
};

exports.getOneFavorite = async (req, res) => {
    const fav = await Favorite.findOne({ _id: req.params.id, user: req.user.id });
    if (!fav) return res.status(404).json({ message: "Not found" });
    res.json(fav);
};

exports.updateFavorite = async (req, res) => {
    const updated = await Favorite.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { cityName: req.body.cityName },
        { new: true }
    );
    res.json(updated);
};

exports.deleteFavorite = async (req, res) => {
    await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: "Deleted" });
};