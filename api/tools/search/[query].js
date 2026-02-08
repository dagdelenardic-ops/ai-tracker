import { aiTools } from '../../../backend/data/ai-tools.js';

export default function handler(req, res) {
  const { query } = req.query;
  const q = query.toLowerCase();

  const results = aiTools.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.company.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.categoryLabel.toLowerCase().includes(q)
  );

  res.json({
    success: true,
    count: results.length,
    data: results
  });
}
