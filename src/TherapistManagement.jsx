import React from 'react';
import styles from './Dashboard.module.css';
import { UserPlus, Trash } from 'lucide-react';

const TherapistManagement = ({ therapists, openEditTherapistModal, openChangeTherapistPasswordModal, openAddTherapistModal, openClearDatabaseModal }) => {
  return (
    <div className={styles.therapistManagement}>
        <div className={styles.controls}>
            <button onClick={openAddTherapistModal} className={`${styles.actionButton} ${styles.addTherapistButton}`}>
                <UserPlus size={20} /> <span>Add Therapist</span>
            </button>
        </div>
      <div className={styles.clientListContainer}>
        <div className={styles.clientList}>
          <div className={styles.clientListHeader}>
            <p>Username</p> {/* Changed from Name to Username */}
            <p>Role</p> {/* Added Role to display */}
            <p>Actions</p>
          </div>
          {therapists.map((therapist) => (
            <div key={therapist.id} className={styles.clientListItem}>
              <p>{therapist.username}</p> {/* Changed from therapist.counselor to therapist.username */}
              <p>{therapist.role}</p> {/* Display role */}
              <div className={styles.clientActions}>
                <button onClick={() => openEditTherapistModal(therapist)} className={styles.actionLink}>Edit</button>
                <button onClick={() => openChangeTherapistPasswordModal(therapist)} className={styles.actionLink}>Change Password</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TherapistManagement;