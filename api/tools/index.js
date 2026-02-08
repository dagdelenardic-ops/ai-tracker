import { aiTools, getToolsByCategory } from '../../backend/data/ai-tools.js';

export default function handler(req, res) {
  const { category } = req.query;

  let tools = category && category !== 'all'
    ? getToolsByCategory(category)
    : aiTools;

  res.json({
    success: true,
    count: tools.length,
    data: tools
  });
}
