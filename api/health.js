export default function handler(req, res) {
  const hasRapidApi = !!process.env.RAPIDAPI_KEY;
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mode: hasRapidApi ? 'RAPIDAPI' : 'DEMO'
  });
}
