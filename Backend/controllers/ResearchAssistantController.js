const researchAssistantService = require('../Services/ResearchAssistantService');
const { success } = require('../Utilities/responseFormatter');

class ResearchAssistantController {
  async ask(req, res, next) {
    try {
      const { question, query, prompt, message, text, q, conversationId, filters = {} } = req.body || {};
      const targetQuestion = question || query || prompt || message || text || q || req.query?.question || req.query?.query || req.query?.prompt || req.query?.q;
      const result = await researchAssistantService.ask(targetQuestion, conversationId, filters);
      return success(res, result, 'Grounded AI answer generated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ResearchAssistantController();
