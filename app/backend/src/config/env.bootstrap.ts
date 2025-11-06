import path from 'path';
import dotenv from 'dotenv';

type DotenvExpand = (config: dotenv.DotenvConfigOutput) => void;

if (!(global as typeof globalThis & { __envBootstrapLoaded?: boolean }).__envBootstrapLoaded) {
  const globalWithFlag = global as typeof globalThis & { __envBootstrapLoaded?: boolean };

  const explicitPath = process.env.DOTENV_CONFIG_PATH;
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const defaultFile = nodeEnv === 'test' ? '.env.test' : '.env';
  const resolvedPath = explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : path.resolve(process.cwd(), defaultFile);

  const configResult = dotenv.config({ path: resolvedPath });

  if (configResult.parsed) {
    try {
      const expandModule = require('dotenv-expand') as
        | DotenvExpand
        | { default: DotenvExpand }
        | undefined;
      const expand = typeof expandModule === 'function' ? expandModule : expandModule?.default;
      if (expand) {
        expand(configResult);
      }
    } catch {
      // dotenv-expand is optional; ignore if not installed.
    }
  }

  globalWithFlag.__envBootstrapLoaded = true;
}

export {}; // Ensure this module is treated as a module.
