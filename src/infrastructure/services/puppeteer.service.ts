import {bind} from '@loopback/context';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import isNull from 'lodash/isNull';
import {HttpErrors} from '@loopback/rest';
import {BotRequestBody, BotStatus} from '../../domain/models/bot.model';
import {Account} from '../../domain/models/account.model';
import {repository} from '@loopback/repository';
import {service} from '@loopback/core';
import {AccountRepository} from '../repositories';
import {Receipt, ReceiptStatus} from '../../domain/models/receipt.model';
import {Page} from 'puppeteer-extra-plugin/dist/puppeteer';
import {ReceiptService} from '../../domain/services/receipt.service';
import {Browser} from 'puppeteer';

@bind()
export class PuppeteerService {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @service(ReceiptService)
    private receiptService: ReceiptService,
  ) {}

  public async run(values: BotRequestBody, account: Account): Promise<void> {
    const {betLevel, password, username} = values;
    const {profitRate, email, id} = account;
    const level = [1, 2, 5, 25, 100, 500, 1000, 5000];
    puppeteer.use(StealthPlugin());

    const options = {
      headless: false,
      ignoreHTTPSErrors: true,
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      defaultViewport: null,
    };

    try {
      const browser = await puppeteer.launch(options);
      browser.on('disconnected', async () => {
        console.log('Disconnected');
        if (currentBalance) {
          const acc = await this.accountRepository.findById(id);
          const curBalance = parseFloat(currentBalance.replace(/,/g, ''));
          await this.receiptService.createReceipt(email, {
            balance: curBalance,
            profit: curBalance - initialBalance,
            profitRate,
            accountId: account.id,
            numberOfConsecutiveLosses:
              !win && !tie
                ? maxNumberOfConsecutiveLosses + 1
                : maxNumberOfConsecutiveLosses,
            status:
              acc.botStatus === BotStatus.ACTIVATE
                ? ReceiptStatus.COMPLETE
                : ReceiptStatus.INCOMPLETE,
          } as Receipt);
        }
      });
      const page = await browser.newPage();

      await page.goto('https://studio.evolutiongaming.com/', {
        timeout: 0,
        waitUntil: 'networkidle2',
      });

      await this.botLogin(page, {username, password});

      await this.chooseCategory(page);

      const statusSelector = 'div[data-role="status-text"]';
      const balanceSelector = 'span[data-role="balance-label__value"]';

      await page.waitForSelector(balanceSelector);
      await page.waitForSelector(statusSelector);

      let currentBalance = await page.$eval(
        balanceSelector,
        el => el.textContent,
      );
      if (!currentBalance) {
        throw new HttpErrors.BadRequest('error_balance');
      }
      const expectBalance =
        parseFloat(currentBalance.replace(/,/g, '')) * profitRate +
        parseFloat(currentBalance.replace(/,/g, ''));

      console.log({profitRate});
      console.log({expectBalance});

      const initialBalance = parseFloat(currentBalance.replace(/,/g, ''));

      let data = await page.$eval(statusSelector, el => el.textContent);

      // const betObject = [
      //   'bet-spot-banker',
      //   'bet-spot-banker',
      //   'bet-spot-banker',
      //   'bet-spot-player',
      //   'bet-spot-player',
      //   'bet-spot-player',
      // ];
      const betObject = [
        'bet-spot-banker',
        'bet-spot-banker',
        'bet-spot-banker',
        'bet-spot-player',
        'bet-spot-player',
        'bet-spot-banker',
        'bet-spot-player',
      ];
      let betPositon = -1;
      // let lastY: string = '4';

      for (;;) {
        // const x =  await page.$eval('svg[data-role="Bead-road"] > svg > use[y="2"]', el => el.getAttribute('x'));

        // if(!currentXPositon){
        // currentXPositon = x;

        // }
        // try {
        //   lastY = await page.$eval(
        //     'svg[data-type="coordinates"]:last-child',
        //     el => el.getAttribute('data-y'),
        //   ) ?? '4';
        // } catch (error) {
        //   console.log({error});
        // }

        if (data === 'PLACE YOUR BETS 5') {
          // if (lastY) {
          //   if (parseInt(lastY) === betObject.length - 1) {
          //     betPositon === 0;
          //   } else {
          //     betPositon = parseInt(lastY);
          //   }
          //   break;
          // }
          // if(currentXPositon && currentXPositon !== x){
          //   break;
          // }
          break;
        }

        data = await page.$eval(statusSelector, el => el.textContent);
      }

      let win: boolean | null = null;
      let tie = false;
      let bet = false;
      let numberOfConsecutiveLosses = 0;
      let maxNumberOfConsecutiveLosses = 0;
      let betAmount: number = betLevel;

      // let newTable = false;

      const playCardInterval = setInterval(async () => {
        data = await page.$eval(statusSelector, el => el.textContent);
        if (!data) {
          throw new HttpErrors.BadRequest('error_status');
        }
        switch (data) {
          case 'PLAYER WINS': {
            // newTable = false;
            currentBalance = await page.$eval(
              balanceSelector,
              el => el.textContent,
            );
            if (!currentBalance) {
              throw new HttpErrors.BadRequest('error_balance');
            }
            if (betObject[betPositon] === 'bet-spot-player') {
              win = true;
              const curBalance = parseFloat(currentBalance.replace(/,/g, ''));
              if (curBalance >= expectBalance) {
                await this.stop(page, browser, playCardInterval);
              }
            } else {
              win = false;
            }
            tie = false;
            if (bet) {
              await this.deactivateBot(
                {accountId: id},
                page,
                browser,
                playCardInterval,
              );
            }
            bet = false;
            break;
          }
          case 'BANKER WINS': {
            // newTable = false;
            currentBalance = await page.$eval(
              balanceSelector,
              el => el.textContent,
            );
            if (!currentBalance) {
              throw new HttpErrors.BadRequest('error_balance');
            }
            if (betObject[betPositon] === 'bet-spot-banker') {
              win = true;
              const curBalance = parseFloat(currentBalance.replace(/,/g, ''));
              if (curBalance >= expectBalance) {
                await this.stop(page, browser, playCardInterval);
              }
            } else {
              win = false;
            }
            tie = false;
            if (bet) {
              await this.deactivateBot(
                {accountId: id},
                page,
                browser,
                playCardInterval,
              );
            }
            bet = false;

            break;
          }
          case 'TIE': {
            tie = true;
            if (bet) {
              await this.deactivateBot(
                {accountId: id},
                page,
                browser,
                playCardInterval,
              );
            }
            bet = false;
            break;
          }
          default: {
            // if (data.includes('PLACE YOUR BET') && !newTable) {
            //   try {
            //     const x = await page.$eval('svg[data-type="coordinates"]', el =>
            //       el.getAttribute('data-x'),
            //     );

            //   } catch (error) {
            //     console.log({error});

            //     newTable = true;
            //     bet = false;
            //     betPositon = -1;
            //     await this.undoBet(betAmount,level,page);
            //   }
            // }

            if (data.includes('PLACE YOUR BET') && !bet) {
              if (betPositon !== betObject.length - 1) {
                betPositon++;
              } else {
                betPositon = 0;
              }

              bet = true;
              try {
                if (isNull(win) || win) {
                  // await page.click(`div[data-value="${betLevel}"]`);
                  await this.bet(betLevel, level, page, betObject[betPositon]);
                  betAmount = betLevel;
                  // await page.click(`div[data-role="${betObject[betPositon]}"]`);
                  numberOfConsecutiveLosses = 0;
                } else {
                  if (!tie) {
                    // if(!newTable){
                    numberOfConsecutiveLosses++;
                    betAmount = betAmount * 2;
                    // }
                  }
                  if (
                    numberOfConsecutiveLosses > maxNumberOfConsecutiveLosses
                  ) {
                    maxNumberOfConsecutiveLosses = numberOfConsecutiveLosses;
                  }

                  // let temp = Math.floor(betAmount / 4);

                  // for (;;) {
                  //   if (temp === 0) {
                  //     break;
                  //   }
                  //   await page.click(`div[data-role="${betObject[betPositon]}"]`);
                  //   temp--;
                  // }
                  // await page.waitForSelector(doubleButtonSelector);
                  // await page.click(doubleButtonSelector);
                  await this.bet(betAmount, level, page, betObject[betPositon]);
                }
              } catch (error) {
                console.log({error});

                bet = false;
              }
            }
            break;
          }
        }
      }, 1000);
    } catch (error) {
      console.log({error});
    }

    // await page.evaluate((selector) => document.querySelector(selector).click(), viewButtonSelector);

    // await page.screenshot({ path: 'example.png' });

    // let selector = 'span[contains(text(),"Log in)]';

    // await page.evaluate((selector) => document.querySelector(selector).click(), selector);

    // const [loginButton] = await page.$x('//span[contains(text(),"Log in")]')
    // loginButton.click()

    // try {
    //   const data = await page.$eval('div > p[color="piccolo.100"]', el => el.textContent);
    // } catch (error) {
    //   console.log({error});
    //   const temp = await page.$eval('a[href="/login"] > div', el => el)

    //   console.log(temp);

    //   // const [loginButton] = await page.$x(`//a[contains(@class,'')]]`)
    //   // loginButton.click();
    // }

    // await browser.close();
  }

  private async botLogin(
    page: Page,
    values: {username: string; password: string},
  ): Promise<void> {
    const {username, password} = values;
    await page.type('input[name="username"]', username, {delay: 50});
    await page.type('input[name="password"]', password, {delay: 50});

    const loginButtonSelector = 'input[value="Log in"]';

    await page.waitForSelector(loginButtonSelector);

    await page.evaluate(
      selector => document.querySelector(selector).click(),
      loginButtonSelector,
    );

    await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  }

  private async chooseCategory(page: Page): Promise<void> {
    const bacaratSelector = 'a[href="/entry?category=baccarat"]';

    await page.waitForSelector(bacaratSelector);

    await page.evaluate(
      selector => document.querySelector(selector).click(),
      bacaratSelector,
    );

    await page.waitForNavigation({waitUntil: 'domcontentloaded'});

    const speedBacaratSelector = 'div[data-tableid="leqhceumaq6qfoug"] > div';

    await page.waitForSelector(speedBacaratSelector);

    await page.evaluate(
      selector => document.querySelector(selector).click(),
      speedBacaratSelector,
    );

    await page.waitForNavigation({waitUntil: 'domcontentloaded'});

    const viewButtonSelector = 'button[data-role="video-button"]';

    await page.waitForSelector(viewButtonSelector);

    await page.waitForTimeout(3000);

    await page.click(viewButtonSelector);
  }

  private async bet(
    betAmount: number,
    level: number[],
    page: Page,
    betTarget: string,
  ): Promise<void> {
    let amount = betAmount;
    const oldLevelValue = 0;
    for (let i = level.length - 1; i >= 0; i--) {
      while (amount >= level[i]) {
        amount -= level[i];
        if (oldLevelValue !== level[i]) {
          await page.click(`div[data-value="${level[i]}"]`);
        }
        await page.click(`div[data-role="${betTarget}"]`);
      }
    }
  }

  private async stop(
    page: Page,
    browser: Browser,
    interval: NodeJS.Timer,
  ): Promise<void> {
    clearInterval(interval);
    await page.close();
    await browser.close();
  }

  private async deactivateBot(
    values: {
      accountId: number;
    },
    page: Page,
    browser: Browser,
    interval: NodeJS.Timer,
  ): Promise<void> {
    const acc = await this.accountRepository.findById(values.accountId);
    if (acc.botStatus === BotStatus.DEACTIVATE) {
      await this.stop(page, browser, interval);
    }
  }

  // private async undoBet(
  //   betAmount: number,
  //   level: number[],
  //   page: Page,
  // ): Promise<void> {
  //   await page.waitForSelector('button[data-role="undo-button"]')
  //   let amount = betAmount;
  //   for (let i = level.length - 1; i >= 0; i--) {
  //     while (amount >= level[i]) {
  //       amount -= level[i];
  //       await page.click('button[data-role="undo-button"]');
  //     }
  //   }
  // }
}
