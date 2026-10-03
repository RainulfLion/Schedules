const { useState, useEffect } = React;

const initialEmployees = [
  { id: 1, name: 'Jorgensen, Colin', phone: '602-309-7937', defaultLocation: 'Supervisor Post', armed: true, role: 'supervisor' },
  { id: 2, name: 'Zieger, Ken', phone: '720-609-1120', defaultLocation: '5025 W Baseline Rd', armed: false, role: 'guard' },
  { id: 3, name: 'De Los Reyes, Harvey', phone: '602-679-1166', defaultLocation: null, armed: true, role: 'rover' },
  { id: 4, name: 'Dimodica, David', phone: '623-703-6508', defaultLocation: '4303 W. Olive', armed: false, role: 'guard' },
  { id: 5, name: 'Gonzalez, Manuel', phone: '323-979-7544', defaultLocation: '7723 W. Thomas', armed: false, role: 'guard' },
  { id: 6, name: 'Goodlow, Ernest', phone: '602-710-6198', defaultLocation: '5755 N 19th Ave', armed: false, role: 'guard' },
  { id: 7, name: 'Romero, Gilberto', phone: '602-733-3248', defaultLocation: '6026 S. 7th Ave', armed: false, role: 'guard' },
  { id: 8, name: 'Valerio, Kevin', phone: '623-693-1007', defaultLocation: '5401 W. Indian School', armed: true, role: 'guard' },
];

const locations = [
  { name: '5401 W. Indian School', armed: true },
  { name: '5025 W Baseline Rd', armed: false },
  { name: '4303 W. Olive', armed: false },
  { name: '6026 S. 7th Ave', armed: false },
  { name: '7723 W. Thomas', armed: false },
  { name: '5755 N 19th Ave', armed: false },
  { name: 'Supervisor Post', armed: false, supervisorOnly: true },
];

const STATUS_OPTIONS = ['work', 'vacation', 'holiday', 'nowork', 'oncall', 'closed'];

const federalHolidays = {
  2026: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: 'MLK Day' },
    { date: '2026-02-16', name: "Presidents' Day" },
    { date: '2026-05-25', name: 'Memorial Day' },
    { date: '2026-06-19', name: 'Juneteenth' },
    { date: '2026-07-03', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-10-12', name: 'Columbus Day' },
    { date: '2026-11-11', name: 'Veterans Day' },
    { date: '2026-11-26', name: 'Thanksgiving' },
    { date: '2026-12-25', name: 'Christmas' },
  ],
  2027: [
    { date: '2027-01-01', name: "New Year's Day" },
    { date: '2027-01-18', name: 'MLK Day' },
    { date: '2027-02-15', name: "Presidents' Day" },
    { date: '2027-05-31', name: 'Memorial Day' },
    { date: '2027-06-19', name: 'Juneteenth' },
    { date: '2027-07-05', name: 'Independence Day' },
    { date: '2027-09-06', name: 'Labor Day' },
    { date: '2027-10-11', name: 'Columbus Day' },
    { date: '2027-11-11', name: 'Veterans Day' },
    { date: '2027-11-25', name: 'Thanksgiving' },
    { date: '2027-12-25', name: 'Christmas' },
  ]
};

const formatDateISO = (date) => date.toISOString().split('T')[0];
const isSunday = (date) => date.getDay() === 0;
const isSaturday = (date) => date.getDay() === 6;
const isHoliday = (date) => {
  const dateStr = formatDateISO(date);
  const year = date.getFullYear();
  return (federalHolidays[year] || []).find(h => h.date === dateStr);
};
const getHoursForDay = (date) => isSunday(date) ? 0 : isSaturday(date) ? 5.5 : 8.5;

function isCertExpiring(dateStr) {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr + 'T00:00:00');
  const twoMonthsFromNow = new Date(today);
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  return expDate <= twoMonthsFromNow;
}

function ScheduleManager() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [employees, setEmployees] = useState(initialEmployees);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [schedule, setSchedule] = useState({});
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [vacationRequests, setVacationRequests] = useState({});
  const [workRequests, setWorkRequests] = useState({});
  const [manualOverrides, setManualOverrides] = useState({});

  // Track if data is being loaded from Firestore
  const isLoadingVacationRequests = React.useRef(false);
  const isLoadingWorkRequests = React.useRef(false);
  const isLoadingManualOverrides = React.useRef(false);
  const hasInitializedVacations = React.useRef(false);
  const hasInitializedWorkRequests = React.useRef(false);
  const hasInitializedOverrides = React.useRef(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  // Firebase Authentication listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const profile = await FirebaseHelpers.getUserProfile(user.uid);
        if (profile) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            role: profile.role,
            name: profile.name,
            employeeId: profile.employeeId
          });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load employee profiles
  useEffect(() => {
    if (!currentUser) return;
    db.collection('employees').get().then((snapshot) => {
      if (snapshot.empty) return;
      const profileMap = {};
      snapshot.docs.forEach(doc => {
        profileMap[parseInt(doc.id)] = doc.data();
      });
      setEmployees(prev => prev.map(emp => {
        const profile = profileMap[emp.id];
        if (!profile) return emp;
        return {
          ...emp,
          name: profile.name || emp.name,
          phone: profile.phone || emp.phone,
          defaultLocation: profile.defaultLocation || emp.defaultLocation,
          armed: profile.armed !== undefined ? profile.armed : emp.armed,
          guardCardExpiration: profile.guardCardExpiration || '',
          cprCardExpiration: profile.cprCardExpiration || '',
          shirtSize: profile.shirtSize || '',
          pantsSize: profile.pantsSize || ''
        };
      }));
    }).catch(err => console.error('Error loading employee profiles:', err));
  }, [currentUser]);

  // Load vacation requests
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = FirebaseHelpers.onVacationRequestsChange((requests) => {
      isLoadingVacationRequests.current = true;
      setVacationRequests(requests);
      hasInitializedVacations.current = true;
      setTimeout(() => { isLoadingVacationRequests.current = false; }, 100);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Load work requests
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = db.collection('workRequests').onSnapshot(
      snapshot => {
        isLoadingWorkRequests.current = true;
        const requests = {};
        snapshot.forEach(doc => {
          requests[doc.id] = doc.data();
        });
        setWorkRequests(requests);
        hasInitializedWorkRequests.current = true;
        setTimeout(() => { isLoadingWorkRequests.current = false; }, 100);
      },
      error => {
        console.error('Error listening to work requests:', error);
        setWorkRequests({});
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Load manual overrides
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = FirebaseHelpers.onManualOverridesChange((overrides) => {
      isLoadingManualOverrides.current = true;
      setManualOverrides(overrides);
      hasInitializedOverrides.current = true;
      setTimeout(() => { isLoadingManualOverrides.current = false; }, 100);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Save vacation requests
  useEffect(() => {
    if (!currentUser || !hasInitializedVacations.current || isLoadingVacationRequests.current) return;
    const timeoutId = setTimeout(() => {
      FirebaseHelpers.saveVacationRequests(vacationRequests).catch(error => {
        console.error('Error saving vacation requests:', error);
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [vacationRequests, currentUser]);

  // Save work requests
  useEffect(() => {
    if (!currentUser || !hasInitializedWorkRequests.current || isLoadingWorkRequests.current) return;
    const timeoutId = setTimeout(() => {
      const batch = db.batch();
      Object.entries(workRequests).forEach(([empId, dates]) => {
        const ref = db.collection('workRequests').doc(empId);
        if (dates && Object.keys(dates).length > 0) {
          batch.set(ref, dates);
        }
      });
      batch.commit().catch(error => console.error('Error saving work requests:', error));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [workRequests, currentUser]);

  // Save manual overrides
  useEffect(() => {
    if (!currentUser || !hasInitializedOverrides.current || isLoadingManualOverrides.current) return;
    const timeoutId = setTimeout(() => {
      FirebaseHelpers.saveManualOverrides(manualOverrides).catch(error => {
        console.error('Error saving manual overrides:', error);
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [manualOverrides, currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const email = username.includes('@') ? username : `${username.toLowerCase()}@security.com`;
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setLoginError('Invalid username or password');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Please try again later.');
      } else {
        setLoginError('Login failed. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Build schedule
  useEffect(() => {
    const newSchedule = {};
    employees.forEach(emp => { newSchedule[emp.id] = {}; });

    // Get all days in the current month + next 2 months for better planning
    const startDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const endDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 3, 0);

    const allDates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    const bankGuards = employees.filter(emp => emp.role === 'guard');
    const rover = employees.find(emp => emp.role === 'rover');

    allDates.forEach(date => {
      const dateKey = formatDateISO(date);
      const holiday = isHoliday(date);
      const sunday = isSunday(date);
      const saturday = isSaturday(date);
      const hours = getHoursForDay(date);

      const needsCoverage = [];
      const availableGuards = [];

      bankGuards.forEach(guard => {
        const vacReq = vacationRequests[guard.id]?.[dateKey];
        if (vacReq?.status === 'approved' && guard.defaultLocation) {
          needsCoverage.push({ guard, reason: 'vacation' });
        } else if (!sunday && !holiday) {
          availableGuards.push(guard);
        }
      });

      let rotationDayOff = null;
      if (!sunday && !saturday && !holiday && needsCoverage.length === 0 && availableGuards.length > 0) {
        const dayIndex = Math.floor((date.getTime() - new Date('2026-01-01').getTime()) / (1000 * 60 * 60 * 24));
        rotationDayOff = availableGuards[dayIndex % availableGuards.length];
        needsCoverage.push({ guard: rotationDayOff, reason: 'rotation' });
      }

      const coveragePost = needsCoverage.length > 0 ? needsCoverage[0].guard.defaultLocation : null;

      employees.forEach(emp => {
        const vacReq = vacationRequests[emp.id]?.[dateKey];
        const workReq = workRequests[emp.id]?.[dateKey];

        if (sunday) {
          newSchedule[emp.id][dateKey] = { status: 'closed', location: '', hours: 0 };
        } else if (holiday) {
          newSchedule[emp.id][dateKey] = { status: 'holiday', location: '', hours: 0, holidayName: holiday.name };
        } else if (vacReq?.status === 'approved') {
          newSchedule[emp.id][dateKey] = { status: 'vacation', location: '', hours: 0 };
        } else if (workReq?.status === 'approved') {
          newSchedule[emp.id][dateKey] = { status: 'work', location: workReq.location, hours, time: saturday ? '0830-1430' : '0830-1730' };
        } else if (emp.role === 'supervisor') {
          newSchedule[emp.id][dateKey] = { status: 'work', location: 'Supervisor Post', hours, time: saturday ? '0830-1430' : '0830-1730' };
        } else if (emp.role === 'rover') {
          if (coveragePost) {
            newSchedule[emp.id][dateKey] = { status: 'work', location: coveragePost, hours, time: saturday ? '0830-1430' : '0830-1730' };
          } else {
            newSchedule[emp.id][dateKey] = { status: 'oncall', location: 'On Call', hours: 0 };
          }
        } else {
          if (rotationDayOff?.id === emp.id) {
            newSchedule[emp.id][dateKey] = { status: 'nowork', location: '', hours: 0 };
          } else {
            newSchedule[emp.id][dateKey] = { status: 'work', location: emp.defaultLocation, hours, time: saturday ? '0830-1430' : '0830-1730' };
          }
        }
      });
    });

    // Apply manual overrides
    Object.keys(manualOverrides).forEach(key => {
      const [empIdStr, dateKey] = key.split('_');
      const empId = parseInt(empIdStr);
      if (newSchedule[empId]?.[dateKey]) {
        newSchedule[empId][dateKey] = { ...newSchedule[empId][dateKey], ...manualOverrides[key] };
      }
    });

    setSchedule(newSchedule);
  }, [calendarMonth, vacationRequests, workRequests, manualOverrides]);

  const requestTimeOff = (empId, dateStr) => {
    setVacationRequests(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [dateStr]: { status: 'pending', requestedAt: new Date().toISOString() }
      }
    }));
  };

  const cancelTimeOffRequest = (empId, dateStr) => {
    setVacationRequests(prev => {
      const n = { ...prev };
      if (n[empId]) delete n[empId][dateStr];
      return n;
    });
  };

  const requestWork = (empId, dateStr, location) => {
    setWorkRequests(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [dateStr]: { status: 'pending', location, requestedAt: new Date().toISOString() }
      }
    }));
  };

  const cancelWorkRequest = (empId, dateStr) => {
    setWorkRequests(prev => {
      const n = { ...prev };
      if (n[empId]) delete n[empId][dateStr];
      return n;
    });
  };

  const approveTimeOff = (empId, dateStr) => {
    if (currentUser?.role !== 'supervisor') return;
    setVacationRequests(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [dateStr]: { ...prev[empId][dateStr], status: 'approved' }
      }
    }));
  };

  const denyTimeOff = (empId, dateStr) => {
    if (currentUser?.role !== 'supervisor') return;
    setVacationRequests(prev => {
      const n = { ...prev };
      if (n[empId]) delete n[empId][dateStr];
      return n;
    });
  };

  const approveWorkRequest = (empId, dateStr) => {
    if (currentUser?.role !== 'supervisor') return;
    setWorkRequests(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [dateStr]: { ...prev[empId][dateStr], status: 'approved' }
      }
    }));
  };

  const denyWorkRequest = (empId, dateStr) => {
    if (currentUser?.role !== 'supervisor') return;
    setWorkRequests(prev => {
      const n = { ...prev };
      if (n[empId]) delete n[empId][dateStr];
      return n;
    });
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    try {
      await db.collection('employees').doc(String(currentUser.employeeId)).set({
        name: profileData.name,
        phone: profileData.phone,
        defaultLocation: profileData.defaultLocation,
        armed: profileData.armed,
        guardCardExpiration: profileData.guardCardExpiration,
        cprCardExpiration: profileData.cprCardExpiration,
        shirtSize: profileData.shirtSize,
        pantsSize: profileData.pantsSize
      }, { merge: true });

      setEmployees(prev => prev.map(emp =>
        emp.id === currentUser.employeeId ? { ...emp, ...profileData } : emp
      ));

      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const CalendarView = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));

    const currentEmployee = employees.find(e => e.id === currentUser.employeeId);
    const isPast = (date) => date < new Date(new Date().setHours(0, 0, 0, 0));

    return (
      <div className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <button
            onClick={() => setCalendarMonth(new Date(year, month - 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg text-lg"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCalendarMonth(new Date(year, month + 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg text-lg"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-zinc-500 font-medium text-sm py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;

              const dateStr = formatDateISO(day);
              const holiday = isHoliday(day);
              const sunday = isSunday(day);
              const cell = schedule[currentUser.employeeId]?.[dateStr] || {};
              const vacReq = vacationRequests[currentUser.employeeId]?.[dateStr];
              const workReq = workRequests[currentUser.employeeId]?.[dateStr];
              const past = isPast(day);
              const isToday = formatDateISO(new Date()) === dateStr;

              let bg = 'bg-zinc-800 hover:bg-zinc-700';
              let text = 'text-zinc-300';
              let badge = null;

              if (isToday) {
                bg = 'bg-emerald-900/40 ring-2 ring-emerald-500';
                text = 'text-emerald-300';
              } else if (sunday) {
                bg = 'bg-zinc-700/30';
                text = 'text-zinc-500';
              } else if (holiday) {
                bg = 'bg-blue-900/40';
                text = 'text-blue-300';
                badge = '🎉';
              } else if (cell.status === 'work') {
                bg = 'bg-emerald-900/40';
                text = 'text-emerald-300';
                badge = '💼';
              } else if (cell.status === 'vacation' || vacReq?.status === 'approved') {
                bg = 'bg-amber-900/40';
                text = 'text-amber-300';
                badge = '🏖️';
              } else if (vacReq?.status === 'pending') {
                bg = 'bg-amber-900/20 border-2 border-amber-500 border-dashed';
                text = 'text-amber-300';
                badge = '⏳';
              } else if (workReq?.status === 'pending') {
                bg = 'bg-cyan-900/20 border-2 border-cyan-500 border-dashed';
                text = 'text-cyan-300';
                badge = '📝';
              } else if (workReq?.status === 'approved') {
                bg = 'bg-cyan-900/40';
                text = 'text-cyan-300';
                badge = '✅';
              } else if (cell.status === 'nowork') {
                bg = 'bg-zinc-700/40';
                text = 'text-zinc-400';
                badge = '🏠';
              }

              if (past) {
                text = 'text-zinc-600';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !past && setSelectedDate(day)}
                  className={`aspect-square rounded-lg ${bg} ${text} p-2 text-left cursor-pointer transition-all relative`}
                  disabled={past}
                >
                  <div className="text-lg font-medium">{day.getDate()}</div>
                  {badge && <div className="text-xl absolute top-1 right-1">{badge}</div>}
                  {cell.location && !sunday && !holiday && (
                    <div className="text-[10px] mt-1 truncate opacity-70">{cell.location}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500 bg-zinc-900/30 rounded-lg p-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-900/40"></span> Working
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-900/40"></span> Time Off
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-900/40"></span> Work Request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-dashed border-amber-500"></span> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-900/40"></span> Holiday
          </span>
        </div>

        {/* Date Detail Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  {isHoliday(selectedDate) && (
                    <p className="text-sm text-blue-400 mt-1">🎉 {isHoliday(selectedDate).name}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const dateStr = formatDateISO(selectedDate);
                const cell = schedule[currentUser.employeeId]?.[dateStr] || {};
                const vacReq = vacationRequests[currentUser.employeeId]?.[dateStr];
                const workReq = workRequests[currentUser.employeeId]?.[dateStr];
                const sunday = isSunday(selectedDate);
                const holiday = isHoliday(selectedDate);

                return (
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-sm text-zinc-500 mb-2">Current Status</p>
                      {sunday ? (
                        <p className="text-zinc-400">🔒 Closed (Sunday)</p>
                      ) : holiday ? (
                        <p className="text-blue-400">🎉 Holiday - {holiday.name}</p>
                      ) : cell.status === 'work' ? (
                        <div>
                          <p className="text-emerald-400">💼 Working</p>
                          <p className="text-sm text-zinc-400 mt-1">Location: {cell.location}</p>
                          <p className="text-sm text-zinc-400">Time: {cell.time}</p>
                        </div>
                      ) : cell.status === 'vacation' ? (
                        <p className="text-amber-400">🏖️ Time Off (Approved)</p>
                      ) : cell.status === 'nowork' ? (
                        <p className="text-zinc-400">🏠 Day Off</p>
                      ) : (
                        <p className="text-zinc-400">No assignment</p>
                      )}
                    </div>

                    {/* Actions */}
                    {!sunday && !holiday && (
                      <div className="space-y-3">
                        {/* Time Off Request */}
                        {!vacReq && cell.status !== 'vacation' && (
                          <button
                            onClick={() => {
                              requestTimeOff(currentUser.employeeId, dateStr);
                              setSelectedDate(null);
                            }}
                            className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium"
                          >
                            Request Time Off
                          </button>
                        )}

                        {vacReq?.status === 'pending' && (
                          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
                            <p className="text-amber-400 text-sm mb-2">⏳ Time off request pending approval</p>
                            <button
                              onClick={() => {
                                cancelTimeOffRequest(currentUser.employeeId, dateStr);
                                setSelectedDate(null);
                              }}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}

                        {/* Work Request */}
                        {!workReq && cell.status !== 'work' && !vacReq && (
                          <div className="bg-zinc-800/50 rounded-lg p-3">
                            <p className="text-sm text-zinc-400 mb-2">Request to work at:</p>
                            <div className="space-y-2">
                              {locations.filter(loc => !loc.supervisorOnly).map(loc => (
                                <button
                                  key={loc.name}
                                  onClick={() => {
                                    requestWork(currentUser.employeeId, dateStr, loc.name);
                                    setSelectedDate(null);
                                  }}
                                  className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm text-left"
                                >
                                  {loc.name} {loc.armed && '🔫'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {workReq?.status === 'pending' && (
                          <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-3">
                            <p className="text-cyan-400 text-sm mb-1">📝 Work request pending approval</p>
                            <p className="text-sm text-zinc-400 mb-2">Location: {workReq.location}</p>
                            <button
                              onClick={() => {
                                cancelWorkRequest(currentUser.employeeId, dateStr);
                                setSelectedDate(null);
                              }}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const PendingRequestsView = () => {
    if (currentUser?.role !== 'supervisor') return null;

    const pendingTimeOff = [];
    const pendingWork = [];

    Object.entries(vacationRequests).forEach(([empId, dates]) => {
      Object.entries(dates).forEach(([dateStr, req]) => {
        if (req.status === 'pending') {
          const emp = employees.find(e => e.id === parseInt(empId));
          pendingTimeOff.push({ empId: parseInt(empId), empName: emp?.name, dateStr, req });
        }
      });
    });

    Object.entries(workRequests).forEach(([empId, dates]) => {
      Object.entries(dates).forEach(([dateStr, req]) => {
        if (req.status === 'pending') {
          const emp = employees.find(e => e.id === parseInt(empId));
          pendingWork.push({ empId: parseInt(empId), empName: emp?.name, dateStr, req });
        }
      });
    });

    if (pendingTimeOff.length === 0 && pendingWork.length === 0) {
      return (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg">No pending requests</p>
          <p className="text-sm mt-2">All requests have been processed</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Time Off Requests */}
        {pendingTimeOff.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4">
            <h3 className="font-medium text-amber-300 mb-4 text-lg">
              🏖️ Time Off Requests ({pendingTimeOff.length})
            </h3>
            <div className="space-y-3">
              {pendingTimeOff.map(({ empId, empName, dateStr, req }) => (
                <div key={`${empId}-${dateStr}`} className="bg-zinc-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{empName}</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested: {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveTimeOff(empId, dateStr)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => denyTimeOff(empId, dateStr)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Requests */}
        {pendingWork.length > 0 && (
          <div className="bg-cyan-900/20 border border-cyan-800 rounded-xl p-4">
            <h3 className="font-medium text-cyan-300 mb-4 text-lg">
              💼 Work Requests ({pendingWork.length})
            </h3>
            <div className="space-y-3">
              {pendingWork.map(({ empId, empName, dateStr, req }) => (
                <div key={`${empId}-${dateStr}`} className="bg-zinc-900/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{empName}</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-cyan-400 mt-1">Location: {req.location}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested: {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveWorkRequest(empId, dateStr)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => denyWorkRequest(empId, dateStr)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProfileView = () => {
    const currentEmployee = employees.find(e => e.id === currentUser.employeeId);
    if (!currentEmployee) return null;

    if (!editingProfile) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-xl border border-emerald-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-3xl font-bold">
                {currentEmployee.name.split(',')[0][0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentEmployee.name}</h2>
                <p className="text-emerald-400 capitalize">{currentEmployee.role}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Phone</p>
                <p className="font-medium">{currentEmployee.phone}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Default Location</p>
                <p className="font-medium">{currentEmployee.defaultLocation || 'Rover'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Armed Status</p>
                <p className="font-medium">{currentEmployee.armed ? '🔫 Armed' : 'Unarmed'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Guard Card Exp</p>
                <p className={`font-medium ${isCertExpiring(currentEmployee.guardCardExpiration) ? 'text-red-400' : ''}`}>
                  {currentEmployee.guardCardExpiration || 'Not set'}
                  {isCertExpiring(currentEmployee.guardCardExpiration) && ' 🚩'}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">CPR Card Exp</p>
                <p className={`font-medium ${isCertExpiring(currentEmployee.cprCardExpiration) ? 'text-red-400' : ''}`}>
                  {currentEmployee.cprCardExpiration || 'Not set'}
                  {isCertExpiring(currentEmployee.cprCardExpiration) && ' 🚩'}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Uniform Size</p>
                <p className="font-medium">
                  {currentEmployee.shirtSize && `Shirt: ${currentEmployee.shirtSize}`}
                  {currentEmployee.shirtSize && currentEmployee.pantsSize && ' | '}
                  {currentEmployee.pantsSize && `Pants: ${currentEmployee.pantsSize}`}
                  {!currentEmployee.shirtSize && !currentEmployee.pantsSize && 'Not set'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setProfileData({
                  name: currentEmployee.name,
                  phone: currentEmployee.phone,
                  defaultLocation: currentEmployee.defaultLocation || '',
                  armed: currentEmployee.armed || false,
                  guardCardExpiration: currentEmployee.guardCardExpiration || '',
                  cprCardExpiration: currentEmployee.cprCardExpiration || '',
                  shirtSize: currentEmployee.shirtSize || '',
                  pantsSize: currentEmployee.pantsSize || ''
                });
                setEditingProfile(true);
              }}
              className="mt-6 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Guard Card Expiration</label>
              <input
                type="date"
                value={profileData.guardCardExpiration}
                onChange={(e) => setProfileData({...profileData, guardCardExpiration: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">CPR Card Expiration</label>
              <input
                type="date"
                value={profileData.cprCardExpiration}
                onChange={(e) => setProfileData({...profileData, cprCardExpiration: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Shirt Size</label>
                <select
                  value={profileData.shirtSize}
                  onChange={(e) => setProfileData({...profileData, shirtSize: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select size</option>
                  {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pants Size</label>
                <select
                  value={profileData.pantsSize}
                  onChange={(e) => setProfileData({...profileData, pantsSize: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select size</option>
                  {['28x30', '30x30', '30x32', '32x30', '32x32', '32x34', '34x30', '34x32', '34x34',
                    '36x30', '36x32', '36x34', '38x30', '38x32', '38x34', '40x30', '40x32', '40x34',
                    '42x30', '42x32', '44x30', '44x32', '46x30', '46x32', '48x30', '48x32', '50x30', '50x32'].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveProfile}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold text-lg">
              SM
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Schedule Manager</h1>
              <p className="text-xs text-zinc-500">Security Guard Scheduler</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Enter password"
              />
            </div>
            {loginError && <div className="text-red-400 text-sm">{loginError}</div>}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-sm font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = (() => {
    if (currentUser?.role !== 'supervisor') return 0;
    let count = 0;
    Object.values(vacationRequests).forEach(dates => {
      Object.values(dates).forEach(req => {
        if (req.status === 'pending') count++;
      });
    });
    Object.values(workRequests).forEach(dates => {
      Object.values(dates).forEach(req => {
        if (req.status === 'pending') count++;
      });
    });
    return count;
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold">
                SM
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold">Schedule Manager</h1>
                <p className="text-xs text-zinc-500">
                  {currentUser.name} • {currentUser.role === 'supervisor' ? '★ Supervisor' : 'Guard'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-3 text-sm font-medium ${
              activeTab === 'calendar'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📅 Calendar
          </button>
          {currentUser?.role === 'supervisor' && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 py-3 text-sm font-medium relative ${
                activeTab === 'requests'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📋 Requests
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3 text-sm font-medium ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            👤 Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'requests' && <PendingRequestsView />}
        {activeTab === 'profile' && <ProfileView />}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ScheduleManager />);
