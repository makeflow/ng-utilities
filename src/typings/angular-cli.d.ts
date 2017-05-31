declare interface AngularCLIAppConfiguration {
  root: string;
  outDir: string;
  deployUrl: string;
  assets: string[];
  index: string;
  main: string;
  polyfills: string;
  prefix: string;
  styles: string[];
  scripts: string[];
  environmentSource: string;
  environments: {
    [key : string]: string;
  };
}
declare interface AngularCLIConfiguration {
  project: {
    name: string;
  };
  apps: AngularCLIAppConfiguration[],
  lint: any[];
  defaults: any;
}
