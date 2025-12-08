import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const ClearDatabaseModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    const [isConfirming, setIsConfirming] = useState(true);

    const handleConfirm = () => {
        setIsConfirming(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.clearDatabaseModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Clear Database</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                {isConfirming ? (
                    <div>
                        <p>Are you sure you want to clear the database? This action cannot be undone.</p>
                        <div className={styles.modalFooter}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                            <button type="button" onClick={handleConfirm} className={styles.submitButton}>Clear Database</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p>Please enter the admin password to confirm.</p>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin Password"
                            required
                            className={styles.input}
                        />
                        <div className={styles.modalFooter}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                            <button type="submit" className={styles.submitButton}>Confirm Clear Database</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ClearDatabaseModal;
