const timelineService = require('../Services/TimelineService');
const { success } = require('../Utilities/responseFormatter');

class TimelineController {
  async getTimeline(req, res, next) {
    try {
      const timeline = await timelineService.getFullTimeline();
      return success(res, timeline, 'Polar expedition & scientific milestones timeline retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TimelineController();
