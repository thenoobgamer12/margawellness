import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, UserPlus, Calendar, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './Dashboard.module.css';
import ScheduleModal from './ScheduleModal';
import CreateClientModal from './CreateClientModal';
import TherapistManagement from './TherapistManagement';
import Settings from './Settings';

const Dashboard = ({ user, onLogout, clients, therapists, caseTypes, genders, setExternalClients, openChangePasswordModal, openAddTherapistModal, openEditClientModal, openEditTherapistModal, openChangeTherapistPasswordModal, openScheduleModal, openClearDatabaseModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateClientOpen, setCreateClientOpen] = useState(false);
  // const [schedule, setSchedule] = useState({}); // Removed, schedule is handled by ScheduleModal
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
      client && client.name && client.id && // Changed clientName to name, caseId to id
      (user.role === 'Admin' || String(client.therapist_id) === String(user.id)) && // Changed counselor to therapist_id, comparing with user.id
      (client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || String(client.id).includes(debouncedSearchTerm)) &&
      (statusFilter === 'All' || client.status === statusFilter) // Assuming status is still part of client data
  ), [clients, debouncedSearchTerm, statusFilter, user]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleCreateClient = async (newClient) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Authentication required to create client.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3002/clients', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newClient)
        });
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message || 'Failed to create client.');
            return;
        }
        
        setExternalClients([data, ...clients]); // Assuming API returns the created client
        alert('Client created successfully!');
    } catch (error) {
        console.error("Error creating client:", error);
        alert('Network error or server unavailable.');
    }
  };

  // const therapistUsers = useMemo(() => users.filter(u => u.role === 'Therapist'), [users]); // Removed, now using 'therapists' prop directly

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
                            <p>ID</p><p>Client Name</p><p>Age</p><p>Gender</p><p>Therapist</p><p>Status</p>
                        </div>
                        {paginatedClients.map((client) => {
                            const isClickable = user.role === 'Admin' || (user.role === 'Therapist' && String(client.therapist_id) === String(user.id));
                            return (
                                <div 
                                    key={client.id} 
                                    className={`${styles.clientListItem} ${isClickable ? styles.adminClickable : ''}`}
                                    onClick={() => isClickable && openEditClientModal(client)}
                                >
                                    <p data-label="ID">{client.id}</p>
                                    <p data-label="Client Name" className={styles.clientNameColumn}>{client.name}</p>
                                    <p data-label="Age">{client.age}</p>
                                    <p data-label="Gender">{client.gender}</p>
                                    <p data-label="Therapist">{therapists.find(t => t.id === client.therapist_id)?.username || 'N/A'}</p>
                                    <p data-label="Status"><span className={`${styles.statusBadge} ${client.status === 'Open' ? styles.statusOpen : styles.statusClosed}`}>{client.status}</span></p>
                                </div>
                            );
                        })}
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
                therapists={therapists} // Changed from therapistUsers
                openEditTherapistModal={openEditTherapistModal}
                openChangeTherapistPasswordModal={openChangeTherapistPasswordModal}
                openScheduleModal={openScheduleModal}
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
