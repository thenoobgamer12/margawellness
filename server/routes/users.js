import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const router = Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, username, role FROM users ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET all therapists
router.get('/therapists', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, username, role FROM users WHERE role = 'Therapist' ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT (update) a user's details
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;

    try {
        const { rows } = await db.query(
            'UPDATE users SET username = $1, role = $2, updated_at = NOW() WHERE id = $3 RETURNING id, username, role',
            [username, role, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT (update) a user's password
router.put('/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const { rows } = await db.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, role',
            [password_hash, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// DELETE a user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // The schema's ON DELETE SET NULL for counselor_id in the clients table
        // will automatically handle un-assigning clients from the deleted therapist.
        const deleteOp = await db.query('DELETE FROM users WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


export default router;
