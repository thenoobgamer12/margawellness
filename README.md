# Marga: Client & Schedule Management System

Marga is a comprehensive, role-based web application designed for therapy and counseling centers. It provides a streamlined interface for administrators and therapists to manage client data, therapist schedules, and user accounts efficiently.

## Core Features

### 1. Role-Based Access Control
- **Secure Login:** Users log in with a username and password. The application differentiates between 'Admin' and 'Therapist' roles, presenting a tailored dashboard for each.
- **Password Security:** Passwords are encrypted (using Base64 for this demo) in the database. Logged-in users have the ability to change their own password.

### 2. Admin Dashboard (Full Control)
The admin dashboard is a centralized hub for managing all aspects of the application.

- **Client Management:**
  - **View Clients:** Displays a full list of all clients in a paginated and searchable table.
  - **Create & Edit Clients:** Admins can add new clients or edit the details of existing clients by clicking on their row.
  - **Delete Clients:** Admins can delete clients from within the edit modal, with a multi-stage confirmation process to prevent accidental deletions.
  - **Typo-Proof Document Editing:** When editing a client, document URL fields provide a "Test Link" button, allowing the user to verify the link works before saving.
  - **Import & Export:**
    - **Export:** Export the entire client database to an XLSX file with a single click.
    - **Import:** Import new clients from an XLSX file. The system uses column headers (e.g., "Client Name") instead of fixed positions, making it robust to changes in the file layout. It also processes large files in batches to ensure server stability and intelligently handles cases where a therapist listed in the file is not yet registered in the database.
- **Therapist Management:**
  - **View Therapists:** A dedicated tab lists all registered therapists.
  - **Add Therapists:** Admins can create new user accounts for therapists.
  - **Edit & Change Password:** Admins can edit therapist details and change their passwords directly from this panel.
  - **Delete Therapists:** Admins can delete therapists, with the same multi-stage confirmation process.
- **Settings:**
    - **Database Management:** A dedicated settings page provides options for bulk data operations.
    - **Import/Export:** Import and export client data from/to XLSX files.
    - **Clear Database:** A protected function to clear all client and schedule data from the database, requiring admin password confirmation.
- **Scheduling:**
  - **Comprehensive View:** View a full calendar schedule for all therapists.
  - **Book Appointments:** Admins can book new appointments for any client with any therapist in 45-minute slots.

### 3. Therapist Dashboard (Focused View)
Therapists have a simplified interface focused on their immediate responsibilities.

- **View Assigned Clients:** The dashboard displays a list of only the clients assigned to the logged-in therapist.
- **Update Client Documents:** Therapists have restricted editing rights, allowing them to update links to a client's "Case History" and "Session Summary" documents without changing other sensitive information.
- **View Personal Schedule:** Therapists can view their own daily and monthly schedule in a calendar format.

## Getting Started

To run this project locally, you will need to have Node.js and npm installed.

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Running the Application
This project requires two processes to run concurrently: the Vite development server for the React application and the `json-server` to act as a mock backend API.

**a) Start the JSON Server:**
Open a terminal and run the following command. This will start a server on `http://localhost:3001` that will serve and save changes to the `public/db.json` file, with CORS configured to allow requests from specific origins.
```bash
npm run server
```

**b) Start the Vite Development Server:**
Open a *second* terminal and run:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Sample Credentials
You can use the following credentials from the `public/db.json` file to test the different roles:

- **Admin:**
  - **Username:** `admin`
  - **Password:** `adminpass`
- **Therapist:**
  - **Username:** `therapist1`
  - **Password:** `therapistpass`
