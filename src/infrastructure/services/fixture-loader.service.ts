import {readFileSync} from 'fs';
import {join} from 'path';
import {bind} from '@loopback/context';
import {Configuration} from '../../domain/models/configuration.model';

@bind()
export class FixtureLoader {
  public getConfigurations(): Array<Configuration> {
    const jsonStr = readFileSync(
      join(__dirname, '../../../fixtures/configurations.json'),
    ).toString();
    return JSON.parse(jsonStr) as Array<Configuration>;
  }
}
