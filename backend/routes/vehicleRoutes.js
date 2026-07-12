const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.getVehicles);
router.post('/', vehicleController.addVehicle);
router.post('/:id/documents', vehicleController.uploadDocument);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);
router.delete('/:id/documents/:docId', vehicleController.deleteDocument);

module.exports = router;
