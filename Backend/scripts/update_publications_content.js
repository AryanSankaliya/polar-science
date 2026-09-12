const { connectToDatabase, closeDatabase } = require('../Configuration/database');

async function updatePublications() {
  const db = await connectToDatabase();
  console.log('Connected to MongoDB polar_hub to update publication content...');

  const publicationsData = [
    {
      publication_id: 'pub_001',
      title: 'Glacial-interglacial atmospheric circulation changes in East Antarctica revealed by Dome Fuji ice core isotopes',
      authors: [
        'Thamban Meloth',
        'A. S. Laluraj',
        'R. Mohan',
        'M. Ravichandran'
      ],
      year: 2022,
      journal: 'Journal of Geophysical Research: Atmospheres',
      doi: '10.1029/2021JD036124',
      abstract: 'We present high-resolution stable water isotope (delta 18O and delta D) records from the Dome Fuji ice core spanning 720,000 years, detailing orbital Milankovitch cycles and Termination deglacial transitions.',
      keywords: [
        'Dome Fuji',
        'Paleoclimate',
        'Stable Isotopes',
        'Antarctica',
        'Termination I',
        'Milankovitch Cycles'
      ],
      disciplines: [
        'Cryosphere & Glaciology',
        'Atmospheric & Climate Science'
      ],
      station_ids: ['ind-stn-02', 'ind-stn-03'],
      project_ids: ['PACER-GLACIO-01'],
      dataset_ids: ['DS-ICE-001'],
      key_findings: 'Isotopic temperature reconstructions reveal an 8.6°C glacial-interglacial temperature shift at Dome Fuji, with strong 100-kyr orbital eccentricity pacing and abrupt moisture source shifts during Termination deglaciations.',
      methodology_specs: [
        'Ice Core Extraction: 3,035-meter deep ice core drilled at Dome Fuji (77°19′S, 39°42′E, 3,810m elevation)',
        'Analytical Instrumentation: Wavelength-Scanned Cavity Ring-Down Spectroscopy (WS-CRDS Picarro L2130-i)',
        'Temporal Resolution: 50-year continuous sampling spanning 0 to 720,000 Years Before Present (MIS 1 to MIS 18)',
        'Calibration Standard: Standard Light Antarctic Precipitation (SLAP) and Vienna Standard Mean Ocean Water (V-SMOW2)'
      ],
      sections: [
        {
          num: '1',
          title: 'Introduction & Paleoclimate Context',
          content: 'Deep ice core records from the East Antarctic Plateau provide uniquely preserved atmospheric and climatic archives extending over multiple glacial-interglacial cycles. The Dome Fuji ice core, retrieved by Japanese and Indian researchers in central Dronning Maud Land, preserves an uninterrupted 720,000-year stratigraphy of atmospheric moisture sources and polar surface temperatures.\n\nUnderstanding the phase relationships between Antarctic surface warming, greenhouse gas radiative forcing, and Southern Ocean circulation during glacial terminations is essential for constraining polar climate sensitivity and future ice sheet stability under elevated radiative forcing.'
        },
        {
          num: '2',
          title: 'Isotope Mass Spectrometry & Chronology',
          content: 'Continuous deuterium (δD) and oxygen-18 (δ18O) measurements were conducted at 5 cm discrete resolution using cavity ring-down laser spectroscopy calibrated against international standards. The age scale was established using volcanic dielectric profiling, orbital tuning of O2/N2 ratios, and matching of global methane tie-points with EPICA Dome C and Vostok cores.\n\nSecond-order isotopic parameter deuterium excess (d = δD - 8·δ18O) was calculated to isolate sea-surface conditions and relative humidity anomalies in mid-latitude moisture source regions during colder stadial periods.'
        },
        {
          num: '3',
          title: 'Glacial Termination Dynamics & Temperature Reconstructions',
          content: 'Site temperature reconstructions indicate a mean glacial-interglacial temperature variation of 8.6 ± 1.2°C at Dome Fuji. All seven major glacial terminations (Terminations I through VII) exhibit rapid warming intervals characterized by steep isotopic enrichment.\n\nSpectral analysis of the 720kyr record demonstrates predominant 100-kyr periodicity alongside clear 41-kyr obliquity and 23-kyr precession signals, demonstrating strong orbital pacing of East Antarctic continental ice volume.'
        },
        {
          num: '4',
          title: 'Conclusions & Polar Environmental Implications',
          content: 'Our findings indicate that the East Antarctic Plateau experienced exceptional thermal stability even during interglacial peaks MIS 5e and MIS 11, with inland temperatures exceeding pre-industrial levels by only 1.8°C to 2.4°C. These empirical baseline constraints provide an indispensable benchmark for CMIP6 ice-sheet model projections of future cryospheric mass loss.'
        }
      ],
      references: [
        'Dome Fuji Ice Core Project Members (2017). State-dependent Antarctic climate sensitivity over the last 720,000 years. Science Advances, 3(2), e1600846.',
        'Meloth, T., et al. (2020). Antarctic climate variability and ice core proxies. Journal of Geophysical Research, 125(14).',
        'Jouzel, J., et al. (2007). Orbital and millennial Antarctic climate variability over the past 800,000 years. Science, 317(5839), 793-797.'
      ]
    },
    {
      publication_id: 'pub_002',
      title: 'Decadal trends in Antarctic sea ice extent and Circumpolar Deep Water warming mechanisms',
      authors: [
        'Shridhar Jawak',
        'Thamban Meloth',
        'B. L. Redkar'
      ],
      year: 2023,
      journal: 'Remote Sensing of Environment',
      doi: '10.1016/j.rse.2023.113589',
      abstract: 'Analysis of daily satellite microwave radiometer sea ice extent indicates localized anomalies in the Indian sector of Antarctica correlated with subsurface warm CDW intrusion.',
      keywords: [
        'Sea Ice Extent',
        'Microwave Radiometry',
        'Southern Ocean',
        'CDW',
        'Larsemann Hills',
        'Prydz Bay'
      ],
      disciplines: [
        'Cryosphere & Glaciology',
        'Southern Ocean Dynamics & Oceanography'
      ],
      station_ids: ['ind-stn-03'],
      project_ids: ['PACER-GLACIO-01'],
      dataset_ids: ['DS-SAT-001', 'DS-OCN-001'],
      key_findings: 'Satellite microwave data reveals a localized -3.4% per decade reduction in fast ice duration in the Prydz Bay / Bharati Station sector, driven by episodic upwelling of warm Modified Circumpolar Deep Water (MCDW) onto the continental shelf.',
      methodology_specs: [
        'Satellite Sensor Suite: SSM/I, SSMIS, and AMSR2 passive microwave radiometers (1979–2023)',
        'In-situ Ground Truth: Moored hydrographic arrays and CTD rosettes deployed by NCPOR research vessels',
        'Spatial Coverage: 65°S to 72°S, 10°E to 90°E (Indian Antarctic Ocean Sector)',
        'Algorithm: NASA Team and Bootstrap brightness temperature sea ice concentration algorithms'
      ],
      sections: [
        {
          num: '1',
          title: 'Introduction & Coastal Sea Ice Dynamics',
          content: 'Antarctic sea ice represents one of the most critical climatic components modulating global albedo, deep ocean convection, and ocean-atmosphere heat exchange. Over recent decades, the Indian Ocean sector of East Antarctica (between 20°E and 90°E) has exhibited pronounced spatial and seasonal heterogeneities in sea ice concentration and polynya development.\n\nObservations recorded during the Indian Scientific Expeditions to Antarctica (ISEA) from stations Maitri and Bharati have revealed episodic thinning of coastal fast ice shelves linked to anomalous wind-stress curl and baroclinic eddy activity transporting warmer Circumpolar Deep Water (CDW) onto the continental shelf.'
        },
        {
          num: '2',
          title: 'Observational Methodology & Satellite Calibrations',
          content: 'This study synthesizes continuous multi-frequency satellite microwave radiometry (SSM/I, AMSR-E, AMSR2) calibrated against conductivity-temperature-depth (CTD) hydrographic profiles acquired by NCPOR research vessels and automated moored arrays in Prydz Bay and Schirmacher Oasis waters.\n\nRadiometric brightness temperatures were processed at 12.5 km grid resolution, with atmospheric water vapor corrections applied using ERA5 reanalysis fields.'
        },
        {
          num: '3',
          title: 'Circumpolar Deep Water Intrusion & Basal Ice Thinning',
          content: 'Decadal trend analysis demonstrates that while total circum-Antarctic sea ice experienced record winter maximums followed by rapid spring retreats, the Prydz Bay / Bharati Station sector showed a statistically significant -3.4% per decade reduction in fast ice duration.\n\nSubsurface thermal profiles confirm that shoaling of modified CDW by 60–80 meters directly erodes the basal ice layer of the Amery Ice Shelf and prevents persistent consolidation of autumn pack ice.'
        },
        {
          num: '4',
          title: 'Conclusions & Policy Implications',
          content: 'Our findings emphasize the imperative of integrated satellite telemetry and year-round benthic moored observatories to resolve rapid thermodynamic phase shifts in Antarctic coastal waters. These insights directly inform IPCC AR6 cryospheric projections and SCAR collaborative science initiatives.'
        }
      ],
      references: [
        'Jawak, S., Meloth, T. (2022). High-resolution Antarctic ice shelf elevation changes. Polar Science, 31, 100780.',
        'Zwally, H. J., et al. (2021). Mass gains of the Antarctic Ice Sheet exceed losses. Journal of Glaciology, 67(263).',
        'NCPOR Polar Data Centre (2023). Calibrated Oceanographic CTD Archive #DS-OCN-001.'
      ]
    },
    {
      publication_id: 'pub_003',
      title: 'Hydrographic structure and Antarctic Bottom Water export in the Enderby Basin',
      authors: [
        'M. Ravichandran',
        'Rahul Mohan',
        'S. Rajan'
      ],
      year: 2021,
      journal: 'Deep Sea Research Part II: Topical Studies in Oceanography',
      doi: '10.1016/j.dsr2.2021.104921',
      abstract: 'Observations of dense shelf water formation and brine rejection near Prydz Bay, demonstrating pathways of AABW export and bottom overturning circulation.',
      keywords: [
        'Antarctic Bottom Water',
        'Prydz Bay',
        'Thermohaline Circulation',
        'Salinity',
        'Enderby Basin',
        'Deep Ocean'
      ],
      disciplines: [
        'Southern Ocean Dynamics & Oceanography'
      ],
      station_ids: ['ind-stn-03'],
      project_ids: ['PACER-OCEAN-02'],
      dataset_ids: ['DS-OCN-001'],
      key_findings: 'Detailed CTD profiles identify a previously unquantified export of 1.4 Sverdrups of newly ventilated Antarctic Bottom Water (AABW) cascading through the Prydz Channel into the Enderby Basin deep abyss.',
      methodology_specs: [
        'Hydrographic Rosette: 24-bottle Seabird SBE-911plus CTD with dual SBE-3plus temperature sensors',
        'Deep Stations: 520 full-depth hydrographic profiles from shelf edge (200m) to abyss (4,800m)',
        'Biogeochemical Parameters: Dissolved Oxygen (Winkler titration), Salinity (Autosal 8400B), and Silicate',
        'Calibration: Pre- and post-cruise laboratory calibration at NCPOR Marine Instrumentation Facility'
      ],
      sections: [
        {
          num: '1',
          title: 'Thermohaline Circulation & Bottom Water Export',
          content: 'Antarctic Bottom Water (AABW) constitutes the densest and coldest water mass in the global ocean, ventilating the abyssal ocean and regulating oceanic carbon sequestration. While the Weddell and Ross Seas have historically been regarded as the principal generation sites, the continental margin of East Antarctica between 50°E and 80°E has increasingly been recognized as an active contributor.\n\nDuring successive Indian Southern Ocean Expeditions, intensive hydrographic sections were executed across Prydz Bay and the Enderby Basin to delineate Dense Shelf Water (DSW) production mechanisms and subsequent benthic drainage pathways.'
        },
        {
          num: '2',
          title: 'Full-Depth Hydrographic Profiling Methodology',
          content: 'High-precision CTD casts were acquired across seven meridional transects extending from the coastal Antarctic margin at 69°S northward to 45°S. Dissolved oxygen and nutrient concentrations were analyzed onboard within 12 hours of sampling using automated spectrophotometric auto-analyzers.\n\nPotential density anomalies (σθ) were calculated utilizing the TEOS-10 international thermodynamic equation of seawater.'
        },
        {
          num: '3',
          title: 'Water Mass Transformation & Salinity Fronts',
          content: 'Hydrographic sections reveal cold, dense Modified Shelf Water with neutral densities γn > 28.27 kg/m³ and temperatures near the surface freezing point (-1.86°C) overflowing the shelf break through the Prydz Channel.\n\nEntrainment of ambient Circumpolar Deep Water modifies this plume as it cascades down the continental slope, producing well-ventilated bottom water with dissolved oxygen levels exceeding 240 µmol/kg at depths exceeding 4,000 meters in the Enderby Basin.'
        },
        {
          num: '4',
          title: 'Geostrophic Transport & Abyssal Venting Conclusions',
          content: 'Geostrophic velocity shear calculations referenced to lower acoustic Doppler current profiler (LADCP) velocities indicate a net northward bottom water export of 1.4 ± 0.3 Sv. These results establish that East Antarctic coastal polynyas contribute significantly to Southern Ocean abyssal ventilation, with profound implications for decadal ocean heat uptake.'
        }
      ],
      references: [
        'Ravichandran, M., et al. (2020). Southern Ocean hydrographic variability and climate connections. MoES Special Monograph Series, 14, 88-104.',
        'Orsi, A. H., et al. (1999). Circulation, mixing, and production of Antarctic Bottom Water. Progress in Oceanography, 43(1), 55-109.',
        'NCPOR Ocean Science Repository (2022). Calibrated CTD Data Package #DS-OCN-001.'
      ]
    },
    {
      publication_id: 'pub_004',
      title: 'IndARC: Observations of winter ocean convection and Atlantic water intrusion in Kongsfjorden, Svalbard',
      authors: [
        'K. P. Krishnan',
        'N. Anilkumar',
        'M. Ravichandran'
      ],
      year: 2022,
      journal: 'Polar Science',
      doi: '10.1016/j.polar.2022.100812',
      abstract: 'Multi-year data from India IndARC mooring records seasonal pulses of warm Transformed Atlantic Water (TAW) impacting fjord stratification and winter sea-ice freeze up.',
      keywords: [
        'IndARC',
        'Kongsfjorden',
        'Arctic Mooring',
        'Atlantic Water',
        'Ny-Ålesund',
        'Svalbard'
      ],
      disciplines: [
        'Polar Biology & Marine Ecology',
        'Southern Ocean Dynamics & Oceanography'
      ],
      station_ids: ['ind-stn-04'],
      project_ids: ['PACER-ARCTIC-04'],
      dataset_ids: ['DS-INDARC-001'],
      key_findings: 'The IndARC moored observatory captured repeated mid-winter thermal pulses exceeding 2.5°C in the intermediate fjord layer, driven by Fram Strait Atlantic Water intrusion that inhibits winter fast-ice formation in Kongsfjorden.',
      methodology_specs: [
        'Mooring Platform: IndARC subsurface moored observatory deployed at 192m depth (78°59′N, 11°50′E)',
        'Sensor Array: Sea-Bird SBE-37 MicroCAT CTDs, Aanderaa Seaguard Doppler Current Meter',
        'Sampling Frequency: High-frequency telemetry logged every 10 to 30 minutes year-round',
        'Auxiliary Instruments: WET Labs chlorophyll fluorometers and acoustic ice-profiling sonars'
      ],
      sections: [
        {
          num: '1',
          title: 'Arctic Atlantification & IndARC Observatory Context',
          content: 'The Arctic is warming at more than three times the global average rate—a phenomenon known as Arctic Amplification. A key mechanism driving cryospheric and ecological transition in the European Arctic is "Atlantification", wherein warm and saline waters of Atlantic origin penetrate into High-Arctic fjords.\n\nTo capture continuous, high-resolution year-round physical and biogeochemical signatures of this intrusion, the National Centre for Polar and Ocean Research (NCPOR) established IndARC—India’s first multi-sensor underwater moored observatory in Kongsfjorden, Svalbard in July 2014.'
        },
        {
          num: '2',
          title: 'Mooring Architecture & Multi-Sensor Deployment',
          content: 'IndARC is anchored at 78°59′N, 11°50′E at a water depth of 192 meters, serviced annually from India\'s Himadri Research Station in Ny-Ålesund. The mooring string includes conductivity-temperature-depth (CTD) sensors at multiple strata (30m, 50m, 100m, 150m, 185m), alongside upward-looking acoustic Doppler current profilers (ADCP).\n\nThis multi-sensor configuration resolves both rapid baroclinic tidal fluctuations and sustained seasonal water mass replacements without surface ice hazard vulnerability.'
        },
        {
          num: '3',
          title: 'Winter Thermal Pulses & Stratification Breakdown',
          content: 'Time-series records from 2014 to 2022 reveal recurrent winter intrusions of Transformed Atlantic Water (TAW; T > 1.0°C, S > 34.7 PSU) into the inner fjord during December through February.\n\nThese thermal pulses elevate water temperatures by up to 2.8°C within a 72-hour window, effectively eroding the winter halocline and preventing the formation of contiguous fast ice that was historically characteristic of Kongsfjorden.'
        },
        {
          num: '4',
          title: 'Ecosystem Impacts & High-Arctic Conclusions',
          content: 'The loss of seasonal ice cover directly modulates light availability and shifts phytoplankton bloom phenology earlier into the spring. Furthermore, Atlantic zooplankton species (e.g., Calanus finmarchicus) increasingly displace Arctic endemic species (Calanus glacialis). The continuous IndARC baseline remains paramount for projecting broader Pan-Arctic climate transitions.'
        }
      ],
      references: [
        'Krishnan, K. P., et al. (2020). IndARC: Long-term observation of Kongsfjorden. Polar Science, 24, 100516.',
        'Cottier, F. R., et al. (2010). Arctic fjords: a review of the oceanographic environment and dominant physical processes. Geological Society, London, Special Publications, 344(1), 35-50.',
        'NCPOR Arctic Observatory Group (2023). Kongsfjorden IndARC Mooring Archive #DS-INDARC-001.'
      ]
    },
    {
      publication_id: 'pub_006',
      title: 'IndARC: Multi-year biogeochemical dynamics and microbial community shifts in Kongsfjorden, Svalbard',
      authors: [
        'K. P. Krishnan',
        'Rahul Mohan',
        'Thamban Meloth'
      ],
      year: 2023,
      journal: 'Journal of Marine Systems',
      doi: '10.1016/j.jmarsys.2023.103940',
      abstract: 'Synthesizing multi-year metagenomic sequencing with physical sensor arrays from the IndARC observatory to evaluate microbial ecological shifts under warming Arctic marine conditions.',
      keywords: [
        'IndARC',
        'Kongsfjorden',
        'Arctic Marine Microbiology',
        'Biogeochemistry',
        'Metagenomics',
        'Ny-Ålesund'
      ],
      disciplines: [
        'Polar Biology & Marine Ecology',
        'Southern Ocean Dynamics & Oceanography'
      ],
      station_ids: ['ind-stn-04'],
      project_ids: ['PACER-ARCTIC-04'],
      dataset_ids: ['DS-INDARC-001'],
      key_findings: 'DNA metagenomic profiling across 4 winter seasons indicates a 40% increase in boreal bacterial taxa and accelerated organic carbon remineralization coinciding with Atlantic Water pulses recorded by IndARC.',
      methodology_specs: [
        'Sampling Facility: Indian Arctic Station Himadri and Marine Lab in Ny-Ålesund',
        'Molecular Profiling: 16S rRNA gene amplicon sequencing (Illumina NovaSeq 6000)',
        'Biogeochemical Sensors: WetLabs ECO fluorometer and optical dissolved oxygen sensors',
        'Temporal Coverage: 2018–2023 seasonal sea ice and open-water campaigns'
      ],
      sections: [
        {
          num: '1',
          title: 'Introduction & Arctic Marine Microbiomes',
          content: 'Microorganisms form the foundational base of Arctic marine biogeochemical cycles, mediating carbon export, nitrogen fixation, and remineralization. As High-Arctic fjords undergo rapid climate-induced warming and glacier runoff dilution, microbial community structures are experiencing unprecedented selective pressures.'
        },
        {
          num: '2',
          title: 'Metagenomic Sequencing & IndARC Coupling',
          content: 'Seawater samples were collected at discrete depths (surface, chlorophyll maximum, 100m, and bottom) in Kongsfjorden. High-molecular-weight DNA was extracted and sequenced on the Illumina NovaSeq platform to profile taxonomic composition and functional gene repertoires.'
        },
        {
          num: '3',
          title: 'Boreal Taxa Expansion & Carbon Turnover',
          content: 'Our multi-year analysis reveals a marked expansion of temperate and boreal marine bacteria (notably Rhodobacteraceae and Flavobacteriaceae) during winter periods of high Atlantic Water inflow, alongside elevated enzymatic turnover of particulate organic matter.'
        },
        {
          num: '4',
          title: 'Conclusions & Polar Ecological Outlook',
          content: 'These results establish that physical oceanographic shifts documented by the IndARC observatory translate directly into molecular-level biological transformations across the Arctic marine food web.'
        }
      ],
      references: [
        'Krishnan, K. P., et al. (2022). Microbial diversity in High Arctic waters. FEMS Microbiology Ecology, 98(3).',
        'Hop, H., et al. (2019). The marine system of Kongsfjorden, Svalbard. Polar Research, 38, 3328.'
      ]
    }
  ];

  for (const pub of publicationsData) {
    await db.collection('publications').updateOne(
      { publication_id: pub.publication_id },
      { $set: pub },
      { upsert: true }
    );
    console.log(`✓ Updated / Inserted publication: ${pub.publication_id} - "${pub.title.slice(0, 45)}..."`);
  }

  // Also make sure Himadri is inserted in stations
  const himadriStation = {
    station_id: 'ind-stn-05',
    name: 'Himadri',
    country: 'India',
    operator: 'NCPOR / Ministry of Earth Sciences',
    latitude: 78.9233,
    longitude: 11.9233,
    elevation_m: 10.0,
    status: 'Active - Summer & Seasonal',
    established_year: 2008,
    is_indian_station: true,
    region: 'Arctic',
    location: 'Ny-Ålesund, Spitsbergen, Svalbard, High Arctic',
    location_description: 'India\'s premier Arctic research station situated at 78°55′N in Ny-Ålesund, Norway. Operational hub for Arctic aerosols, IndARC fjord oceanography, and glaciological monitoring.',
    research_areas: [
      'Arctic Oceanography & IndARC',
      'Atmospheric Aerosols & Black Carbon',
      'Polar Microbiology & Metagenomics',
      'Glaciology & Mass Balance'
    ],
    facilities: [
      'Atmospheric Chemistry Laboratory',
      'Clean Cold Room (-20°C)',
      'IndARC Oceanographic Mooring Base',
      'Direct Satellite Telemetry Terminal'
    ]
  };

  await db.collection('stations').updateOne(
    { name: 'Himadri' },
    { $set: himadriStation },
    { upsert: true }
  );
  console.log('✓ Inserted Himadri Station into stations collection!');

  await closeDatabase();
  console.log('Finished updating MongoDB publication & station data.');
}

updatePublications().catch(console.error);
