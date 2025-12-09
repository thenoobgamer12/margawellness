import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const ChangeTherapistPasswordModal = ({ isOpen, onClose, therapist, onChangePassword }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords don't match.");
            return;
        }
        onChangePassword(therapist.id, newPassword);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.changePasswordModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Change Password for {therapist.username}</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.changePasswordForm}>
                    {error && <p className={styles.errorText}>{error}</p>}
                    <input
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        required
                        className={styles.input}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        required
                        className={styles.input}
                    />
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Change Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeTherapistPasswordModal;
