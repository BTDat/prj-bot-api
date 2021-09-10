import {BootMixin} from '@loopback/boot';
import {
  ApplicationConfig as LbApplicationConfig,
  BindingKey,
} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication as LbRestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {
  registerAuthenticationStrategy,
  AuthenticationComponent,
} from '@loopback/authentication';
import {AuthorizationComponent} from '@loopback/authorization';
import {ApplicationSequence} from './sequence';
import {ConfigBindings} from './keys';
import {JWTAuthenticationStrategy} from './application/authentication-strategies/jwt-strategy';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}

export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

interface AppConfig {
  baseUrl?: string;
  frontEndBaseUrl?: string;
  systemInitializationPassword?: string;
  jwtSecret?: string;
}

interface InfraConfig {
  dbUrl?: string;
}

export interface ApplicationConfig extends LbApplicationConfig {
  appConfig?: AppConfig;
  infraConfig?: InfraConfig;
}

export class Application extends BootMixin(
  ServiceMixin(RepositoryMixin(LbRestApplication)),
) {
  constructor(options: ApplicationConfig) {
    super(options);

    // Open-API Swagger explorer
    if (!options.rest?.apiExplorer.disabled) {
      this.setUpOpenApi();
    }

    // Auth
    this.component(AuthenticationComponent);
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);
    this.component(AuthorizationComponent);

    this.setUpBindings();

    this.sequence(ApplicationSequence);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        glob: '/application/controllers/**/*.controller.js',
      },
      interceptors: {
        glob: '/application/interceptors/**/*.interceptor.js',
      },
      repositories: {
        glob: '/infrastructure/repositories/**/*.repository.js',
      },
      datasources: {
        glob: '/infrastructure/datasources/**/*.datasource.js',
      },
      services: {
        glob: '/@(application|infrastructure|domain)/services/**/*.js',
      },
    };
  }

  private setUpOpenApi() {
    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{bearerAuth: []}],
      servers: [{url: '/'}],
    });
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);
  }

  setUpBindings(): void {
    this.bind(PackageKey).to(pkg);

    this.configure(ConfigBindings.APP_CONFIG).to(this.options.appConfig);
    this.configure(ConfigBindings.INFRA_CONFIG).to(this.options.infraConfig);
  }
}
