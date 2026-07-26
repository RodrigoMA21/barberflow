const DEFAULT_WINDOWS = {
  1: [[8 * 60, 19 * 60]],
  2: [[8 * 60, 19 * 60]],
  3: [[8 * 60, 19 * 60]],
  4: [[8 * 60, 19 * 60]],
  5: [[8 * 60, 19 * 60]],
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

function timeStringToMinutes(value) {
  if (!value) return null;

  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

function normalizeDayList(diasAtendimento) {
  if (!Array.isArray(diasAtendimento)) return [];
  return diasAtendimento.map((dia) => Number(dia)).filter((dia) => Number.isInteger(dia));
}

function getBusinessWindows(date, barbeiro = null) {
  const days = normalizeDayList(barbeiro?.dias_atendimento);

  if (days.length > 0 && !days.includes(date.getDay())) {
    return [];
  }

  const startMinutes = timeStringToMinutes(barbeiro?.horario_inicio);
  const endMinutes = timeStringToMinutes(barbeiro?.horario_fim);

  if (startMinutes === null || endMinutes === null) {
    return DEFAULT_WINDOWS[date.getDay()] || [];
  }

  const windows = [[startMinutes, endMinutes]];
  const breakStart = timeStringToMinutes(barbeiro?.horario_intervalo_inicio);
  const breakEnd = timeStringToMinutes(barbeiro?.horario_intervalo_fim);

  if (breakStart !== null && breakEnd !== null && breakEnd > breakStart) {
    return [
      [startMinutes, breakStart],
      [breakEnd, endMinutes],
    ].filter(([open, close]) => close > open);
  }

  return windows;
}

function validateBusinessHours(startDateTime, endDateTime, barbeiro = null) {
  if (endDateTime <= startDateTime) {
    return {
      ok: false,
      error: "O horário final precisa ser maior que o horário inicial",
    };
  }

  const windows = getBusinessWindows(startDateTime, barbeiro);

  if (!windows.length) {
    return {
      ok: false,
      error: "O barbeiro não atende no dia selecionado",
    };
  }

  const startMinutes = minutesFromDate(startDateTime);
  const endMinutes = minutesFromDate(endDateTime);

  const fitsWindow = windows.some(
    ([openMinutes, closeMinutes]) => startMinutes >= openMinutes && endMinutes <= closeMinutes,
  );

  if (!fitsWindow) {
    return {
      ok: false,
      error: "O horário do atendimento precisa respeitar o atendimento configurado para este barbeiro",
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
  timeStringToMinutes,
  validateBusinessHours,
};
