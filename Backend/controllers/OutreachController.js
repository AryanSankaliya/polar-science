const outreachService = require('../Services/OutreachService');
const { success } = require('../Utilities/responseFormatter');

class OutreachController {
  async getOutreachContent(req, res, next) {
    try {
      const items = await outreachService.getEducationalStories();
      return success(res, items, 'Outreach content retrieved');
    } catch (err) {
      next(err);
    }
  }

  async generateOutreach(req, res, next) {
    try {
      const draft = await outreachService.generateOutreachDraft(req.body);
      return success(res, draft, 'AI research outreach draft generated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OutreachController();

