import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './Dashboard.module.css';

const generateTimeSlots = () => {
    const slots = [];
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(20, 0, 0, 0);

    while (startTime < endTime) {
        slots.push(startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        startTime.setMinutes(startTime.getMinutes() + 45);
    }
    return slots;
};
const timeSlots = generateTimeSlots();

const ScheduleModal = ({ isOpen, onClose, user, clients, therapists }) => { 
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTherapistId, setSelectedTherapistId] = useState(
        user.role === 'Admin' && therapists.length > 0 ? therapists[0].id : (user.role === 'Therapist' ? user.id : '')
    );
    const [selectedClient, setSelectedClient] = useState('');
    const [appointments, setAppointments] = useState({}); 
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [error, setError] = useState(null);

    // Helper to get local YYYY-MM-DD key
    const getLocalDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch appointments for the selected date and therapist
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!selectedTherapistId || !selectedDate || !isOpen) return;

            setIsLoadingAppointments(true);
            setError(null);
            const token = localStorage.getItem('token');
            const dateKey = getLocalDateKey(selectedDate);

            // Calculate start and end of the day in local time, converted to ISO (UTC) for backend
            const start = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(selectedDate);
            end.setHours(23, 59, 59, 999);
            
            const startDateISO = start.toISOString();
            const endDateISO = end.toISOString();

            try {
                const response = await fetch(`http://localhost:3002/appointments?therapist_id=${selectedTherapistId}&start_date=${startDateISO}&end_date=${endDateISO}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const dailyAppointments = {};
                data.forEach(apt => {
                    // Convert UTC appointment time back to local time slot string
                    const aptDate = new Date(apt.appointment_time);
                    // We need to format it to match 'hh:mm AM/PM' format of timeSlots
                    // Assuming timeSlots are like "09:00 AM"
                    const timeSlot = aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    dailyAppointments[timeSlot] = apt; 
                });
                
                setAppointments(prev => ({
                    ...prev,
                    [`${dateKey}-${selectedTherapistId}`]: dailyAppointments
                }));
            } catch (err) {
                console.error("Error fetching appointments:", err);
                setError('Failed to fetch appointments.');
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchAppointments();
    }, [selectedTherapistId, selectedDate, isOpen]);

    const therapistClients = useMemo(() => clients.filter(c => String(c.therapist_id) === String(selectedTherapistId)), [clients, selectedTherapistId]);

    const handleBooking = async (slot) => {
        if (user.role === 'Therapist') {
            alert("Please contact an Admin to book or change appointments.");
            return;
        }
        if (!selectedClient) {
            alert("Please select a client first.");
            return;
        }

        const dateKey = getLocalDateKey(selectedDate);
        
        // Parse 12-hour time slot to Date object
        const [time, modifier] = slot.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        const appointment_time = appointmentDate.toISOString(); 
        const client_id = selectedClient; 
        const therapist_id = selectedTherapistId;

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication required to book appointment.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ client_id, therapist_id, appointment_time })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to book appointment: ${response.status}`);
            }

            // Update local state with new appointment
            const newAppointment = data;
            setAppointments(prev => {
                const dateTherapistKey = `${dateKey}-${selectedTherapistId}`;
                const updatedDailyAppointments = {
                    ...prev[dateTherapistKey],
                    [slot]: newAppointment
                };
                return {
                    ...prev,
                    [dateTherapistKey]: updatedDailyAppointments
                };
            });
            alert('Booking successful!');
        } catch (err) {
            console.error("Error booking appointment:", err);
            setError(err.message || 'Failed to book appointment.');
        }
    };
    
    if (!isOpen) return null;

    // Filter to show only the selected therapist
    const displayTherapists = therapists.filter(t => t.id === selectedTherapistId);
    
    const dateKey = getLocalDateKey(selectedDate);
    
    const currentAppointmentsForSelectedTherapist = appointments[`${dateKey}-${selectedTherapistId}`] || {};

    return (
        <div className={styles.modalBackdrop}>
            <div className={`${styles.modal} ${styles.scheduleModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Schedule Sessions</h2>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                {error && <p className={styles.errorText}>{error}</p>}
                <div className={styles.scheduleGrid}>
                    <div className={styles.scheduleControls}>
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            className={styles.calendar}
                        />
                        {user.role === 'Admin' && (
                            <div style={{marginTop: '1rem'}}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Therapist:</label>
                                <select value={selectedTherapistId} onChange={(e) => { setSelectedTherapistId(parseInt(e.target.value, 10)); setSelectedClient(''); }} className={styles.select}>
                                    {therapists.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                                </select>
                            </div>
                        )}
                        <div style={{marginTop: '1rem'}}>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Client:</label>
                             <select value={selectedClient} onChange={(e) => setSelectedClient(parseInt(e.target.value, 10))} className={styles.select} disabled={user.role === 'Therapist'}>
                                <option value="">-- Select a Client --</option>
                                {therapistClients.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
                             </select>
                        </div>
                         {user.role === 'Therapist' && <p className={styles.note}>Contact an Admin to book or change appointments.</p>}
                    </div>
                    <div className={styles.scheduleSlotsContainer}>
                        {isLoadingAppointments ? (
                            <div>Loading appointments...</div>
                        ) : (
                            <div className={styles.scheduleSlots}>
                                {displayTherapists.map(therapist => (
                                    <div key={therapist.id} className={styles.therapistColumn}>
                                        <h3 className={styles.therapistName}>{therapist.username}</h3>
                                        <div className="space-y-2">
                                            {timeSlots.map(slot => {
                                                const booking = currentAppointmentsForSelectedTherapist[slot];
                                                const isBooked = !!booking;
                                                const clientName = isBooked ? clients.find(c => c.id === booking.client_id)?.name : '';
                                                return (
                                                    <button key={slot} onClick={() => !isBooked && handleBooking(slot)} disabled={isBooked || user.role === 'Therapist'} className={`${styles.slotButton} ${isBooked ? styles.slotBooked : styles.slotAvailable}`}>
                                                        <p>{slot}</p>
                                                        {isBooked && <p className={styles.slotClient}>{clientName}</p>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;