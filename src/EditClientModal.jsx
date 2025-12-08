import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const EditClientModal = ({ isOpen, onClose, client, onEditClient, onDeleteClient, therapists, caseTypes, genders, user }) => {
    const getInitialData = () => {
        if (client) return {
            ...client,
            counselorId: client.counselorId || therapists[0]?.id || '' // Ensure counselorId is set, fallback to first therapist
        };
        return {
            clientName: '',
            age: '',
            gender: genders[0] || 'Other',
            contactNo: '',
            addressCity: '',
            caseType: caseTypes[0] || '',
            counselorId: therapists[0]?.id || '', // Changed to counselorId and uses therapist ID
            status: 'Open',
            caseHistoryDocument: '#',
            sessionSummaryDocument: '#'
        };
    };

    const [clientData, setClientData] = useState(getInitialData());

    useEffect(() => {
        // Reset form when modal opens or client changes
        // Also ensure counselorId is correctly initialized if therapists load later
        setClientData(getInitialData());
    }, [client, isOpen, therapists]); // Added therapists to dependency array


    const handleChange = (e) => {
        setClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onEditClient({
            ...clientData,
            age: parseInt(clientData.age, 10), // Ensure age is an integer
            counselorId: parseInt(clientData.counselorId, 10) // Ensure counselorId is an integer
        });
        onClose();
    };

    const handleDelete = () => {
        onDeleteClient(client.id);
        onClose();
    };

    if (!isOpen || !client) return null;

    const isTherapist = user.role === 'Therapist';

    // Helper to ensure the URL is absolute
    const formatUrl = (url) => {
        if (!url || url.startsWith('http://') || url.startsWith('https://') || url === '#') {
            return url;
        }
        return `https://${url}`;
    };

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.editClientModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit Client</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.editClientForm}>
                    <div className={styles.editClientGrid}>
                        <input name="clientName" value={clientData.clientName} onChange={handleChange} placeholder="Client Name" required className={styles.input} disabled={isTherapist} />
                        <input name="age" type="number" value={clientData.age} onChange={handleChange} placeholder="Age" required className={styles.input} disabled={isTherapist} />
                        <select name="gender" value={clientData.gender} onChange={handleChange} className={styles.select} disabled={isTherapist}>{['Female', 'Male', 'Other', 'Rather not say'].map(g => <option key={g} value={g}>{g}</option>)}</select>
                        <input name="contactNo" value={clientData.contactNo} onChange={handleChange} placeholder="Contact No." required className={styles.input} disabled={isTherapist} />
                        <input name="addressCity" value={clientData.addressCity} onChange={handleChange} placeholder="City" required className={styles.input} disabled={isTherapist} />
                        <select name="caseType" value={clientData.caseType} onChange={handleChange} className={styles.select} disabled={isTherapist}>{caseTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}</select>
                        {/* Changed from 'counselor' to 'counselorId' and uses therapist.id for value */}
                        <select name="counselorId" value={clientData.counselorId} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`} disabled={isTherapist}>
                            {therapists.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                        </select>
                        <select name="status" value={clientData.status} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`} disabled={isTherapist}>{['Open', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <div className={`${styles.documentLinkContainer} ${styles.fullWidth}`}>
                            <input name="caseHistoryDocument" type="url" value={clientData.caseHistoryDocument} onChange={handleChange} placeholder="Case History Document URL" className={styles.input} />
                            {clientData.caseHistoryDocument && clientData.caseHistoryDocument !== '#' && (
                                <a href={formatUrl(clientData.caseHistoryDocument)} target="_blank" rel="noopener noreferrer" className={styles.documentPreviewLink}>
                                    Test Link
                                </a>
                            )}
                        </div>
                        <div className={`${styles.documentLinkContainer} ${styles.fullWidth}`}>
                            <input name="sessionSummaryDocument" type="url" value={clientData.sessionSummaryDocument} onChange={handleChange} placeholder="Session Summary Document URL" className={styles.input} />
                            {clientData.sessionSummaryDocument && clientData.sessionSummaryDocument !== '#' && (
                                <a href={formatUrl(clientData.sessionSummaryDocument)} target="_blank" rel="noopener noreferrer" className={styles.documentPreviewLink}>
                                    Test Link
                                </a>
                            )}
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={handleDelete} className={styles.deleteButton}>Delete Client</button>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default EditClientModal;