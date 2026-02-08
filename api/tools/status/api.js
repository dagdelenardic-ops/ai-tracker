import { getApiStatus } from '../../../backend/services/dataService.js';

export default function handler(req, res) {
  res.json({
    success: true,
    data: getApiStatus()
  });
}
