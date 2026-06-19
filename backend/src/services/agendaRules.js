const BUSINESS_WINDOWS = {
  0: [],
  1: [
    [8 * 60, 12 * 60],
    [13 * 60 + 30, 19 * 60],
  ],
  2: [
    [8 * 60, 12 * 60],
    [13 * 60 + 30, 19 * 60],
  ],
  3: [
    [8 * 60, 12 * 60],
    [13 * 60 + 30, 19 * 60],
  ],
  4: [
    [8 * 60, 12 * 60],
    [13 * 60 + 30, 19 * 60],
  ],
  5: [
    [8 * 60, 12 * 60],
    [13 * 60 + 30, 19 * 60],
  ],
  6: [[8 * 60, 12 * 60]],
};

function parseLocalDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const datePart = dateValue instanceof Date
    ? `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}-${String(dateValue.getDate()).padStart(2, "0")}`
    : String(dateValue).includes("T")
      ? String(dateValue).split("T")[0]
      : String(dateValue);
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds = 0] = String(timeValue)
    .slice(0, 8)
    .split(":")
    .map(Number);

  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, Number(seconds) || 0, 0);
}

function minutesFromDate(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function calculateTotalDuration(servicos = []) {
  return servicos.reduce(
    (total, servico) => total + Number(servico.duracao_minutos || 30),
    0,
  );
}

function calculateAppointmentEnd(startDateTime, durationMinutes) {
  return addMinutes(startDateTime, durationMinutes);
}

function formatMinutesAsTime(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mins = String(normalized % 60).padStart(2, "0");

  return `${hours}:${mins}`;
}

function getBusinessWindows(date) {
  return BUSINESS_WINDOWS[date.getDay()] || [];
}

function validateBusinessHours(startDateTime, endDateTime) {
  const windows = getBusinessWindows(startDateTime);

  if (!windows.length) {
    return {
      ok: false,
      error: "A barbearia está fechada no dia selecionado",
    };
  }

  const startMinutes = minutesFromDate(startDateTime);
  const endMinutes = minutesFromDate(endDateTime);

  if (endMinutes <= startMinutes) {
    return {
      ok: false,
      error: "O horário final precisa ser maior que o horário inicial",
    };
  }

  const fitsWindow = windows.some(
    ([openMinutes, closeMinutes]) =>
      startMinutes >= openMinutes && endMinutes <= closeMinutes,
  );

  if (!fitsWindow) {
    return {
      ok: false,
      error:
        "O horário do atendimento precisa respeitar o expediente da barbearia",
    };
  }

  return { ok: true };
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

module.exports = {
  addMinutes,
  calculateAppointmentEnd,
  calculateTotalDuration,
  formatMinutesAsTime,
  getBusinessWindows,
  overlaps,
  parseLocalDateTime,
  validateBusinessHours,
};
