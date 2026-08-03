// Monorepo setup: Metro must watch the workspace packages and resolve their
// dependencies from the shared pnpm store.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm keeps each package's own dependencies in a symlinked folder next to
// its real (non-hoisted) location. Metro must walk up from there to resolve
// them, so hierarchical lookup has to stay on — disabling it (a recipe meant
// for hoisted npm/yarn monorepos) breaks resolution for any dependency a
// third-party package expects to find next to itself.
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
