/**
 * OpenAPI 3.0.0 Specification for Polar Research Information Platform
 */

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Polar Research Information Platform API (NCPOR)',
    version: '1.0.0',
    description: 'Complete production-grade backend API for Antarctic & Arctic scientific research, expedition tracking, paleoclimate datasets, RAG AI assistant, knowledge graphs, and human review workflows.',
    contact: {
      name: 'National Centre for Polar and Ocean Research (NCPOR)',
      url: 'https://ncpor.res.in'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Production Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register'
      }
    }
  },
  tags: [
    { name: 'Authentication', description: 'User registration, JWT login, token rotation, and password management' },
    { name: 'Global Search', description: 'Unified multi-entity search across all polar collections' },
    { name: 'Interactive Polar Map', description: 'Geospatial station coordinates and filtering' },
    { name: 'Research Stations', description: 'Antarctic and Arctic scientific base explorer' },
    { name: 'Scientific Datasets', description: 'WOA18 oceanography, Dome Fuji ice cores, satellite sea ice, and data submissions' },
    { name: 'Expeditions & Timeline', description: 'Historical and active Indian Scientific Expeditions (ISEA) and timeline' },
    { name: 'Researchers & Scientists', description: 'Polar researcher profiles and linked outputs' },
    { name: 'Research Projects', description: 'PACER projects and research grants' },
    { name: 'Publications', description: 'Peer-reviewed scientific papers and DOIs' },
    { name: 'Documents & Ingestion', description: 'Expedition reports and text chunking' },
    { name: 'Media Repository', description: 'High-resolution photographs and video documentaries' },
    { name: 'Facilities & Infrastructure', description: 'Observatories, clean labs, and instrumentation' },
    { name: 'Science Disciplines', description: 'Cryosphere, Ocean, Atmospheric, Bio, and Geo disciplines' },
    { name: 'Environment & Policy', description: 'Antarctic Treaty, Madrid Protocol, and ASPA protected areas' },
    { name: 'Antarctica', description: 'Antarctic programmes, stations, and historical records' },
    { name: 'Arctic', description: 'Himadri station, Kongsfjorden monitoring, and IndARC mooring' },
    { name: 'AI Research Assistant', description: 'Grounded Polar Assistant with verified citations' },
    { name: 'RAG & Citations', description: 'Vector similarity search and document retrieval' },
    { name: 'Knowledge Graph', description: 'Entity nodes and typed relationship network' },
    { name: 'AI Outreach Generation', description: 'Automated research collaboration proposals' },
    { name: 'Human Review Workflow', description: 'Content approval, rejection, edits, and audit trail' },
    { name: 'Admin', description: 'System metrics and administrative operations' }
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', example: 'scientist@ncpor.res.in' },
                  password: { type: 'string', example: 'PolarSecure@2026' },
                  name: { type: 'string', example: 'Dr. Ramesh Kumar' },
                  role: { type: 'string', enum: ['Admin', 'Researcher', 'Reviewer', 'User'], example: 'Researcher' },
                  institution: { type: 'string', example: 'NCPOR Goa' },
                  designation: { type: 'string', example: 'Project Scientist' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate and receive JWT Bearer token & refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@polarhub.gov.in' },
                  password: { type: 'string', example: 'PolarAdmin@2026' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current profile retrieved' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/search': {
      get: {
        tags: ['Global Search'],
        summary: 'Unified search across all 10+ polar collections',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search keywords (e.g. "climate", "Maitri", "salinity")' }
        ],
        responses: {
          200: { description: 'Grouped multi-collection search results' }
        }
      }
    },
    '/api/map/stations': {
      get: {
        tags: ['Interactive Polar Map'],
        summary: 'Get geospatial station coordinates and metadata for interactive maps',
        parameters: [
          { name: 'region', in: 'query', schema: { type: 'string' }, description: 'Filter by Antarctica or Arctic' },
          { name: 'country', in: 'query', schema: { type: 'string' }, description: 'Filter by Country' }
        ],
        responses: {
          200: { description: 'Station map dataset' }
        }
      }
    },
    '/api/stations': {
      get: {
        tags: ['Research Stations'],
        summary: 'List all polar research stations',
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of stations' }
        }
      }
    },
    '/api/stations/{id}': {
      get: {
        tags: ['Research Stations'],
        summary: 'Get station details by ID or slug',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'ind-stn-02' }],
        responses: {
          200: { description: 'Station details' },
          404: { description: 'Station not found' }
        }
      }
    },
    '/api/expeditions': {
      get: {
        tags: ['Expeditions & Timeline'],
        summary: 'List Indian Scientific Expeditions (ISEA)',
        parameters: [
          { name: 'vessel', in: 'query', schema: { type: 'string' } },
          { name: 'year', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Expeditions list' }
        }
      }
    },
    '/api/expeditions/timeline': {
      get: {
        tags: ['Expeditions & Timeline'],
        summary: 'Get chronological expedition timeline',
        responses: {
          200: { description: 'Chronological expedition events' }
        }
      }
    },
    '/api/datasets': {
      get: {
        tags: ['Scientific Datasets'],
        summary: 'Browse polar dataset catalogue',
        responses: {
          200: { description: 'Dataset catalogue' }
        }
      }
    },
    '/api/research/ask': {
      post: {
        tags: ['AI Research Assistant'],
        summary: 'Ask grounded AI research assistant with verified citations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string', example: 'What is the mean salinity of the Southern Ocean and how does it drive AABW?' },
                  conversationId: { type: 'string', example: 'conv-101' },
                  filters: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Grounded AI response with exact source tags' }
        }
      }
    },
    '/api/rag/query': {
      post: {
        tags: ['RAG & Citations'],
        summary: 'Execute RAG pipeline with vector retrieval and citations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string', example: 'What logistics were used for Antarctic station resupply?' },
                  topK: { type: 'integer', example: 5 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Retrieved evidence and synthesized answer' }
        }
      }
    },
    '/api/knowledge/graph': {
      get: {
        tags: ['Knowledge Graph'],
        summary: 'Get graph network (nodes & edges) for interactive visualization',
        responses: {
          200: { description: 'Nodes and edges structure' }
        }
      }
    },
    '/api/outreach/generate': {
      post: {
        tags: ['AI Outreach Generation'],
        summary: 'Generate tailored research collaboration pitch',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  researcher_id: { type: 'string', example: 'res_001' },
                  recipient_name: { type: 'string', example: 'Prof. David Vaughan' },
                  recipient_institution: { type: 'string', example: 'British Antarctic Survey' },
                  focus_area: { type: 'string', example: 'East Antarctic Ice Sheet Dynamics' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Generated collaboration draft' }
        }
      }
    },
    '/api/reviews': {
      get: {
        tags: ['Human Review Workflow'],
        summary: 'List review submissions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Review submissions' }
        }
      },
      post: {
        tags: ['Human Review Workflow'],
        summary: 'Submit content for human review',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content_type', 'content_payload'],
                properties: {
                  content_type: { type: 'string', example: 'OutreachDraft' },
                  title: { type: 'string', example: 'Outreach Email to British Antarctic Survey' },
                  content_payload: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Review submission created' }
        }
      }
    },
    '/api/admin/metrics': {
      get: {
        tags: ['Admin'],
        summary: 'System metrics and database counts',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'System health and collection metrics' }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
