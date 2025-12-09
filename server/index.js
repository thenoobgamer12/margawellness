require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3002;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing username, password, or role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error during registration:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET all users (for Admin to manage therapists)
app.get('/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    try {
        const result = await pool.query('SELECT id, username, role FROM users'); // Don't return passwords
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// Change user's password (for self-service or admin changing others)
app.post('/users/:id/change-password', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Check if the user is changing their own password or if an admin is changing someone else's
    if (req.user.id !== parseInt(id, 10) && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. You can only change your own password unless you are an Admin.' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const userToUpdate = userResult.rows[0];

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // If not admin, verify old password
        if (req.user.role !== 'Admin') {
            const isMatch = await bcrypt.compare(oldPassword, userToUpdate.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid old password.' });
            }
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        await logAudit(req.user.id, 'CHANGE_PASSWORD', id);
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error changing password.' });
    }
});

// Update a user (Admin only)
app.put('/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    const { id } = req.params;
    const { username, role } = req.body;

    try {
        // Check if username is already taken by another user
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, id]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const result = await pool.query(
            'UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role',
            [username, role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await logAudit(req.user.id, 'UPDATE_USER', id);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
});

// Delete a user (Admin only)
app.delete('/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete yourself.' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await logAudit(req.user.id, 'DELETE_USER', id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.code === '23503') { // Foreign key violation
            return res.status(409).json({ message: 'Cannot delete user. They may have assigned clients or appointments.' });
        }
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});

// Admin endpoint to clear database
app.post('/admin/clear-database', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    try {
        // Delete all appointments first to avoid foreign key constraints
        await pool.query('DELETE FROM appointments');
        // Then delete all clients
        await pool.query('DELETE FROM clients');
        // Optionally, delete all users except the current admin
        await pool.query('DELETE FROM users WHERE id != $1', [req.user.id]); 

        await logAudit(req.user.id, 'CLEAR_DATABASE');
        res.status(200).json({ message: 'Database cleared successfully (excluding current admin user).' });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).json({ message: 'Server error clearing database.' });
    }
});


// Audit Logging Function
const logAudit = async (userId, actionType, clientIdAccessed = null) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action_type, client_id_accessed) VALUES ($1, $2, $3)',
      [userId, actionType, clientIdAccessed]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// Get all clients (protected)
app.get('/clients', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM clients';
    const queryParams = [];
    // If user is a therapist, only show their clients
    if (req.user.role === 'Therapist') {
        query += ' WHERE therapist_id = $1';
        queryParams.push(req.user.id);
    }
    const result = await pool.query(query, queryParams);
    await logAudit(req.user.id, 'VIEW_ALL_CLIENTS');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error fetching clients' });
  }
});

// Get a single client by ID (protected)
app.get('/clients/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    // Ensure therapists can only view their own clients
    if (req.user.role === 'Therapist' && result.rows[0].therapist_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You can only view your own clients.' });
    }
    await logAudit(req.user.id, 'VIEW_CLIENT', id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching client by ID:', error);
    res.status(500).json({ message: 'Server error fetching client' });
  }
});

// Create a new client (protected)
app.post('/clients', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required to create clients.' });
  }
  const { name, phone, address, age, gender, therapist_id, status, case_history_url, session_summary_url, case_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clients (name, phone, address, age, gender, therapist_id, status, case_history_url, session_summary_url, case_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, phone, address, age, gender, therapist_id, status || 'Open', case_history_url, session_summary_url, case_type]
    );
    const newClient = result.rows[0];
    await logAudit(req.user.id, 'CREATE_CLIENT', newClient.id);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Server error creating client' });
  }
});

// Update a client by ID (protected)
app.put('/clients/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, age, gender, therapist_id, status, case_history_url, session_summary_url, case_type } = req.body;

  try {
    // Check if the client exists and get current details
    const currentClientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (currentClientResult.rows.length === 0) {
        return res.status(404).json({ message: 'Client not found' });
    }
    const currentClient = currentClientResult.rows[0];

    // Authorization Check
    if (req.user.role !== 'Admin') {
        // If not Admin, must be the assigned Therapist
        if (req.user.role !== 'Therapist' || currentClient.therapist_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You can only update your own clients.' });
        }
    }

    const result = await pool.query(
      'UPDATE clients SET name = $1, phone = $2, address = $3, age = $4, gender = $5, therapist_id = $6, status = $7, case_history_url = $8, session_summary_url = $9, case_type = $10 WHERE id = $11 RETURNING *',
      [name, phone, address, age, gender, therapist_id, status, case_history_url, session_summary_url, case_type, id]
    );
    
    await logAudit(req.user.id, 'UPDATE_CLIENT', id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Server error updating client', error: error.message });
  }
});

// ... (DELETE /clients/:id remains unchanged) ...

// Appointments API
// GET /appointments?therapist_id={id}&start_date={ISO}&end_date={ISO}
app.get('/appointments', authenticateToken, async (req, res) => {
    const { therapist_id, date, start_date, end_date } = req.query;

    if (!therapist_id) {
        return res.status(400).json({ message: 'Therapist ID is required.' });
    }

    // Ensure therapist can only fetch their own appointments
    if (req.user.role === 'Therapist' && req.user.id !== parseInt(therapist_id, 10)) {
        return res.status(403).json({ message: 'Access denied. Therapists can only view their own appointments.' });
    }

    try {
        let query = 'SELECT * FROM appointments WHERE therapist_id = $1';
        const queryParams = [therapist_id];

        if (start_date && end_date) {
            query += ' AND appointment_time >= $2 AND appointment_time <= $3';
            queryParams.push(start_date, end_date);
        } else if (date) {
            // Fallback for date-only query (assumes UTC day)
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query += ' AND appointment_time >= $2 AND appointment_time < $3';
            queryParams.push(startDate.toISOString(), endDate.toISOString());
        } else {
             return res.status(400).json({ message: 'Either date or start_date/end_date range is required.' });
        }
        
        query += ' ORDER BY appointment_time';

        const result = await pool.query(query, queryParams);
        await logAudit(req.user.id, 'VIEW_APPOINTMENTS', therapist_id); 
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Server error fetching appointments.', error: error.message });
    }
});

// POST /appointments
app.post('/appointments', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required to create appointments.' });
    }
    const { client_id, therapist_id, appointment_time } = req.body;

    if (!client_id || !therapist_id || !appointment_time) {
        return res.status(400).json({ message: 'Client ID, Therapist ID, and Appointment Time are required.' });
    }

    try {
        // Check for existing appointment at the same time for the same therapist
        const existingAppointment = await pool.query(
            'SELECT * FROM appointments WHERE therapist_id = $1 AND appointment_time = $2',
            [therapist_id, appointment_time]
        );
        if (existingAppointment.rows.length > 0) {
            return res.status(409).json({ message: 'Appointment slot already booked.' });
        }

        const result = await pool.query(
            'INSERT INTO appointments (client_id, therapist_id, appointment_time) VALUES ($1, $2, $3) RETURNING *',
            [client_id, therapist_id, appointment_time]
        );
        const newAppointment = result.rows[0];
        await logAudit(req.user.id, 'CREATE_APPOINTMENT', client_id);
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Server error creating appointment.', error: error.message });
    }
});

app.get('/', (req, res) => {
  res.send('Marga Wellness API');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
