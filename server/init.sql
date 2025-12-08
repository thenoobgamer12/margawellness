-- This script initializes the database schema for the Marga application.

-- Users table to store login information and roles.
-- Roles can be 'Admin' or 'Therapist'.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table to store client information.
-- The counselor_id references a user with the 'Therapist' role.
-- ON DELETE SET NULL means if a therapist is deleted, the client record is kept.
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    contact_no VARCHAR(50),
    address_city VARCHAR(255),
    case_type VARCHAR(255),
    counselor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50),
    case_history_document TEXT,
    session_summary_document TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for tracking critical activities as required for compliance.
-- This table records who did what, and when.
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- The user who performed the action.
    action VARCHAR(255) NOT NULL,       -- e.g., 'CREATE_CLIENT', 'LOGIN_SUCCESS', 'VIEW_CLIENT_DETAILS'
    target_type VARCHAR(50),            -- The type of object affected, e.g., 'client', 'user'.
    target_id INTEGER,                  -- The ID of the affected object.
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    details TEXT                        -- Any additional relevant information.
);
