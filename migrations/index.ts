import * as migration_20261110_051110_init from './20261110_051110_init';
import * as migration_20261110_051622_access_token from './20261110_051622_access_token';
import * as migration_20261110_060000_no_overlap from './20261110_060000_no_overlap';
import * as migration_20261110_130022_canada from './20261110_130022_canada';

export const migrations = [
  {
    up: migration_20261110_051110_init.up,
    down: migration_20261110_051110_init.down,
    name: '20261110_051110_init',
  },
  {
    up: migration_20261110_051622_access_token.up,
    down: migration_20261110_051622_access_token.down,
    name: '20261110_051622_access_token',
  },
  {
    up: migration_20261110_060000_no_overlap.up,
    down: migration_20261110_060000_no_overlap.down,
    name: '20261110_060000_no_overlap',
  },
  {
    up: migration_20261110_130022_canada.up,
    down: migration_20261110_130022_canada.down,
    name: '20261110_130022_canada'
  },
];
