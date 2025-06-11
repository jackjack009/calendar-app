export const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createLocalDateFromYYYYMMDD = (dateString) => {
  if (typeof dateString !== 'string') {
    console.error('createLocalDateFromYYYYMMDD received non-string input:', dateString, 'Type:', typeof dateString);
    // Return a default invalid date or throw an error to prevent further issues
    return new Date(NaN); // Or throw new Error("Invalid date string provided");
  }
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript Date constructor
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0); // Ensure it's midnight in local time
  return date;
};

export const getSundayOfWeek = (date) => {
  const d = new Date(date); // Create a copy to avoid modifying original
  d.setHours(0, 0, 0, 0); // Set to midnight local time
  const day = d.getDay(); // Get current day of week (0 = Sunday, 6 = Saturday)
  const diff = d.getDate() - day; // Calculate date for Sunday of current week
  d.setDate(diff);
  return d;
}; 