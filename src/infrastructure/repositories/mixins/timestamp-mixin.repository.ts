import {
  Count,
  DataObject,
  Entity,
  EntityCrudRepository,
  Options,
  Where,
} from '@loopback/repository';
import {Constructor} from '@loopback/context';

export function TimestampRepositoryMixin<
  E extends Entity & {createdAt: Date; updatedAt?: Date},
  ID,
  R extends Constructor<EntityCrudRepository<E, ID>>,
>(repository: R, timestampOptions: {updatedAt: boolean} = {updatedAt: true}) {
  return class MixedRepository extends repository {
    async create(entity: DataObject<E>, options?: Options): Promise<E> {
      entity.createdAt = new Date();

      if (timestampOptions?.updatedAt) {
        entity.updatedAt = entity.createdAt;
      }

      return super.create(entity, options);
    }

    async createAll(
      entities: DataObject<E>[],
      options?: Options,
    ): Promise<E[]> {
      entities.forEach(entity => {
        entity.createdAt = new Date();

        if (timestampOptions?.updatedAt) {
          entity.updatedAt = entity.createdAt;
        }
      });

      return super.createAll(entities, options);
    }

    async updateAll(
      data: DataObject<E>,
      where?: Where<E>,
      options?: Options,
    ): Promise<Count> {
      if (timestampOptions?.updatedAt) {
        data.updatedAt = new Date();
      }

      return super.updateAll(data, where, options);
    }

    async replaceById(
      id: ID,
      data: DataObject<E>,
      options?: Options,
    ): Promise<void> {
      if (timestampOptions?.updatedAt) {
        data.updatedAt = new Date();
      }

      return super.replaceById(id, data, options);
    }
  };
}
