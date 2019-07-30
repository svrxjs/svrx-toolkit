const path = require('path');
const home = require('user-home');
const { npm, logger } = require('svrx-util');

// mark
const _ = require('lodash');
const tmp = require('tmp');
const fs = require('fs-extra');

const VERSIONS_ROOT = path.join(home, '.svrx', 'versions');

const getSvrxPath = version => path.resolve(VERSIONS_ROOT, version, 'lib/svrx.js');

const getVersions = () => {
  const { lstatSync, readdirSync } = fs;
  const { join } = path;
  const isDirectory = name => lstatSync(join(VERSIONS_ROOT, name)).isDirectory();
  const getDirectories = source => readdirSync(source).filter(isDirectory);

  return (fs.existsSync(VERSIONS_ROOT) && getDirectories(VERSIONS_ROOT)) || [];
};

const install = async (version) => {
    const versions = await getVersions();
    versions.reverse();
  
    const installVersion = version || versions[0];
    const tmpObj = tmp.dirSync();
    const tmpPath = tmpObj.name;
    const options = {
      name: 'svrx',
      version: installVersion,
      path: tmpPath,
      npmLoad: {
        loaded: false,
        prefix: tmpPath,
      },
    };
  
    const spinner = logger.progress('Installing svrx core package...');
  
    try {
        const result = await npm.install(options);
        const svrxRoot = path.resolve(tmpPath, 'node_modules/svrx');
        const destFolder = path.resolve(VERSIONS_ROOT, result.version);
        const destFolderDependency = path.resolve(VERSIONS_ROOT, result.version, 'node_modules');
  
        fs.copySync(svrxRoot, destFolder);
        fs.copySync(path.resolve(tmpPath, 'node_modules'), destFolderDependency);
        if (spinner) spinner();
        return installVersion;
    } catch (e) {
        if (spinner) spinner();
        logger.error(e);
        return null;
    }
};

const exists = version => version && fs.existsSync(getSvrxPath(version));

module.exports = {
  load: async (version, params = {}) => {
    if (!exists(version)) {
        await install(version);
    }
    const Svrx = require(getSvrxPath(version));
    return new Svrx(params);
  },
};