const { useState, useEffect } = React;

const initialEmployees = [
  { id: 1, name: 'Jorgensen, Colin', phone: '602-309-7937', defaultLocation: 'Supervisor Post', armed: true, role: 'supervisor' },
  { id: 3, name: 'De Los Reyes, Harvey', phone: '602-679-1166', defaultLocation: null, armed: true, role: 'rover' },
  { id: 4, name: 'Dimodica, David', phone: '623-703-6508', defaultLocation: '4303 W. Olive', armed: false, role: 'guard' },
  { id: 5, name: 'Gonzalez, Manuel', phone: '323-979-7544', defaultLocation: '7723 W. Thomas', armed: false, role: 'guard' },
  { id: 6, name: 'Goodlow, Ernest', phone: '602-710-6198', defaultLocation: '5755 N 19th Ave', armed: false, role: 'guard' },
  { id: 7, name: 'Romero, Gilberto', phone: '602-733-3248', defaultLocation: '6026 S. 7th Ave', armed: false, role: 'guard' },
  { id: 8, name: 'Valerio, Kevin', phone: '623-693-1007', defaultLocation: '5401 W. Indian School', armed: true, role: 'guard' },
  { id: 9, name: 'Blanding, Elvon', phone: '602-441-7354', defaultLocation: '5025 W Baseline Rd', armed: false, role: 'guard' },
  { id: 10, name: 'Tucker, Dylon', phone: '317-499-5206', defaultLocation: null, armed: false, role: 'guard' },
  { id: 11, name: 'Williams, Brandy', phone: '480-386-4097', defaultLocation: null, armed: false, role: 'guard' },
  { id: 12, name: 'Ducar, David', phone: '303-906-1191', defaultLocation: null, armed: false, role: 'guard' },
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

const TIME_OFF_TYPES = {
  off: { label: 'Day Off', icon: '🏠', button: 'bg-red-700 hover:bg-red-600', cell: 'bg-red-900/40 text-red-300', pending: 'bg-red-900/10 text-red-300 border-red-500' },
  vacation: { label: 'Vacation', icon: '🏖️', button: 'bg-amber-600 hover:bg-amber-500', cell: 'bg-amber-900/40 text-amber-300', pending: 'bg-amber-900/10 text-amber-300 border-amber-500' },
  sick: { label: 'Sick', icon: '🤒', button: 'bg-purple-700 hover:bg-purple-600', cell: 'bg-purple-900/40 text-purple-300', pending: 'bg-purple-900/10 text-purple-300 border-purple-500' },
};
// Requests saved before types existed were all vacation requests
const requestType = (req) => (TIME_OFF_TYPES[req?.type] ? req.type : 'vacation');
const MAX_WEEKLY_HOURS = 40;

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const PANTS_SIZES = ['28x30', '30x30', '30x32', '32x30', '32x32', '32x34', '34x30', '34x32', '34x34',
  '36x30', '36x32', '36x34', '38x30', '38x32', '38x34', '40x30', '40x32', '40x34',
  '42x30', '42x32', '44x30', '44x32', '46x30', '46x32', '48x30', '48x32', '50x30', '50x32'];

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

// Last name to email for easy login
const userEmailMap = {
  jorgensen: 'jorgensen@security.com',
  delosreyes: 'delosreyes@security.com',
  dimodica: 'dimodica@security.com',
  gonzalez: 'gonzalez@security.com',
  goodlow: 'goodlow@security.com',
  romero: 'romero@security.com',
  valerio: 'valerio@security.com',
  blanding: 'blanding@security.com',
  tucker: 'tucker@security.com',
  williams: 'williams@security.com',
  ducar: 'ducar@security.com'
};

const getWeekDates = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);
  const friday = new Date(start);
  friday.setDate(start.getDate() - ((start.getDay() + 2) % 7));
  for (let i = 0; i < 7; i++) {
    const date = new Date(friday);
    date.setDate(friday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getCurrentWeekFriday = () => getWeekDates(new Date())[0];

const pad2 = (n) => String(n).padStart(2, '0');
// Local date (not UTC) so keys don't shift a day in timezones east of UTC
const formatDateISO = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
const formatLongDate = (dateStr) => new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const isSunday = (date) => date.getDay() === 0;
const isSaturday = (date) => date.getDay() === 6;
const isHoliday = (date) => (federalHolidays[date.getFullYear()] || []).find(h => h.date === formatDateISO(date));
const getHoursForDay = (date) => isSunday(date) ? 0 : isSaturday(date) ? 5.5 : 8.5;
const shiftTime = (date) => isSaturday(date) ? '0830-1430' : '0830-1730';
const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
// Shifts that end at or before they start run past midnight
const shiftLength = (start, end) => {
  const minutes = toMinutes(end) - toMinutes(start);
  return Math.round(((minutes <= 0 ? minutes + 1440 : minutes) / 60) * 100) / 100;
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

function isCertExpiring(dateStr) {
  if (!dateStr) return true;
  const twoMonthsFromNow = startOfToday();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  return new Date(dateStr + 'T00:00:00') <= twoMonthsFromNow;
}

const removeRequest = (prev, empId, dateStr) => {
  const forEmp = { ...(prev[empId] || {}) };
  delete forEmp[dateStr];
  return { ...prev, [empId]: forEmp };
};

const getStatusColor = (s) => ({
  work: 'bg-emerald-900/40 text-emerald-300',
  vacation: 'bg-amber-900/40 text-amber-300',
  holiday: 'bg-blue-900/40 text-blue-300',
  closed: 'bg-zinc-700/40 text-zinc-400',
  nowork: 'bg-red-900/40 text-red-300',
  oncall: 'bg-purple-900/40 text-purple-300'
}[s] || 'bg-zinc-800 text-zinc-500');

const getStatusLabel = (s) => ({ work: 'Work', vacation: 'Time Off', holiday: 'Holiday', closed: 'Closed', nowork: 'Day Off', oncall: 'On Call' }[s] || s);

// Live-synced Firestore state. Local edits are saved (debounced) unless they match
// the last snapshot received, so incoming data is never echoed back.
function useFirestoreSync(enabled, subscribe, save) {
  const [value, setValue] = useState({});
  const lastSynced = React.useRef(null);

  useEffect(() => {
    if (!enabled) { lastSynced.current = null; return; }
    return subscribe(data => {
      lastSynced.current = JSON.stringify(data);
      setValue(data);
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || lastSynced.current === null) return;
    const json = JSON.stringify(value);
    if (json === lastSynced.current) return;
    const timeoutId = setTimeout(() => {
      lastSynced.current = json;
      save(value).catch(error => console.error('Error saving to Firestore:', error));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [value, enabled]);

  return [value, setValue];
}

function ScheduleManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [employees, setEmployees] = useState(initialEmployees);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getCurrentWeekFriday());
  const [schedule, setSchedule] = useState({});
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeEnd, setRangeEnd] = useState('');
  const [shiftForm, setShiftForm] = useState({
    empId: '', location: locations[0].name, start: '08:30', end: '17:30', from: '', to: '', days: [1, 2, 3, 4, 5, 6]
  });
  const [shiftMessage, setShiftMessage] = useState('');
  const [viewEmployeeId, setViewEmployeeId] = useState(null);
  const [draggedEmployee, setDraggedEmployee] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  const signedIn = !!currentUser;
  const [vacationRequests, setVacationRequests] = useFirestoreSync(signedIn,
    cb => FirebaseHelpers.onVacationRequestsChange(cb), data => FirebaseHelpers.saveVacationRequests(data));
  const [manualOverrides, setManualOverrides] = useFirestoreSync(signedIn,
    cb => FirebaseHelpers.onManualOverridesChange(cb), data => FirebaseHelpers.saveManualOverrides(data));

  const isSupervisor = currentUser?.role === 'supervisor';
  const viewedId = viewEmployeeId ?? currentUser?.employeeId;

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

  useEffect(() => {
    if (!currentUser) return;
    db.collection('employees').get().then((snapshot) => {
      if (snapshot.empty) return;
      const profileMap = {};
      snapshot.docs.forEach(doc => { profileMap[parseInt(doc.id)] = doc.data(); });
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const email = userEmailMap[username.toLowerCase()] || username;
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
      setViewEmployeeId(null);
      setActiveTab('calendar');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const weekDates = getWeekDates(weekStart);

  // Build the schedule for the visible month (plus two ahead) and the visible week
  useEffect(() => {
    const newSchedule = {};
    employees.forEach(emp => { newSchedule[emp.id] = {}; });

    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1, 12);
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 3, 0, 12);
    const rangeStart = weekDates[0] < monthStart ? new Date(weekDates[0]) : monthStart;
    const rangeEnd = weekDates[6] > monthEnd ? new Date(weekDates[6]) : monthEnd;

    const bankGuards = employees.filter(emp => emp.role === 'guard' && emp.defaultLocation);

    for (let date = new Date(rangeStart); date <= rangeEnd; date.setDate(date.getDate() + 1)) {
      const dateKey = formatDateISO(date);
      const holiday = isHoliday(date);
      const sunday = isSunday(date);
      const saturday = isSaturday(date);
      const hours = getHoursForDay(date);
      const time = shiftTime(date);

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
        let entry;

        if (sunday) {
          entry = { status: 'closed', location: '', hours: 0 };
        } else if (holiday) {
          entry = { status: 'holiday', location: '', hours: 0, holidayName: holiday.name };
        } else if (vacReq?.status === 'approved') {
          entry = { status: 'vacation', location: '', hours: 0, timeOffType: requestType(vacReq) };
        } else if (emp.role === 'supervisor') {
          entry = { status: 'work', location: 'Supervisor Post', hours, time };
        } else if (emp.role === 'rover') {
          entry = coveragePost
            ? { status: 'work', location: coveragePost, hours, time }
            : { status: 'oncall', location: 'On Call', hours: 0 };
        } else if (!emp.defaultLocation) {
          entry = { status: 'oncall', location: 'On Call', hours: 0 };
        } else if (rotationDayOff?.id === emp.id) {
          entry = { status: 'nowork', location: '', hours: 0 };
        } else {
          entry = { status: 'work', location: emp.defaultLocation, hours, time };
        }
        newSchedule[emp.id][dateKey] = entry;
      });
    }

    Object.keys(manualOverrides).forEach(key => {
      const [empIdStr, dateKey] = key.split('_');
      const empId = parseInt(empIdStr);
      if (newSchedule[empId]?.[dateKey]) {
        newSchedule[empId][dateKey] = { ...newSchedule[empId][dateKey], ...manualOverrides[key] };
      }
    });

    setSchedule(newSchedule);
  }, [calendarMonth, weekStart, employees, vacationRequests, manualOverrides]);

  // Availability: no entry means available; an entry marks time off of a given type
  const setTimeOff = (empId, dateStr, type) => setVacationRequests(prev => ({
    ...prev, [empId]: { ...prev[empId], [dateStr]: { status: isSupervisor ? 'approved' : 'pending', type, requestedAt: new Date().toISOString() } }
  }));
  const markAvailable = (empId, dateStr) => setVacationRequests(prev => removeRequest(prev, empId, dateStr));

  const setRequestStatus = (empId, dateStr, status) => {
    if (!isSupervisor) return;
    setVacationRequests(prev => ({ ...prev, [empId]: { ...prev[empId], [dateStr]: { ...prev[empId][dateStr], status } } }));
  };
  const approveTimeOff = (empId, dateStr) => setRequestStatus(empId, dateStr, 'approved');
  const denyTimeOff = (empId, dateStr) => setRequestStatus(empId, dateStr, 'denied');

  // Team schedule (supervisor)
  const handleDragStart = (e, employee) => {
    if (!isSupervisor) return;
    setDraggedEmployee(employee);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!isSupervisor) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, location, dateKey) => {
    e.preventDefault();
    if (!draggedEmployee || !isSupervisor) return;
    const date = new Date(dateKey + 'T12:00:00');
    const newOverrides = { ...manualOverrides };

    employees.forEach(emp => {
      const s = schedule[emp.id]?.[dateKey];
      if (emp.id !== draggedEmployee.id && s?.status === 'work' && s.location === location) {
        newOverrides[`${emp.id}_${dateKey}`] = { status: 'nowork', location: '', hours: 0, manual: true };
      }
    });
    newOverrides[`${draggedEmployee.id}_${dateKey}`] = {
      status: 'work', location, hours: getHoursForDay(date), time: shiftTime(date), manual: true
    };

    setManualOverrides(newOverrides);
    setDraggedEmployee(null);
  };

  const cycleStatus = (empId, dateKey) => {
    if (!isSupervisor) return;
    const current = schedule[empId]?.[dateKey] || {};
    if (current.status === 'closed') return;
    let nextStatus = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(current.status || 'work') + 1) % STATUS_OPTIONS.length];
    if (nextStatus === 'closed') nextStatus = 'work';

    const date = new Date(dateKey + 'T12:00:00');
    const isWork = nextStatus === 'work';
    setManualOverrides(prev => ({
      ...prev,
      [`${empId}_${dateKey}`]: {
        status: nextStatus,
        hours: isWork ? getHoursForDay(date) : 0,
        location: isWork ? current.location || '' : '',
        time: isWork ? (current.time || shiftTime(date)) : '',
        manual: true
      }
    }));
  };

  const calculateWeeklyHours = (empId) =>
    weekDates.reduce((sum, d) => sum + (schedule[empId]?.[formatDateISO(d)]?.hours || 0), 0);
  const calculateOvertime = (empId) => Math.max(0, calculateWeeklyHours(empId) - MAX_WEEKLY_HOURS);

  const generateImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cw = 120, ch = 50, hh = 45, nw = 160, pad = 15;
    canvas.width = nw + weekDates.length * cw + 120 + pad * 2;
    canvas.height = hh + employees.length * ch + pad * 2;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(pad, pad, canvas.width - pad * 2, hh);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('Employee', pad + 5, pad + 28);
    weekDates.forEach((d, i) => {
      ctx.fillStyle = isHoliday(d) ? '#3b82f6' : isSunday(d) ? '#9ca3af' : '#1a1a1a';
      ctx.fillText(`${getDayName(d)} ${formatDate(d)}`, pad + nw + i * cw + 5, pad + 28);
    });
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('Hrs', pad + nw + weekDates.length * cw + 5, pad + 28);
    ctx.fillText('OT', pad + nw + weekDates.length * cw + 55, pad + 28);

    const colors = { vacation: '#fef08a', holiday: '#bfdbfe', closed: '#d4d4d8', nowork: '#fecaca', oncall: '#e9d5ff' };
    const labels = { vacation: 'TIME OFF', holiday: 'HOLIDAY', closed: 'CLOSED', nowork: 'DAY OFF', oncall: 'ON CALL' };

    employees.forEach((emp, ri) => {
      const y = pad + hh + ri * ch;
      const rowBg = ri % 2 === 0 ? '#fafafa' : '#f0f0f0';
      ctx.fillStyle = rowBg;
      ctx.fillRect(pad, y, canvas.width - pad * 2, ch);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 9px Arial';
      ctx.fillText(emp.name, pad + 5, y + 20);
      ctx.font = '8px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(emp.phone, pad + 5, y + 32);

      weekDates.forEach((d, ci) => {
        const x = pad + nw + ci * cw;
        const cell = schedule[emp.id]?.[formatDateISO(d)] || {};
        ctx.fillStyle = colors[cell.status] || rowBg;
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = '#d4d4d4';
        ctx.strokeRect(x, y, cw, ch);
        ctx.fillStyle = '#1a1a1a';
        if (labels[cell.status]) {
          ctx.font = 'bold 9px Arial';
          ctx.fillText(labels[cell.status], x + 5, y + 28);
        } else if (cell.status === 'work') {
          ctx.font = '8px Arial';
          ctx.fillText(cell.time || '', x + 5, y + 16);
          ctx.font = '7px Arial';
          ctx.fillStyle = '#666';
          ctx.fillText((cell.location || '').substring(0, 20), x + 5, y + 30);
        }
      });

      const hx = pad + nw + weekDates.length * cw;
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 9px Arial';
      ctx.fillText(calculateWeeklyHours(emp.id).toFixed(1), hx + 10, y + 28);
      const ot = calculateOvertime(emp.id);
      ctx.fillStyle = ot > 0 ? '#ea580c' : '#666';
      ctx.fillText(ot.toFixed(1), hx + 60, y + 28);
    });

    const link = document.createElement('a');
    link.download = `Schedule_${formatDate(weekDates[0]).replace('/', '-')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Profile
  const startEditingProfile = (emp) => {
    setProfileData({
      name: emp.name,
      phone: emp.phone,
      defaultLocation: emp.defaultLocation || '',
      armed: emp.armed || false,
      guardCardExpiration: emp.guardCardExpiration || '',
      cprCardExpiration: emp.cprCardExpiration || '',
      shirtSize: emp.shirtSize || '',
      pantsSize: emp.pantsSize || ''
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    try {
      await db.collection('employees').doc(String(viewedId)).set(profileData, { merge: true });
      setEmployees(prev => prev.map(emp => emp.id === viewedId ? { ...emp, ...profileData } : emp));
      setEditingProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const pendingList = (requests) => {
    const list = [];
    Object.entries(requests).forEach(([empId, dates]) => {
      Object.entries(dates || {}).forEach(([dateStr, req]) => {
        if (req.status === 'pending') {
          const emp = employees.find(e => e.id === parseInt(empId));
          list.push({ empId: parseInt(empId), empName: emp?.name, dateStr, req });
        }
      });
    });
    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  };

  // Views are plain render functions (not nested components) so inputs keep focus across re-renders
  const renderEmployeePicker = () => isSupervisor && (
    <select
      value={viewedId}
      onChange={(e) => { setViewEmployeeId(parseInt(e.target.value)); setEditingProfile(false); }}
      className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
    >
      {employees.map(emp => (
        <option key={emp.id} value={emp.id}>{emp.name}{emp.id === currentUser.employeeId ? ' (you)' : ''}</option>
      ))}
    </select>
  );

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d, 12));

    const today = startOfToday();
    const todayStr = formatDateISO(new Date());
    const viewedEmployee = employees.find(e => e.id === viewedId);
    const isOwnCalendar = viewedId === currentUser.employeeId;
    const myPendingCount = pendingList({ [viewedId]: vacationRequests[viewedId] }).length;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{isOwnCalendar ? 'My Availability' : `${viewedEmployee?.name} - Availability`}</h2>
            <p className="text-sm text-zinc-500">Every open day starts as Available. Tap a day to mark it Day Off, Vacation or Sick.</p>
          </div>
          {renderEmployeePicker()}
        </div>

        {myPendingCount > 0 && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-300">
            ⏳ {myPendingCount} day{myPendingCount === 1 ? '' : 's'} waiting for supervisor approval
          </div>
        )}

        <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl border border-zinc-800 p-3">
          <button onClick={() => setCalendarMonth(new Date(year, month - 1))} className="px-4 py-2 hover:bg-zinc-800 rounded-lg min-h-[44px]">← Prev</button>
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCalendarMonth(new Date())} className="text-xs text-emerald-400 hover:text-emerald-300">Today</button>
          </div>
          <button onClick={() => setCalendarMonth(new Date(year, month + 1))} className="px-4 py-2 hover:bg-zinc-800 rounded-lg min-h-[44px]">Next →</button>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-2 md:p-4">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-zinc-500 font-medium text-xs md:text-sm py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = formatDateISO(day);
              const holiday = isHoliday(day);
              const cell = schedule[viewedId]?.[dateStr] || {};
              const req = vacationRequests[viewedId]?.[dateStr];
              const past = day < today;
              const assignedShift = cell.manual && cell.status === 'work';
              const closed = (isSunday(day) || holiday) && !assignedShift;

              let style, label, icon, sub = null;
              if (assignedShift && !(req && req.status !== 'denied')) {
                style = 'bg-teal-800/60 text-teal-200'; label = `Shift ${cell.time || ''}`; icon = '💼'; sub = cell.location;
              } else if (isSunday(day)) {
                style = 'bg-zinc-800/40 text-zinc-500'; label = 'Closed'; icon = '';
              } else if (holiday) {
                style = 'bg-blue-900/40 text-blue-300'; label = holiday.name; icon = '🎉';
              } else if (req && req.status !== 'denied') {
                const t = TIME_OFF_TYPES[requestType(req)];
                const pending = req.status === 'pending';
                style = pending ? `${t.pending} border-2 border-dashed` : t.cell;
                label = pending ? `${t.label}?` : t.label;
                icon = pending ? '⏳' : t.icon;
              } else if (cell.status === 'vacation') {
                style = TIME_OFF_TYPES.vacation.cell; label = 'Time Off'; icon = '🏖️';
              } else {
                style = 'bg-emerald-900/40 text-emerald-300'; label = 'Available'; icon = '✅';
                if (cell.status === 'work' && cell.location) sub = cell.location;
              }

              return (
                <button
                  key={idx}
                  onClick={() => { if (!past && !closed) { setSelectedDate(day); setRangeEnd(''); } }}
                  disabled={past || closed}
                  className={`min-h-[64px] md:min-h-[96px] rounded-lg p-1 md:p-2 text-left flex flex-col transition-all ${style} ${past ? 'opacity-40' : closed ? '' : 'hover:ring-2 hover:ring-zinc-400 cursor-pointer'} ${dateStr === todayStr ? 'ring-2 ring-white' : ''}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-sm md:text-base font-semibold">{day.getDate()}</span>
                    <span className="text-xs md:text-base">{icon}</span>
                  </div>
                  <span className="text-[9px] md:text-xs mt-auto leading-tight truncate w-full font-medium">{label}</span>
                  {sub && <span className="hidden md:block text-[10px] opacity-70 truncate w-full">📍 {sub}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 bg-zinc-900/30 rounded-lg p-3">
          <span>✅ Available</span>
          {Object.values(TIME_OFF_TYPES).map(t => <span key={t.label}>{t.icon} {t.label}</span>)}
          <span>⏳ Waiting for approval</span>
          <span>🎉 Holiday</span>
          <span>💼 Assigned shift</span>
          <span>📍 Usual post</span>
        </div>

        {selectedDate && renderDayModal()}
      </div>
    );
  };

  // Open days (not Sunday or holiday) from start through end, inclusive
  const openDaysBetween = (startStr, endStr) => {
    const result = [];
    for (let d = new Date(startStr + 'T12:00:00'); formatDateISO(d) <= endStr; d.setDate(d.getDate() + 1)) {
      if (!isSunday(d) && !isHoliday(d)) result.push(formatDateISO(d));
    }
    return result;
  };

  const renderDayModal = () => {
    const dateStr = formatDateISO(selectedDate);
    const cell = schedule[viewedId]?.[dateStr] || {};
    const req = vacationRequests[viewedId]?.[dateStr];
    const current = req && req.status !== 'denied' ? requestType(req) : 'available';
    const close = () => setSelectedDate(null);
    const dates = rangeEnd && rangeEnd > dateStr ? openDaysBetween(dateStr, rangeEnd) : [dateStr];

    const choose = (choice) => {
      dates.forEach(d => choice === 'available' ? markAvailable(viewedId, d) : setTimeOff(viewedId, d, choice));
      close();
    };

    const options = [
      { id: 'available', label: 'Available', icon: '✅', button: 'bg-emerald-700 hover:bg-emerald-600' },
      ...Object.entries(TIME_OFF_TYPES).map(([id, t]) => ({ id, ...t })),
    ];

    return (
      <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={close}>
        <div className="bg-zinc-900 rounded-t-2xl md:rounded-xl border border-zinc-800 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{formatLongDate(dateStr)}</h3>
            <button onClick={close} className="text-zinc-500 hover:text-zinc-300 text-xl px-2">✕</button>
          </div>

          {cell.status === 'work' && current === 'available' && (
            <div className="bg-zinc-800/50 rounded-lg p-3 mb-4 text-sm">
              <p className="text-zinc-400">Currently scheduled</p>
              <p className="font-medium">📍 {cell.location}</p>
              <p className="text-zinc-400">{cell.time}</p>
            </div>
          )}

          {req?.status === 'pending' && <p className="text-sm text-amber-300 mb-3">⏳ {TIME_OFF_TYPES[current].label} is waiting for supervisor approval.</p>}
          {req?.status === 'approved' && <p className="text-sm text-emerald-300 mb-3">✔ {TIME_OFF_TYPES[current].label} approved.</p>}
          {req?.status === 'denied' && <p className="text-sm text-red-400 mb-3">Your {TIME_OFF_TYPES[requestType(req)].label.toLowerCase()} request for this day was denied, so you are marked Available.</p>}

          <p className="text-sm text-zinc-300 mb-2">Set this day to:</p>
          <div className="grid grid-cols-2 gap-2">
            {options.map(o => (
              <button
                key={o.id}
                onClick={() => choose(o.id)}
                className={`px-3 py-4 rounded-lg font-medium text-sm ${o.button} ${current === o.id ? 'ring-2 ring-white' : 'opacity-80'}`}
              >
                <div className="text-2xl mb-1">{o.icon}</div>
                {o.label}
              </button>
            ))}
          </div>

          <div className="mt-4 bg-zinc-800/50 rounded-lg p-3">
            <label className="block text-sm text-zinc-300 mb-2">Several days in a row? Apply through:</label>
            <input
              type="date"
              value={rangeEnd}
              min={dateStr}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
            {dates.length > 1 && <p className="text-xs text-zinc-400 mt-2">Your choice will apply to {dates.length} open days (Sundays and holidays skipped).</p>}
          </div>

          {!isSupervisor && <p className="text-xs text-zinc-500 mt-4">Day Off, Vacation and Sick need supervisor approval.</p>}
        </div>
      </div>
    );
  };

  const renderRequests = () => {
    const pending = pendingList(vacationRequests);

    if (pending.length === 0) {
      return (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">✅ No pending requests</p>
          <p className="text-sm mt-2">When guards mark a day off, vacation or sick, it shows up here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Time Off Requests ({pending.length})</h3>
          <button
            onClick={() => pending.forEach(({ empId, dateStr }) => approveTimeOff(empId, dateStr))}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm min-h-[44px]"
          >
            Approve all
          </button>
        </div>
        {pending.map(({ empId, empName, dateStr, req }) => {
          const t = TIME_OFF_TYPES[requestType(req)];
          return (
            <div key={`${empId}-${dateStr}`} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{empName}</p>
                <p className="text-sm text-zinc-300">{t.icon} {t.label} · {formatLongDate(dateStr)}</p>
                {req.requestedAt && <p className="text-xs text-zinc-500">Requested {new Date(req.requestedAt).toLocaleString()}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveTimeOff(empId, dateStr)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm min-h-[44px]">Approve</button>
                <button onClick={() => denyTimeOff(empId, dateStr)} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm min-h-[44px]">Deny</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const createShifts = () => {
    const { empId, location, start, end, from, to, days } = shiftForm;
    if (!empId || !from || !to || to < from || days.length === 0) {
      setShiftMessage('Pick a guard, a start and end date, and at least one weekday.');
      return;
    }
    const entries = {};
    const skipped = [];
    for (let d = new Date(from + 'T12:00:00'); formatDateISO(d) <= to; d.setDate(d.getDate() + 1)) {
      if (!days.includes(d.getDay())) continue;
      const dateStr = formatDateISO(d);
      const req = vacationRequests[empId]?.[dateStr];
      if (req && req.status !== 'denied') { skipped.push(dateStr); continue; }
      entries[`${empId}_${dateStr}`] = {
        status: 'work', location, time: `${start.replace(':', '')}-${end.replace(':', '')}`,
        hours: shiftLength(start, end), manual: true
      };
    }
    const count = Object.keys(entries).length;
    setManualOverrides(prev => ({ ...prev, ...entries }));
    const name = employees.find(e => e.id === parseInt(empId))?.name;
    setShiftMessage(`Created ${count} shift${count === 1 ? '' : 's'} for ${name}.` +
      (skipped.length ? ` Skipped ${skipped.length} day${skipped.length === 1 ? '' : 's'} where they have time off.` : ''));
  };

  const removeShift = (key) => setManualOverrides(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });

  const renderShifts = () => {
    const inputClass = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500';
    const set = (field) => (e) => setShiftForm({ ...shiftForm, [field]: e.target.value });
    const toggleDay = (i) => setShiftForm({
      ...shiftForm, days: shiftForm.days.includes(i) ? shiftForm.days.filter(x => x !== i) : [...shiftForm.days, i]
    });
    const todayStr = formatDateISO(new Date());

    const upcoming = Object.entries(manualOverrides)
      .map(([key, s]) => { const [empId, dateStr] = key.split('_'); return { key, empId: parseInt(empId), dateStr, ...s }; })
      .filter(s => s.status === 'work' && s.dateStr >= todayStr)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.empId - b.empId);

    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4 h-fit">
          <h2 className="text-lg font-semibold">Create Shifts</h2>
          <div>
            <label className="block text-sm mb-1">Guard</label>
            <select value={shiftForm.empId} onChange={set('empId')} className={inputClass}>
              <option value="">Select a guard</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}{emp.armed ? ' (armed)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Post</label>
            <select value={shiftForm.location} onChange={set('location')} className={inputClass}>
              {locations.map(loc => <option key={loc.name} value={loc.name}>{loc.name}{loc.armed ? ' (armed)' : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm mb-1">Start time</label><input type="time" value={shiftForm.start} onChange={set('start')} className={inputClass} /></div>
            <div><label className="block text-sm mb-1">End time</label><input type="time" value={shiftForm.end} onChange={set('end')} className={inputClass} /></div>
            <div><label className="block text-sm mb-1">From</label><input type="date" value={shiftForm.from} min={todayStr} onChange={set('from')} className={inputClass} /></div>
            <div><label className="block text-sm mb-1">Through</label><input type="date" value={shiftForm.to} min={shiftForm.from || todayStr} onChange={set('to')} className={inputClass} /></div>
          </div>
          <div>
            <label className="block text-sm mb-1">Days of the week</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d, i) => (
                <button key={d} onClick={() => toggleDay(i)} className={`px-3 py-2 rounded-lg text-sm min-w-[52px] ${shiftForm.days.includes(i) ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{d}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-zinc-500">{shiftLength(shiftForm.start, shiftForm.end)} hours per shift. Days the guard already has time off are skipped.</p>
          {(() => {
            const emp = employees.find(e => e.id === parseInt(shiftForm.empId));
            const loc = locations.find(l => l.name === shiftForm.location);
            return emp && loc?.armed && !emp.armed && <p className="text-sm text-red-300">⚠ This post needs an armed guard and {emp.name} is not armed.</p>;
          })()}
          <button onClick={createShifts} className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium">Create Shifts</button>
          {shiftMessage && <p className="text-sm text-emerald-300">{shiftMessage}</p>}
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5">
          <h2 className="text-lg font-semibold mb-3">Upcoming Assigned Shifts ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">No shifts created yet. Guards without one follow their usual post.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {upcoming.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-3 bg-zinc-800/50 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{employees.find(e => e.id === s.empId)?.name || `Employee ${s.empId}`}</p>
                    <p className="text-zinc-400">{formatLongDate(s.dateStr)}</p>
                    <p className="text-zinc-400">📍 {s.location} · {s.time}</p>
                  </div>
                  <button onClick={() => removeShift(s.key)} className="px-3 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg text-xs min-h-[40px]">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTeam = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm min-h-[44px]">← Prev</button>
          <div className="px-4 py-2 bg-zinc-800/50 rounded-lg text-sm min-h-[44px] flex items-center">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</div>
          <button onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm min-h-[44px]">Next →</button>
        </div>
        <button onClick={generateImage} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm min-h-[44px]">📷 Export Week</button>
      </div>
      <p className="text-xs text-zinc-500">Click a cell to change status. Drag a name onto the coverage grid to reassign a post.</p>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left p-3 text-zinc-400 sticky left-0 bg-zinc-900 z-10 min-w-[170px]">Employee</th>
              {weekDates.map(d => {
                const h = isHoliday(d), sun = isSunday(d);
                return (
                  <th key={d.toISOString()} className="text-center p-3 min-w-[110px]">
                    <div className={h ? 'text-blue-400' : sun ? 'text-zinc-500' : 'text-zinc-400'}>{getDayName(d)}</div>
                    <div className="text-xs text-zinc-500">{formatDate(d)}</div>
                    {h && <div className="text-[10px] text-blue-400">{h.name}</div>}
                  </th>
                );
              })}
              <th className="text-center p-3 text-zinc-400 min-w-[60px]">Hrs</th>
              <th className="text-center p-3 text-zinc-400 min-w-[50px]">OT</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                <td className="p-3 sticky left-0 bg-zinc-950 z-10">
                  <div className="font-medium flex items-center gap-1 cursor-move" draggable onDragStart={(e) => handleDragStart(e, emp)}>
                    <span className="text-zinc-600">⋮⋮</span>
                    {emp.name}
                    {emp.armed && <span className="text-[10px]">🔫</span>}
                    {emp.role === 'supervisor' && <span className="text-[10px] text-yellow-400">★</span>}
                    {emp.role === 'rover' && <span className="text-[10px] text-cyan-400">↔</span>}
                    {(isCertExpiring(emp.guardCardExpiration) || isCertExpiring(emp.cprCardExpiration)) && <span className="text-[10px]" title="Certification expired or expiring soon">🚩</span>}
                  </div>
                  <div className="text-xs text-zinc-500">{emp.phone}</div>
                </td>
                {weekDates.map(d => {
                  const dk = formatDateISO(d);
                  const cell = schedule[emp.id]?.[dk] || {};
                  return (
                    <td key={dk} className="p-2">
                      <div className={`rounded-lg p-2 text-xs ${getStatusColor(cell.status)} cursor-pointer hover:ring-1 hover:ring-zinc-600`} onClick={() => cycleStatus(emp.id, dk)}>
                        <div className="font-medium mb-1">{cell.timeOffType ? TIME_OFF_TYPES[cell.timeOffType].label : getStatusLabel(cell.status)}</div>
                        {cell.status === 'work' && cell.location && <div className="text-[10px] opacity-70 truncate">{cell.location}</div>}
                        {cell.status === 'work' && <div className="text-[10px] opacity-70">{cell.time}</div>}
                      </div>
                    </td>
                  );
                })}
                <td className="p-3 text-center font-medium">{calculateWeeklyHours(emp.id).toFixed(1)}</td>
                <td className="p-3 text-center"><span className={calculateOvertime(emp.id) > 0 ? 'text-amber-400 font-medium' : 'text-zinc-500'}>{calculateOvertime(emp.id).toFixed(1)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50"><h3 className="font-medium">Coverage Grid</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-400 min-w-[180px]">Location</th>
                {weekDates.map(d => <th key={d.toISOString()} className="text-center p-3 text-zinc-400 min-w-[100px]">{getDayName(d)}</th>)}
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.name} className="border-b border-zinc-800/50">
                  <td className="p-3">
                    <span className="font-medium">{loc.name}</span>
                    {loc.armed && <span className="ml-2 px-2 py-0.5 bg-red-900/40 text-red-300 text-[10px] rounded">ARMED</span>}
                    {loc.supervisorOnly && <span className="ml-2 px-2 py-0.5 bg-yellow-900/40 text-yellow-300 text-[10px] rounded">SUP</span>}
                  </td>
                  {weekDates.map(d => {
                    const dk = formatDateISO(d);
                    const sun = isSunday(d), hol = isHoliday(d);
                    if (sun || hol) return <td key={dk} className="p-2"><div className={`rounded-lg p-2 text-center text-xs ${sun ? 'bg-zinc-700/30 text-zinc-500' : 'bg-blue-900/30 text-blue-400'}`}>{sun ? 'CLOSED' : 'HOLIDAY'}</div></td>;

                    const covering = employees.filter(e => {
                      const s = schedule[e.id]?.[dk];
                      return s?.status === 'work' && s.location?.includes(loc.supervisorOnly ? 'Supervisor' : loc.name);
                    });
                    let bg = 'bg-emerald-900/30', txt = 'text-emerald-300', warn = null;
                    if (covering.length === 0) { bg = 'bg-red-900/30'; txt = 'text-red-300'; warn = 'NONE'; }
                    else if (loc.armed && !covering.some(e => e.armed)) { bg = 'bg-red-900/30'; txt = 'text-red-300'; warn = 'NEED ARMED'; }
                    else if (covering.some(e => e.role === 'rover')) { bg = 'bg-cyan-900/30'; txt = 'text-cyan-300'; }

                    return (
                      <td key={dk} className="p-2" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, loc.name, dk)}>
                        <div className={`rounded-lg p-2 ${bg} border-2 border-dashed border-transparent hover:border-emerald-500`}>
                          {covering.map(e => <div key={e.id} className={`text-xs ${txt}`}>{e.name.split(',')[0]} {e.role === 'rover' && '↔'}</div>)}
                          {warn && <div className={`text-[10px] font-bold ${txt}`}>{warn}</div>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    const emp = employees.find(e => e.id === viewedId);
    if (!emp) return null;
    const inputClass = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500';
    const setField = (field) => (e) => setProfileData({ ...profileData, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const todayStr = formatDateISO(new Date());
    const upcoming = [];
    Object.entries(vacationRequests[viewedId] || {}).forEach(([d, r]) => {
      if (d >= todayStr) {
        const t = TIME_OFF_TYPES[requestType(r)];
        upcoming.push({ ...r, d, type: `${t.icon} ${t.label}` });
      }
    });
    upcoming.sort((a, b) => a.d.localeCompare(b.d));
    const statusStyle = { pending: 'text-amber-400', approved: 'text-emerald-400', denied: 'text-red-400' };
    const certFlag = isCertExpiring(emp.guardCardExpiration) || isCertExpiring(emp.cprCardExpiration);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {isSupervisor && <div className="flex justify-end">{renderEmployeePicker()}</div>}

        {!editingProfile ? (
          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl border border-emerald-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">{emp.name}</h2>
                <p className="text-emerald-400 capitalize">{emp.role}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-zinc-500">Phone</p><p className="font-medium">{emp.phone || 'Not set'}</p></div>
              <div><p className="text-sm text-zinc-500">Usual Post</p><p className="font-medium">{emp.defaultLocation || (emp.role === 'rover' ? 'Rover' : 'Not assigned yet')}</p></div>
              <div><p className="text-sm text-zinc-500">Armed</p><p className="font-medium">{emp.armed ? '🔫 Yes' : 'No'}</p></div>
              <div><p className="text-sm text-zinc-500">Uniform</p><p className="font-medium">{[emp.shirtSize && `Shirt ${emp.shirtSize}`, emp.pantsSize && `Pants ${emp.pantsSize}`].filter(Boolean).join(' · ') || 'Not set'}</p></div>
              <div>
                <p className="text-sm text-zinc-500">Guard Card Expires</p>
                <p className={`font-medium ${isCertExpiring(emp.guardCardExpiration) ? 'text-red-400' : ''}`}>{emp.guardCardExpiration || 'Not set'}{isCertExpiring(emp.guardCardExpiration) && ' 🚩'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">CPR Card Expires</p>
                <p className={`font-medium ${isCertExpiring(emp.cprCardExpiration) ? 'text-red-400' : ''}`}>{emp.cprCardExpiration || 'Not set'}{isCertExpiring(emp.cprCardExpiration) && ' 🚩'}</p>
              </div>
            </div>

            {certFlag && (
              <p className="mt-4 text-sm text-red-300 bg-red-900/20 border border-red-900 rounded-lg p-3">🚩 A certification is missing, expired, or expires within 2 months. Please update it.</p>
            )}

            <button onClick={() => startEditingProfile(emp)} className="mt-6 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium">
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <div><label className="block text-sm font-medium mb-2">Full Name</label><input type="text" value={profileData.name} onChange={setField('name')} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-2">Phone</label><input type="tel" value={profileData.phone} onChange={setField('phone')} className={inputClass} /></div>
            {isSupervisor && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Usual Post</label>
                  <select value={profileData.defaultLocation} onChange={setField('defaultLocation')} className={inputClass}>
                    <option value="">Rover (no fixed post)</option>
                    {locations.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profileData.armed} onChange={setField('armed')} /> Armed</label>
              </>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Guard Card Expires</label><input type="date" value={profileData.guardCardExpiration} onChange={setField('guardCardExpiration')} className={inputClass} /></div>
              <div><label className="block text-sm font-medium mb-2">CPR Card Expires</label><input type="date" value={profileData.cprCardExpiration} onChange={setField('cprCardExpiration')} className={inputClass} /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Shirt Size</label>
                <select value={profileData.shirtSize} onChange={setField('shirtSize')} className={inputClass}>
                  <option value="">Select size</option>
                  {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pants Size</label>
                <select value={profileData.pantsSize} onChange={setField('pantsSize')} className={inputClass}>
                  <option value="">Select size</option>
                  {PANTS_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveProfile} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium">Save</button>
              <button onClick={() => setEditingProfile(false)} className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <h3 className="font-semibold mb-3">Upcoming Requests</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">No upcoming requests. Use the Calendar tab to request a day off or extra work.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(r => (
                <div key={r.d + r.type} className="flex justify-between items-center bg-zinc-800/50 rounded-lg px-3 py-2 text-sm">
                  <div><p>{formatLongDate(r.d)}</p><p className="text-xs text-zinc-400">{r.type}</p></div>
                  <span className={`capitalize ${statusStyle[r.status] || ''}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHolidays = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {Object.keys(federalHolidays).map(yr => (
        <div key={yr} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-lg font-medium mb-4 text-blue-400">{yr} Holidays</h3>
          {federalHolidays[yr].map(h => (
            <div key={h.date} className="p-3 bg-zinc-800/50 rounded-lg mb-2">
              <div className="font-medium text-sm">{h.name}</div>
              <div className="text-xs text-zinc-500">{new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold text-lg">SM</div>
            <div>
              <h1 className="text-2xl font-semibold">Schedule Manager</h1>
              <p className="text-xs text-zinc-500">Security Guard Scheduler</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500" placeholder="Your last name" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500" placeholder="Enter password" />
            </div>
            {loginError && <div className="text-red-400 text-sm">{loginError}</div>}
            <button type="submit" className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-sm font-medium">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = isSupervisor ? pendingList(vacationRequests).length : 0;

  const tabs = [
    { id: 'calendar', label: '📅 Calendar' },
    ...(isSupervisor ? [
      { id: 'requests', label: '📋 Requests', badge: pendingCount },
      { id: 'shifts', label: '🗓️ Shifts' },
      { id: 'team', label: '👥 Team Week' },
    ] : []),
    { id: 'profile', label: '👤 Profile' },
    { id: 'holidays', label: '🎉 Holidays' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold">SM</div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold">Schedule Manager</h1>
              <p className="text-xs text-zinc-500">{currentUser.name} • {isSupervisor ? '★ Supervisor' : 'Guard'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg text-sm min-h-[44px]">Logout</button>
        </div>
      </header>

      <div className="border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditingProfile(false); }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center gap-2 ${activeTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab.label}
              {tab.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'requests' && isSupervisor && renderRequests()}
        {activeTab === 'shifts' && isSupervisor && renderShifts()}
        {activeTab === 'team' && isSupervisor && renderTeam()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'holidays' && renderHolidays()}
      </main>
    </div>
  );
}
