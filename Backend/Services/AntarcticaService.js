const stationRepository = require('../Repositories/StationRepository');
const expeditionRepository = require('../Repositories/ExpeditionRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');
const environmentRepository = require('../Repositories/EnvironmentRepository');
const projectRepository = require('../Repositories/ProjectRepository');

class AntarcticaService {
  async getAntarcticaInfo() {
    const [indianStations, totalStations, expeditionsCount] = await Promise.all([
      stationRepository.findIndianStations(),
      stationRepository.count({ region: /Antarctica/i }),
      expeditionRepository.count({})
    ]);

    return {
      title: 'Indian Antarctic Programme & Science Hub',
      summary: 'India has maintained a sustained, premier scientific presence in Antarctica since the 1st Indian Scientific Expedition to Antarctica (ISEA) in 1981.',
      key_achievements: [
        'Established Dakshin Gangotri (1983) - India first permanent Antarctic base.',
        'Commissioned Maitri Station (1989) in Schirmacher Oasis - continuous year-round operations.',
        'Constructed state-of-the-art Bharati Station (2012) in Larsemann Hills.',
        'Over 41 successful scientific expeditions completed covering oceanography, glaciology, biology, and space physics.'
      ],
      stations: indianStations,
      statistics: {
        total_antarctic_stations: totalStations,
        indian_active_stations: indianStations.length,
        expeditions_conducted: expeditionsCount
      }
    };
  }

  async getIndianPrograms() {
    const projects = await projectRepository.find({});
    return {
      program_name: 'PACER - Polar and Cryosphere Studies (Antarctica)',
      nodal_agency: 'National Centre for Polar and Ocean Research (NCPOR), MoES',
      active_projects: projects,
      thrust_areas: [
        'Ice Sheet Mass Balance & Sea Level Rise',
        'Paleoclimatology via Deep Ice Cores (Dome Fuji & Coastal Ice Caps)',
        'Southern Ocean Biogeochemistry and Carbon Pumps',
        'Antarctic Microbial Diversity and Extremophile Genomics'
      ]
    };
  }

  async getRecords() {
    return [
      { achievement: 'First Indian Wintering in Antarctica', year: '1984', leader: 'Dr. S. Z. Qasim' },
      { achievement: 'Establishment of Maitri Base in Schirmacher Oasis', year: '1989', leader: 'ISEA Team' },
      { achievement: 'South Pole Overland Scientific Expedition', year: '2010', leader: 'Dr. Rasik Ravindra' },
      { achievement: 'Inauguration of Green Bharati Station', year: '2012', leader: 'NCPOR / MoES' },
      { achievement: '40th ISEA Commemorative Expedition to Maitri & Bharati', year: '2021', leader: 'Dr. Atul Suresh' }
    ];
  }

  async getAntarcticaTimeline() {
    return expeditionRepository.find({}, { sort: { operational_year: 1 } });
  }

  async getProtectedAreas() {
    return environmentRepository.findByCategory('Protected');
  }
}

module.exports = new AntarcticaService();
