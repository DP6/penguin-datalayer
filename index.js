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

let export_opt = process.argv.slice(2)[1] || 'xlsx';

// Checking command line params for export option
if (!(export_opt === 'xlsx' || export_opt === 'txt')) {
  console.log(new Error('Export type not specified as start param. Please inform how you wish to export the results.'));
  // For now, we can only export in xlsx and txt, but later on we'll be able to export in pdf. Therefore, we'll leave this code line as is.
  return;
}

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

    async function makePostRequest(body) {
      const fetch = require('node-fetch');

      let authToken =
        'eyJhbGciOiJSUzI1NiIsImtpZCI6ImNhMDA2MjBjNWFhN2JlOGNkMDNhNmYzYzY4NDA2ZTQ1ZTkzYjNjYWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNjE4MTA0NzA4MDU0LTlyOXMxYzRhbGczNmVybGl1Y2hvOXQ1Mm4zMm42ZGdxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNjE4MTA0NzA4MDU0LTlyOXMxYzRhbGczNmVybGl1Y2hvOXQ1Mm4zMm42ZGdxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTExNTE2NDk2MDUyMzEzMTkxNzY0IiwiaGQiOiJkcDYuY29tLmJyIiwiZW1haWwiOiJnYWJyaWVsLnRlbGxhcm9saUBkcDYuY29tLmJyIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJTSFkwYUFyaFduNmthT29IaW1oanZ3IiwiaWF0IjoxNjQyNjE2MTg2LCJleHAiOjE2NDI2MTk3ODYsImp0aSI6IjIwZDgxMzFiZjE3NzI5MjczMDlkODM4NjliYWNmNGE0YjljNDAzODAifQ.ssWJElWthouO2MwWEU3eI00N5viXJX62p6Ro-zU2sRopcLUFd-IOROW4uZE-QRuPfgZ3gP3hXsotQlujQ4oXaMJo6v74BSK3cBJK1y-w2jMWDDZ3ex2SRfXtYa2pg-35NvYKCXWkuadNNo3S2rh0s1T21-dCZf5fTdVnwX1AxdINhXfpniOgBVLjEOlYPwJfrL6oh2ph6TvWDZ6IA-YwhrbCMZ8vcNWWQYSyeh6k42A89ihdItjxfOljRidu_sAEVFEXbVOsG0OZS_5oESV-gYUWd6hNKMfMYIMZ3ndw-2nCRrNlr1Z-iiwzcnnEPJ1w6dn_d1OdvHh1MLhbhsfzqQ';
      try {
        const headers = {
          Authorization: `Bearer ${authToken}`,
        };
        const response = await fetch('https://us-central1-dp6-estudos.cloudfunctions.net/hub-raft-suite-deploy', {
          method: 'POST',
          body: JSON.stringify(body),
          headers,
        });
        const result = await response.text();
        console.log(result);
      } catch (error) {
        console.error(error);
      }
    }

    let cleanupEval = () => {
      console.log('Realizing last eval');
      bowserjr.validate(schema, {}, function (result) {
        resultsArray.push(result[0]);
      });
      resultsArray.forEach((resultObject) => {
        if (resultObject) {
          let keyName = JSON.parse(resultObject.dataLayerObject).event;

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
          if (config.hubOption && keyName) {
            let status = resultObject.status;

            let codes = [];

            switch (status) {
              case 'OK':
                codes.push('01-00'); /* Disponibilidade */
                codes.push('03-00'); /* Completude */
                codes.push('06-00'); /* Consistência */
                codes.push('08-00'); /* Uniformidade */
                break;

              case 'ERROR':
                if (status.includes('Hit not validated or missed during test')) {
                  codes.push('01-01'); /* Disponibilidade */
                } else {
                  codes.push('01-00'); /* Disponibilidade */
                }

                if (status.includes('sent without the following property')) {
                  codes.push('03-01'); /* Completude */
                }
                break;

              case 'WARNING':
                codes.push('01-00'); /* Disponibilidade */
                codes.push('03-00'); /* Completude */

                if (
                  status.includes('should be equal to one of the allowed values') ||
                  status.includes('should match pattern')
                ) {
                  codes.push('06-00'); /* Consistência */
                  codes.push('07-01'); /* Acurácia */
                  codes.push('08-01'); /* Uniformidade */
                } else {
                  codes.push('06-01'); /* Consistência */
                }
                break;

              default:
                break;
            }
            codes.forEach(async (code) => {
              let body = {
                module: 'penguin-datalayer',
                spec: 'dp6_site',
                deploy: '2.0.0',
                code: code,
                description: 'Saving collect data',
                payload: {
                  status: status,
                  objectName: 'event',
                  keyName: keyName,
                  message: resultObject.message,
                },
              };

              makePostRequest(body);
            });
          }
        }
      });
    };

    await process.on('exit', cleanupEval);
  })();
});
