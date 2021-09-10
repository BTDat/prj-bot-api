import {inject, lifeCycleObserver} from '@loopback/core';
import {AnyObject, juggler} from '@loopback/repository';
import {config, ValueOrPromise} from '@loopback/context';
import {ConfigBindings} from '../../keys';

const dbConfig = {
  name: 'db',
  connector: 'postgresql',
};

@lifeCycleObserver('datasource')
export class DbDatasource extends juggler.DataSource {
  static dataSourceName = 'db';
  static readonly defaultConfig = dbConfig;

  constructor(
    @inject('datasources.config.db', {optional: true})
    private dsConfig: AnyObject = dbConfig,

    @config({
      fromBinding: ConfigBindings.INFRA_CONFIG,
      propertyPath: 'dbUrl',
    })
    private dbUrl: string,
  ) {
    super({...dbConfig, url: dbUrl});
  }

  stop(): ValueOrPromise<void> {
    return super.disconnect();
  }
}
