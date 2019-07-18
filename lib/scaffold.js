const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const download = require('download-git-repo');
const home = require('user-home');
const Metalsmith = require('metalsmith');
const async = require('async');
const render = require('consolidate').handlebars.render;
const rm = require('rimraf').sync;
const exec = require('child_process').execSync;
const exists = require('fs').existsSync;
const path = require('path');
const logger = require('./logger');
const { getSvrxVersionInfo } = require('./util');

const TEMPLATE_REPOSITORY_NAME = 'svrx-toolkit-template';
const TEMPLATE_REPOSITORY_URL = `x-orpheus/${TEMPLATE_REPOSITORY_NAME}`;

class Scaffold {
  constructor() {
    this.init();
  }

  async init() {
    const svrxVersionInfo = await getSvrxVersionInfo();
    const info = await this.getProjectInfo(svrxVersionInfo);
    const isContinue = await this.checkPluginPath(info);
    if (isContinue) {
      await this.downloadTemplate();
      await this.generateProject(info);
    }
  }

  checkPluginPath(info) {
    const pluginPath = path.join(process.cwd(), info.name);
    if (exists(pluginPath)) {
      return new Promise((resolve) => {
        inquirer.prompt([{
          name: 'isContinue',
          type: 'confirm',
          message: 'Target directory exists. Continue?'
        }]).then(answers => {
          resolve(answers.isContinue);
        });
      });
    } else {
      return true;
    }
  }

  getProjectInfo(svrxVersionInfo) {
    return inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Plugin name:',

      },
      {
        name: 'version',
        type: 'input',
        message: 'Plugin version:',
        default: '0.0.1',
      },
      {
        name: 'svrxVersion',
        type: 'list',
        message: 'Svrx version:',
        choices: svrxVersionInfo.list,
        default: svrxVersionInfo.currentVersion,
      },
      {
        name: 'author',
        type: 'input',
        message: 'Author:',
        default: this.getDefaultAuthor(),
      },
      {
        name: 'license',
        type: 'input',
        message: 'License:',
        default: 'MIT',
      },
    ]);
  }

  downloadTemplate() {
    return new Promise((resolve) => {
      const tmpPath = this.getTmpPath();
      if (exists(tmpPath)) rm(tmpPath);

      const spinner = ora('downloading template');
      spinner.start();
      download(TEMPLATE_REPOSITORY_URL, tmpPath, (err) => {
        spinner.stop();
        if (err) {
          logger.fatal(`Failed to download repo ${TEMPLATE_REPOSITORY_URL}: ${err.message.trim()}`);
        } else {
          resolve();
        }
      });
    });
  }

  generateProject(info) {
    return new Promise((resolve) => {
      Metalsmith(process.cwd())
        .metadata(info)
        .clean(false)
        .source(this.getTmpPath())
        .destination(`./svrx-plugin-${info.name}`)
        .use((files, metalsmith, done) => {
          const meta = metalsmith.metadata();
          const keys = Object.keys(files);
          async.each(
            keys,
            (fileName, next) => {
              const str = files[fileName].contents.toString();
              render(str, meta, (err, res) => {
                if (err) {
                  err.message = `[${fileName}] ${err.message}`;
                  return next(err);
                }
                files[fileName].contents = Buffer.from(res);
                next();
              });
            },
            done,
          );
        })
        .build((err) => {
          if (err) {
            logger.fatal(`Failed to transform template: ${err.message.trim()}`);
          } else {
            console.log('')
            console.log(`${chalk.green('Success!')} To get started:`);
            console.log('');
            console.log(chalk.yellow(`  cd ./svrx-plugin-${info.name}`));
            console.log('');
            resolve();
          }
        });
    });
  }

  getDefaultAuthor() {
    let name; let
      email;

    try {
      name = exec('git config --get user.name');
      email = exec('git config --get user.email');
    } catch (e) {}

    name = name && JSON.stringify(name.toString().trim()).slice(1, -1);
    email = email && ` <${email.toString().trim()}>`;
    return (name || '') + (email || '');
  }

  getTmpPath() {
    return path.join(home, '.svrx-toolkit', TEMPLATE_REPOSITORY_NAME);
  }
}

module.exports = Scaffold;
