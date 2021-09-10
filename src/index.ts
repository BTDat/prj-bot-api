require('dotenv').config();

import {Application, ApplicationConfig} from './application';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new Application(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  if (
    !options.rest.openApiSpec.disabled &&
    !options.rest.apiExplorer.disabled
  ) {
    console.log(
      `API explorer is running at ${options.rest.apiExplorer.url}/explorer`,
    );
  }

  return app;
}

if (require.main === module) {
  const enableApiExplorer = process.env.ENABLE_API_EXPLORER === 'true';
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST,
      basePath: '/api',
      openApiSpec: {disabled: !enableApiExplorer},
      apiExplorer: {
        disabled: !enableApiExplorer,
        url: `${process.env.BASE_URL}/api`,
      },
    },
    appConfig: {
      baseUrl: process.env.BASE_URL,
      frontEndBaseUrl: process.env.FRONTEND_BASE_URL,
      systemInitializationPassword: process.env.SYSTEM_INITIALIZATION_PASSWORD,
      jwtSecret: process.env.JWT_SECRET,
    },
    infraConfig: {
      dbUrl: process.env.DB_URL,
    },
  };
  main(config).catch(err => {
    console.error('Failed to start the application.', err);
    process.exit(1);
  });
}
