require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

const seedData = async () => {
  try {
    const dbJsonPath = path.join(__dirname, '../public/db.json');
    if (!fs.existsSync(dbJsonPath)) {
      console.log('No db.json found at', dbJsonPath);
      return;
    }

    const rawData = fs.readFileSync(dbJsonPath, 'utf8');
    const data = JSON.parse(rawData);

    // --- Migrate Users ---
    const userMap = new Map(); // username -> postgres_id

    // Ensure default admin exists
    const defaultAdminHash = await bcrypt.hash('adminpass', 10);
    const adminRes = await pool.query(
      `INSERT INTO users (username, password, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username 
       RETURNING id, username`,
      ['admin', defaultAdminHash, 'Admin']
    );
    userMap.set('admin', adminRes.rows[0].id);
    console.log('Processed default admin.');

    if (data.users) {
      for (const user of data.users) {
        if (user.username === 'admin') continue; // Already handled

        // Decode Base64 password
        let decodedPassword = 'password';
        try {
           decodedPassword = Buffer.from(user.password, 'base64').toString('utf-8');
        } catch (e) {
           console.log(`Could not decode password for ${user.username}, using default.`);
        }
        
        const hashedPassword = await bcrypt.hash(decodedPassword, 10);
        
        try {
          const res = await pool.query(
            `INSERT INTO users (username, password, role) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
             RETURNING id`,
            [user.username, hashedPassword, user.role]
          );
          userMap.set(user.username, res.rows[0].id);
          console.log(`Processed user: ${user.username}`);
        } catch (err) {
          console.error(`Error inserting user ${user.username}:`, err);
        }
      }
    }

    // --- Migrate Clients ---
    const clientMap = new Map(); // clientName -> postgres_id (Best effort mapping)

    if (data.clients) {
      for (const client of data.clients) {
        const therapistId = userMap.get(client.counselor) || userMap.get('admin'); // Default to admin if counselor not found
        
        try {
          const res = await pool.query(
            `INSERT INTO clients (name, email, phone, address, dob, gender, therapist_id, status, case_history_url, session_summary_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, name`,
            [
              client.clientName, 
              '', // email not in db.json
              client.contactNo, 
              client.addressCity, 
              // Convert age to rough DOB if necessary, or leave null. db.json has 'age' not DOB.
              // We'll leave DOB null for now or mock it? Schema allows null.
              null, 
              client.gender, 
              therapistId, 
              client.status || 'Open',
              client.caseHistoryDocument,
              client.sessionSummaryDocument
            ]
          );
          clientMap.set(client.clientName, res.rows[0].id);
          console.log(`Processed client: ${client.clientName}`);
        } catch (err) {
          console.error(`Error inserting client ${client.clientName}:`, err);
        }
      }
    }

    // --- Migrate Schedule/Appointments ---
    if (data.schedule) {
        for (const [date, therapistSchedule] of Object.entries(data.schedule)) {
            for (const [therapistName, appointments] of Object.entries(therapistSchedule)) {
                const therapistId = userMap.get(therapistName);
                if (!therapistId) continue;

                for (const [timeStr, details] of Object.entries(appointments)) {
                    const clientId = clientMap.get(details.client);
                    if (!clientId) {
                        console.log(`Skipping appointment for unknown client: ${details.client}`);
                        continue;
                    }

                    // Parse timeStr (e.g. "09:00 AM") + date (e.g. "2025-12-06") -> ISO String
                    // Simple parsing logic
                    try {
                        const [time, modifier] = timeStr.split(' ');
                        let [hours, minutes] = time.split(':');
                        if (hours === '12') {
                            hours = '00';
                        }
                        if (modifier === 'PM') {
                            hours = parseInt(hours, 10) + 12;
                        }
                        const appointmentDate = new Date(`${date}T${hours}:${minutes}:00`);
                        
                        await pool.query(
                            `INSERT INTO appointments (client_id, therapist_id, appointment_time) 
                             VALUES ($1, $2, $3)
                             ON CONFLICT DO NOTHING`, // Avoid duplicates if re-run
                            [clientId, therapistId, appointmentDate.toISOString()]
                        );
                        console.log(`Processed appointment for ${details.client} on ${date} at ${timeStr}`);
                    } catch (err) {
                        console.error(`Error processing appointment ${date} ${timeStr}:`, err);
                    }
                }
            }
        }
    }

    console.log('Migration completed.');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await pool.end();
  }
};

seedData();