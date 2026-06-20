function formatDateToYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getCurrentHourMin() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
}

function isLate(currentTime, limitTime) {
  return timeToMinutes(currentTime) > timeToMinutes(limitTime);
}

function getLateMinutes(currentTime, limitTime) {
  const diff = timeToMinutes(currentTime) - timeToMinutes(limitTime);
  return diff > 0 ? diff : 0;
}

function isEarly(currentTime, limitTime) {
  return timeToMinutes(currentTime) < timeToMinutes(limitTime);
}

module.exports = {
  formatDateToYMD,
  getCurrentTime,
  getCurrentHourMin,
  timeToMinutes,
  isLate,
  getLateMinutes,
  isEarly
};