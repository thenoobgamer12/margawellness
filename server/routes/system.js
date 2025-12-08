import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = Router();

// POST /api/system/clear-database
// Protected route for Admins only, requires re-authentication.
router.post('/clear-database', adminMiddleware, async (req, res) => {
    const { password } = req.body;
    const adminId = req.user.id; // Get admin ID from the verified JWT

    if (!password) {
        return res.status(400).json({ message: 'Admin password is required to confirm this action.' });
    }

    try {
        // 1. Verify admin password
        const adminUser = await db.query('SELECT password_hash FROM users WHERE id = $1', [adminId]);
        if (adminUser.rows.length === 0) {
            return res.status(404).json({ message: 'Admin user not found.' }); // Should not happen if JWT is valid
        }

        const isMatch = await bcrypt.compare(password, adminUser.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect admin password.' });
        }

        // 2. Clear the tables
        // We TRUNCATE for performance and to reset SERIAL counters.
        // CASCADE is used to also clear dependent tables (e.g., schedules when clients are cleared).
        // We specifically target 'clients' and 'schedules'. 'users' and 'audit_logs' are left untouched.
        await db.query('TRUNCATE TABLE schedules, clients RESTART IDENTITY CASCADE');

        // 3. Log the action
        // This is a fire-and-forget, no need to await it.
        db.query(
            `INSERT INTO audit_logs (user_id, action, target_type, details)
             VALUES ($1, $2, $3, $4)`,
            [adminId, 'CLEAR_DATABASE_SUCCESS', 'system', 'Cleared clients and schedules tables.']
        );
        
        res.status(200).json({ message: 'Client and schedule data has been successfully cleared.' });

    } catch (err) {
        console.error('Error clearing database:', err.message);
        // Log failure
        db.query(
            `INSERT INTO audit_logs (user_id, action, target_type, details)
             VALUES ($1, $2, $3, $4)`,
            [adminId, 'CLEAR_DATABASE_FAILURE', 'system', `Error: ${err.message}`]
        );
        res.status(500).send('Server error during database clearing.');
    }
});

export default router;
