const express = require('express');
const { createLead } = require('../controllers/leadsController');

const router = express.Router();

router.post('/leads', createLead);

module.exports = router;