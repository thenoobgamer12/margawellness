import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, Trash } from 'lucide-react';
import styles from './Dashboard.module.css';

const API_BASE_URL = 'http://localhost:3002/api';

const Settings = ({ clients, therapists, setExternalClients, openClearDatabaseModal }) => {
    const fileInputRef = useRef(null);

    const handleExport = () => {
        // Map counselorId back to counselor username for export
        const getCounselorUsername = (counselorId) => {
            const counselor = therapists.find(t => t.id === counselorId);
            return counselor ? counselor.username : '';
        };

        const header = ["Client ID", "Client Name", "Age", "Gender", "Contact No.", "Address City", "Case Type", "Counselor", "Date Created", "Status", "Case History Document", "Session Summary Document"];
        const rows = clients.map(client => [
            client.id, // Using client.id as unique identifier
            client.clientName,
            client.age,
            client.gender,
            client.contactNo,
            client.addressCity,
            client.caseType,
            getCounselorUsername(client.counselorId), // Map counselorId to username
            client.createdAt ? new Date(client.createdAt).toISOString().split('T')[0] : '', // Using createdAt
            client.status,
            client.caseHistoryDocument,
            client.sessionSummaryDocument
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        XLSX.writeFile(workbook, "ClientData.xlsx");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                // Updated header mapping - removed Case ID
                const headerMapping = {
                    "Client Name": "clientName",
                    "Age": "age",
                    "Gender": "gender",
                    "Contact No.": "contactNo",
                    "Address City": "addressCity",
                    "Case Type": "caseType",
                    "Counselor": "counselor", // Will be converted to counselorId
                    "Status": "status",
                    "Case History Document": "caseHistoryDocument",
                    "Session Summary Document": "sessionSummaryDocument"
                };
                
                // No longer checking existingCaseIds as caseId is removed from schema
                // Assume all imported clients are new or handle uniqueness at backend

                const importedClients = json
                    .map(row => {
                        const client = {};
                        for (const header in headerMapping) {
                            // Trim string values to remove leading/trailing whitespace
                            client[headerMapping[header]] = typeof row[header] === 'string' ? row[header].trim() : row[header];
                        }
                        return client;
                    })
                    .map(client => {
                        // Find therapist ID from username, default to null if not found
                        const counselorObj = therapists.find(t => t.username === client.counselor);
                        
                        return {
                            clientName: client.clientName || 'N/A',
                            age: parseInt(client.age, 10) || null, // Parse age to int, default to null
                            gender: client.gender || 'Other',
                            contactNo: client.contactNo || null,
                            addressCity: client.addressCity || null,
                            caseType: client.caseType || null,
                            counselorId: counselorObj ? counselorObj.id : null, // Convert counselor name to ID
                            status: client.status || 'Open',
                            caseHistoryDocument: client.caseHistoryDocument || null,
                            sessionSummaryDocument: client.sessionSummaryDocument || null
                        };
                    })
                    .filter(client => client.clientName); // Ensure at least clientName exists

                if (importedClients.length === 0) {
                    alert("No valid new client data found in the file.");
                    fileInputRef.current.value = ""; // Reset file input
                    return;
                }

                // Batch loop for importing clients
                const importInBatches = async (clientsToImport) => {
                    const batchSize = 20;
                    let allImported = [];

                    for (let i = 0; i < clientsToImport.length; i += batchSize) {
                        const batch = clientsToImport.slice(i, i + batchSize);
                        try {
                            const importedBatch = await Promise.all(
                                batch.map(client =>
                                    fetch(`${API_BASE_URL}/clients`, { // Use new API base URL
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(client)
                                    }).then(async res => {
                                        if (!res.ok) {
                                            const errorBody = await res.json(); // Assuming backend sends JSON error
                                            throw new Error(`Failed to import '${client.clientName}': ${errorBody.message || res.statusText}`);
                                        }
                                        return res.json();
                                    })
                                )
                            );
                            allImported = [...allImported, ...importedBatch];
                            console.log(`Imported batch ${i / batchSize + 1}...`);
                        } catch (error) {
                            throw error; // Propagate error to be caught by the outer catch block
                        }
                    }
                    return allImported;
                };

                const newClients = await importInBatches(importedClients);
                
                setExternalClients(prev => [...prev, ...newClients]); // Update global clients state
                alert(`${newClients.length} clients imported successfully!`);
            } catch (error) {
                console.error("Import failed:", error);
                alert(`Import failed: ${error.message}`);
            } finally {
                // Reset the file input so the user can select the same file again if needed
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    return (
        <div className={styles.settings}>
            <h2 className={styles.headerTitle}>Settings</h2>
            <div className={styles.settingsControls}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    style={{ display: 'none' }} 
                    accept=".xlsx, .xls"
                />
                <button onClick={triggerFileSelect} className={`${styles.actionButton} ${styles.importButton}`}>
                    <Upload size={20} /> <span>Import Clients</span>
                </button>
                <button onClick={handleExport} className={`${styles.actionButton} ${styles.exportButton}`}>
                    <Download size={20} /> <span>Export Clients</span>
                </button>
                <button onClick={openClearDatabaseModal} className={`${styles.actionButton} ${styles.clearDbButton}`}>
                    <Trash size={20} /> <span>Clear Database</span>
                </button>
            </div>
        </div>
    );
};

export default Settings;