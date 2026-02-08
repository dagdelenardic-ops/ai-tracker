import { aiTools } from '../../backend/data/ai-tools.js';

export default function handler(req, res) {
  const { id } = req.query;
  const tool = aiTools.find(t => t.id === id);

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found'
    });
  }

  res.json({
    success: true,
    data: tool
  });
}
