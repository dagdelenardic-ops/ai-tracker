import { getApiStatus } from '../backend/services/dataService.js';

export default function handler(req, res) {
  const status = getApiStatus();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mode: status.snapshotAvailable ? 'SNAPSHOT' : 'UNAVAILABLE',
    source: status.source,
    lastUpdated: status.lastUpdated
  });
}
