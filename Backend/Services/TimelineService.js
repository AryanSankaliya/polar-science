const expeditionService = require('./ExpeditionService');
const antarcticaService = require('./AntarcticaService');

class TimelineService {
  async getFullTimeline() {
    const [expeditions, antarcticMilestones] = await Promise.all([
      expeditionService.getExpeditionTimeline(),
      antarcticaService.getRecords()
    ]);

    return {
      expeditions_timeline: expeditions,
      milestones: antarcticMilestones
    };
  }
}

module.exports = new TimelineService();
