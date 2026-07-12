const express = require('express');
const router = express.Router();
const maintController = require('../controllers/maintController');

router.get('/', maintController.getMaintenance);
router.post('/', maintController.addMaintenance);
router.post('/:id/close', maintController.closeMaintenance);

module.exports = router;
