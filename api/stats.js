import { getApiStatus } from '../backend/services/dataService.js';

export default function handler(req, res) {
  const status = getApiStatus();
  res.json({
    totalTools: 35,
    categories: 6,
    mode: status.snapshotAvailable ? 'SNAPSHOT' : 'DEMO',
    lastUpdated: status.lastUpdated
  });
}
