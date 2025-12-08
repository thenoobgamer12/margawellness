import React, { useState } from 'react';
import styles from './Dashboard.module.css';
import { X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleConfirm = () => {
        onConfirm(dontShowAgain);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.deleteConfirmModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Confirm Deletion</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <div>
                    <p>Are you sure you want to delete this {itemType}? This action cannot be undone.</p>
                    <div className={styles.checkboxContainer}>
                        <input 
                            type="checkbox" 
                            id="dontShowAgain" 
                            checked={dontShowAgain} 
                            onChange={(e) => setDontShowAgain(e.target.checked)} 
                        />
                        <label htmlFor="dontShowAgain">Don't show this warning again</label>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="button" onClick={handleConfirm} className={styles.deleteButton}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
