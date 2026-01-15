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

const defaultRules = [
  { id: 1, name: 'Target Weekly Hours', value: '40', type: 'number', description: 'Target hours per employee' },
  { id: 2, name: 'Max Weekly Hours', value: '40', type: 'number', description: 'Max before overtime' },
  { id: 3, name: 'Max Vacation Same Day', value: '2', type: 'number', description: 'Max employees on vacation same day' },
];

const getWeekDates = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const friday = new Date(start);
  friday.setDate(start.getDate() - ((dayOfWeek + 2) % 7));
  for (let i = 0; i < 7; i++) {
    const date = new Date(friday);
    date.setDate(friday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
const formatDateISO = (date) => date.toISOString().split('T')[0];
const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const isSunday = (date) => date.getDay() === 0;
const isSaturday = (date) => date.getDay() === 6;
const isHoliday = (date) => {
  const dateStr = formatDateISO(date);
  const year = date.getFullYear();
  return (federalHolidays[year] || []).find(h => h.date === dateStr);
};
const getHoursForDay = (date) => isSunday(date) ? 0 : isSaturday(date) ? 5.5 : 8.5;

function ScheduleManager() {
  const [employees] = useState(initialEmployees);
  const [rules, setRules] = useState(defaultRules);
  const [weekStart, setWeekStart] = useState(new Date('2026-01-16'));
  const [schedule, setSchedule] = useState({});
  const [activeTab, setActiveTab] = useState('schedule');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [vacationRequests, setVacationRequests] = useState({
    4: { '2026-01-16': { status: 'approved' }, '2026-01-17': { status: 'approved' } },
    7: { '2026-01-20': { status: 'approved' }, '2026-01-21': { status: 'approved' }, '2026-01-22': { status: 'approved' } }
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const weekDates = getWeekDates(weekStart);

  // Build schedule targeting ~40 hours per person
  useEffect(() => {
    const newSchedule = {};
    employees.forEach(emp => { newSchedule[emp.id] = {}; });

    const bankGuards = employees.filter(emp => emp.role === 'guard');
    const rover = employees.find(emp => emp.role === 'rover');

    // Build each day's schedule
    weekDates.forEach(date => {
      const dateKey = formatDateISO(date);
      const holiday = isHoliday(date);
      const sunday = isSunday(date);
      const saturday = isSaturday(date);
      const hours = getHoursForDay(date);

      // First pass: identify who's available and who needs coverage
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

      // Limit rotation days off - only give day off if rover can cover
      let rotationDayOff = null;
      if (!sunday && !saturday && !holiday && needsCoverage.length === 0 && availableGuards.length > 0) {
        // Rotate through guards for days off
        const dayIndex = Math.floor((date.getTime() - new Date('2026-01-01').getTime()) / (1000 * 60 * 60 * 24));
        rotationDayOff = availableGuards[dayIndex % availableGuards.length];
        needsCoverage.push({ guard: rotationDayOff, reason: 'rotation' });
      }

      // Assign rover to first post that needs coverage
      const coveragePost = needsCoverage.length > 0 ? needsCoverage[0].guard.defaultLocation : null;

      // Now assign everyone
      employees.forEach(emp => {
        const vacReq = vacationRequests[emp.id]?.[dateKey];

        if (sunday) {
          newSchedule[emp.id][dateKey] = { status: 'closed', location: '', hours: 0 };
        } else if (holiday) {
          newSchedule[emp.id][dateKey] = { status: 'holiday', location: '', hours: 0, holidayName: holiday.name };
        } else if (vacReq?.status === 'approved') {
          newSchedule[emp.id][dateKey] = { status: 'vacation', location: '', hours: 0 };
        } else if (emp.role === 'supervisor') {
          newSchedule[emp.id][dateKey] = { status: 'work', location: 'Supervisor Post', hours, time: saturday ? '0830-1430' : '0830-1730' };
        } else if (emp.role === 'rover') {
          if (coveragePost) {
            newSchedule[emp.id][dateKey] = { status: 'work', location: coveragePost, hours, time: saturday ? '0830-1430' : '0830-1730' };
          } else {
            newSchedule[emp.id][dateKey] = { status: 'oncall', location: 'On Call', hours: 0 };
          }
        } else {
          // Regular guard
          if (rotationDayOff?.id === emp.id) {
            newSchedule[emp.id][dateKey] = { status: 'nowork', location: '', hours: 0 };
          } else {
            newSchedule[emp.id][dateKey] = { status: 'work', location: emp.defaultLocation, hours, time: saturday ? '0830-1430' : '0830-1730' };
          }
        }
      });
    });

    setSchedule(newSchedule);
  }, [weekStart, vacationRequests]);

  const cycleStatus = (empId, dateKey) => {
    const current = schedule[empId]?.[dateKey]?.status || 'work';
    if (current === 'closed') return;
    const idx = STATUS_OPTIONS.indexOf(current);
    let nextStatus = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    if (nextStatus === 'closed') nextStatus = 'work';
    
    const date = new Date(dateKey + 'T12:00:00');
    const hours = nextStatus === 'work' ? getHoursForDay(date) : 0;
    setSchedule(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [dateKey]: { ...prev[empId]?.[dateKey], status: nextStatus, hours } }
    }));
  };

  const calculateWeeklyHours = (empId) => {
    if (!schedule[empId]) return 0;
    return Object.values(schedule[empId]).reduce((sum, day) => sum + (day.hours || 0), 0);
  };

  const calculateOvertime = (empId) => {
    const total = calculateWeeklyHours(empId);
    const threshold = parseInt(rules.find(r => r.name === 'Max Weekly Hours')?.value || 40);
    return Math.max(0, total - threshold);
  };

  const requestVacation = (empId, dateStr) => setVacationRequests(prev => ({ ...prev, [empId]: { ...prev[empId], [dateStr]: { status: 'pending' } } }));
  const approveVacation = (empId, dateStr) => setVacationRequests(prev => ({ ...prev, [empId]: { ...prev[empId], [dateStr]: { status: 'approved' } } }));
  const denyVacation = (empId, dateStr) => setVacationRequests(prev => ({ ...prev, [empId]: { ...prev[empId], [dateStr]: { status: 'denied' } } }));
  const cancelVacation = (empId, dateStr) => {
    setVacationRequests(prev => {
      const n = { ...prev };
      if (n[empId]) delete n[empId][dateStr];
      return n;
    });
  };

  const VacationCalendar = ({ employeeId }) => {
    const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));

    return (
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalendarMonth(new Date(year, month - 1))} className="p-2 hover:bg-zinc-800 rounded-lg">←</button>
          <h3 className="font-medium">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => setCalendarMonth(new Date(year, month + 1))} className="p-2 hover:bg-zinc-800 rounded-lg">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-zinc-500 py-2">{d}</div>)}
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = formatDateISO(day);
            const holiday = isHoliday(day);
            const sunday = isSunday(day);
            const vacReq = vacationRequests[employeeId]?.[dateStr];
            const isPast = day < new Date(new Date().setHours(0,0,0,0));
            
            let bg = 'hover:bg-zinc-800', text = 'text-zinc-300';
            if (sunday) { bg = 'bg-zinc-700/30'; text = 'text-zinc-500'; }
            else if (holiday) { bg = 'bg-blue-900/40'; text = 'text-blue-300'; }
            else if (vacReq?.status === 'approved') { bg = 'bg-emerald-900/40'; text = 'text-emerald-300'; }
            else if (vacReq?.status === 'pending') { bg = 'bg-amber-900/40'; text = 'text-amber-300'; }
            else if (isPast) { text = 'text-zinc-600'; }
            
            return (
              <button key={idx} onClick={() => {
                if (isPast || holiday || sunday) return;
                if (vacReq?.status === 'pending') cancelVacation(employeeId, dateStr);
                else if (!vacReq) requestVacation(employeeId, dateStr);
              }} className={`p-2 rounded-lg ${bg} ${text}`}>{day.getDate()}</button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-900/40"></span> Pending</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-900/40"></span> Approved</span>
        </div>
      </div>
    );
  };

  const PendingRequests = () => {
    const pending = [];
    Object.entries(vacationRequests).forEach(([empId, dates]) => {
      Object.entries(dates).forEach(([dateStr, req]) => {
        if (req.status === 'pending') {
          const emp = employees.find(e => e.id === parseInt(empId));
          pending.push({ empId: parseInt(empId), empName: emp?.name, dateStr });
        }
      });
    });
    if (!pending.length) return null;
    
    return (
      <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800 rounded-xl">
        <h3 className="font-medium text-amber-300 mb-3">Pending Requests ({pending.length})</h3>
        <div className="space-y-2">
          {pending.map(({ empId, empName, dateStr }) => (
            <div key={`${empId}-${dateStr}`} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg">
              <div>
                <div className="font-medium">{empName}</div>
                <div className="text-xs text-zinc-500">{new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveVacation(empId, dateStr)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm">Approve</button>
                <button onClick={() => denyVacation(empId, dateStr)} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm">Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const generateImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cw = 120, ch = 50, hh = 45, nw = 160, pad = 15;
    canvas.width = nw + weekDates.length * cw + 120 + pad * 2;
    canvas.height = hh + employees.length * ch + pad * 2;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(pad, pad, canvas.width - pad * 2, hh);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('Employee', pad + 5, pad + 28);
    weekDates.forEach((d, i) => {
      const x = pad + nw + i * cw;
      ctx.fillStyle = isHoliday(d) ? '#3b82f6' : isSunday(d) ? '#9ca3af' : '#1a1a1a';
      ctx.fillText(`${getDayName(d)} ${formatDate(d)}`, x + 5, pad + 28);
    });
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('Hrs', pad + nw + weekDates.length * cw + 5, pad + 28);
    ctx.fillText('OT', pad + nw + weekDates.length * cw + 55, pad + 28);
    
    // Rows
    employees.forEach((emp, ri) => {
      const y = pad + hh + ri * ch;
      ctx.fillStyle = ri % 2 === 0 ? '#fafafa' : '#f0f0f0';
      ctx.fillRect(pad, y, canvas.width - pad * 2, ch);
      
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 9px Arial';
      ctx.fillText(emp.name, pad + 5, y + 20);
      ctx.font = '8px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(emp.phone, pad + 5, y + 32);
      
      weekDates.forEach((d, ci) => {
        const x = pad + nw + ci * cw;
        const dk = formatDateISO(d);
        const cell = schedule[emp.id]?.[dk] || {};
        
        const colors = { vacation: '#fef08a', holiday: '#bfdbfe', closed: '#d4d4d8', nowork: '#fecaca', oncall: '#e9d5ff' };
        ctx.fillStyle = colors[cell.status] || (ri % 2 === 0 ? '#fafafa' : '#f0f0f0');
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = '#d4d4d4';
        ctx.strokeRect(x, y, cw, ch);
        
        ctx.font = '8px Arial';
        ctx.fillStyle = '#1a1a1a';
        
        const labels = { vacation: 'VACATION', holiday: 'HOLIDAY', closed: 'CLOSED', nowork: 'NO WORK', oncall: 'ON CALL' };
        if (labels[cell.status]) {
          ctx.font = 'bold 9px Arial';
          ctx.fillText(labels[cell.status], x + 5, y + 28);
        } else if (cell.status === 'work') {
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
    link.download = `Schedule_${formatDate(weekDates[0]).replace('/','-')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const runAi = async () => {
    setAiLoading(true);
    setShowAiPanel(true);
    const data = employees.map(e => ({ name: e.name, role: e.role, hours: calculateWeeklyHours(e.id), ot: calculateOvertime(e.id) }));
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: `Analyze schedule hours: ${JSON.stringify(data)}. Target 40hrs. Give JSON with violations, recommendations, summary.` }] })
      });
      const d = await res.json();
      const t = d.content?.map(c => c.text || '').join('') || '';
      const m = t.match(/\{[\s\S]*\}/);
      setAiSuggestions(m ? JSON.parse(m[0]) : { summary: t });
    } catch { setAiSuggestions({ summary: 'Error' }); }
    setAiLoading(false);
  };

  const getStatusColor = (s) => {
    const c = { work: 'bg-emerald-900/40 text-emerald-300', vacation: 'bg-amber-900/40 text-amber-300', holiday: 'bg-blue-900/40 text-blue-300', closed: 'bg-zinc-700/40 text-zinc-400', nowork: 'bg-red-900/40 text-red-300', oncall: 'bg-purple-900/40 text-purple-300' };
    return c[s] || 'bg-zinc-800 text-zinc-500';
  };
  
  const getStatusLabel = (s) => ({ work: 'Work', vacation: 'Vacation', holiday: 'Holiday', closed: 'Closed', nowork: 'No Work', oncall: 'On Call' }[s] || s);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold">SM</div>
            <div>
              <h1 className="text-xl font-semibold">Schedule Manager</h1>
              <p className="text-xs text-zinc-500">Target: 40 hrs/week</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekStart(new Date(weekStart.getTime() - 7*24*60*60*1000))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">← Prev</button>
            <div className="px-4 py-2 bg-zinc-800/50 rounded-lg text-sm">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</div>
            <button onClick={() => setWeekStart(new Date(weekStart.getTime() + 7*24*60*60*1000))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Next →</button>
          </div>
        </div>
      </header>

      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {['schedule', 'employees', 'rules', 'holidays'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{tab}</button>
          ))}
          <div className="flex-1" />
          <button onClick={generateImage} className="my-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm mr-2">📷 Export</button>
          <button onClick={runAi} disabled={aiLoading} className="my-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-sm disabled:opacity-50">{aiLoading ? '...' : '⚡ AI'}</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <PendingRequests />
            
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left p-3 text-zinc-400 sticky left-0 bg-zinc-900 z-10 min-w-[170px]">Employee</th>
                    {weekDates.map(d => {
                      const h = isHoliday(d), sun = isSunday(d);
                      return (
                        <th key={d.toISOString()} className="text-center p-3 min-w-[120px]">
                          <div className={h ? 'text-blue-400' : sun ? 'text-zinc-500' : 'text-zinc-400'}>{getDayName(d)}</div>
                          <div className="text-xs text-zinc-500">{formatDate(d)}</div>
                          {h && <div className="text-[10px] text-blue-400">{h.name}</div>}
                          {sun && <div className="text-[10px] text-zinc-500">Closed</div>}
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
                        <div className="font-medium flex items-center gap-1">
                          {emp.name}
                          {emp.armed && <span className="text-[10px]">🔫</span>}
                          {emp.role === 'supervisor' && <span className="text-[10px] text-yellow-400">★</span>}
                          {emp.role === 'rover' && <span className="text-[10px] text-cyan-400">↔</span>}
                        </div>
                        <div className="text-xs text-zinc-500">{emp.phone}</div>
                      </td>
                      {weekDates.map(d => {
                        const dk = formatDateISO(d);
                        const cell = schedule[emp.id]?.[dk] || {};
                        return (
                          <td key={dk} className="p-2">
                            <div className={`rounded-lg p-2 text-xs ${getStatusColor(cell.status)} cursor-pointer hover:ring-1 hover:ring-zinc-600`} onClick={() => cycleStatus(emp.id, dk)}>
                              <div className="font-medium mb-1">{getStatusLabel(cell.status)}</div>
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

            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              {[['emerald', 'Work'], ['amber', 'Vacation'], ['blue', 'Holiday'], ['red', 'No Work'], ['purple', 'On Call'], ['zinc-700', 'Closed']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded bg-${c}-900/40`}></span> {l}</span>
              ))}
            </div>

            {/* Coverage Grid */}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
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
                            if (s?.status !== 'work') return false;
                            if (loc.supervisorOnly) return s.location?.includes('Supervisor');
                            return s.location?.includes(loc.name);
                          });
                          
                          const ok = covering.length > 0;
                          const armed = covering.some(e => e.armed);
                          const rover = covering.some(e => e.role === 'rover');
                          
                          let bg = 'bg-emerald-900/30', txt = 'text-emerald-300', warn = null;
                          if (!ok) { bg = 'bg-red-900/30'; txt = 'text-red-300'; warn = 'NONE'; }
                          else if (loc.armed && !armed) { bg = 'bg-red-900/30'; txt = 'text-red-300'; warn = 'NEED ARMED'; }
                          else if (rover) { bg = 'bg-cyan-900/30'; txt = 'text-cyan-300'; }
                          
                          return (
                            <td key={dk} className="p-2">
                              <div className={`rounded-lg p-2 ${bg}`}>
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
        )}

        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Team</h2>
              {employees.map(emp => {
                const hrs = calculateWeeklyHours(emp.id);
                const diff = hrs - 40;
                return (
                  <div key={emp.id} onClick={() => setSelectedEmployee(emp.id)} className={`p-4 bg-zinc-900/50 rounded-xl border cursor-pointer ${selectedEmployee === emp.id ? 'border-emerald-500' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{emp.name} {emp.armed && '🔫'} {emp.role === 'supervisor' && '★'} {emp.role === 'rover' && '↔'}</div>
                        <div className="text-xs text-zinc-500 mt-1">{emp.phone}</div>
                        <div className="text-xs text-zinc-600 mt-2">{emp.defaultLocation || 'Rover'}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${Math.abs(diff) <= 2 ? 'text-emerald-400' : diff > 0 ? 'text-amber-400' : 'text-blue-400'}`}>{hrs.toFixed(1)}</div>
                        <div className="text-xs text-zinc-500">({diff >= 0 ? '+' : ''}{diff.toFixed(1)})</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              {selectedEmployee ? (
                <>
                  <h2 className="text-lg font-medium mb-4">Vacation - {employees.find(e => e.id === selectedEmployee)?.name}</h2>
                  <VacationCalendar employeeId={selectedEmployee} />
                </>
              ) : <div className="text-center text-zinc-500 py-20">Select employee for vacation calendar</div>}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            {rules.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="flex-1">
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-zinc-500">{r.description}</div>
                </div>
                <input type={r.type} value={r.value} onChange={e => setRules(p => p.map(x => x.id === r.id ? { ...x, value: e.target.value } : x))} className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="grid md:grid-cols-2 gap-6">
            {[2026, 2027].map(yr => (
              <div key={yr} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <h3 className="text-lg font-medium mb-4 text-blue-400">{yr} Holidays</h3>
                {federalHolidays[yr]?.map(h => (
                  <div key={h.date} className="flex justify-between p-3 bg-zinc-800/50 rounded-lg mb-2">
                    <div>
                      <div className="font-medium text-sm">{h.name}</div>
                      <div className="text-xs text-zinc-500">{new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {showAiPanel && (
          <div className="fixed inset-y-0 right-0 w-96 bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col">
            <div className="flex justify-between p-4 border-b border-zinc-800">
              <span className="font-medium">AI Analysis</span>
              <button onClick={() => setShowAiPanel(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {aiLoading ? <div className="text-center py-8 text-zinc-500">Analyzing...</div> : aiSuggestions ? (
                <>
                  {aiSuggestions.summary && <div className="p-3 bg-zinc-800/50 rounded-lg mb-4"><div className="font-medium mb-2">Summary</div><div className="text-sm text-zinc-400">{aiSuggestions.summary}</div></div>}
                  {aiSuggestions.violations?.map((v, i) => <div key={i} className="p-3 bg-red-900/30 rounded-lg mb-2 text-sm"><div className="font-medium text-red-300">{v.type}</div><div className="text-xs text-red-200">{v.description}</div></div>)}
                  {aiSuggestions.recommendations?.map((r, i) => <div key={i} className="p-3 bg-emerald-900/30 rounded-lg mb-2 text-sm"><div className="font-medium text-emerald-300">{r.action}</div><div className="text-xs text-emerald-200">{r.reason}</div></div>)}
                </>
              ) : <div className="text-center py-8 text-zinc-500">Click AI to analyze</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
