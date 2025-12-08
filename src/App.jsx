import React, { useState, useMemo, useEffect } from 'react';
import LoginPage from './LoginPage';
import ChangePasswordModal from './ChangePasswordModal';
import AddTherapistModal from './AddTherapistModal';
import EditClientModal from './EditClientModal';
// import ScheduleModal from './ScheduleModal'; // Removed
import CreateClientModal from './CreateClientModal';
import TherapistDashboard from './TherapistDashboard';
import Dashboard from './Dashboard';
import EditTherapistModal from './EditTherapistModal';
import ChangeTherapistPasswordModal from './ChangeTherapistPasswordModal';
import ClearDatabaseModal from './ClearDatabaseModal';
import styles from './Dashboard.module.css';

const API_BASE_URL = 'http://localhost:3002/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [isScheduleOpen, setScheduleOpen] = useState(false); // Removed

  // Helper function for audit logging
  const logAudit = async (action, targetType = null, targetId = null, details = null) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action,
          targetType,
          targetId,
          details
        })
      });
    } catch (logError) {
      console.error('Failed to send audit log:', logError);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, clientsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/clients`),
        ]);
        if (!usersRes.ok || !clientsRes.ok) {
          throw new Error(`HTTP error! Status: ${usersRes.status}/${clientsRes.status}`);
        }
        const usersData = await usersRes.json();
        const clientsData = await clientsRes.json();
        
        setUsers(usersData);
        setClients(clientsData);
        
        setTherapists(usersData.filter(u => u.role === 'Therapist'));
        
        setCaseTypes([...new Set(clientsData.map(c => c.caseType))]);
        setGenders([...new Set(clientsData.map(c => c.gender))]);

      } catch (e) {
        setError(e.message);
        console.error("Error fetching initial data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isAddTherapistOpen, setAddTherapistOpen] = useState(false);
  const [isEditClientOpen, setEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isEditTherapistOpen, setEditTherapistOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState(null);
  const [isChangeTherapistPasswordOpen, setChangeTherapistPasswordOpen] = useState(false);
  const [isClearDatabaseOpen, setClearDatabaseOpen] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState({ count: 0, show: true });

  const handleLogin = async (loggedInUser) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loggedInUser)
        });

        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('LOGIN_FAILURE', 'user', null, `Attempted login for username: ${loggedInUser.username}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        await logAudit('LOGIN_SUCCESS', 'user', data.user.id, `User ${data.user.username} logged in.`);
        return true;
    } catch (error) {
        console.error("Login error:", error);
        alert(error.message);
        return false;
    }
  };
  
  const handleLogout = () => {
    logAudit('LOGOUT', 'user', user.id, `User ${user.username} logged out.`);
    setUser(null);
    setToken(null);
  };
  
  const handleSetClients = (newClients) => {
    setClients(newClients);
  };

  const handleCreateClient = async (newClient) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });
        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('CREATE_CLIENT_FAILURE', 'client', null, `Failed to create client ${newClient.clientName}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(errorData.message || 'Failed to create client');
        }
        const createdClient = await response.json();
        setClients(prevClients => [...prevClients, createdClient]);
        await logAudit('CREATE_CLIENT_SUCCESS', 'client', createdClient.id, `Client ${createdClient.clientName} created.`);
        return true;
    } catch (error) {
        console.error("Error creating client:", error);
        alert(`Error creating client: ${error.message}`);
        return false;
    }
  };

  const handleDeleteClient = async (clientId) => {
    const performDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete client');
            setClients(clients.filter(c => c.id !== clientId));
            await logAudit('DELETE_CLIENT_SUCCESS', 'client', clientId, `Client ID ${clientId} deleted.`);
        } catch (error) {
            console.error("Error deleting client:", error);
            alert(`Error deleting client: ${error.message}`);
            await logAudit('DELETE_CLIENT_FAILURE', 'client', clientId, `Failed to delete client ID ${clientId}. Reason: ${error.message}`);
        }
    };

    // Note: The backend will cascade delete appointments.
    if (deleteWarning.show) {
        if (window.confirm("Are you sure you want to delete this client?")) {
            await performDelete();
            setDeleteWarning({ count: 1, show: false });
        }
    } else {
        if (deleteWarning.count < 5) {
            await performDelete();
            setDeleteWarning(prev => ({ ...prev, count: prev.count + 1 }));
        } else {
            if (window.confirm("You have deleted several items. Are you sure you want to continue?")) {
                await performDelete();
                setDeleteWarning({ count: 0, show: true });
            }
        }
    }
  };

  const handleDeleteTherapist = async (therapistId) => {
    const performDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${therapistId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete therapist');
            setUsers(users.filter(u => u.id !== therapistId));
            setTherapists(therapists.filter(t => t.id !== therapistId));
            await logAudit('DELETE_THERAPIST_SUCCESS', 'user', therapistId, `Therapist ID ${therapistId} deleted.`);
        } catch (error) {
            console.error("Error deleting therapist:", error);
            alert(`Error deleting therapist: ${error.message}`);
            await logAudit('DELETE_THERAPIST_FAILURE', 'user', therapistId, `Failed to delete therapist ID ${therapistId}. Reason: ${error.message}`);
        }
    };

    // Note: The backend will cascade delete appointments.
    if (deleteWarning.show) {
        if (window.confirm("Are you sure you want to delete this therapist?")) {
            await performDelete();
            setDeleteWarning({ count: 1, show: false });
        }
    } else {
        if (deleteWarning.count < 5) {
            await performDelete();
            setDeleteWarning(prev => ({ ...prev, count: prev.count + 1 }));
        } else {
            if (window.confirm("You have deleted several items. Are you sure you want to continue?")) {
                await performDelete();
                setDeleteWarning({ count: 0, show: true });
            }
        }
    }
  };

  const handleClearDatabase = async (password) => {
    if (user.role !== 'Admin') {
        alert('Only admins can perform this action.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/system/clear-database`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to clear database');
        }
        setClients([]);
        alert('Client and schedule data cleared successfully!');
    } catch (error) {
        console.error("Error clearing database:", error);
        alert(`Error clearing database: ${error.message}`);
    }
  };
  
  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${user.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, password: newPassword })
        });

        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('CHANGE_PASSWORD_FAILURE', 'user', user.id, `Failed to change own password for ${user.username}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(errorData.message || 'Failed to change password');
        }

        alert('Password changed successfully!');
        await logAudit('CHANGE_PASSWORD_SUCCESS', 'user', user.id, `User ${user.username} changed own password.`);
        return true;
    } catch (error) {
        console.error("Error changing password:", error);
        alert(`Error changing password: ${error.message}`);
        return false;
    }
  };

  const handleAddTherapist = async (therapistData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: therapistData.username, 
                password: therapistData.password,
                role: 'Therapist' 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('CREATE_THERAPIST_FAILURE', 'user', null, `Failed to add therapist ${therapistData.username}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(`Could not add therapist. ${errorData.message || ''}`);
        }

        const addedUser = await response.json();
        setUsers(prevUsers => [...prevUsers, addedUser.user]);
        setTherapists(prev => [...prev, addedUser.user]);
        alert('Therapist added successfully!');
        await logAudit('CREATE_THERAPIST_SUCCESS', 'user', addedUser.user.id, `Therapist ${addedUser.user.username} created.`);
    } catch (error) {
        console.error("Error adding therapist:", error);
        alert(`Error adding therapist: ${error.message}`);
    }
  };

  const handleEditClient = async (updatedClient) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients/${updatedClient.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClient)
        });
        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('EDIT_CLIENT_FAILURE', 'client', updatedClient.id, `Failed to edit client ${updatedClient.clientName}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(errorData.message || 'Failed to edit client');
        }
        const returnedClient = await response.json();

        setClients(clients.map(c => c.id === returnedClient.id ? returnedClient : c));
        await logAudit('EDIT_CLIENT_SUCCESS', 'client', returnedClient.id, `Client ${returnedClient.clientName} edited.`);
    } catch (error) {
        console.error("Error editing client:", error);
        alert(`Error editing client: ${error.message}`);
    }
  };

  const handleEditTherapist = async (updatedTherapist) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${updatedTherapist.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: updatedTherapist.username, role: updatedTherapist.role })
        });
        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('EDIT_THERAPIST_FAILURE', 'user', updatedTherapist.id, `Failed to edit therapist ${updatedTherapist.username}. Reason: ${errorData.message || 'Unknown'}`);
            throw new Error(errorData.message || 'Failed to edit therapist');
        }
        const returnedTherapist = await response.json();

        const updatedUsers = users.map(u => u.id === returnedTherapist.id ? returnedTherapist : u);
        setUsers(updatedUsers);
        setTherapists(updatedUsers.filter(u => u.role === 'Therapist'));
        await logAudit('EDIT_THERAPIST_SUCCESS', 'user', returnedTherapist.id, `Therapist ${returnedTherapist.username} edited.`);
    } catch (error) {
        console.error("Error editing therapist:", error);
        alert(`Error editing therapist: ${error.message}`);
    }
  };

  const handleChangeTherapistPassword = async (therapist, newPassword) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${therapist.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });

        if (!response.ok) {
            const errorData = await response.json();
            await logAudit('CHANGE_THERAPIST_PASSWORD_FAILURE', 'user', therapist.id, `Failed to change password for therapist ${therapist.username}. Reason: ${errorData.message || ''}`);
            throw new Error(`Could not change password. ${errorData.message || ''}`);
        }

        alert("Password changed successfully for therapist:", therapist.username);
        await logAudit('CHANGE_THERAPIST_PASSWORD_SUCCESS', 'user', therapist.id, `Password changed for therapist ${therapist.username}.`);
    } catch (error) {
        console.error("Error changing password:", error);
        alert(`Error changing password: ${error.message}`);
    }
  };

  const openEditClientModal = (client) => {
    setEditingClient(client);
    setEditClientOpen(true);
    logAudit('VIEW_CLIENT_DETAILS', 'client', client.id, `Viewed client ${client.clientName} details.`);
  };

  const closeEditClientModal = () => {
    setEditingClient(null);
    setEditClientOpen(false);
  };

  const openEditTherapistModal = (therapist) => {
    setEditingTherapist(therapist);
    setEditTherapistOpen(true);
    logAudit('VIEW_THERAPIST_DETAILS', 'user', therapist.id, `Viewed therapist ${therapist.username} details.`);
  };

  const closeEditTherapistModal = () => {
    setEditingTherapist(null);
    setEditTherapistOpen(false);
  };

  const openChangeTherapistPasswordModal = (therapist) => {
    setEditingTherapist(therapist);
    setChangeTherapistPasswordOpen(true);
    logAudit('VIEW_CHANGE_THERAPIST_PASSWORD', 'user', therapist.id, `Opened change password for therapist ${therapist.username}.`);
  };

  const closeChangeTherapistPasswordModal = () => {
    setEditingTherapist(null);
    setChangeTherapistPasswordOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data: {error}</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      {user.role === 'Admin' ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          clients={clients}
          users={users}
          therapists={therapists} 
          caseTypes={caseTypes} 
          genders={genders} 
          setExternalClients={setClients}
          onCreateClient={handleCreateClient}
          openChangePasswordModal={() => setChangePasswordOpen(true)}
          openAddTherapistModal={() => setAddTherapistOpen(true)}
          openEditClientModal={openEditClientModal}
          openEditTherapistModal={openEditTherapistModal}
          openChangeTherapistPasswordModal={openChangeTherapistPasswordModal}
          openClearDatabaseModal={() => setClearDatabaseOpen(true)}
        />
      ) : (
        <TherapistDashboard 
          user={user} 
          onLogout={handleLogout} 
          initialClients={clients}
          openEditClientModal={openEditClientModal}
          clients={clients}
          therapists={therapists}
        />
      )}

      <ClearDatabaseModal
        isOpen={isClearDatabaseOpen}
        onClose={() => setClearDatabaseOpen(false)}
        onConfirm={handleClearDatabase}
      />
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)} 
        onChangePassword={handleChangePassword}
      />
      <AddTherapistModal
        isOpen={isAddTherapistOpen}
        onClose={() => setAddTherapistOpen(false)}
        onAddTherapist={handleAddTherapist}
      />
      <EditClientModal
        isOpen={isEditClientOpen}
        onClose={closeEditClientModal}
        client={editingClient}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
        therapists={therapists}
        caseTypes={caseTypes}
        genders={genders}
        user={user}
      />
      {/* ScheduleModal component removed */}
      <EditTherapistModal
        isOpen={isEditTherapistOpen}
        onClose={closeEditTherapistModal}
        therapist={editingTherapist}
        onEditTherapist={handleEditTherapist}
        onDeleteTherapist={handleDeleteTherapist}
      />
      <ChangeTherapistPasswordModal
        isOpen={isChangeTherapistPasswordOpen}
        onClose={closeChangeTherapistPasswordModal}
        therapist={editingTherapist}
        onChangePassword={handleChangeTherapistPassword}
      />
    </>
  );
}

export default App;