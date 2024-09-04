const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "4dtiya",
  e2e: {
    setupNodeEvents(on, config) {
      // Implement node event listeners if necessary
      // If not needed, this can remain empty
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
