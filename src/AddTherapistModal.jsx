import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const AddTherapistModal = ({ isOpen, onClose, onAddTherapist }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // Role state is removed as we are hardcoding it to 'Therapist' for security.

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddTherapist({
            username,
            password,
            role: 'Therapist', // Hardcode role to 'Therapist'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.addTherapistModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Add New Therapist</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.addTherapistForm}>
                    <input
                        type="text"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                        className={styles.input}
                    />
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className={styles.input}
                    />
                    {/* Role dropdown removed to prevent creating Admins from this UI. */}
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Add Therapist</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTherapistModal;