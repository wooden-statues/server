// server/config/middlewares.ts
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', process.env.FRONTEND_URL || 'http://localhost:3000'],
          'media-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      methods: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'],
      headers: ['Content-Type','Authorization','Origin','Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
