import { testConnection } from '../../../backend/services/xApiService.js';

export default async function handler(req, res) {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
