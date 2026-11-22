export const isOverdue = value => !!value && new Date(value).getTime() < Date.now();
/** Gujarati countdown label used by the yard deadlines (payment / dispatch / credit). */
export const deadlineLabel = value => {
  if (!value) return '—';
  const ms = new Date(value).getTime() - Date.now();
  if (ms < 0) return 'મર્યાદા વટાવી';
  const hours = Math.ceil(ms / 3600000);
  return hours < 24 ? hours + ' કલાક બાકી' : Math.ceil(hours / 24) + ' દિવસ બાકી';
};
