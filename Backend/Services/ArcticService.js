const stationRepository = require('../Repositories/StationRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const facilityRepository = require('../Repositories/FacilityRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');

class ArcticService {
  async getArcticInfo() {
    return {
      title: 'Indian Arctic Programme & Himadri Research Base',
      summary: 'Initiated in 2007, India Arctic Programme conducts cutting-edge research in atmospheric science, marine biology, glaciology, and climate teleconnections with the Indian Monsoon.',
      station: {
        name: 'Himadri Station',
        location: 'Ny-Ålesund, Spitsbergen, Svalbard (78°55′N, 11°56′E)',
        established_year: 2008,
        operational_status: 'Active Summer & Austral Field Expeditions'
      },
      key_initiatives: [
        'IndARC: India First Multi-sensor Moored Underwater Observatory in Kongsfjorden (deployed 2014).',
        'Gruvebadet Atmospheric Aerosol Laboratory participation for black carbon and aerosol characterization.',
        'Long-term Kongsfjorden fjord dynamics and Atlantic Water intrusion monitoring.',
        'Microbial ecology and cryophilic enzyme discovery from Arctic permafrost.'
      ]
    };
  }

  async getArcticProjects() {
    return projectRepository.find({
      $or: [
        { project_code: /ARCTIC/i },
        { title: /Arctic|Kongsfjorden|IndARC|Svalbard/i },
        { station_ids: 'ind-stn-04' }
      ]
    });
  }

  async getArcticStations() {
    return stationRepository.find({
      $or: [
        { region: /Arctic/i },
        { station_id: 'ind-stn-04' }
      ]
    });
  }

  async getArcticMonitoring() {
    return {
      observatory: 'IndARC & Kongsfjorden Monitoring Array',
      sensor_depths: ['25m', '50m', '100m', '150m', '192m (Seabed)'],
      measured_parameters: [
        'Seawater Temperature & Salinity',
        'Ocean Current Velocity & Direction (ADCP)',
        'Photosynthetically Active Radiation (PAR)',
        'Dissolved Oxygen & Turbidity',
        'Fjord Flushing Events'
      ],
      partner_institutions: [
        'National Centre for Polar and Ocean Research (NCPOR)',
        'National Institute of Oceanography (NIO)',
        'Norwegian Polar Institute (NPI)'
      ]
    };
  }

  async getIndarcInfo() {
    return {
      name: 'IndARC Underwater Observatory',
      deployed_year: 2014,
      location: 'Kongsfjorden, Ny-Ålesund, Svalbard',
      depth_meters: 192,
      scientific_goal: 'Continuous multi-year monitoring of seasonal Atlantic Water intrusion and Arctic climate teleconnections with the Asian Monsoon.',
      data_access: 'Available through NCPOR Polar Data Centre on request'
    };
  }
}

module.exports = new ArcticService();
