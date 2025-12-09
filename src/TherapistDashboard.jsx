import React, { useState, useMemo } from 'react';
import { Calendar, User, Search, Filter, X } from 'lucide-react';
import styles from './Dashboard.module.css';

const TherapistDashboard = ({ user, onLogout, clients, openEditClientModal, openScheduleModal }) => { // Changed initialClients to clients
  // const [clients] = useState(initialClients); // Removed local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredClients = useMemo(() => clients.filter(client => 
      (String(client.therapist_id) === String(user.id)) && // Filter by therapist_id
      (client.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(client.id).includes(searchTerm)) && // Changed clientName to name, caseId to id
      (statusFilter === 'All' || client.status === statusFilter)
  ), [clients, searchTerm, statusFilter, user]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
            <h1 className={styles.headerTitle}>Therapist Dashboard</h1>
            <div className={styles.headerUser}>
                 <p className={styles.welcomeMessage}>Welcome, <strong>{user.username}</strong></p>
                 <button onClick={onLogout} className={styles.logoutButton}>Logout</button>
            </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.controls}>
          <div className={styles.searchGroup}>
             <Search size={20} className={styles.searchIcon} />
             <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.searchInput} />
          </div>
          <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <Filter size={20} className={styles.filterIcon} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.select}>
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                </select>
              </div>
              <button onClick={openScheduleModal} className={`${styles.actionButton} ${styles.scheduleButton}`}>
                <Calendar size={20} /> <span>View Schedule</span>
              </button>
            </div>
        </div>

        <div className={styles.clientListContainer}>
            {filteredClients.length > 0 ? (
                <div className={styles.clientList}>
                    <div className={styles.clientListHeader}>
                        <p>ID</p><p>Client Name</p><p>DOB</p><p>Gender</p><p>Status</p><p>Actions</p>
                    </div>
                    {filteredClients.map((client) => (
                        <div key={client.id} className={styles.clientListItem}>
                            <p data-label="ID">{client.id}</p>
                            <p data-label="Client Name" className={styles.clientNameColumn}>{client.name}</p>
                            <p data-label="DOB">{client.dob}</p>
                            <p data-label="Gender">{client.gender}</p>
                            <p data-label="Status"><span className={`${styles.statusBadge} ${client.status === 'Open' ? styles.statusOpen : styles.statusClosed}`}>{client.status}</span></p>
                            <div className={styles.clientActions}>
                                <button onClick={() => openEditClientModal(client)} className={styles.actionLink}>Edit Docs</button>
                                {/* Assuming documents are stored as URLs or handled differently now */}
                                {/* <a href={client.caseHistoryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>History</a>
                                <a href={client.sessionSummaryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>Summary</a> */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (<div className={styles.noClients}><p>No clients found.</p></div>)}
        </div>
      </main>
    </div>
  );
};

export default TherapistDashboard;
