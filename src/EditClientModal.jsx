import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const EditClientModal = ({ isOpen, onClose, client, onEditClient, onDeleteClient, therapists, genders, user }) => { // Removed caseTypes
    const getInitialData = () => {
        if (client) {
            return {
                id: client.id,
                name: client.name,
                age: client.age, 
                gender: client.gender,
                phone: client.phone,
                address: client.address,
                therapist_id: client.therapist_id,
                status: client.status,
                case_history_url: client.case_history_url,
                session_summary_url: client.session_summary_url,
                case_type: client.case_type
            };
        }
        return {
            name: '',
            age: '',
            gender: 'Male',
            phone: '',
            address: '',
            therapist_id: '',
            status: 'Open',
            case_history_url: '',
            session_summary_url: '',
            case_type: 'Mental Health Support'
        };
    };

    const [clientData, setClientData] = useState(getInitialData());

    useEffect(() => {
        if (client) {
            setClientData({
                id: client.id,
                name: client.name || '',
                age: client.age || '',
                gender: client.gender || 'Male',
                phone: client.phone || '',
                address: client.address || '',
                therapist_id: client.therapist_id || (therapists.length > 0 ? therapists[0].id : ''),
                status: client.status || 'Open',
                case_history_url: client.case_history_url || '',
                session_summary_url: client.session_summary_url || '',
                case_type: client.case_type || 'Mental Health Support'
            });
        }
    }, [client, isOpen, genders, therapists]);

    const handleChange = (e) => {
        setClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const ageInt = parseInt(clientData.age, 10);
        onEditClient({
            ...clientData,
            therapist_id: parseInt(clientData.therapist_id, 10),
            age: isNaN(ageInt) ? null : ageInt
        });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            onDeleteClient(client.id);
            onClose();
        }
    };

    if (!isOpen || !client) return null;

    const isAdmin = user.role === 'Admin';
    const isTherapist = user.role === 'Therapist';
    const canEdit = isAdmin || (isTherapist && String(client.therapist_id) === String(user.id));

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.editClientModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit Client</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.editClientForm}>
                    <div className={styles.editClientGrid}>
                        <input name="name" value={clientData.name} onChange={handleChange} placeholder="Client Name" required className={styles.input} disabled={!canEdit} />
                        <input name="age" type="number" min="0" value={clientData.age} onChange={handleChange} placeholder="Age" required className={styles.input} disabled={!canEdit} />
                        <select name="gender" value={clientData.gender} onChange={handleChange} className={styles.select} disabled={!canEdit}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Rather not say">Rather not say</option>
                        </select>
                        <input name="phone" type="tel" value={clientData.phone} onChange={handleChange} placeholder="Contact No." required className={styles.input} disabled={!canEdit} />
                        <input name="address" value={clientData.address} onChange={handleChange} placeholder="Address" required className={styles.input} disabled={!canEdit} />
                        <select name="case_type" value={clientData.case_type} onChange={handleChange} className={styles.select} disabled={!canEdit}>
                            <option value="Mental Health Support">Mental Health Support</option>
                            <option value="Academic Counseling">Academic Counseling</option>
                            <option value="Career Counseling">Career Counseling</option>
                            <option value="Personal Counseling">Personal Counseling</option>
                        </select>
                        <select name="therapist_id" value={clientData.therapist_id} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`} required disabled={!isAdmin}>
                            <option value="">Select Therapist</option>
                            {therapists.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                        </select>
                        <select name="status" value={clientData.status} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`} disabled={!canEdit}>
                            {['Open', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className={`${styles.fullWidth} ${styles.documentLinkContainer}`}>
                            <input name="case_history_url" type="url" value={clientData.case_history_url || ''} onChange={handleChange} placeholder="Case History Document URL" className={styles.input} disabled={!canEdit} />
                            {clientData.case_history_url && (
                                <a href={clientData.case_history_url} target="_blank" rel="noopener noreferrer" className={styles.documentPreviewLink}>Test Link</a>
                            )}
                        </div>
                        <div className={`${styles.fullWidth} ${styles.documentLinkContainer}`}>
                            <input name="session_summary_url" type="url" value={clientData.session_summary_url || ''} onChange={handleChange} placeholder="Session Summary Document URL" className={styles.input} disabled={!canEdit} />
                            {clientData.session_summary_url && (
                                <a href={clientData.session_summary_url} target="_blank" rel="noopener noreferrer" className={styles.documentPreviewLink}>Test Link</a>
                            )}
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        {isAdmin && (
                            <button type="button" onClick={handleDelete} className={styles.deleteButton}>Delete Client</button>
                        )}
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default EditClientModal;
