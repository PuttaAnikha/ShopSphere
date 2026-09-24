const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.put('/tickets/:id', supportController.updateTicket);
router.post('/tickets/:id/messages', supportController.addMessage);

module.exports = router;
