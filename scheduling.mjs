export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 21;
export const CLOSED_WEEKDAY = 0;
export const LUNCH_HOUR = 12;

export const localIsoDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function validLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const date = new Date(`${value}T12:00:00`);
  return localIsoDate(date) === value ? date : null;
}

export function isSunday(value) {
  const date = value instanceof Date ? value : validLocalDate(value);
  return !date || date.getDay() === CLOSED_WEEKDAY;
}

export function formatDateBR(value) {
  const date = validLocalDate(value);
  return date ? date.toLocaleDateString('pt-BR') : '';
}

export function suggestedDays(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return [today, tomorrow].map((date, index) => ({
    iso: localIsoDate(date),
    label: `${index === 0 ? 'Hoje' : 'Amanhã'} · ${date.toLocaleDateString('pt-BR')}`,
    closed: isSunday(date),
  }));
}

export function slotsForDate(value, now = new Date()) {
  const date = validLocalDate(value);
  if (!date || isSunday(date)) return [];
  const today = localIsoDate(now);
  if (value < today) return [];
  const isToday = value === today;
  const slots = [];
  // The business closes at 21:00, so 21:00 is closing time, not a start slot.
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour += 1) {
    const candidate = new Date(date);
    candidate.setHours(hour, 0, 0, 0);
    // For same-day requests, offer only full-hour slots still in the future.
    if (isToday && candidate <= now) continue;
    const time = `${String(hour).padStart(2, '0')}:00`;
    slots.push({
      time,
      needsManualConfirmation: hour === LUNCH_HOUR,
      label: hour === LUNCH_HOUR ? `${time} · confirmar pelo WhatsApp` : time,
    });
  }
  return slots;
}

export function bookingRequestAllowed({ date, time, now = new Date() }) {
  const parsed = validLocalDate(date);
  if (!parsed) return { allowed: false, reason: 'invalid_date' };
  if (isSunday(parsed)) return { allowed: false, reason: 'closed_sunday' };
  if (!/^\d{2}:00$/.test(time)) return { allowed: false, reason: 'invalid_time' };
  const hour = Number(time.slice(0, 2));
  if (hour < OPEN_HOUR || hour >= CLOSE_HOUR) return { allowed: false, reason: 'outside_hours' };
  if (!slotsForDate(date, now).some(slot => slot.time === time)) return { allowed: false, reason: 'past_time' };
  return { allowed: true, needsManualConfirmation: hour === LUNCH_HOUR };
}
