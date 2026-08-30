const Country = require('../models/Country');

const getCountries = async (req, res) => {
  try {
    const countries = await Country.find({ isActive: true });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCountry = async (req, res) => {
  try {
    const { name, code, flag } = req.body;
    const country = new Country({ name, code, flag });
    const createdCountry = await country.save();
    res.status(201).json(createdCountry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { name, code, flag, isActive } = req.body;
    const country = await Country.findById(req.params.id);

    if (country) {
      country.name = name || country.name;
      country.code = code || country.code;
      country.flag = flag || country.flag;
      if (isActive !== undefined) country.isActive = isActive;

      const updatedCountry = await country.save();
      res.json(updatedCountry);
    } else {
      res.status(404).json({ message: 'Country not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (country) {
      await country.deleteOne();
      res.json({ message: 'Country removed' });
    } else {
      res.status(404).json({ message: 'Country not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCountries, createCountry, updateCountry, deleteCountry };
