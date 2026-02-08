import { categories } from '../../backend/data/ai-tools.js';

export default function handler(req, res) {
  res.json({
    success: true,
    data: categories
  });
}
