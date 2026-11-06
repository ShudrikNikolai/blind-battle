import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PROJECT = 'blind-battle-e2e';
const COMPOSE = path.resolve(
  process.cwd(),
  '..',
  'deploy',
  'docker-compose.test.yaml',
);

const compose = (...args: string[]): void => {
  execFileSync('docker', ['compose', '-p', PROJECT, '-f', COMPOSE, ...args], {
    stdio: 'inherit',
  });
};

const psql = (sql: string): string =>
  execFileSync(
    'docker',
    [
      'compose',
      '-p',
      PROJECT,
      '-f',
      COMPOSE,
      'exec',
      '-T',
      'postgres',
      'psql',
      '-U',
      'test',
      '-d',
      'blind_battle_test',
      '-tAc',
      sql,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  ).trim();

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function waitForSchema(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if (psql("select to_regclass('public.admins')") === 'admins') return;
    } catch {
      // контейнер ещё стартует/выполняет initdb.d
    }
    await delay(1000);
  }
  throw new Error('e2e postgres did not apply deploy/scripts in 60s');
}

export default async function setup(): Promise<() => Promise<void>> {
  try {
    compose('up', '-d', '--wait');
    await waitForSchema();
  } catch (error) {
    try {
      compose('down', '-v');
    } catch {
      // ignore cleanup failure, original error is more useful
    }
    throw error;
  }

  return async () => {
    compose('down', '-v');
  };
}
