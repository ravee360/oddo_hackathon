const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/', tripController.getTrips);
router.post('/', tripController.addTrip);
router.post('/:id/dispatch', tripController.dispatchTrip);
router.post('/:id/complete', tripController.completeTrip);
router.post('/:id/cancel', tripController.cancelTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
