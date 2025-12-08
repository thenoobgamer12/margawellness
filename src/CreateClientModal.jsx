import React, { useState, useEffect } from 'react'; // Added useEffect
import { X } from 'lucide-react';
import styles from './Dashboard.module.css';

const CreateClientModal = ({ isOpen, onClose, onCreateClient, therapists, caseTypes, genders }) => {
    // Initialize counselor with the ID of the first therapist, if available
    const [clientData, setClientData] = useState({
        clientName: '',
        age: '',
        gender: genders[0] || 'Other',
        contactNo: '',
        addressCity: '',
        caseType: caseTypes[0] || '',
        counselorId: therapists[0]?.id || '' // Changed to counselorId and uses therapist ID
    });

    // Update clientData counselorId if therapists prop changes and a valid therapist is available
    useEffect(() => {
        if (therapists.length > 0 && !clientData.counselorId) {
            setClientData(prev => ({ ...prev, counselorId: therapists[0].id }));
        }
    }, [therapists, clientData.counselorId]);


    const handleChange = (e) => setClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateClient({
            ...clientData,
            age: parseInt(clientData.age, 10),
            status: 'Open', // Status is still client-side controlled for new clients
            caseHistoryDocument: '#', // Default value
            sessionSummaryDocument: '#' // Default value
            // Removed client-side generation of caseId and dateOpened
            // counselor is now counselorId and parsed as integer
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.createClientModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create New Client</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.createClientForm}>
                    <div className={styles.createClientGrid}>
                        <input name="clientName" value={clientData.clientName} onChange={handleChange} placeholder="Client Name" required className={styles.input} />
                        <input name="age" type="number" value={clientData.age} onChange={handleChange} placeholder="Age" required className={styles.input} />
                        <select name="gender" value={clientData.gender} onChange={handleChange} className={styles.select}>{['Female', 'Male', 'Other', 'Rather not say'].map(g => <option key={g} value={g}>{g}</option>)}</select>
                        <input name="contactNo" value={clientData.contactNo} onChange={handleChange} placeholder="Contact No." required className={styles.input} />
                        <input name="addressCity" value={clientData.addressCity} onChange={handleChange} placeholder="City" required className={styles.input} />
                        <select name="caseType" value={clientData.caseType} onChange={handleChange} className={styles.select}>{caseTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}</select>
                        {/* Changed from 'counselor' to 'counselorId' and uses therapist.id for value */}
                        <select name="counselorId" value={clientData.counselorId} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`}>
                            {therapists.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                        </select>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Create Client</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClientModal;