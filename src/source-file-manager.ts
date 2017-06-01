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

  static async rename(target: string, newName: string): Promise<void> {
    let stats = await safeStats(target);
    let dirname = stats && stats.isDirectory() ? target : Path.dirname(target);
    let dirBasename = Path.basename(dirname);
    let name = Path.basename(target).replace(/\..*$/, '');
    let sameNameFiles: File[];

    if (name === newName) {
      return;
    }

    sameNameFiles = await SourceFileManager.resolveSameNameFiles(target);

    if (!stats || stats.isFile()) {
      sameNameFiles.push({
        filename: Path.basename(target),
        absolutePath: target,
        kind: name,
      });
    }

    let renameItems: string[][] = sameNameFiles.map(file => {
      return [
        file.absolutePath,
        Path.join(dirname, file.filename.replace(/^[^\.]+/, newName)),
      ];
    });

    // let dependencies = renameItems.slice();

    if (dirBasename === name) {
      renameItems.push([
        dirname,
        Path.join(Path.dirname(dirname), newName),
      ]);
    }

    await v.each(renameItems, rename);

    // await v.map(sameNameFiles, file => {
    //   return fixDependenciesPath(file.absolutePath, dependencies);
    // });
  }

  static async resolveSameNameFiles(filename: string): Promise<File[]> {
    let results: File[] = [];

    if (!filename) {
      return results;
    }

    let stats = await safeStats(filename);
    let dirname = stats && stats.isDirectory() ? filename : Path.dirname(filename);
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
    kind: name.indexOf('.') > -1 ? name.slice(name.lastIndexOf('.')).replace(/^\./, '') : name,
  };
}

function rename(paths: [string, string]): Promise<void> {
  let sourcePath = paths[0];
  let destPath = paths[1];

  return v.call(FS.rename, sourcePath, destPath).then(v.bear);
}

// async function fixDependenciesPath(target: string, dependencies: string[][]) {
//   let context = Path.dirname(target);
//   let content = await v.call<string>(FS.readFile, target, 'utf8');

//   for (let dependency of dependencies) {
//     let oldPath = `./${Path.relative(context, dependency[0]).replace(/\\/g, '/')}`;
//     let newPath = `./${Path.relative(context, dependency[1]).replace(/\\/g, '/')}`;
//     let position: number;
//     let nextProcessContent = content;
//     let processedContent = '';
//     // tslint:disable-next-line:no-console
//     console.log('process', oldPath, newPath);
//     // tslint:disable-next-line:no-conditional-assignment
//     while (position = nextProcessContent.indexOf(oldPath)) {
//       if (position === -1) {
//         break;
//       }

//       processedContent = nextProcessContent.slice(0, position) + newPath;
//       nextProcessContent = nextProcessContent.slice(position + oldPath.length);
//     }

//     content = processedContent + nextProcessContent;
//   }

//   // tslint:disable-next-line:no-console
//   console.log('-----------');
//   // tslint:disable-next-line:no-console
//   console.log(content);
// }
