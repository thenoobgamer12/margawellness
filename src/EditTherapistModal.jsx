import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const EditTherapistModal = ({ isOpen, onClose, therapist, onEditTherapist, onDeleteTherapist }) => {
    const [therapistData, setTherapistData] = useState(therapist || {});

    useEffect(() => {
        if (therapist) {
            setTherapistData(therapist);
        }
    }, [therapist]);

    const handleChange = (e) => {
        setTherapistData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onEditTherapist(therapistData);
        onClose();
    };

    const handleDelete = () => {
        onDeleteTherapist(therapist.id);
        onClose();
    };

    if (!isOpen || !therapist) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.editTherapistModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit User</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.editTherapistForm}>
                    <input
                        name="username"
                        value={therapistData.username || ''}
                        onChange={handleChange}
                        placeholder="Username"
                        required
                        className={styles.input}
                    />
                    <select
                        name="role"
                        value={therapistData.role || 'Therapist'}
                        onChange={handleChange}
                        required
                        className={styles.select}
                        disabled={therapistData.role === 'Admin'} // Disable if user is an Admin
                    >
                        <option value="Therapist">Therapist</option>
                        {/* Admin option removed to prevent changing roles to Admin via UI */}
                    </select>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={handleDelete} className={styles.deleteButton}>Delete User</button>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTherapistModal;
