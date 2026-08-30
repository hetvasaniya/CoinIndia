const Mint = require('../models/Mint');

const getMints = async (req, res) => {
  try {
    const mints = await Mint.find({ isActive: true }).populate('country', 'name');
    res.json(mints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMint = async (req, res) => {
  try {
    const { name, location, country, mintMark } = req.body;
    const mint = new Mint({ name, location, country, mintMark });
    const createdMint = await mint.save();
    res.status(201).json(createdMint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMint = async (req, res) => {
  try {
    const { name, location, country, mintMark, isActive } = req.body;
    const mint = await Mint.findById(req.params.id);

    if (mint) {
      mint.name = name || mint.name;
      mint.location = location || mint.location;
      mint.country = country || mint.country;
      mint.mintMark = mintMark || mint.mintMark;
      if (isActive !== undefined) mint.isActive = isActive;

      const updatedMint = await mint.save();
      res.json(updatedMint);
    } else {
      res.status(404).json({ message: 'Mint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMint = async (req, res) => {
  try {
    const mint = await Mint.findById(req.params.id);
    if (mint) {
      await mint.deleteOne();
      res.json({ message: 'Mint removed' });
    } else {
      res.status(404).json({ message: 'Mint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMints, createMint, updateMint, deleteMint };
