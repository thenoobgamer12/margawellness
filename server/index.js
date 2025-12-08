import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRouter from './routes/auth.js';
import clientsRouter from './routes/clients.js';
import usersRouter from './routes/users.js';
import logsRouter from './routes/logs.js';
import systemRouter from './routes/system.js';

const app = express();
const port = process.env.PORT || 3002; // Use a different port from the frontend dev server

// === Middleware ===
// Enable Cross-Origin Resource Sharing for requests from the frontend.
app.use(cors({
    origin: 'http://localhost:5173' // Allow only the frontend to connect
}));
// Parse incoming JSON requests.
app.use(express.json());

// === Routes ===
// A simple root route to check if the server is running.
app.get('/api', (req, res) => {
  res.send('Marga Wellness Backend API is running!');
});

app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/users', usersRouter);
app.use('/api/logs', logsRouter);
app.use('/api/system', systemRouter);


// TODO: Add application-specific API routes here (e.g., for clients, auth, etc.)


// === Server Startup ===
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});