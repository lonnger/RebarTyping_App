/* eslint-env node */

const fs = require('fs');
const path = require('path');
const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');

const MODULE_FILES = ['EspWifiPickerModule.kt', 'EspWifiPickerPackage.kt'];
const PACKAGE_REGISTRATION = 'packages.add(EspWifiPickerPackage())';

const withEspWifiPickerSources = (config) =>
  withDangerousMod(config, [
    'android',
    async (androidConfig) => {
      const packageName = androidConfig.android?.package;
      if (!packageName) {
        throw new Error('android.package is required for the ESP WiFi picker module.');
      }

      const sourceDirectory = path.join(
        androidConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...packageName.split('.')
      );
      const templateDirectory = path.join(__dirname, 'esp-wifi-picker');

      fs.mkdirSync(sourceDirectory, { recursive: true });
      for (const fileName of MODULE_FILES) {
        const template = fs.readFileSync(
          path.join(templateDirectory, `${fileName}.template`),
          'utf8'
        );
        fs.writeFileSync(
          path.join(sourceDirectory, fileName),
          template.replaceAll('__PACKAGE_NAME__', packageName)
        );
      }

      return androidConfig;
    },
  ]);

const withEspWifiPickerRegistration = (config) =>
  withMainApplication(config, (androidConfig) => {
    const mainApplication = androidConfig.modResults;
    if (mainApplication.language !== 'kt') {
      throw new Error('The ESP WiFi picker config plugin currently requires MainApplication.kt.');
    }

    if (!mainApplication.contents.includes(PACKAGE_REGISTRATION)) {
      const packageListLine = 'val packages = PackageList(this).packages';
      if (!mainApplication.contents.includes(packageListLine)) {
        throw new Error('Unable to find the React Native package list in MainApplication.kt.');
      }

      mainApplication.contents = mainApplication.contents.replace(
        packageListLine,
        `${packageListLine}\n            ${PACKAGE_REGISTRATION}`
      );
    }

    return androidConfig;
  });

module.exports = (config) => {
  config = withEspWifiPickerSources(config);
  config = withEspWifiPickerRegistration(config);
  return config;
};
