const express = require('express');
const router = express.Router();
const { processConversation } = require('../controllers/chatbotController');

router.post('/progress', processConversation);

module.exports = router;
