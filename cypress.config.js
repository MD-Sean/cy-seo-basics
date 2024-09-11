const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "4dtiya",
  e2e: {
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser = {}, launchOptions) => {
        // Add any browser-specific launch options here
        return launchOptions;
      });
    },
  },
  reporter: "mocha-multi-reporters",
  reporterOptions: {
    reporterEnabled: "mochawesome",
    mochawesomeReporterOptions: {
      reportDir: "cypress/reports",
      overwrite: false,
      html: true,
      json: true,
    },
  },
});
