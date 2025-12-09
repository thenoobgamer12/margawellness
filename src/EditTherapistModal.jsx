import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const EditTherapistModal = ({ isOpen, onClose, therapist, onEditTherapist, onDeleteTherapist }) => {
    // Initialize with only relevant therapist data
    const [therapistData, setTherapistData] = useState({
        id: therapist?.id || '',
        username: therapist?.username || '',
        role: therapist?.role || ''
    });

    useEffect(() => {
        if (therapist) {
            setTherapistData({
                id: therapist.id,
                username: therapist.username,
                role: therapist.role
            });
        }
    }, [therapist]);

    const handleChange = (e) => {
        setTherapistData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onEditTherapist({ id: therapistData.id, username: therapistData.username, role: therapistData.role });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this therapist? This action cannot be undone.')) {
            onDeleteTherapist(therapist.id);
            onClose();
        }
    };

    if (!isOpen || !therapist) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.editTherapistModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit Therapist</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.editTherapistForm}>
                    {/* Removed Full Name input as 'counselor' field is gone and not part of user schema */}
                    <input
                        name="username"
                        value={therapistData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        required
                        className={styles.input}
                    />
                    {/* Role might also be editable if needed, but for now, it's just username */}
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={handleDelete} className={styles.deleteButton}>Delete Therapist</button>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTherapistModal;
