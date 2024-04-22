const express = require('express')
const cors = require('cors')
const chatbotRoutes = require('./routes/chatbotRoutes');
const app = express()
require('dotenv').config();


app.use(cors())
app.use(express.json());

// Use routes
app.use('/api/chatbot', chatbotRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));