const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby47lJymK5vNJpqRx0mS_00YpwTsoLpBDTTBnyxo_Dkrjp3EMlUMwbNV_FMIubm0LG4/exec';

export interface StaffData {
  employee_id: number;
  division_name_vn: string;
  department_name_vn: string;
  section_name_vn: string;
  team_name_vn: string;
}

export interface ReportData {
  staffList: StaffData[];
  activeByDate: Record<string, number[]>;
  allDates: string[];
}

// ponytail: module-level cache — ceiling is process restart clears it (acceptable for this use case)
let _cache: { data: ReportData; ts: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function fetchAndProcessData(forceRefresh = false): Promise<ReportData> {
  if (!forceRefresh && _cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  // Add artificial delay on hard refresh to allow the UI loading sequence to play out
  const minDelay = forceRefresh ? new Promise(r => setTimeout(r, 4500)) : Promise.resolve();

  const res = await fetch(APPS_SCRIPT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Apps Script fetch failed: ${res.status}`);
  
  await minDelay;

  const data = await res.json() as ReportData;

  // Normalize dates to DD/MM format matching the Python logic
  const normalizeDateKey = (key: string): string => {
    // 1. If it's "17-04" or "17/04", normalize to "17/04"
    if (/^\d{1,2}[-\/]\d{1,2}$/.test(key.trim())) {
      const parts = key.trim().replace('-', '/').split('/');
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
    
    // 2. If it's a full date string, parse it.
    // In Google Sheets, ambiguous DD/MM (like 04/05) is parsed by JS as MM/DD (April 5th).
    // Therefore, the parsed month is the intended DAY, and the parsed day is the intended MONTH.
    const cleanKey = key.split('(')[0].trim();
    const dt = new Date(cleanKey);
    if (!isNaN(dt.getTime())) {
      const intendedDay = String(dt.getMonth() + 1).padStart(2, '0');
      const intendedMonth = String(dt.getDate()).padStart(2, '0');
      return `${intendedDay}/${intendedMonth}`;
    }
    return key;
  };

  const normalizedActiveByDate: Record<string, number[]> = {};
  const normalizedDatesOrder: string[] = [];
  const seenDates = new Set<string>();

  data.allDates.forEach(d => {
    const norm = normalizeDateKey(d);
    
    if (!seenDates.has(norm)) {
      seenDates.add(norm);
      normalizedDatesOrder.push(norm);
    }

    if (data.activeByDate[d]) {
      normalizedActiveByDate[norm] = [
        ...(normalizedActiveByDate[norm] || []),
        ...data.activeByDate[d]
      ];
    }
  });

  // Keep the exact order from the API
  data.allDates = normalizedDatesOrder;
  data.activeByDate = normalizedActiveByDate;

  // employee_id comes as string from Apps Script, normalize to number
  data.staffList = data.staffList.map(s => ({ ...s, employee_id: Number(s.employee_id) }));

  _cache = { data, ts: Date.now() };
  return data;
}
