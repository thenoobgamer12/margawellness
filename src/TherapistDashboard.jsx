import React, { useState, useMemo, useEffect } from 'react';
import { User, Search, Filter, X } from 'lucide-react';
import styles from './Dashboard.module.css';

const TherapistDashboard = ({ user, onLogout, initialClients, openEditClientModal }) => {
  // initialClients is directly used by filteredClients useMemo, no need for local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredClients = useMemo(() => initialClients.filter(client => 
      // Filter clients by counselorId for the logged-in therapist
      client && client.clientName &&
      (client.counselorId === user.id) && // Changed from client.counselor === user.counselor to client.counselorId === user.id
      (client.clientName.toLowerCase().includes(searchTerm.toLowerCase())) && // Removed Case ID from search
      (statusFilter === 'All' || client.status === statusFilter)
  ), [initialClients, searchTerm, statusFilter, user]);

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
             <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.searchInput} /> {/* Case ID removed from placeholder */}
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
            </div>
        </div>

        <div className={styles.clientListContainer}>
            {filteredClients.length > 0 ? (
                <div className={styles.clientList}>
                    <div className={styles.clientListHeader}>
                        {/* Case ID removed */}
                        <p>Client Name</p><p>Age</p><p>Gender</p><p>Status</p><p>Actions</p>
                    </div>
                    {filteredClients.map((client) => (
                        <div key={client.id} className={styles.clientListItem}> {/* Changed key to client.id */}
                            <p className={styles.clientNameColumn}>{client.clientName}</p><p>{client.age}</p><p>{client.gender}</p>
                            <p><span className={`${styles.statusBadge} ${client.status === 'Open' ? styles.statusOpen : styles.statusClosed}`}>{client.status}</span></p>
                            <div className={styles.clientActions}>
                                <button onClick={() => openEditClientModal(client)} className={styles.actionLink}>Edit Docs</button>
                                <a href={client.caseHistoryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>History</a>
                                <a href={client.sessionSummaryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>Summary</a>
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