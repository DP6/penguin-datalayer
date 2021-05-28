const os = require('os');
const exec = require('child_process').exec;
const puppeteer = require('puppeteer-extra');
const req = require('request-promise');
const fs = require('fs');
const bowserjr = require('@dp6/penguin-datalayer-core');
let resultsArray = [];

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage).

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ useCache: false }));

const config_file = process.argv.slice(2)[0]
  ? process.argv.slice(2)[0]
  : new Error(
      'File not specified as start param. Please inform the filename with its extension as --file in start script.'
    );

// Defining xlsx as default value.
let export_opt = 'xlsx';

// Checking command line params for export option
if (process.argv.slice(2)[1] === 'xlsx') {
  export_opt = process.argv.slice(2)[1];
} else {
  new Error('Export type not specified as start param. Please inform how you wish to export the results.');
} // For now, we can only export in xlsx, but later on we'll be able to export in pdf. Therefore, we'll leave this code line as is.

// Defining export extension based on export option extracted from command line params.
let filename = `${__dirname}/results/results_${new Date().getTime()}.${export_opt}`;

const configFile = require(`./config/${config_file}`);
configFile.validator.forEach(async (config) => {
  const schema = require(`./schema/${config.schema_name[0]}`);
  // let startChromeInDebugMode = async () => {
  //   let operatingSystem = os.platform();
  //   if (operatingSystem === "linux") {
  //     await exec(
  //       "google-chrome --remote-debugging-port=9222 --user-data-dir=remote-profile"
  //     );
  //   } else if (operatingSystem === "win32") {
  //      await exec(
  //       "start chrome --remote-debugging-port=9222 --user-data-dir=remote-profile"
  //     );
  //   }

  //   return new Promise((res) => {
  //     setTimeout((_) => {
  //       req("http://localhost:9222/json/version")
  //         .then((result) => {
  //           res(JSON.parse(result).webSocketDebuggerUrl);
  //         })
  //         .catch((err) =>
  //           console.log(
  //             "Error while trying to pick the Debugger URL. Did you open the chrome instance with debugging port?"
  //           )
  //         );
  //     }, 5000);
  //   });
  // };

  (async () => {
    // const browser = await puppeteer.connect({
    //   browserWSEndpoint: await startChromeInDebugMode(),
    // });
    const browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    // .pages
    // .then((res) => res[0])
    // .catch((err) => new Error(err));

    if (config.gtmPreviewModeURL) await page.goto(config.gtmPreviewModeURL);

    if (config.mobile_enabled === true) {
      await page.emulate(iPhone);
    } else {
      await page.setViewport({ width: 1366, height: 768 });
    }

    await page.exposeFunction('bowser', (event) => {
      bowserjr.validate(schema, event, function (result) {
        resultsArray.push(result[0]);
      });
    });

    async function runAfterGTMDebug() {
      page.on('load', async () => {
        await page.waitFor(2000);
        if (page.url() === config.url) {
          await fs.appendFileSync(filename, `Url validating:  ${page.url()}\n`, (err) => {
            if (err) throw err;
          });
          //doc.text(path, 10, 10);
          await page.evaluate(() => {
            //Validate first hits.
            window.dataLayer.forEach((elem) => {
              bowser(elem);
            });
            window.dataLayer.push_c = window.dataLayer.push;
            window.dataLayer.push = function (obj) {
              window.dataLayer.push_c(obj);
              bowser(obj);
            };
          });
          if (config.browserClose) {
            config.time ? await page.waitFor(config.time) : await page.waitFor(0);
            await browser.close();
          }
        } else {
          await fs.appendFileSync(filename, `Path :  ${page.url()}\n`, (err) => {
            if (err) throw err;
          });
          //doc.text(path, 10, 10);
        }
      });

      await page.goto(config.url);
    }

    await runAfterGTMDebug();

    await fs.appendFile(filename, '', () => {});

    let cleanupEval = () => {
      console.log('Realizing last eval');
      bowserjr.validate(schema, {}, function (result) {
        resultsArray.push(result[0]);
      });
      resultsArray.forEach((resultObject) => {
        if (resultObject) {
          resultObject.dataLayerObject = resultObject.dataLayerObject.replace(/(\r\n|\n|\r)/gm, '');
          resultObject.dataLayerObject = resultObject.dataLayerObject.replace(/\s/g, '');
          resultObject.dataLayerObject = resultObject.dataLayerObject.split(',').join(' ');
          fs.appendFileSync(
            filename,
            `${resultObject.status}, ${resultObject.message}, ${resultObject.dataLayerObject}\n`,
            (err) => {
              if (err) throw err;
            }
          );
        }
      });
    };

    await process.on('exit', cleanupEval);
  })();
});
