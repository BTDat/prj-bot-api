import {bind} from '@loopback/context';

import puppeteer from 'puppeteer';
import isNull from 'lodash/isNull';
import {HttpErrors} from '@loopback/rest';
import {BotRequestBody} from '../../domain/models/bot.model';
import {Account} from '../../domain/models/account.model';
import {repository} from '@loopback/repository';
import {service} from '@loopback/core';
import {ReceiptRepository} from '../repositories';
import {ReceiptFactory} from '../../domain/services/receipt-factory.service';
import {Receipt} from '../../domain/models/receipt.model';
import {NodeMailerMailService} from './nodemailer.service';
import {AccountSendMailFactory} from '../../application/services/account-send-mail-factory.service';

@bind()
export class PuppeteerService {
  constructor(
    @repository(ReceiptRepository)
    private receiptRepository: ReceiptRepository,

    @service(ReceiptFactory)
    private receiptFactory: ReceiptFactory,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,
  ) {}

  public async run(values: BotRequestBody, account: Account): Promise<void> {
    const {betLevel, password, username} = values;
    const {profitRate, email} = account;
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      defaultViewport: null,
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

    for (;;) {
      if (data === 'PLACE YOUR BETS 12') {
        await page.click(`div[data-value="${betLevel}"]`);
        break;
      }
      data = await page.$eval(statusSelector, el => el.textContent);
    }

    let win: boolean | null = null;
    let tie = false;
    let bet = false;
    let numberOfConsecutiveLosses = 0;
    let maxNumberOfConsecutiveLosses = 0;
    const defaultBetAmount = 2;
    let betAmount: number = defaultBetAmount;
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

    const playCardInterval = setInterval(async () => {
      data = await page.$eval(statusSelector, el => el.textContent);
      if (!data) {
        throw new HttpErrors.BadRequest('error_status');
      }
      switch (data) {
        case 'PLAYER WINS': {
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
            if (parseFloat(currentBalance.replace(/,/g, '')) >= expectBalance) {
              clearInterval(playCardInterval);
              await this.createReceipt(email, {
                balance: curBalance,
                profit: curBalance - initialBalance,
                profitRate,
                accountId: account.id,
                numberOfConsecutiveLosses: maxNumberOfConsecutiveLosses - 1,
              } as Receipt);
            }
          } else {
            win = false;
          }
          tie = false;
          bet = false;
          break;
        }
        case 'BANKER WINS': {
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
              clearInterval(playCardInterval);
              await this.createReceipt(email, {
                balance: curBalance,
                profit: curBalance - initialBalance,
                profitRate,
                accountId: account.id,
                numberOfConsecutiveLosses: maxNumberOfConsecutiveLosses - 1,
              } as Receipt);
            }
          } else {
            win = false;
          }
          tie = false;
          bet = false;

          break;
        }
        case 'TIE': {
          tie = true;
          bet = false;
          break;
        }
        default: {
          if (data.includes('PLACE YOUR BET') && !bet) {
            bet = true;
            if (betPositon !== betObject.length - 1) {
              betPositon++;
            } else {
              betPositon = 0;
            }
            if (isNull(win) || win) {
              if (defaultBetAmount !== betAmount) {
                await page.click(`div[data-value="${betLevel}"]`);
                betAmount = defaultBetAmount;
              }
              await page.click(`div[data-role="${betObject[betPositon]}"]`);
              numberOfConsecutiveLosses = 0;
            } else {
              numberOfConsecutiveLosses++;
              if (numberOfConsecutiveLosses > maxNumberOfConsecutiveLosses)
                maxNumberOfConsecutiveLosses = numberOfConsecutiveLosses;
              if (!tie) {
                betAmount = betAmount * 2;
              }
              let temp = Math.floor(betAmount / 4);

              for (;;) {
                if (temp === 0) {
                  break;
                }
                await page.click(`div[data-role="${betObject[betPositon]}"]`);
                temp--;
              }
              await page.click('button[data-role="double-button"]');
            }
          }
          break;
        }
      }
    }, 1000);

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
    page: puppeteer.Page,
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

    await page.waitForNavigation();
  }

  private async chooseCategory(page: puppeteer.Page): Promise<void> {
    const bacaratSelector = 'a[href="/entry?category=baccarat"]';

    await page.waitForSelector(bacaratSelector);

    await page.evaluate(
      selector => document.querySelector(selector).click(),
      bacaratSelector,
    );

    await page.waitForNavigation();

    const speedBacaratSelector = 'div[data-tableid="leqhceumaq6qfoug"] > div';

    await page.waitForSelector(speedBacaratSelector);

    await page.evaluate(
      selector => document.querySelector(selector).click(),
      speedBacaratSelector,
    );

    await page.waitForNavigation();

    const viewButtonSelector = 'button[data-role="video-button"]';

    await page.waitForSelector(viewButtonSelector);

    await page.waitForTimeout(3000);

    await page.click(viewButtonSelector);
  }

  private async sendInvoiceEmail(
    recipient: string,
    receipt: Receipt,
  ): Promise<void> {
    const email = await this.accountSendMailFactory.buildInvoiceEmail(
      recipient,
      receipt,
    );
    await this.mailService.send(email);
  }

  private async createReceipt(
    recipient: string,
    receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const receiptBuilding = await this.receiptFactory.buildReceipt(receipt);
    const newReceipt = await this.receiptRepository.create(receiptBuilding);
    this.sendInvoiceEmail(recipient, newReceipt);
  }
}
