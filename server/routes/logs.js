import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// POST a new audit log entry
router.post('/', async (req, res) => {
    const { userId, action, targetType, targetId, details } = req.body;

    if (!userId || !action) {
        return res.status(400).json({ message: 'Missing required fields for audit log' });
    }

    try {
        await db.query(
            `INSERT INTO audit_logs (user_id, action, target_type, target_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, action, targetType, targetId, details]
        );
        res.status(201).send();
    } catch (err) {
        console.error('Error creating audit log:', err.message);
        res.status(500).send('Server error');
    }
});

export default router;
