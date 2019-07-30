const path = require('path');
const local = require('./local');
const exists = require('fs').existsSync;
const { logger } = require('svrx-util');

const { getStatisfySvrxVersion } = require('./util');

class Server {
    constructor() {
        this.init();
    }

    async init() {
        const configList = await this.getConfig();
        if (configList) {
            const [ config, svrxVersion ] = configList;
            this.start(svrxVersion, config);
        }
    }

    async getConfig() {
        const pluginPath = process.cwd();
        const demoPath = path.join(pluginPath, 'demo');
        const packageInfoPath = path.join(pluginPath, 'package.json');
        if (!exists(demoPath)) {
            logger.error(`${demoPath} not exists`);
            return;
        }
        if (!exists(packageInfoPath)) {
            logger.error(`${packageInfoPath} not exists`);
            return;
        }
        const packageInfo = require(packageInfoPath);
        const svrxVersion = await getStatisfySvrxVersion(packageInfo.engines.svrx);

        return [
            {
                root: demoPath,
                plugins: [
                    {
                        path: pluginPath
                    }
                ]
            }, 
            svrxVersion
        ];
    }

    async start(version, config) {
        const server = await local.load(version, config);
        server.start();
    }
}

module.exports = Server;