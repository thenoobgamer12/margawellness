import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import ChangePasswordModal from './ChangePasswordModal';
import AddTherapistModal from './AddTherapistModal';
import EditClientModal from './EditClientModal';
import ScheduleModal from './ScheduleModal';
import CreateClientModal from './CreateClientModal';
import TherapistDashboard from './TherapistDashboard';
import Dashboard from './Dashboard';
import EditTherapistModal from './EditTherapistModal';
import ChangeTherapistPasswordModal from './ChangeTherapistPasswordModal';
import ClearDatabaseModal from './ClearDatabaseModal';
import styles from './Dashboard.module.css'; // Still needed for some styles

function App() {
  const [user, setUser] = useState(null); // User object from JWT payload
  const [clients, setClients] = useState([]);
  const [therapists, setTherapists] = useState([]); // Therapists are users with role 'Therapist'
  const [caseTypes, setCaseTypes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [schedule, setSchedule] = useState({}); // Schedule will be handled in ScheduleModal or fetched on demand

  // Check for stored token and user on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch data from new backend
  useEffect(() => {
    const fetchData = async () => {
      if (!user) { // Only fetch if user is logged in
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      try {
        const [clientsRes, usersRes] = await Promise.all([
          fetch('http://localhost:3002/clients', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          // Assuming /users endpoint returns all users, including therapists and admins
          // A dedicated /therapists endpoint might be better in a real app
          fetch('http://localhost:3002/users', { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (!clientsRes.ok) {
          throw new Error(`HTTP error! Clients status: ${clientsRes.status}`);
        }
        if (!usersRes.ok) {
            throw new Error(`HTTP error! Users status: ${usersRes.status}`);
        }

        const clientsData = await clientsRes.json();
        const usersData = await usersRes.json();
        
        setClients(clientsData);
        
        // Filter users to get therapists
        const therapistUsers = usersData.filter(u => u.role === 'Therapist');
        setTherapists(therapistUsers);
        
        // Dynamically generate case types and genders from client data
        setCaseTypes([...new Set(clientsData.map(c => c.caseType).filter(Boolean))]); // filter(Boolean) removes undefined/null
        setGenders([...new Set(clientsData.map(c => c.gender).filter(Boolean))]);

      } catch (e) {
        console.error("Error fetching initial data:", e);
        setError(e.message);
        // If token is invalid or expired, log out the user
        if (e.message.includes('401') || e.message.includes('403')) {
            handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]); // Re-run effect when user state changes (e.g., after login/logout)

  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isAddTherapistOpen, setAddTherapistOpen] = useState(false);
  const [isEditClientOpen, setEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isEditTherapistOpen, setEditTherapistOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState(null);
  const [isChangeTherapistPasswordOpen, setChangeTherapistPasswordOpen] = useState(false);
  const [isClearDatabaseOpen, setClearDatabaseOpen] = useState(false);
  const [isScheduleOpen, setScheduleOpen] = useState(false); // Moved here

  // Removed deleteWarning state as it's client-side specific and will be handled by API responses

  const handleLogin = (loggedInUser) => {
    // LoginPage now handles storing token and user in localStorage
    // We just need to update the user state in App.jsx
    setUser(loggedInUser);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setClients([]); // Clear client data on logout
    setTherapists([]); // Clear therapist data on logout
  };
  
  const handleSetClients = (newClients) => {
    setClients(newClients);
  };

  const handleDeleteClient = async (clientId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to delete client.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setClients(clients.filter(c => c.id !== clientId));
      alert('Client deleted successfully.');
    } catch (error) {
      console.error("Error deleting client:", error);
      setError('Failed to delete client.');
    }
  };

  const handleDeleteTherapist = async (therapistId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to delete therapist.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/users/${therapistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setTherapists(therapists.filter(t => t.id !== therapistId));
      alert('Therapist deleted successfully.');
    } catch (error) {
      console.error("Error deleting therapist:", error);
      setError('Failed to delete therapist.');
    }
  };

  const handleClearDatabase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to clear database.');
        return;
    }

    try {
        // This assumes you have an admin endpoint for clearing data
        // You might want to implement a more granular clear or separate endpoints for clients, schedule, etc.
        const response = await fetch('http://localhost:3002/admin/clear-database', { // Assuming a new endpoint for this
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Optionally send confirmation or password if required by backend
            body: JSON.stringify({ confirm: true }) 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setClients([]);
        setTherapists([]);
        // setSchedule({}); // If schedule is handled in App.jsx

        alert('Database cleared successfully.');
    } catch (error) {
        console.error('Error clearing database:', error);
        setError('Failed to clear database. Make sure you are an Admin.');
    }
  };
  
  const handleChangePassword = async (oldPassword, newPassword) => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to change password.');
        return false;
    }

    try {
        const response = await fetch(`http://localhost:3002/users/${user.id}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Failed to change password.');
            return false;
        }

        alert('Password changed successfully.');
        // Optionally, re-login user to get a new token if backend issues one on password change
        // Or update local user object if only password hash changed on backend.
        // For simplicity, we'll just assume success for now.
        return true;
    } catch (error) {
        console.error("Error changing password:", error);
        setError('Network error or server unavailable.');
        return false;
    }
  };

  const handleAddTherapist = async (therapistData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to add therapist.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3002/register', { // Use the register endpoint for new users
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Admin adding a user
            },
            body: JSON.stringify({ 
                username: therapistData.username, 
                password: therapistData.password, // Raw password sent to backend for hashing
                role: 'Therapist',
                // other therapist specific fields if any for profile, e.g., counselor_name, etc.
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Failed to add therapist.');
            return;
        }
        
        // Assuming the register endpoint returns the created user object
        // For therapist, we might also need to add specific therapist profile details
        // For now, let's just add the user to the therapists list
        setTherapists(prev => [...prev, { id: data.id, username: data.username, role: data.role }]);
        alert('Therapist added successfully!');
    } catch (error) {
        console.error("Error adding therapist:", error);
        setError('Network error or server unavailable.');
    }
  };

  const handleEditClient = async (updatedClient) => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to edit client.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3002/clients/${updatedClient.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedClient)
        });
        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Failed to edit client.');
            return;
        }

        setClients(clients.map(c => 
          c.id === data.id ? data : c
        ));
        alert("Client updated successfully.");
    } catch (error) {
        console.error("Error editing client:", error);
        setError('Network error or server unavailable.');
    }
  };

  const handleEditTherapist = async (updatedTherapist) => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to edit therapist.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3002/users/${updatedTherapist.id}`, { // Assuming a /users/:id PUT for updating user details
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                username: updatedTherapist.username, 
                role: updatedTherapist.role // Role might also be updatable
                // Add other therapist-specific fields here if they exist in the therapist profile
            })
        });
        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Failed to edit therapist.');
            return;
        }

        setTherapists(therapists.map(t => 
          t.id === data.id ? data : t
        ));
        alert("Therapist updated successfully.");
    } catch (error) {
        console.error("Error editing therapist:", error);
        setError('Network error or server unavailable.');
    }
  };

  const handleChangeTherapistPassword = async (therapistId, newPassword) => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication required to change therapist password.');
        return false;
    }

    try {
        const response = await fetch(`http://localhost:3002/users/${therapistId}/change-password`, { // Assuming a specific endpoint for changing other user's passwords
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword }) // No oldPassword needed for admin changing another's password
        });
        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Failed to change therapist password.');
            return false;
        }

        alert("Therapist password changed successfully.");
        return true;
    } catch (error) {
        console.error("Error changing therapist password:", error);
        setError('Network error or server unavailable.');
        return false;
    }
  };

  const openEditClientModal = (client) => {
    setEditingClient(client);
    setEditClientOpen(true);
  };

  const closeEditClientModal = () => {
    setEditingClient(null);
    setEditClientOpen(false);
  };

  const openEditTherapistModal = (therapist) => {
    setEditingTherapist(therapist);
    setEditTherapistOpen(true);
  };

  const closeEditTherapistModal = () => {
    setEditingTherapist(null);
    setEditTherapistOpen(false);
  };

  const openChangeTherapistPasswordModal = (therapist) => {
    setEditingTherapist(therapist);
    setChangeTherapistPasswordOpen(true);
  };

  const closeChangeTherapistPasswordModal = () => {
    setEditingTherapist(null);
    setChangeTherapistPasswordOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className={styles.errorText}>Error loading data: {error}</div>; // Use existing style
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />; // No users prop needed
  }

  return (
    <>
      {user.role === 'Admin' ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          clients={clients}
          // users={users} // Removed, now derived from therapists or fetched directly in Dashboard if needed
          therapists={therapists} 
          caseTypes={caseTypes} 
          genders={genders} 
          setExternalClients={handleSetClients}
          openChangePasswordModal={() => setChangePasswordOpen(true)}
          openAddTherapistModal={() => setAddTherapistOpen(true)}
          openEditClientModal={openEditClientModal}
          openEditTherapistModal={openEditTherapistModal}
          openChangeTherapistPasswordModal={openChangeTherapistPasswordModal}
          openScheduleModal={() => setScheduleOpen(true)}
          openClearDatabaseModal={() => setClearDatabaseOpen(true)}
        />
      ) : (
        <TherapistDashboard 
          user={user} 
          onLogout={handleLogout} 
          initialClients={clients} 
          openEditClientModal={openEditClientModal}
          openScheduleModal={() => setScheduleOpen(true)}
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
      <ScheduleModal 
        isOpen={isScheduleOpen} 
        onClose={() => setScheduleOpen(false)} 
        user={user} 
        clients={clients} 
        therapists={therapists} 
        // schedule={schedule} // Removed schedule prop as it's not being fetched globally anymore
        // setSchedule={setSchedule} // Removed
      />
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