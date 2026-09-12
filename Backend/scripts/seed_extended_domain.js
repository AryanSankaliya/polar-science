/**
 * Seed Extended Polar & NCPOR Domain Entities
 * Augments polar_hub with Users, Researchers, Projects, Publications, Datasets Metadata,
 * Facilities, Science Areas, Environmental Records, and Knowledge Graph Nodes/Edges.
 * Completely idempotent and preserves all existing database records.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';

async function seedExtendedDomain() {
  console.log('='.repeat(70));
  console.log(' SEEDING EXTENDED POLAR DOMAIN & NCPOR ECOSYSTEM DATA');
  console.log('='.repeat(70));

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // 1. Seed Users
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({ email: 'admin@polarhub.gov.in' });
    if (!existingAdmin) {
      const adminPassHash = await bcrypt.hash('PolarAdmin@2026', 10);
      const researcherPassHash = await bcrypt.hash('Researcher@2026', 10);
      const reviewerPassHash = await bcrypt.hash('Reviewer@2026', 10);
      const userPassHash = await bcrypt.hash('PolarUser@2026', 10);

      await usersCol.insertMany([
        {
          email: 'admin@polarhub.gov.in',
          password_hash: adminPassHash,
          name: 'Polar Platform Administrator',
          role: 'Admin',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          designation: 'Chief System Administrator',
          created_at: new Date().toISOString()
        },
        {
          email: 'researcher@ncpor.res.in',
          password_hash: researcherPassHash,
          name: 'Dr. Thamban Meloth',
          role: 'Researcher',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          designation: 'Senior Scientist & Glaciologist',
          created_at: new Date().toISOString()
        },
        {
          email: 'reviewer@polarhub.gov.in',
          password_hash: reviewerPassHash,
          name: 'Dr. Rahul Mohan',
          role: 'Reviewer',
          institution: 'Ministry of Earth Sciences (MoES)',
          designation: 'Scientific Review Board Chair',
          created_at: new Date().toISOString()
        },
        {
          email: 'user@polarhub.gov.in',
          password_hash: userPassHash,
          name: 'Ananya Sharma',
          role: 'User',
          institution: 'Indian Institute of Science (IISc)',
          designation: 'Doctoral Scholar',
          created_at: new Date().toISOString()
        }
      ]);
      console.log('-> Seeded default authentication accounts (Admin, Researcher, Reviewer, User)');
    }

    // 2. Seed Science Areas
    const scienceCol = db.collection('science_areas');
    const scienceCount = await scienceCol.countDocuments();
    if (scienceCount === 0) {
      await scienceCol.insertMany([
        {
          discipline_id: 'sci_cryo',
          name: 'Cryosphere & Glaciology',
          domain: 'Cryosphere Science',
          description: 'Investigation of polar ice sheets, ice shelf stability, sea ice dynamics, and paleoclimate ice cores.',
          key_topics: ['Ice Sheet Mass Balance', 'Basal Melting', 'Ice Core Isotopes', 'Firn Compaction', 'Glacier Retreat']
        },
        {
          discipline_id: 'sci_ocean',
          name: 'Southern Ocean Dynamics & Oceanography',
          domain: 'Ocean Science',
          description: 'Hydrographic surveying, Antarctic Bottom Water (AABW) genesis, Circumpolar Deep Water upwelling, and thermohaline circulation.',
          key_topics: ['WOA18 CTD Climatology', 'Thermohaline Conveyor', 'Brine Rejection', 'Southern Ocean Carbon Sink', 'IndARC Mooring']
        },
        {
          discipline_id: 'sci_atmo',
          name: 'Atmospheric & Climate Science',
          domain: 'Atmospheric Science',
          description: 'Boundary layer meteorology, polar vortex stability, ozone depletion/recovery, and atmospheric aerosol radiative forcing.',
          key_topics: ['Polar Vortex', 'Ozone Hole Monitoring', 'Tropospheric Aerosols', 'Black Carbon Deposition', 'Gruvebadet Lab Observations']
        },
        {
          discipline_id: 'sci_bio',
          name: 'Polar Biology & Marine Ecology',
          domain: 'Biological Science',
          description: 'Ecology of Antarctic krill, benthic fauna, penguin and seal bio-indicators, extremophile microbial genetics in sub-glacial lakes.',
          key_topics: ['Antarctic Krill Biomass', 'Emperor & Adelie Penguins', 'Endolithic Microbes', 'Non-native Biosecurity', 'Phytoplankton Blooms']
        },
        {
          discipline_id: 'sci_geo',
          name: 'Polar Geoscience & Paleogeography',
          domain: 'Geoscience',
          description: 'Gondwana supercontinent reconstruction, crustal evolution, glacial geology, and sub-ice bedrock topography in East Antarctica.',
          key_topics: ['Gondwana Breakup', 'Schirmacher Oasis Lithology', 'Larsemann Hills Crust', 'Subglacial Lake Bedrock', 'Cosmogenic Dating']
        },
        {
          discipline_id: 'sci_space',
          name: 'Space Physics & Geomagnetism',
          domain: 'Space Sciences',
          description: 'Auroral dynamics, ionospheric scintillations, magnetic field pulsations, and cosmic ray variations monitored at Maitri and Bharati.',
          key_topics: ['Pulsating Aurora', 'Total Electron Content (TEC)', 'Geomagnetic Storms', 'VLF Wave Propagation', 'Cosmic Ray Flux']
        }
      ]);
      console.log('-> Seeded 6 comprehensive Science Disciplines');
    }

    // 3. Seed Researchers
    const researcherCol = db.collection('researchers');
    const researcherCount = await researcherCol.countDocuments();
    if (researcherCount === 0) {
      await researcherCol.insertMany([
        {
          researcher_id: 'res_001',
          name: 'Dr. Thamban Meloth',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          designation: 'Director & Lead Glaciologist',
          email: 'tmeloth@ncpor.res.in',
          biography: 'Pioneering Indian glaciologist who led multiple Antarctic and Arctic scientific expeditions. Specialized in high-resolution paleoclimate reconstructions and ice core chemistry.',
          research_interests: ['Ice Core Paleoclimatology', 'Stable Water Isotopes', 'Antarctic Glacial Mass Balance', 'Cryospheric Climate Change'],
          disciplines: ['Cryosphere & Glaciology', 'Atmospheric & Climate Science'],
          stations: ['ind-stn-02', 'ind-stn-03', 'ind-stn-04'],
          expeditions: ['exp_041', 'exp_040', 'exp_035'],
          publications: ['pub_001', 'pub_002'],
          projects: ['prj_001', 'prj_004']
        },
        {
          researcher_id: 'res_002',
          name: 'Dr. M. Ravichandran',
          institution: 'Ministry of Earth Sciences (MoES) / NCPOR',
          designation: 'Distinguished Oceanographer & Former Director',
          email: 'secretary@moes.gov.in',
          biography: 'Eminent oceanographer leading India deep ocean mission and polar oceanographic observation programs in the Southern Ocean and Arctic.',
          research_interests: ['Southern Ocean Circulation', 'Air-Sea Interaction', 'Argo Float Profiling', 'Climate Variability'],
          disciplines: ['Southern Ocean Dynamics & Oceanography'],
          stations: ['ind-stn-03', 'ind-stn-04'],
          expeditions: ['exp_038', 'exp_039'],
          publications: ['pub_003'],
          projects: ['prj_002']
        },
        {
          researcher_id: 'res_003',
          name: 'Dr. Rahul Mohan',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          designation: 'Scientist G & Polar Biogeochemist',
          email: 'rvmohan@ncpor.res.in',
          biography: 'Specialist in Southern Ocean micropaleontology, diatom biostratigraphy, and biogeochemical cycles across the Polar Frontal Zone.',
          research_interests: ['Marine Micropaleontology', 'Southern Ocean Diatoms', 'Paleoceanography', 'Biogeochemical Cycles'],
          disciplines: ['Southern Ocean Dynamics & Oceanography', 'Polar Biology & Marine Ecology'],
          stations: ['ind-stn-03'],
          expeditions: ['exp_037', 'exp_040'],
          publications: ['pub_004'],
          projects: ['prj_003']
        },
        {
          researcher_id: 'res_004',
          name: 'Dr. Shridhar Jawak',
          institution: 'Svalbard Integrated Arctic Earth Observing System (SIOS) / NCPOR',
          designation: 'Senior Remote Sensing Scientist',
          email: 'shridhar.jawak@sios-svalbard.org',
          biography: 'Expert in satellite remote sensing, hyperspectral mapping, and cryospheric change detection across Antarctica and Svalbard.',
          research_interests: ['Satellite Cryosphere Remote Sensing', 'UAV Glacial Mapping', 'Sea Ice Classification', 'Spectral Radiometry'],
          disciplines: ['Cryosphere & Glaciology', 'Geoscience'],
          stations: ['ind-stn-02', 'ind-stn-03', 'ind-stn-04'],
          expeditions: ['exp_039', 'exp_041'],
          publications: ['pub_005'],
          projects: ['prj_004']
        },
        {
          researcher_id: 'res_005',
          name: 'Dr. K. P. Krishnan',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          designation: 'Scientist F & Arctic Marine Microbiologist',
          email: 'kpkrishnan@ncpor.res.in',
          biography: 'Leading Indian researcher in Kongsfjorden Arctic microbial ecology and biogeochemical dynamics at Himadri station, Ny-Ålesund.',
          research_interests: ['Arctic Marine Microbiology', 'Biogeochemistry', 'Fjord Ecosystem Dynamics', 'Cryophilic Bacteria'],
          disciplines: ['Polar Biology & Marine Ecology', 'Southern Ocean Dynamics & Oceanography'],
          stations: ['ind-stn-04'],
          expeditions: ['exp_036', 'exp_039'],
          publications: ['pub_006'],
          projects: ['prj_005']
        }
      ]);
      console.log('-> Seeded 5 distinguished Polar Researchers');
    }

    // 4. Seed Projects
    const projectCol = db.collection('projects');
    const projectCount = await projectCol.countDocuments();
    if (projectCount === 0) {
      await projectCol.insertMany([
        {
          project_code: 'PACER-GLACIO-01',
          title: 'Antarctic Ice Sheet Mass Balance & Dome Fuji Paleoclimate Proxy Analysis',
          description: 'Comprehensive study of East Antarctic ice sheet dynamics, ice velocity, and stable isotopic temperature reconstructions spanning 720,000 years.',
          lead_researcher_id: 'res_001',
          lead_researcher_name: 'Dr. Thamban Meloth',
          institution: 'National Centre for Polar and Ocean Research (NCPOR)',
          science_disciplines: ['Cryosphere & Glaciology', 'Atmospheric & Climate Science'],
          station_ids: ['ind-stn-02', 'ind-stn-03'],
          expedition_ids: ['exp_040', 'exp_041'],
          status: 'Active',
          start_date: '2020-04-01',
          end_date: '2026-03-31',
          dataset_ids: ['DS-ICE-001', 'DS-SAT-001'],
          publication_ids: ['pub_001', 'pub_002']
        },
        {
          project_code: 'PACER-OCEAN-02',
          title: 'Southern Ocean Hydrographic Variability & Circumpolar Deep Water Intrusion',
          description: 'Continuous hydrographic sampling of temperature, salinity, and biogeochemical tracers across the Sub-Antarctic and Polar Fronts to investigate CDW basal melting.',
          lead_researcher_id: 'res_002',
          lead_researcher_name: 'Dr. M. Ravichandran',
          institution: 'Ministry of Earth Sciences (MoES) / NCPOR',
          science_disciplines: ['Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-03'],
          expedition_ids: ['exp_038', 'exp_039'],
          status: 'Active',
          start_date: '2021-01-01',
          end_date: '2025-12-31',
          dataset_ids: ['DS-OCN-001'],
          publication_ids: ['pub_003']
        },
        {
          project_code: 'PACER-BIO-03',
          title: 'Southern Ocean Diatom Biogeography & Carbon Export in the Indian Sector',
          description: 'Assessment of diatom assemblages, biogenic silica fluxes, and phytoplankton productivity in response to changing sea ice cover.',
          lead_researcher_id: 'res_003',
          lead_researcher_name: 'Dr. Rahul Mohan',
          institution: 'NCPOR',
          science_disciplines: ['Polar Biology & Marine Ecology', 'Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-03'],
          expedition_ids: ['exp_037', 'exp_040'],
          status: 'Active',
          start_date: '2019-06-01',
          end_date: '2024-12-31',
          dataset_ids: ['DS-OCN-001'],
          publication_ids: ['pub_004']
        },
        {
          project_code: 'PACER-ARCTIC-04',
          title: 'IndARC Mooring & Kongsfjorden Multi-disciplinary Long-Term Monitoring',
          description: 'India premier multi-sensor underwater moored observatory (IndARC) measuring fjord-ocean exchanges, Arctic freshwater input, and climate teleconnections.',
          lead_researcher_id: 'res_005',
          lead_researcher_name: 'Dr. K. P. Krishnan',
          institution: 'NCPOR',
          science_disciplines: ['Polar Biology & Marine Ecology', 'Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-04'],
          expedition_ids: ['exp_036', 'exp_039'],
          status: 'Active',
          start_date: '2014-07-01',
          end_date: '2026-12-31',
          dataset_ids: ['DS-INDARC-001'],
          publication_ids: ['pub_006']
        }
      ]);
      console.log('-> Seeded 4 Polar Research Projects');
    }

    // 5. Seed Publications
    const publicationCol = db.collection('publications');
    const pubCount = await publicationCol.countDocuments();
    if (pubCount === 0) {
      await publicationCol.insertMany([
        {
          publication_id: 'pub_001',
          title: 'Glacial-interglacial atmospheric circulation changes in East Antarctica revealed by Dome Fuji ice core isotopes',
          authors: ['Thamban Meloth', 'A. S. Laluraj', 'R. Mohan', 'M. Ravichandran'],
          year: 2022,
          journal: 'Journal of Geophysical Research: Atmospheres',
          doi: '10.1029/2021JD036124',
          abstract: 'We present high-resolution stable water isotope (delta 18O and delta D) records from the Dome Fuji ice core spanning 720,000 years, detailing orbital Milankovitch cycles and Termination deglacial transitions.',
          keywords: ['Dome Fuji', 'Paleoclimate', 'Stable Isotopes', 'Antarctica', 'Termination I'],
          disciplines: ['Cryosphere & Glaciology', 'Atmospheric & Climate Science'],
          station_ids: ['ind-stn-02', 'ind-stn-03'],
          project_ids: ['PACER-GLACIO-01'],
          expedition_ids: ['exp_040'],
          dataset_ids: ['DS-ICE-001']
        },
        {
          publication_id: 'pub_002',
          title: 'Decadal trends in Antarctic sea ice extent and Circumpolar Deep Water warming mechanisms',
          authors: ['Shridhar Jawak', 'Thamban Meloth', 'B. L. Redkar'],
          year: 2023,
          journal: 'Remote Sensing of Environment',
          doi: '10.1016/j.rse.2023.113589',
          abstract: 'Analysis of daily satellite microwave radiometer sea ice extent indicates localized anomalies in the Indian sector of Antarctica correlated with subsurface warm CDW intrusion.',
          keywords: ['Sea Ice Extent', 'Microwave Radiometry', 'Southern Ocean', 'CDW'],
          disciplines: ['Cryosphere & Glaciology', 'Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-03'],
          project_ids: ['PACER-GLACIO-01'],
          expedition_ids: ['exp_041'],
          dataset_ids: ['DS-SAT-001', 'DS-OCN-001']
        },
        {
          publication_id: 'pub_003',
          title: 'Hydrographic structure and Antarctic Bottom Water export in the Enderby Basin',
          authors: ['M. Ravichandran', 'Rahul Mohan', 'S. Rajan'],
          year: 2021,
          journal: 'Deep Sea Research Part II: Topical Studies in Oceanography',
          doi: '10.1016/j.dsr2.2021.104921',
          abstract: 'Observations of dense shelf water formation and brine rejection near Prydz Bay, demonstrating pathways of AABW export and bottom overturning circulation.',
          keywords: ['Antarctic Bottom Water', 'Prydz Bay', 'Thermohaline Circulation', 'Salinity'],
          disciplines: ['Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-03'],
          project_ids: ['PACER-OCEAN-02'],
          expedition_ids: ['exp_038'],
          dataset_ids: ['DS-OCN-001']
        },
        {
          publication_id: 'pub_004',
          title: 'IndARC: Observations of winter ocean convection and Atlantic water intrusion in Kongsfjorden, Svalbard',
          authors: ['K. P. Krishnan', 'N. Anilkumar', 'M. Ravichandran'],
          year: 2022,
          journal: 'Polar Science',
          doi: '10.1016/j.polar.2022.100812',
          abstract: 'Multi-year data from India IndARC mooring records seasonal pulses of warm Transformed Atlantic Water (TAW) impacting fjord stratification and winter sea-ice freeze up.',
          keywords: ['IndARC', 'Kongsfjorden', 'Arctic Mooring', 'Atlantic Water', 'Ny-Ålesund'],
          disciplines: ['Polar Biology & Marine Ecology', 'Southern Ocean Dynamics & Oceanography'],
          station_ids: ['ind-stn-04'],
          project_ids: ['PACER-ARCTIC-04'],
          expedition_ids: ['exp_039'],
          dataset_ids: ['DS-INDARC-001']
        }
      ]);
      console.log('-> Seeded 4 peer-reviewed Polar Publications');
    }

    // 6. Seed Datasets Metadata Catalogue
    const datasetCol = db.collection('datasets');
    const datasetCount = await datasetCol.countDocuments();
    if (datasetCount === 0) {
      await datasetCol.insertMany([
        {
          dataset_id: 'DS-OCN-001',
          title: 'Southern Ocean Decadal Climatological Hydrography (WOA18)',
          description: 'High-resolution ocean temperature and salinity measurements spanning 67 depth strata (0m to 2000m) across the Southern Ocean (Lat <= -60.0 S).',
          source: 'NOAA World Ocean Atlas 2018 (WOA18) / NCPOR Data Center',
          creator: 'NOAA NCEI Ocean Climate Laboratory & NCPOR',
          station_id: 'ind-stn-03',
          region: 'Southern Ocean / Antarctica',
          discipline: 'Southern Ocean Dynamics & Oceanography',
          parameters: ['Temperature (deg C)', 'Salinity (PSU)', 'Depth (m)', 'CTD Profiles'],
          temporal_coverage: '1955-2018 Decadal Composite',
          spatial_coverage: 'Latitude: -60.0 S to -78.0 S, Longitude: -180.0 E to 180.0 E',
          file_format: 'JSON / NetCDF / CSV',
          size_mb: 4.8,
          access_level: 'Public / Open Access',
          license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
          citation_text: 'Locarnini, R. A., et al. (2018). World Ocean Atlas 2018, Volume 1: Temperature & Salinity. NOAA Atlas NESDIS 81.',
          related_collection: 'scientific_oceans'
        },
        {
          dataset_id: 'DS-ICE-001',
          title: 'Dome Fuji 720,000-Year High-Resolution Paleoclimate Ice Core Archive',
          description: 'Continuous deuterium and oxygen isotope (delta 18O, delta D) and reconstructed surface temperature proxy records from the 3,035-meter Dome Fuji ice core in Dronning Maud Land.',
          source: 'NOAA Paleoclimatology & Dome Fuji Ice Core Consortium / NCPOR',
          creator: 'National Institute of Polar Research (NIPR) & NCPOR',
          station_id: 'ind-stn-02',
          region: 'East Antarctica',
          discipline: 'Cryosphere & Glaciology',
          parameters: ['Age (Year BP)', 'Depth (m)', 'delta 18O (permil)', 'delta D (permil)', 'Reconstructed Site Temp (deg C)'],
          temporal_coverage: '0 to 720,000 Years Before Present',
          spatial_coverage: 'Dome Fuji, East Antarctica (77 19 S, 39 42 E, 3,810m elevation)',
          file_format: 'JSON / ASCII Tabular',
          size_mb: 28.5,
          access_level: 'Public / Open Access',
          license: 'CC BY 4.0',
          citation_text: 'Dome Fuji Ice Core Project Members (2018). High-resolution paleoclimate records spanning 720kyr from Dome Fuji. NOAA NCEI Paleoclimatology #2018-024.',
          related_collection: 'scientific_ice_cores'
        },
        {
          dataset_id: 'DS-SAT-001',
          title: 'Daily Antarctic Satellite Sea Ice Extent & Concentration Time-Series',
          description: 'Satellite microwave radiometer measurements capturing daily Antarctic sea ice extent, total area, and decadal trend indicators.',
          source: 'NSIDC / EUMETSAT OSI-SAF / NCPOR Cryosphere Lab',
          creator: 'National Snow and Ice Data Center & NCPOR',
          station_id: 'ind-stn-03',
          region: 'Circum-Antarctic Ocean',
          discipline: 'Cryosphere & Glaciology',
          parameters: ['Sea Ice Extent (Million sq km)', 'Sea Ice Area (sq km)', 'Daily Slope', 'Decadal Rate of Change (%)'],
          temporal_coverage: '2015-01-01 to Present (Daily)',
          spatial_coverage: 'All Southern Hemisphere Sea Ice Zones',
          file_format: 'JSON / GeoTIFF / CSV',
          size_mb: 12.2,
          access_level: 'Public / Open Access',
          license: 'CC BY 4.0',
          citation_text: 'Fetterer, F., et al. (2024). Sea Ice Index, Version 3. Boulder, Colorado USA. NSIDC.',
          related_collection: 'satellite_sea_ice'
        },
        {
          dataset_id: 'DS-INDARC-001',
          title: 'IndARC Kongsfjorden Arctic Underwater Mooring Time-Series',
          description: 'Hourly temperature, salinity, ocean currents, and photosynthetic radiation (PAR) from India first Arctic underwater observatory at 192m depth in Kongsfjorden.',
          source: 'NCPOR Arctic Research Program',
          creator: 'NCPOR IndARC Technical Team',
          station_id: 'ind-stn-04',
          region: 'Arctic / Svalbard',
          discipline: 'Southern Ocean Dynamics & Oceanography',
          parameters: ['Temperature (deg C)', 'Salinity (PSU)', 'Current Velocity (cm/s)', 'Dissolved Oxygen (uM)', 'Turbidity'],
          temporal_coverage: '2014 to Present (Continuous)',
          spatial_coverage: 'Kongsfjorden, Ny-Ålesund, Svalbard (78 54 N, 11 53 E)',
          file_format: 'JSON / NetCDF',
          size_mb: 65.0,
          access_level: 'Research Collaboration / On-Request',
          license: 'MoES Data Policy',
          citation_text: 'NCPOR Arctic Division (2024). IndARC Moored Hydrographic Observational Dataset. Ministry of Earth Sciences, India.'
        }
      ]);
      console.log('-> Seeded 4 Scientific Datasets in Catalogue');
    }

    // 7. Seed Facilities
    const facilityCol = db.collection('facilities');
    const facilityCount = await facilityCol.countDocuments();
    if (facilityCount === 0) {
      await facilityCol.insertMany([
        {
          facility_id: 'fac_001',
          name: 'Maitri Meteorological & Atmospheric Observatory',
          type: 'Observatory',
          station_id: 'ind-stn-02',
          region: 'Antarctica',
          location: 'Schirmacher Oasis, Central Dronning Maud Land',
          description: 'Equipped with Brewer Spectrophotometer for ozone column tracking, automatic weather station (AWS), and ceilometer for cloud ceiling profiling.',
          research_areas: ['Atmospheric & Climate Science', 'Space Physics & Geomagnetism'],
          equipment: ['Brewer Spectrophotometer #153', 'Digisonde Ionospheric Sounder', 'Fluxgate Magnetometer', 'AWS Vaisala WXT536'],
          status: 'Operational Year-Round'
        },
        {
          facility_id: 'fac_002',
          name: 'Bharati Seismological & Geodetic Observatory',
          type: 'Laboratory',
          station_id: 'ind-stn-03',
          region: 'Antarctica',
          location: 'Larsemann Hills, East Antarctica',
          description: 'State-of-the-art broadband seismometer, permanent GNSS reference station, and high-frequency geomagnetic recording station.',
          research_areas: ['Polar Geoscience & Paleogeography', 'Space Physics & Geomagnetism'],
          equipment: ['Guralp CMG-3T Broadband Seismometer', 'Trimble NetR9 GNSS Receiver', 'Overhauser Magnetometer'],
          status: 'Operational Year-Round'
        },
        {
          facility_id: 'fac_003',
          name: 'Himadri Arctic Research Base & Gruvebadet Aerosol Lab',
          type: 'Laboratory & Station Base',
          station_id: 'ind-stn-04',
          region: 'Arctic',
          location: 'Ny-Ålesund, Spitsbergen, Svalbard',
          description: 'India primary Arctic research base supporting atmospheric chemistry, marine biology, and glaciological fieldwork.',
          research_areas: ['Atmospheric & Climate Science', 'Polar Biology & Marine Ecology', 'Cryosphere & Glaciology'],
          equipment: ['Aethalometer AE33 Black Carbon Monitor', 'Scanning Mobility Particle Sizer (SMPS)', 'IndARC Moorings Control System'],
          status: 'Operational Summer & Austral Expeditions'
        },
        {
          facility_id: 'fac_004',
          name: 'National Polar Ice Core Processing & Storage Facility',
          type: 'National Core Repository & Clean Lab',
          station_id: 'ind-stn-03',
          region: 'Goa, India (NCPOR HQ)',
          location: 'Headquarters, NCPOR, Vasco da Gama, Goa',
          description: 'Ultra-clean -20 deg C ice core archive holding over 1,500m of ice cores from Antarctica, Arctic, and the Himalayas.',
          research_areas: ['Cryosphere & Glaciology'],
          equipment: ['Thermo Fisher Delta V Plus Isotope Ratio Mass Spectrometer', 'Picarro Cavity Ring-Down Spectrometer', 'Dionex ICS-5000 Ion Chromatograph'],
          status: 'Operational 24/7'
        }
      ]);
      console.log('-> Seeded 4 Research Facilities');
    }

    // 8. Seed Environmental & Treaty Records
    const envCol = db.collection('environmental_records');
    const envCount = await envCol.countDocuments();
    if (envCount === 0) {
      await envCol.insertMany([
        {
          record_id: 'ENV-ATS-001',
          category: 'Antarctic Treaty System',
          title: 'The Antarctic Treaty (1959) & India Accession (1983)',
          summary: 'International accord dedicating Antarctica exclusively to peaceful purposes and scientific freedom. India attained Consultative Party status in 1983.',
          details: 'Key Articles: Article I (Peaceful uses only; prohibition of military bases), Article II (Freedom of scientific investigation), Article III (International scientific cooperation and data exchange), Article IV (Freezing of territorial sovereignty claims).',
          status: 'Active International Treaty',
          year: 1983
        },
        {
          record_id: 'ENV-MADRID-002',
          category: 'Madrid Protocol',
          title: 'Protocol on Environmental Protection to the Antarctic Treaty (Madrid Protocol, 1991)',
          summary: 'Designates Antarctica as a "natural reserve, devoted to peace and science". Imposes a comprehensive moratorium on mineral resource activities and strict environmental impact assessments.',
          details: 'Contains 6 Annexes: Annex I (Environmental Impact Assessment), Annex II (Conservation of Antarctic Fauna & Flora), Annex III (Waste Disposal & Waste Management), Annex IV (Prevention of Marine Pollution), Annex V (Area Protection and Management), Annex VI (Liability Arising from Environmental Emergencies).',
          status: 'Legally Binding Environmental Framework',
          year: 1998
        },
        {
          record_id: 'ENV-ASPA-003',
          category: 'Antarctic Specially Protected Areas (ASPA)',
          title: 'ASPA 163: Haswell Island & Larsemann Hills Ecological Zones',
          summary: 'Specially protected coastal ecosystems in East Antarctica conserving breeding colonies of Emperor penguins, South Polar skuas, and rare moss/lichen assemblages.',
          details: 'Entry into ASPA zones requires official national authority permits. Drone operations and motorized transport are strictly regulated to avoid disturbance to avifauna.',
          status: 'Permit-Required Protected Zone',
          coordinates: { latitude: -69.4, longitude: 76.2 }
        },
        {
          record_id: 'ENV-GUIDE-004',
          category: 'Environmental Guidelines & Biosecurity',
          title: 'Non-Native Species Prevention & Clean Fieldwork Protocol',
          summary: 'Comprehensive guidelines mandated by NCPOR for all expedition members, ensuring disinfection of boots, cargo containers, scientific instruments, and food supplies.',
          details: 'Mandatory vacuuming of all outerwear, sterilization of field gear with Virkon S, prohibition of fresh poultry and unpasteurized eggs, and strict zero-waste return-to-origin policies.',
          status: 'Mandatory Operational Policy'
        }
      ]);
      console.log('-> Seeded 4 Environmental & Treaty Framework Records');
    }

    // 9. Seed Knowledge Graph Nodes and Edges
    const nodesCol = db.collection('knowledge_nodes');
    const edgesCol = db.collection('knowledge_edges');
    const nodeCount = await nodesCol.countDocuments();
    if (nodeCount === 0) {
      const nodes = [
        { id: 'res_001', label: 'Dr. Thamban Meloth', type: 'Researcher', group: 'Scientist', properties: { institution: 'NCPOR', designation: 'Director' } },
        { id: 'res_002', label: 'Dr. M. Ravichandran', type: 'Researcher', group: 'Scientist', properties: { institution: 'MoES/NCPOR', designation: 'Oceanographer' } },
        { id: 'res_003', label: 'Dr. Rahul Mohan', type: 'Researcher', group: 'Scientist', properties: { institution: 'NCPOR', designation: 'Biogeochemist' } },
        { id: 'ind-stn-02', label: 'Maitri Station', type: 'Station', group: 'Base', properties: { region: 'Antarctica', established: 1989 } },
        { id: 'ind-stn-03', label: 'Bharati Station', type: 'Station', group: 'Base', properties: { region: 'Antarctica', established: 2012 } },
        { id: 'ind-stn-04', label: 'Himadri Station', type: 'Station', group: 'Base', properties: { region: 'Arctic', established: 2008 } },
        { id: 'PACER-GLACIO-01', label: 'PACER Antarctic Glaciology', type: 'Project', group: 'Research', properties: { status: 'Active' } },
        { id: 'PACER-OCEAN-02', label: 'PACER Southern Ocean Dynamics', type: 'Project', group: 'Research', properties: { status: 'Active' } },
        { id: 'PACER-ARCTIC-04', label: 'IndARC Kongsfjorden Program', type: 'Project', group: 'Research', properties: { status: 'Active' } },
        { id: 'pub_001', label: 'Dome Fuji 720kyr Isotopes (JGR)', type: 'Publication', group: 'Literature', properties: { year: 2022 } },
        { id: 'pub_003', label: 'Antarctic Bottom Water Export (DSR)', type: 'Publication', group: 'Literature', properties: { year: 2021 } },
        { id: 'pub_004', label: 'IndARC Kongsfjorden Study (Polar Sci)', type: 'Publication', group: 'Literature', properties: { year: 2022 } },
        { id: 'DS-ICE-001', label: 'Dome Fuji Ice Core Archive', type: 'Dataset', group: 'Data', properties: { records: 7470 } },
        { id: 'DS-OCN-001', label: 'Southern Ocean WOA18 Climatology', type: 'Dataset', group: 'Data', properties: { records: 2000 } },
        { id: 'sci_cryo', label: 'Cryosphere & Glaciology', type: 'ScienceArea', group: 'Discipline', properties: { domain: 'Cryosphere' } },
        { id: 'sci_ocean', label: 'Southern Ocean Dynamics', type: 'ScienceArea', group: 'Discipline', properties: { domain: 'Ocean' } }
      ];

      const edges = [
        { source: 'res_001', target: 'PACER-GLACIO-01', label: 'LEADS_PROJECT', type: 'LEADS' },
        { source: 'res_001', target: 'ind-stn-02', label: 'OPERATES_AT', type: 'AFFILIATION' },
        { source: 'res_001', target: 'pub_001', label: 'AUTHORED', type: 'AUTHORSHIP' },
        { source: 'res_001', target: 'sci_cryo', label: 'SPECIALIZES_IN', type: 'DISCIPLINE' },
        { source: 'PACER-GLACIO-01', target: 'DS-ICE-001', label: 'GENERATES_DATASET', type: 'OUTPUT' },
        { source: 'PACER-GLACIO-01', target: 'ind-stn-03', label: 'LOCATED_AT', type: 'LOCATION' },
        { source: 'pub_001', target: 'DS-ICE-001', label: 'CITES_DATASET', type: 'CITATION' },
        { source: 'res_002', target: 'PACER-OCEAN-02', label: 'LEADS_PROJECT', type: 'LEADS' },
        { source: 'res_002', target: 'sci_ocean', label: 'SPECIALIZES_IN', type: 'DISCIPLINE' },
        { source: 'PACER-OCEAN-02', target: 'DS-OCN-001', label: 'GENERATES_DATASET', type: 'OUTPUT' },
        { source: 'pub_003', target: 'DS-OCN-001', label: 'CITES_DATASET', type: 'CITATION' },
        { source: 'res_003', target: 'ind-stn-03', label: 'CONDUCTS_FIELDWORK_AT', type: 'LOCATION' },
        { source: 'PACER-ARCTIC-04', target: 'ind-stn-04', label: 'HOSTED_AT', type: 'LOCATION' },
        { source: 'pub_004', target: 'ind-stn-04', label: 'FIELD_SITE', type: 'LOCATION' }
      ];

      await nodesCol.insertMany(nodes);
      await edgesCol.insertMany(edges);
      console.log(`-> Seeded Knowledge Graph: ${nodes.length} Nodes & ${edges.length} Typed Relation Edges`);
    }

    console.log('='.repeat(70));
    console.log(' EXTENDED DOMAIN SEEDING COMPLETED WITH 100% SUCCESS');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('Extended domain seeding failed:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  seedExtendedDomain();
}

module.exports = { seedExtendedDomain };
