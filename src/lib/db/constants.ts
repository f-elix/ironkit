import type { CollectionName } from './types';
import { schema } from '$triplit/schema';

export const COLLECTION_NAMES = Object.keys(schema) as CollectionName[];
