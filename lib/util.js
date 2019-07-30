const fetch = require('node-fetch');
const ora = require('ora');
const semver = require('semver');
const logger = require('./logger');

const getSvrxVersionInfo = () => {
    return new Promise((resolve) => {
        const spinner = ora('loading svrx version');
        spinner.start();
        fetch('https://registry.npmjs.org/svrx')
            .then((res) => res.json())
            .then((data) => {
                spinner.stop();
                resolve({
                    currentVersion: data['dist-tags'].latest,
                    list: Object.keys(data.versions)
                        .filter(v => v.indexOf('-') === -1)
                });
            }).catch(err => {
                logger.fatal(`Failed to get svrx version: ${err.message.trim()}`);
            });
    });
}

const getStatisfySvrxVersion = async (range) => {
    const svrxVersionInfo = await getSvrxVersionInfo();
    return svrxVersionInfo.list.reverse().find(version => {
        return semver.satisfies(version, range);
    });
};

module.exports = {
    getSvrxVersionInfo,
    getStatisfySvrxVersion
};