/* eslint-env node */

const { withMainActivity, withMainApplication } = require('@expo/config-plugins');

const REQUIRED_IMPORTS = [
  'import android.content.Context',
  'import android.content.res.Configuration',
  'import android.os.Build',
  'import android.util.DisplayMetrics',
];
const LEGACY_ATTACH_BASE_CONTEXT = `  override fun attachBaseContext(newBase: Context) {
    val fixedConfiguration = Configuration(newBase.resources.configuration).apply {
      fontScale = 1.0f
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
      }
    }

    super.attachBaseContext(newBase.createConfigurationContext(fixedConfiguration))
  }
`;
const FIXED_CONFIGURATION_METHODS = `  private fun createFixedConfiguration(source: Configuration): Configuration =
    Configuration(source).apply {
      fontScale = 1.0f
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        densityDpi = (DisplayMetrics.DENSITY_DEVICE_STABLE * 0.9f).toInt()
      }
    }

  @Suppress("DEPRECATION")
  private fun applyFixedConfiguration(source: Configuration): Configuration {
    val fixedConfiguration = createFixedConfiguration(source)
    resources.updateConfiguration(fixedConfiguration, resources.displayMetrics)
    return fixedConfiguration
  }

  override fun attachBaseContext(newBase: Context) {
    val fixedConfiguration = createFixedConfiguration(newBase.resources.configuration)
    super.attachBaseContext(newBase.createConfigurationContext(fixedConfiguration))
  }
`;
const ACTIVITY_CONFIGURATION_HANDLER = `
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(applyFixedConfiguration(newConfig))
  }
`;
const DEFAULT_APPLICATION_CONFIGURATION_HANDLER = `  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }`;
const FIXED_APPLICATION_CONFIGURATION_HANDLER = `  override fun onConfigurationChanged(newConfig: Configuration) {
    val fixedConfiguration = applyFixedConfiguration(newConfig)
    super.onConfigurationChanged(fixedConfiguration)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, fixedConfiguration)
  }`;

const addRequiredImports = (contents) => {
  const missingImports = REQUIRED_IMPORTS.filter(
    (requiredImport) => !contents.includes(requiredImport)
  );
  if (missingImports.length === 0) {
    return contents;
  }

  return contents.replace(/^(package [^\n]+\n)/, `$1\n${missingImports.join('\n')}\n`);
};

const addFixedConfiguration = (mainFile, classDeclaration) => {
  mainFile.contents = addRequiredImports(mainFile.contents);

  if (mainFile.contents.includes(LEGACY_ATTACH_BASE_CONTEXT)) {
    mainFile.contents = mainFile.contents.replace(
      LEGACY_ATTACH_BASE_CONTEXT,
      FIXED_CONFIGURATION_METHODS
    );
  } else if (!mainFile.contents.includes('override fun attachBaseContext')) {
    if (!mainFile.contents.includes(classDeclaration)) {
      throw new Error(`Unable to find the class declaration: ${classDeclaration}`);
    }

    mainFile.contents = mainFile.contents.replace(
      classDeclaration,
      `${classDeclaration}\n${FIXED_CONFIGURATION_METHODS}`
    );
  }

  return mainFile;
};

const withFixedMainActivity = (config) =>
  withMainActivity(config, (androidConfig) => {
    const mainActivity = androidConfig.modResults;
    if (mainActivity.language !== 'kt') {
      throw new Error('The fixed display scale plugin requires MainActivity.kt.');
    }

    androidConfig.modResults = addFixedConfiguration(
      mainActivity,
      'class MainActivity : ReactActivity() {'
    );

    if (!mainActivity.contents.includes('override fun onConfigurationChanged')) {
      mainActivity.contents = mainActivity.contents.replace(
        FIXED_CONFIGURATION_METHODS,
        `${FIXED_CONFIGURATION_METHODS}${ACTIVITY_CONFIGURATION_HANDLER}`
      );
    }

    return androidConfig;
  });

const withFixedMainApplication = (config) =>
  withMainApplication(config, (androidConfig) => {
    const mainApplication = androidConfig.modResults;
    if (mainApplication.language !== 'kt') {
      throw new Error('The fixed display scale plugin requires MainApplication.kt.');
    }

    androidConfig.modResults = addFixedConfiguration(
      mainApplication,
      'class MainApplication : Application(), ReactApplication {'
    );

    if (mainApplication.contents.includes(DEFAULT_APPLICATION_CONFIGURATION_HANDLER)) {
      mainApplication.contents = mainApplication.contents.replace(
        DEFAULT_APPLICATION_CONFIGURATION_HANDLER,
        FIXED_APPLICATION_CONFIGURATION_HANDLER
      );
    } else if (!mainApplication.contents.includes(FIXED_APPLICATION_CONFIGURATION_HANDLER)) {
      throw new Error('Unable to update MainApplication.onConfigurationChanged.');
    }

    return androidConfig;
  });

module.exports = (config) => {
  config = withFixedMainActivity(config);
  config = withFixedMainApplication(config);
  return config;
};
