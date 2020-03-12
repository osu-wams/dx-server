export const getDaysInDuration = (duration: string): [number, Date][] => {
  const [number] = duration.toLowerCase().split('daysago');
  const now = new Date(Date.now());
  const days = [...Array(parseInt(number, 10))];
  return days.map((v, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (i + 1));
    return [i + 1, d];
  });
};

export default getDaysInDuration;
