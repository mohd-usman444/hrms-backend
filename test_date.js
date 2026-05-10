const fromDate = '2026-04-28';
const d = new Date(fromDate);
console.log('Original:', d.toISOString(), d.toString());
d.setHours(0,0,0,0);
console.log('Normalized Start:', d.toISOString(), d.toString());

const end = new Date(fromDate);
end.setHours(23,59,59,999);
console.log('Normalized End:', end.toISOString(), end.toString());
