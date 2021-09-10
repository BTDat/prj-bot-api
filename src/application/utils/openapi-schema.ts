import {SchemaRef} from '@loopback/openapi-v3';
import {
  getJsonSchema,
  JsonSchemaOptions,
} from '@loopback/repository-json-schema';
import {getModelSchemaRef} from '@loopback/rest';

export function getModelSchemaRefExtended<T extends object>(
  modelCtor: Function & {prototype: T},
  options?: JsonSchemaOptions<T> & {include?: (keyof T)[]},
): SchemaRef {
  if (options?.include) {
    const schemaWithDefinitions = getJsonSchema(modelCtor);

    const exclude = [];
    for (const p in schemaWithDefinitions.properties) {
      if (!options.include.includes(p as keyof T)) {
        exclude.push(p as keyof T);
      }
    }
    options.exclude = exclude;
    delete options.include;

    return getModelSchemaRef(modelCtor, options);
  }

  return getModelSchemaRef(modelCtor, options);
}
