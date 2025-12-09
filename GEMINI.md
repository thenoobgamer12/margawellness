# Project Overview

This project is a web application for a therapy and counseling center called "Marga". It's designed to manage client data, therapist schedules, and user accounts. The application has role-based access control, with "Admin" and "Therapist" roles.

## Architecture

The application consists of two main parts:

1.  **Frontend:** A React application built with Vite. The source code is located in the `src` directory.
2.  **Backend:** A mock API server using `json-server`. It serves the `public/db.json` file, which acts as the database.

## Key Technologies

*   **Frontend:**
    *   React
    *   Vite
    *   `react-calendar` for displaying schedules
    *   `lucide-react` for icons
*   **Backend:**
    *   `json-server`
    *   `cors`
*   **Data:**
    *   `xlsx` for importing and exporting data to/from Excel files.

# Building and Running

To run this project locally, you need to have Node.js and npm installed.

1.  **Installation:**

    Clone the repository and install the dependencies:

    ```bash
    npm install
    ```

2.  **Running the Application:**

    This project requires two processes to run concurrently: the Vite development server for the React application and the `json-server` to act as a mock backend API.

    **a) Start the JSON Server:**

    Open a terminal and run the following command. This will start a server on `http://localhost:3001` that will serve and save changes to the `public/db.json` file.

    ```bash
    npm run server
    ```

    **b) Start the Vite Development Server:**

    Open a *second* terminal and run:

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

## Sample Credentials

You can use the following credentials from the `public/db.json` file to test the different roles:

*   **Admin:**
    *   **Username:** `admin`
    *   **Password:** `adminpass`
*   **Therapist:**
    *   **Username:** `therapist1`
    *   **Password:** `therapistpass`

# Development Conventions

*   **Linting:** The project uses ESLint for code linting. You can run the linter with the following command:

    ```bash
    npm run lint
    ```

*   **Code Style:** The code style is based on the default configurations of ESLint and Prettier, as seen in `eslint.config.js` and `package.json`.
*   **Component Structure:** The React components are located in the `src` directory. Each component has its own `.jsx` file, and some have a corresponding `.module.css` file for styling.
