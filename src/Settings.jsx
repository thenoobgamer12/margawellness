import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, Trash } from 'lucide-react';
import styles from './Dashboard.module.css';

const Settings = ({ clients, therapists, setExternalClients, openClearDatabaseModal }) => {
    const fileInputRef = useRef(null);

    const handleExport = () => {
        const header = ["ID", "Name", "Age", "Gender", "Phone", "Address", "Therapist Username", "Case Type", "Status", "Case History URL", "Session Summary URL"];
        const rows = clients.map(client => {
            const therapist = therapists.find(t => t.id === client.therapist_id);
            return [
                client.id,
                client.name,
                client.age,
                client.gender,
                client.phone,
                client.address,
                therapist ? therapist.username : 'N/A',
                client.case_type,
                client.status,
                client.case_history_url,
                client.session_summary_url
            ];
        });

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
        XLSX.writeFile(workbook, "ClientData.xlsx");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to import clients.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                // Mapping generic headers to our DB schema
                const headerMapping = {
                    "Name": "name",
                    "Client Name": "name",
                    "Age": "age",
                    "Gender": "gender",
                    "Phone": "phone",
                    "Contact No.": "phone",
                    "Address": "address",
                    "Therapist": "therapist_username",
                    "Therapist Username": "therapist_username",
                    "Counselor": "therapist_username",
                    "Case Type": "case_type",
                    "Status": "status",
                    "Case History URL": "case_history_url",
                    "Case History Document": "case_history_url",
                    "Session Summary URL": "session_summary_url",
                    "Session Summary Document": "session_summary_url"
                };

                const importedClients = json.map(row => {
                    const client = {};
                    for (const key in row) {
                        const mappedKey = headerMapping[key] || headerMapping[key.trim()];
                        if (mappedKey) {
                            client[mappedKey] = row[key];
                        }
                    }
                    return client;
                }).filter(c => c.name); // Basic validation

                // Enrich with therapist_id and defaults
                const processedClients = importedClients.map(client => {
                    // Find therapist by username (case-insensitive)
                    const therapistUser = client.therapist_username 
                        ? therapists.find(t => t.username.toLowerCase() === client.therapist_username.toLowerCase())
                        : null;

                    const defaultTherapistId = therapists.length > 0 ? therapists[0].id : null;

                    return {
                        name: client.name,
                        age: client.age || null, 
                        gender: client.gender || 'Other',
                        phone: client.phone || '',
                        address: client.address || '',
                        therapist_id: therapistUser ? therapistUser.id : defaultTherapistId,
                        case_type: client.case_type || 'Mental Health Support',
                        status: client.status || 'Open',
                        case_history_url: client.case_history_url || '',
                        session_summary_url: client.session_summary_url || ''
                    };
                });

                if (processedClients.length === 0) {
                    alert("No valid client data found.");
                    return;
                }

                // Batch Import
                const batchSize = 20;
                let successCount = 0;
                let errors = [];

                for (let i = 0; i < processedClients.length; i += batchSize) {
                    const batch = processedClients.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (client) => {
                        try {
                            const res = await fetch('http://localhost:3002/clients', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(client)
                            });
                            if (!res.ok) {
                                const errData = await res.json();
                                throw new Error(errData.message || res.statusText);
                            }
                            const newClient = await res.json();
                            setExternalClients(prev => [newClient, ...prev]);
                            successCount++;
                        } catch (err) {
                            errors.push(`${client.name}: ${err.message}`);
                        }
                    }));
                }

                if (errors.length > 0) {
                    console.error("Some imports failed:", errors);
                    alert(`Imported ${successCount} clients. ${errors.length} failed. Check console for details.`);
                } else {
                    alert(`Successfully imported all ${successCount} clients.`);
                }

            } catch (error) {
                console.error("Import processing error:", error);
                alert("Failed to process file. Ensure it is a valid Excel file.");
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
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
