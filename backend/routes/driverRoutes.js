const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

router.get('/', driverController.getDrivers);
router.post('/', driverController.addDriver);
router.put('/:id', driverController.updateDriver);
router.patch('/:id/status', driverController.overrideStatus);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
