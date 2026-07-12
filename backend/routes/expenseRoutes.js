const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/', expenseController.getExpenses);
router.post('/fuel', expenseController.addFuelLog);
router.post('/other', expenseController.addOtherExpense);

module.exports = router;
