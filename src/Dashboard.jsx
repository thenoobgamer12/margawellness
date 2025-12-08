import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, UserPlus, Download, Upload } from 'lucide-react';
import styles from './Dashboard.module.css';
import CreateClientModal from './CreateClientModal';
import TherapistManagement from './TherapistManagement';
import Settings from './Settings';

const Dashboard = ({ user, onLogout, clients, users, therapists, caseTypes, genders, setExternalClients, onCreateClient, openChangePasswordModal, openAddTherapistModal, openEditClientModal, openEditTherapistModal, openChangeTherapistPasswordModal, openClearDatabaseModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateClientOpen, setCreateClientOpen] = useState(false);
  const [activeView, setActiveView] = useState('clients');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredClients = useMemo(() => clients.filter(client => 
      client && client.clientName &&
      (user.role === 'Admin' || client.counselorId === user.id) &&
      (client.clientName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
      (statusFilter === 'All' || client.status === statusFilter)
  ), [clients, debouncedSearchTerm, statusFilter, user]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleCreateClient = (newClient) => {
    onCreateClient(newClient);
    setCreateClientOpen(false);
  };

  const getCounselorUsername = (counselorId) => {
    const counselor = therapists.find(t => t.id === counselorId);
    return counselor ? counselor.username : 'N/A';
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
            <h1 className={styles.headerTitle}>Admin Dashboard</h1>
            <div className={styles.headerUser}>
                 <p className={styles.welcomeMessage}>Welcome, <strong>{user.username}</strong> ({user.role})</p>
                 <button onClick={openChangePasswordModal} className={styles.changePasswordButton}>Change Password</button>
                 <button onClick={onLogout} className={styles.logoutButton}>Logout</button>
            </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.viewTabs}>
            <button 
                className={`${styles.tabButton} ${activeView === 'clients' ? styles.activeTab : ''}`} 
                onClick={() => setActiveView('clients')}
            >
                Clients
            </button>
            <button 
                className={`${styles.tabButton} ${activeView === 'therapists' ? styles.activeTab : ''}`} 
                onClick={() => setActiveView('therapists')}
            >
                Therapists
            </button>
            <button 
                className={`${styles.tabButton} ${activeView === 'settings' ? styles.activeTab : ''}`} 
                onClick={() => setActiveView('settings')}
            >
                Settings
            </button>
        </div>

        {activeView === 'clients' && (
            <>
                <div className={styles.controls}>
                  <div className={styles.searchGroup}>
                     <Search size={20} className={styles.searchIcon} />
                     <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.searchInput} />
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
                      {user.role === 'Admin' && (
                          <button onClick={() => setCreateClientOpen(true)} className={`${styles.actionButton} ${styles.newClientButton}`}>
                              <UserPlus size={20} /> <span>New Client</span>
                          </button>
                      )}
                    </div>
                </div>

                <div className={styles.clientListContainer}>
                    <div className={styles.clientList}>
                        <div className={styles.clientListHeader}>
                            <p>Client Name</p><p>Age</p><p>Gender</p><p>Counselor</p><p>Status</p><p>Actions</p>
                        </div>
                        {paginatedClients.map((client) => (
                            <div 
                                key={client.id}
                                className={`${styles.clientListItem} ${user.role === 'Admin' ? styles.adminClickable : ''}`}
                                onClick={() => user.role === 'Admin' && openEditClientModal(client)}
                            >
                                <p data-label="Client Name" className={styles.clientNameColumn}>{client.clientName}</p>
                                <p data-label="Age">{client.age}</p>
                                <p data-label="Gender">{client.gender}</p>
                                <p data-label="Counselor">{getCounselorUsername(client.counselorId)}</p>
                                <p data-label="Status"><span className={`${styles.statusBadge} ${client.status === 'Open' ? styles.statusOpen : styles.statusClosed}`}>{client.status}</span></p>
                                <div className={styles.clientActions}>
                                    {user.role === 'Therapist' && (
                                        <button onClick={() => openEditClientModal(client)} className={styles.actionLink}>Edit Docs</button>
                                    )}
                                    <a href={client.caseHistoryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>History</a>
                                    <a href={client.sessionSummaryDocument} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>Summary</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.pagination}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                </div>
            </>
        )}

        {activeView === 'therapists' && (
            <TherapistManagement 
                therapists={therapists}
                openEditTherapistModal={openEditTherapistModal}
                openChangeTherapistPasswordModal={openChangeTherapistPasswordModal}
                openAddTherapistModal={openAddTherapistModal}
            />
        )}

        {activeView === 'settings' && (
            <Settings 
                clients={clients}
                therapists={therapists}
                setExternalClients={setExternalClients}
                openClearDatabaseModal={openClearDatabaseModal}
            />
        )}
      </main>
      
      <CreateClientModal isOpen={isCreateClientOpen} onClose={() => setCreateClientOpen(false)} onCreateClient={handleCreateClient} therapists={therapists} caseTypes={caseTypes} genders={genders} />
    </div>
  );
};

export default Dashboard;