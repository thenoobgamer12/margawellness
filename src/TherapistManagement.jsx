import React from 'react';
import styles from './Dashboard.module.css';
import { Calendar, UserPlus, Trash } from 'lucide-react';

const TherapistManagement = ({ therapists, openEditTherapistModal, openChangeTherapistPasswordModal, openScheduleModal, openAddTherapistModal, openClearDatabaseModal }) => {
  return (
    <div className={styles.therapistManagement}>
        <div className={styles.controls}>
            <button onClick={openScheduleModal} className={`${styles.actionButton} ${styles.scheduleButton}`}>
                <Calendar size={20} /> <span>View Schedule</span>
            </button>
            <button onClick={openAddTherapistModal} className={`${styles.actionButton} ${styles.addTherapistButton}`}>
                <UserPlus size={20} /> <span>Add Therapist</span>
            </button>
        </div>
      <div className={styles.clientListContainer}>
        <div className={styles.clientList}>
          <div className={styles.clientListHeader}>
            <p>Username</p>
            <p>Actions</p>
          </div>
          {therapists.map((therapist) => (
            <div key={therapist.id} className={styles.clientListItem}>
              <p data-label="Username">{therapist.username}</p>
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
