import * as FS from 'fs';
import * as Path from 'path';
import * as v from 'villa';

export function resolveSourceRootDirs(projectDir: string) {
  let rootDirs: string[] = [];

  let angularCLIConfig = getAngularCLIConfig(projectDir);

  if (angularCLIConfig && angularCLIConfig.apps) {
    for (let app of angularCLIConfig.apps) {
      if (app.root) {
        rootDirs.push(Path.resolve(projectDir, app.root));
      }
    }
  }

  if (!rootDirs.length) {
    if (existsSync(Path.join(projectDir, 'src'))) {
      rootDirs.push(Path.join(projectDir, 'src'));
    }
  }

  return rootDirs;
}

export function getAngularCLIConfig(projectDir: string): AngularCLIConfiguration | undefined {
  let angularCLIConfig: AngularCLIConfiguration | undefined;

  try {
    angularCLIConfig = JSON.parse(FS.readFileSync(
      Path.resolve(projectDir, '.angular-cli.json'),
      'utf8',
    ));

  } catch (e) { }

  return angularCLIConfig;
}

export function safeStatsSync(target: string): FS.Stats | undefined {
  let stats: FS.Stats | undefined;

  try {
    stats = FS.statSync(target);
  } catch (e) { }

  return stats;
}

export function safeStats(target: string): Promise<FS.Stats | undefined> {
  return v.call(FS.stat, target).catch(v.bear);
}

export function existsSync(target: string): boolean {
  return !!safeStatsSync(target);
}
