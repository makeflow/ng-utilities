import * as FS from 'fs';
import * as Path from 'path';
import * as v from 'villa';

import {
  safeStats,
} from './helpers';

export interface File {
  filename: string;
  absolutePath: string;
  kind: string;
}

export default class SourceFileManager {

  constructor(
    public rootDirs: string[],
  ) { }

  contain(filename: string): boolean {
    return this.rootDirs.some(rootDir => filename.startsWith(rootDir) );
  }

  destroy() {

  }

  static async resolveSameNameFiles(filename: string): Promise<File[]> {
    let results: File[] = [];

    if (!filename) {
      return results;
    }

    let dirname = Path.dirname(filename);
    let basename = Path.basename(filename);
    let basenameWithoutExt = Path.basename(basename, Path.extname(basename));
    let ns = basenameWithoutExt;
    let names: string[] = [];

    while (true) {
      if (ns.indexOf('.') === -1) {
        names.push(ns);
        break;
      }

      names.push(ns);
      ns = ns.slice(0, ns.lastIndexOf('.'));
    }

    let files = await v.call(FS.readdir, dirname);

    files = await v.filter(files, async file => {
      let stats = await safeStats(Path.join(dirname, file));

      return stats ? stats.isFile() : false;
    });

    files.sort((a, b) => {
      return b.startsWith(basenameWithoutExt) ? 1 : -1;
    });

    // results.push(getFile(basename, dirname));

    for (let file of files) {
      if (file === basename) {
        continue;
      }

      if (names.some(name => file.startsWith(name))) {
        results.push(getFile(file, dirname));
      }
    }

    return results;
  }
}

function getFile(filename: string, context: string): File {
  let name = Path.basename(filename, Path.extname(filename));

  return {
    filename,
    absolutePath: Path.resolve(context, filename),
    kind: name.slice(name.lastIndexOf('.')).replace(/^\./, ''),
  };
}
