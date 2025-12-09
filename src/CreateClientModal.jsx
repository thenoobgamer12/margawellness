import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Dashboard.module.css';

const CreateClientModal = ({ isOpen, onClose, onCreateClient, therapists, caseTypes, genders }) => {
    const [clientData, setClientData] = useState({
        name: '',
        age: '',
        gender: '',
        phone: '',
        address: '',
        therapist_id: '',
        case_type: ''
    });

    useEffect(() => {
        // Set initial values from props or defaults when modal opens
        if (isOpen) {
            setClientData({
                name: '',
                age: '',
                gender: 'Male', // Default to first option
                phone: '',
                address: '',
                therapist_id: therapists.length > 0 ? therapists[0].id : '',
                case_type: 'Mental Health Support'
            });
        }
    }, [isOpen, genders, therapists]);

    const handleChange = (e) => {
        setClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const ageInt = parseInt(clientData.age, 10);
        onCreateClient({
            ...clientData,
            therapist_id: parseInt(clientData.therapist_id, 10),
            age: isNaN(ageInt) ? null : ageInt
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
                        <input name="name" value={clientData.name} onChange={handleChange} placeholder="Client Name" required className={styles.input} />
                        <input name="age" type="number" min="0" value={clientData.age} onChange={handleChange} placeholder="Age" required className={styles.input} />
                        <select name="gender" value={clientData.gender} onChange={handleChange} className={styles.select}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Rather not say">Rather not say</option>
                        </select>
                        <input name="phone" type="tel" value={clientData.phone} onChange={handleChange} placeholder="Contact No." required className={styles.input} />
                        <input name="address" value={clientData.address} onChange={handleChange} placeholder="Address" required className={styles.input} />
                        <select name="case_type" value={clientData.case_type} onChange={handleChange} className={styles.select} required>
                            <option value="Mental Health Support">Mental Health Support</option>
                            <option value="Academic Counseling">Academic Counseling</option>
                            <option value="Career Counseling">Career Counseling</option>
                            <option value="Personal Counseling">Personal Counseling</option>
                        </select>
                        <select name="therapist_id" value={clientData.therapist_id} onChange={handleChange} className={`${styles.select} ${styles.fullWidth}`} required>
                            <option value="">Select Therapist</option>
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
