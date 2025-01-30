import { SetMetadata } from '@nestjs/common';
import { AUTO_CRUD_WRAP_RESOLVER_KEY } from '../constant';

export function AutoCrudWrap(
  query: 'getOne' | 'getMany' | 'createOne' | 'updateOne' | 'deleteOne',
): MethodDecorator {
  return SetMetadata(AUTO_CRUD_WRAP_RESOLVER_KEY, query);
}
