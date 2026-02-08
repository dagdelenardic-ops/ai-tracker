export default function handler(req, res) {
  const hasRapidApi = !!process.env.RAPIDAPI_KEY;
  res.json({
    totalTools: 35,
    categories: 6,
    mode: hasRapidApi ? 'RAPIDAPI' : 'DEMO',
    lastUpdated: new Date().toISOString()
  });
}
