import { SetMetadata } from '@nestjs/common';
import { AutoCrudConfig } from '../types/config.types';
import { AUTO_CRUD_RESOLVER_KEY } from '../constant';

export function AutoCrudResolver(config: AutoCrudConfig) {
  return SetMetadata(AUTO_CRUD_RESOLVER_KEY, config);
}
