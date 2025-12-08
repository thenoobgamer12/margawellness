import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET all clients
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM clients ORDER BY id ASC');
        // Map snake_case from DB to camelCase for frontend
        const clients = rows.map(client => ({
            id: client.id,
            clientName: client.client_name,
            age: client.age,
            gender: client.gender,
            contactNo: client.contact_no,
            addressCity: client.address_city,
            caseType: client.case_type,
            counselorId: client.counselor_id,
            status: client.status,
            caseHistoryDocument: client.case_history_document,
            sessionSummaryDocument: client.session_summary_document,
            createdAt: client.created_at,
            updatedAt: client.updated_at
        }));
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST a new client
router.post('/', async (req, res) => {
    const {
        clientName,
        age,
        gender,
        contactNo,
        addressCity,
        caseType,
        counselorId,
        status,
        caseHistoryDocument,
        sessionSummaryDocument
    } = req.body;

    try {
        const { rows } = await db.query(
            `INSERT INTO clients (client_name, age, gender, contact_no, address_city, case_type, counselor_id, status, case_history_document, session_summary_document)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [clientName, age, gender, contactNo, addressCity, caseType, counselorId, status, caseHistoryDocument, sessionSummaryDocument]
        );
        // Map single record back to camelCase
        const newClient = {
            id: rows[0].id,
            clientName: rows[0].client_name,
            age: rows[0].age,
            gender: rows[0].gender,
            contactNo: rows[0].contact_no,
            addressCity: rows[0].address_city,
            caseType: rows[0].case_type,
            counselorId: rows[0].counselor_id,
            status: rows[0].status,
            caseHistoryDocument: rows[0].case_history_document,
            sessionSummaryDocument: rows[0].session_summary_document,
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at
        };
        res.status(201).json(newClient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT (update) a client
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        clientName,
        age,
        gender,
        contactNo,
        addressCity,
        caseType,
        counselorId,
        status,
        caseHistoryDocument,
        sessionSummaryDocument
    } = req.body;

    try {
        const { rows } = await db.query(
            `UPDATE clients
             SET client_name = $1, age = $2, gender = $3, contact_no = $4, address_city = $5, case_type = $6, counselor_id = $7, status = $8, case_history_document = $9, session_summary_document = $10, updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [clientName, age, gender, contactNo, addressCity, caseType, counselorId, status, caseHistoryDocument, sessionSummaryDocument, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        // Map single record back to camelCase
        const updatedClient = {
            id: rows[0].id,
            clientName: rows[0].client_name,
            age: rows[0].age,
            gender: rows[0].gender,
            contactNo: rows[0].contact_no,
            addressCity: rows[0].address_city,
            caseType: rows[0].case_type,
            counselorId: rows[0].counselor_id,
            status: rows[0].status,
            caseHistoryDocument: rows[0].case_history_document,
            sessionSummaryDocument: rows[0].session_summary_document,
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at
        };
        res.json(updatedClient);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// DELETE a client
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await db.query('DELETE FROM clients WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


export default router;