import bcrypt from 'bcryptjs';
import { db } from './db.js';
import 'dotenv/config';

async function seedDatabase() {
    try {
        console.log('Seeding database...');

        // Clear existing data (optional, for development)
        await db.query('DELETE FROM audit_logs');
        await db.query('DELETE FROM schedules');
        await db.query('DELETE FROM clients');
        await db.query('DELETE FROM users'); // Must delete users last due to FK constraints
        console.log('Cleared existing data.');

        // Admin User
        const adminPassword = 'adminpass';
        const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
        const adminUser = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            ['admin', adminPasswordHash, 'Admin']
        );
        console.log('Admin user created.');

        // Therapist User
        const therapistPassword = 'therapistpass';
        const therapistPasswordHash = await bcrypt.hash(therapistPassword, 10);
        const therapistUser = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
            ['therapist1', therapistPasswordHash, 'Therapist']
        );
        console.log('Therapist user created.');

        // Add some sample clients
        // For simplicity, directly assign to admin counselor_id
        // In a real app, you'd fetch the therapistUser.rows[0].id
        const adminUserId = adminUser.rows[0].id; // For demonstration, assigning to admin
        const therapistUserId = therapistUser.rows[0].id;

        const client1 = await db.query(
            `INSERT INTO clients (client_name, age, gender, contact_no, address_city, case_type, counselor_id, status, case_history_document, session_summary_document)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            ['Alice Smith', 30, 'Female', '123-456-7890', 'New York', 'Anxiety', therapistUserId, 'Open', 'https://example.com/alice_case_history', 'https://example.com/alice_session_summary']
        );
        console.log('Client 1 created.');

        const client2 = await db.query(
            `INSERT INTO clients (client_name, age, gender, contact_no, address_city, case_type, counselor_id, status, case_history_document, session_summary_document)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            ['Bob Johnson', 45, 'Male', '098-765-4321', 'Los Angeles', 'Depression', therapistUserId, 'Open', 'https://example.com/bob_case_history', 'https://example.com/bob_session_summary']
        );
        console.log('Client 2 created.');

        const client3 = await db.query(
            `INSERT INTO clients (client_name, age, gender, contact_no, address_city, case_type, counselor_id, status, case_history_document, session_summary_document)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            ['Charlie Brown', 25, 'Male', '555-123-4567', 'Chicago', 'PTSD', therapistUserId, 'Open', 'https://example.com/charlie_case_history', 'https://example.com/charlie_session_summary']
        );
        console.log('Client 3 created.');

        // Add some sample schedules
        // For simplicity, using today's date
        const today = new Date().toISOString().slice(0, 10);
        await db.query(
            `INSERT INTO schedules (date, time, client_id, therapist_id) VALUES ($1, $2, $3, $4)`,
            [today, '10:00:00', client1.rows[0].id, therapistUserId]
        );
        await db.query(
            `INSERT INTO schedules (date, time, client_id, therapist_id) VALUES ($1, $2, $3, $4)`,
            [today, '11:00:00', client2.rows[0].id, therapistUserId]
        );
        console.log('Sample schedules created.');


        console.log('Database seeded successfully!');

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        // Ensure the process exits even if there's an error
        process.exit();
    }
}

seedDatabase();