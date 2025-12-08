import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords don't match.");
            return;
        }
        const success = onChangePassword(oldPassword, newPassword);
        if (success) {
            onClose();
        } else {
            setError('Incorrect old password.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.changePasswordModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Change Password</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.changePasswordForm}>
                    {error && <p className={styles.errorText}>{error}</p>}
                    <input
                        type="password"
                        name="oldPassword"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Old Password"
                        required
                        className={styles.input}
                    />
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

export default ChangePasswordModal;
