const express = require('express');
const router = express.Router();
const {
  getMints,
  createMint,
  updateMint,
  deleteMint
} = require('../controllers/mintController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.route('/')
  .get(getMints)
  .post(protect, admin, createMint);

router.route('/:id')
  .put(protect, admin, updateMint)
  .delete(protect, admin, deleteMint);

module.exports = router;
