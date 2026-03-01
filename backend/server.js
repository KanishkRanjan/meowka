const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const vehicleRoutes = require('./routes/vehicleRoutes');
const http = require('http');
const configureWebSocket = require('./websocket');


dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/vehicles', vehicleRoutes);

app.get('/', (req, res) => {
  res.send('Vehicle Tracking API is running');
});

const server = http.createServer(app);
configureWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
}); 

