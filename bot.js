import ethers from "ethers";
import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import fetch from "node-fetch";
import quotes from "success-motivational-quotes";
import superheroes from "superheroes";
import supervillains from "supervillains";
import { Configuration, OpenAIApi } from "openai";
import open from "open";

dotenv.config();

import {
  notifUserWallet,
  buying,
  selling,
  successfulBuy,
  successfulSell,
  unableToSell,
  unableToBuy,
} from "./telegram.js";

//TELEGRAM
const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;
const group1 = process.env.GROUP_1;
const msTime = 5000;
let bot = new TelegramBot(token, { polling: true});

//AI GENERATON
const openAi_KEY = process.env.AI_API_KEY;

const configuration = new Configuration({
  apiKey: openAi_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateImage(prompt, id) {
  try {
    var groupChatId = id;
    try {
      return await openai.createImage({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
    } catch (error) {
      bot.sendMessage(groupChatId, "Unable to get image.");
    }
  } catch (error) {}
}

async function askQuestion(prompt, id) {
  try {
    var groupChatId = id;
    try {
      return await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt.trim(),
        max_tokens: 4000,
        temperature: 0,
      });
    } catch (erorr) {
      bot.sendMessage(groupChatId, "Unable to get answer.");
    }
  } catch (error) {}
}

async function loadAiBot(){
  console.log("\nLoading ai bot");
  bot.onText(/\/i (.+)/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      bot.sendMessage(groupChatId, "Your image is being generated. Please wait.");
      const response = await generateImage(match[1], groupChatId);
      
      bot.sendPhoto(groupChatId, response.data.data[0].url);
      
    } catch (error) {
      bot.sendMessage(groupChatId, "Unable to retrieve image.")
    }
  });

  bot.onText(/\/sh/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      bot.sendMessage(groupChatId, "Your image is being generated. Please wait.");
      var superhero = superheroes.random();
      const response = await generateImage(
        `A realistic cool image of a superhero named "${superhero}", image that looks like in real life`,
        groupChatId
      );
      
        bot.sendPhoto(groupChatId, response.data.data[0].url, {
          caption: superhero,
        });
    
    } catch (error) {
      bot.sendMessage(groupChatId, "Unable to retrieve image.")
    }
  });

  bot.onText(/\/sv/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      bot.sendMessage(groupChatId, "Your image is being generated. Please wait.");
      var supervillain = supervillains.random();
      const response = await generateImage(
        `A realistic cool image of an evil supervillain named "${supervillain}:, image that looks like in real life`,
        groupChatId
      );
   
        bot.sendPhoto(groupChatId, response.data.data[0].url, {
          caption: supervillain,
        });
      
    } catch (error) {
      bot.sendMessage(groupChatId, "Unable to retrieve image.")
    }
  });

  bot.onText(/\/ask (.+)/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      bot.sendMessage(groupChatId, "Getting answer. Please wait.");
      var response = await askQuestion(match[1], groupChatId);
      
      var answer = response.data.choices[0].text.trim();
     
      var msg = `${answer}`;

        if (response.data.choices[0].text.length != 0) {
          bot.sendMessage(groupChatId, msg);
        } else {
          bot.sendMessage(groupChatId, "Empty response.");
        }
     
    } catch (error) {}
  });

  bot.onText(/\/credits/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      var url = "https://api.openai.com/dashboard/billing/credit_grants";
      var loop = true;

      while (loop) {
        try {
          var response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${openAi_KEY}`,
            },
          });

          var json = await response.json();
          var info = await json;
          loop = false;
        } catch (error) {
          bot.sendMessage(groupChatId, "Unable to retrieve credit info.");
        }
      }
      var total_granted = info.total_granted;
      var total_used = info.total_used;
      var total_available = info.total_available;

      var time = new Date(info.grants.data[0].expires_at * 1000);
      var month = time.getMonth();
      var day = time.getDate();

      var msg = `Credit Summary:\n Total Granted: ${total_granted}\n Total Used: ${total_used}\n Total Available: ${total_available}\n Expiry: M:${
        month + 1
      } D:${day}`;

      bot.sendMessage(groupChatId, msg);
    } catch (error) {bot.sendMessage(groupChatId, "No credit info response.")}
  });

  bot.onText(/\/commands/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      var message = `
    ========================================
    ===

      COMMANDS:

      /ask (prompt) - ask any question and get answer
      /i (description) - get any image from based description
      /sh - random superhero picture
      /sv - random supervillain picture
      /q - random quote
      /credits - api credits summary
      
      ===========================================
    `;
      bot.sendMessage(groupChatId, message);
    } catch (error) {bot.sendMessage(groupChatId, "Unable to get commands info.")}
  });

  //MOTIVATIONAL QUOTES
  bot.onText(/\/q/, async (msg, match) => {
    try {
      var groupChatId = msg.chat.id;
      var quote = quotes.getTodaysQuote();
      var quoteMessage = quote.body;
      var by = quote.by;
      var msg = `"${quoteMessage}"\n- ${by}`;

      try {
        bot.sendMessage(groupChatId, msg);
      } catch (error) {}
    } catch (error) {bot.sendMessage(groupChatId, "Unable to get quote.")}
  });
}

//ADDRESSES
const wbnbAddress = process.env.WBNB_ADDRESS;
const pancakeswapAddress = process.env.PANCAKESWAP_ADDRESS;
const usdtAddress = process.env.USDT_ADDRESS;
const busdAddress = process.env.BUSD_ADDRESS;
const userAddress = process.env.USER_ADDRESS;
const factory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

//PROVIDER AND PRIVATEKEY
const privateKey = process.env.PRIVATE_KEY;
const providerURL = process.env.PROVIDER_URL;
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const wallet = new ethers.Wallet(privateKey, provider);
const bscAPI = process.env.BSC_API_KEY;

//CONTRACTS
const BEP20_ABI = [
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() pure returns (uint8)",
  "function approve(address spender, uint amount) public returns(bool)",
  "function symbol() external view returns (string memory)",
];

const pancakeswapContract = new ethers.Contract(
  pancakeswapAddress,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path,address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin,address[] calldata path, address to, uint deadline) external",
  ],
  wallet
);

const factoryContract = new ethers.Contract(
  factory,
  [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  ],
  wallet
);

const USDTContract = new ethers.Contract(usdtAddress, BEP20_ABI, wallet);
const BUSDContract = new ethers.Contract(busdAddress, BEP20_ABI, wallet);

//HONEYPOT CONTRACT AND ABI
const honeypot_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "address", name: "token", type: "address" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "base", type: "address" },
    ],
    name: "failedResponse",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isHoneyPot", type: "bool" },
          { internalType: "address", name: "base", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "estimatedBuy", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint256", name: "estimatedSell", type: "uint256" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyGas", type: "uint256" },
          { internalType: "uint256", name: "sellGas", type: "uint256" },
        ],
        internalType: "struct HoneyPotChecker.HoneyPot",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "router", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "router", type: "address" },
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "token", type: "address" },
    ],
    name: "isHoneyPot",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "isHoneyPot", type: "bool" },
          { internalType: "address", name: "base", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "estimatedBuy", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint256", name: "estimatedSell", type: "uint256" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyGas", type: "uint256" },
          { internalType: "uint256", name: "sellGas", type: "uint256" },
        ],
        internalType: "struct HoneyPotChecker.HoneyPot",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "router", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "swap",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "swapBase",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
];

const honeyPotChecker = "0x77Dd873ad58418c40974016EbB792D2c20A1ABCA";
const honeyPotContractChecker = new ethers.Contract(
  honeyPotChecker,
  honeypot_ABI,
  wallet
);

//ARRAYS FOR COIN DESCRIPTIONS
const walletNamesArr = [];
const walletBalanceArr = [];
const walletAddressesArr = [];
const walletDecimalsArr = [];
const amountBoughtArr = [];
const liquidityUsedArr = [];
const telegramPercentages = [];
const upperPercentArr = [];
const lowerPercentArr = [];
const buyTaxArr = [];
const sellTaxArr = [];
const profitPerCoinArr = [];
const coinURL = []
let profit = 0;

//BOT CONFIGURATIONS
const receiver = process.env.MY_ACCOUNT_ADDRESS;
let wbnbAmount = 0.03;
let usdtAmount;
const buySlippage = process.env.BUY_SLIPPAGE;
const sellSlippage = process.env.SELL_SLIPPAGE;
const gasLimit = process.env.GAS_LIMIT;
const gasPrice = new ethers.utils.parseUnits(
  process.env.GAS_PRICE.toString(),
  "gwei"
);
const limitCoins = parseFloat(process.env.LIMIT_COINS);
let percentToSellUpper = 0;
let percentToSellLower = 0;

let inTransaction = false;
let removeInProgress = false;
let insideBuy = false;
let insideSell = false;
let stop = false;
let sell = false;

//FUNCTIONS
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getNonce() {
  var loop_getNonce = true;

  while(loop_getNonce){
    try {
    var nonce = await provider.getTransactionCount(receiver);
    loop_getNonce = false;

    return nonce;
    } catch (error) {
      console.log(`Error in getNonce`);
    }
  }
}

async function readJson(path, callback) {
  fs.readFile(path, "utf-8", (error, data) => {
    if (error) {
      return callback(error);
    } else {
      try {
        var store = JSON.parse(data);
        return callback(null, store);
      } catch (err) {
        return callback(err);
      }
    }
  });
}

async function insertToOurWallet(
  name,
  balance,
  address,
  decimal,
  amountbought,
  liquidity,
  upper,
  lower,
  url
) {
  try {
    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          walletNamesArr.push(name);
          walletBalanceArr.push(balance);
          walletAddressesArr.push(address);
          walletDecimalsArr.push(decimal);
          amountBoughtArr.push(parseFloat(amountbought));
          liquidityUsedArr.push(liquidity);
          upperPercentArr.push(upper);
          lowerPercentArr.push(lower);
          profitPerCoinArr.push(0);
          coinURL.push(url);

          data.wallet.name.push(name);
          data.wallet.balance.push(balance);
          data.wallet.address.push(address);
          data.wallet.decimal.push(decimal);
          data.wallet.amountbought.push(amountbought);
          data.wallet.liquidityused.push(liquidity);
          data.wallet.upper.push(upper);
          data.wallet.lower.push(lower);
          data.wallet.profitpercoin.push(0);
          data.wallet.coinurl.push(url)

          fs.writeFile(
            "/home/leeharuto86/TrailStopLossBot/wallet.json",
            JSON.stringify(data, null, 2),
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(`\nSuccessfully added "${name}" to Json Wallet.`);
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(`Error in insertToOurWallet`);
  }
}

async function removeFromOurWallet(name, profit, address) {
  try {
    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          for (var i = 0; i < walletNamesArr.length; i++) {
            if (walletNamesArr[i] == name) {
              walletNamesArr.splice(i, 1);
              walletBalanceArr.splice(i, 1);
              walletAddressesArr.splice(i, 1);
              walletDecimalsArr.splice(i, 1);
              amountBoughtArr.splice(i, 1);
              liquidityUsedArr.splice(i, 1);
              upperPercentArr.splice(i, 1);
              lowerPercentArr.splice(i, 1);
              profitPerCoinArr.splice(i, 1);
              coinURL.splice(i, 1);

              data.wallet.name.splice(i, 1);
              data.wallet.balance.splice(i, 1);
              data.wallet.address.splice(i, 1);
              data.wallet.decimal.splice(i, 1);
              data.wallet.amountbought.splice(i, 1);
              data.wallet.liquidityused.splice(i, 1);
              data.wallet.upper.splice(i, 1);
              data.wallet.lower.splice(i, 1);
              data.wallet.profitpercoin.splice(i, 1);
              data.wallet.coinurl.splice(i, 1);
            }
          }

          data.wallet.profit = parseFloat(profit);

          fs.writeFile(
            "/home/leeharuto86/TrailStopLossBot/wallet.json",
            JSON.stringify(data, null, 2),
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  `\nSuccessfully removed "${name}" from Json Wallet.`
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(`Error in RemoveFromOurWallet`);
  }
}

async function changeBalance(name, balance, newAmount) {
  try {
    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          var previousAmountBought = parseFloat(data.wallet.amountbought);

          var totalAmount = (
            previousAmountBought + parseFloat(newAmount)
          ).toString();

          for (var i = 0; i < walletNamesArr.length; i++) {
            if (name == walletNamesArr[i]) {
              walletBalanceArr[i] = balance;
              amountBoughtArr[i] = totalAmount;

              data.wallet.balance[i] = balance;
              data.wallet.amountbought[i] = totalAmount;
            }
          }

          fs.writeFile(
            "/home/leeharuto86/TrailStopLossBot/wallet.json",
            JSON.stringify(data, null, 2),
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  "Successfully changed the existing balance of the coin"
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(`Error in changeBalance function`);
  }
}

async function halfBalance(name, newAmount, profitwbnb, profit) {
  try {
    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          for (var i = 0; i < walletNamesArr.length; i++) {
            if (name == walletNamesArr[i]) {
              walletBalanceArr[i] = newAmount;
              data.wallet.balance[i] = newAmount;

              var totalProfit = parseFloat(profitPerCoinArr[i]) + parseFloat(profitwbnb);
              profitPerCoinArr[i] = totalProfit;
              data.wallet.profitpercoin[i] = totalProfit;
            }
          }

          data.wallet.profit = parseFloat(profit);

          fs.writeFile(
            "/home/leeharuto86/TrailStopLossBot/wallet.json",
            JSON.stringify(data, null, 2),
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  "Successfully change the balance of the coin to 1/3"
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(`Error in halfBalance function`);
  }
}

async function remove(name) {
  try {
    var arrayName = name;

    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          for (let i = 0; i < walletNamesArr.length; i++) {
            if (arrayName.trim() == walletNamesArr[i].trim()) {
              removeInProgress = true;
              walletNamesArr.splice(i, 1);
              walletBalanceArr.splice(i, 1);
              walletAddressesArr.splice(i, 1);
              walletDecimalsArr.splice(i, 1);
              amountBoughtArr.splice(i, 1);
              liquidityUsedArr.splice(i, 1);
              upperPercentArr.splice(i, 1);
              lowerPercentArr.splice(i, 1);
              profitPerCoinArr.splice(i, 1);
              coinURL.splice(i, 1);

              data.wallet.name.splice(i, 1);
              data.wallet.balance.splice(i, 1);
              data.wallet.address.splice(i, 1);
              data.wallet.decimal.splice(i, 1);
              data.wallet.amountbought.splice(i, 1);
              data.wallet.liquidityused.splice(i, 1);
              data.wallet.upper.splice(i, 1);
              data.wallet.lower.splice(i, 1);
              data.wallet.profitpercoin.splice(i, 1);
              data.wallet.coinurl.splice(i, 1);

              var message = `You have removed: "${arrayName}" (WALLET DISPLAY)`;

              bot.sendMessage(chatId, message);
            }
          }

          fs.writeFile(
            "/home/leeharuto86/TrailStopLossBot/wallet.json",
            JSON.stringify(data, null, 2),
            (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log(`\nRemoved "${arrayName}" from wallet display.`);
                removeInProgress = false;
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(`Error in remove`);
  }
}

async function updateAll() {
  try {
    readJson(
      "/home/leeharuto86/TrailStopLossBot/wallet.json",
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          if (data.wallet.name.length >= 1) {
            for (var i = 0; i < data.wallet.name.length; i++) {
              walletNamesArr.push(data.wallet.name[i]);
              walletBalanceArr.push(data.wallet.balance[i]);
              walletAddressesArr.push(data.wallet.address[i]);
              walletDecimalsArr.push(data.wallet.decimal[i]);
              amountBoughtArr.push(data.wallet.amountbought[i]);
              liquidityUsedArr.push(data.wallet.liquidityused[i]);
              upperPercentArr.push(data.wallet.upper[i]);
              lowerPercentArr.push(data.wallet.lower[i]);
              profitPerCoinArr.push(data.wallet.profitpercoin[i]);
              coinURL.push(data.wallet.coinurl[i]);
            }

            console.log("Updated values from wallet.json");
          } else {
            console.log("\nScanning wallet... Empty wallet.\n");
          }
          wbnbAmount = data.howmuch;
          usdtAmount = wbnbAmount * 300;
          percentToSellUpper = data.upperpercent;
          percentToSellLower = data.lowerpercent;
          profit = parseFloat(data.wallet.profit);
          stop = data.stop;
          sell = data.sell;
        }
      }
    );
  } catch (error) {
    console.log("Error in UpdateAll");
  }
}

async function checkBalance(){
  
      for(var i = 0; i < walletBalanceArr.length; i++){

        var address = walletAddressesArr[i];
        var balanceToCompare = walletBalanceArr[i];
        var tokenContract;
        var tokenBalanceOfUser;
        var contractName;
        var loop_getBalance = true;

        while(loop_getBalance){
          try {
             tokenContract = new ethers.Contract(address, BEP20_ABI, wallet);
             contractName = await tokenContract.name();
             tokenBalanceOfUser = await tokenContract.balanceOf(receiver);
             loop_getBalance = false;
          } catch (error) {
            console.log("Error in loop_getBalance in checkBalance function")
          }
        }

        var balance1 = ethers.utils.formatUnits(tokenBalanceOfUser, 18);
        var balance2 = ethers.utils.formatUnits(balanceToCompare, 18);

        if(balance1 != balance2 && balance1 != 0){
            try {
              readJson(
                "/home/leeharuto86/TrailStopLossBot/wallet.json",
                (error, data) => {
                  if (error) {
                    console.log(error);
                  } else {
                    walletBalanceArr[arrayNo] = tokenBalanceOfUser;
                    data.wallet.balance[arrayNo] = tokenBalanceOfUser;

                    fs.writeFile(
                      "/home/leeharuto86/TrailStopLossBot/wallet.json",
                      JSON.stringify(data, null, 2),
                      (err) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log(`Change new balance of ${contractName}`)
                        }
                      }
                    );
                  }
                }
              );
              
            } catch (error) {
              console.log(`Error in check balance`);
            }
          } else if (balance1 == 0){
            await remove(contractName);
          }
      }
}

async function buyToken(address, pair, autotrading) {
  try {
    var auto = autotrading;
    var pairToken = pair;
    var tokenIn;
    var tokenOut = address;
    var buyOnce = false;
    var continueBuying = false;
    var tokenContract;
    var contractName;
    var decimal;
    var amountToBuy;
    var loop_getAmount = true;
    var alreadyBought = false;
    var noCoinInfo = false;
    var loop_honeypot = true;
    var isHoneypot = false;
    var buyTax = 0;
    var sellTax = 0;
    var url= `https://poocoin.app/tokens/${tokenOut}`;

    switch (pairToken) {
      case "bnb":
        tokenIn = wbnbAddress;
        amountToBuy = wbnbAmount;
        break;
      case "usdt":
        tokenIn = usdtAddress;
        amountToBuy = usdtAmount;
        break;
    }

    try {
      tokenContract = new ethers.Contract(tokenOut, BEP20_ABI, wallet);
      contractName = await tokenContract.name();
      decimal = await tokenContract.decimals();
    } catch (error) {
      noCoinInfo = true;
      console.log("\nError In getting contract info. buyToken function");
    }

    if (auto == true) {
      for (var i = 0; i < walletNamesArr.length; i++) {
        if (contractName == walletNamesArr[i]) {
          buyOnce = true;
        }
      }
    }

    while (loop_honeypot) {
      try {
        var RESPONSE = await honeyPotContractChecker.callStatic.isHoneyPot(
          pancakeswapAddress,
          tokenIn,
          tokenOut,
          {
            value: ethers.utils.parseUnits(amountToBuy.toString(), 18),
          }
        );
        isHoneypot = RESPONSE.isHoneyPot;

        buyTax = Math.round(
          ((parseInt(RESPONSE.estimatedBuy) - parseInt(RESPONSE.buyAmount)) /
            parseInt(RESPONSE.estimatedBuy)) *
            100
        );
        sellTax = Math.round(
          ((parseInt(RESPONSE.estimatedSell) - parseInt(RESPONSE.sellAmount)) /
            parseInt(RESPONSE.estimatedSell)) *
            100
        );

        loop_honeypot = false;
      } catch (error) {}
    }

    // if (isHoneypot == true) {
    //   try {
    //     bot.sendMessage(chatId, "User bought a Honeypot token");
    //   } catch (error) {}
    // } else if (sellTax > 15) {
    //   try {
    //     bot.sendMessage(chatId, "Sell Tax is too high.");
    //   } catch (error) {}
    // } else if (buyTax > 15) {
    //   try {
    //     bot.sendMessage(chatId, "Buy Tax is too high.");
    //   } catch (error) {}
    // }
    // &&
    //   sellTax <= 15 &&
    //   buyTax <= 15
    if(isHoneypot == true){
      try{
        bot.sendMessage(chatId, "This is a honeypot token.")
      }catch(err){}
    }

    insideBuy = false;

    if (
      inTransaction == false &&
      isHoneypot == false &&
      noCoinInfo == false &&
      walletNamesArr.length < limitCoins &&
      buyOnce == false
    ) {
      console.log(`BUYING "${contractName}" . PLEASE WAIT`);
      buying(contractName, bot);
      inTransaction = true;
      try {
        var amountIn = ethers.utils.parseUnits(amountToBuy.toString(), "ether");
        var amounts = await pancakeswapContract.getAmountsOut(amountIn, [
          tokenIn,
          tokenOut,
        ]);
        var amountOutMin = amounts[1].sub(amounts[1].div(buySlippage));
      } catch (err) {
        console.log(`${err.name}: ${err.message}`);
        console.log(`Error in getamountsout, buyToken function`);
      }

      if (tokenIn == wbnbAddress) {
        try {
          var tx = await pancakeswapContract.swapExactETHForTokens(
            amountOutMin,
            [tokenIn, tokenOut],
            receiver,
            Date.now() + 1000 * 60 * 1,
            {
              gasLimit: gasLimit,
              gasPrice: gasPrice,
              nonce: await getNonce(),
              value: amountIn,
            }
          );
          const receipt = await tx.wait();
          console.log("Transaction receipt");
          console.log(receipt);
          continueBuying = true;
        } catch (err) {
          console.log(err);
          unableToBuy(contractName, bot);
          insideBuy = false;
          inTransaction = false;
        }
      }

      if (tokenIn == usdtAddress) {
        try {
          await USDTContract.approve(pancakeswapAddress, amountIn, {
            gasLimit,
            gasPrice,
            nonce: await getNonce(),
          });

          console.log("\nApproved Done");
          await sleep(8000);

          let tx =
            await pancakeswapContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
              amountIn,
              amountOutMin,
              [tokenIn, tokenOut],
              receiver,
              Date.now() + 1000 * 60 * 1, //1 minute
              {
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                nonce: await getNonce(),
              }
            );
          const receipt = await tx.wait();
          console.log("Transaction receipt");
          console.log(receipt);
          continueBuying = true;
        } catch (err) {
          console.log(err);
          unableToBuy(contractName, bot);
          inTransaction = false;
        }
      }

      if (continueBuying == true) {
        await sleep(5000);
        var amountTokenBought;

        while (loop_getAmount) {
          try {
            amountTokenBought = await tokenContract.balanceOf(receiver);
            loop_getAmount = false;
          } catch (error) {
            console.log("\nGetting token amount again...");
          }
        }

        console.log(
          `\nSwapping ${amountToBuy} ${pairToken.toUpperCase()} for ${ethers.utils.formatUnits(
            amountTokenBought,
            decimal
          )} ${contractName}`
        );

        for (var i = 0; i < walletNamesArr.length; i++) {
          if (contractName == walletNamesArr[i]) {
            alreadyBought = true;
          }
        }

        if (alreadyBought == true) {
          await changeBalance(contractName, amountTokenBought, amountToBuy);
        }

        if (alreadyBought == false) {
          await insertToOurWallet(
            contractName,
            amountTokenBought,
            tokenOut,
            decimal,
            amountToBuy,
            tokenIn,
            percentToSellUpper,
            percentToSellLower,
            url
          );
        }

        if (auto == true) {
          await open(url);
        }

        successfulBuy(contractName, bot);
        await sleep(5000);
        inTransaction = false;
        insideBuy = false;
      }
    }
  } catch (error) {
    console.log(`Error in buyToken`);
  }
}

async function sellToken(address) {
  try {
    var tokenIn;
    var tokenOut = address;
    var allowSell = false;
    var continueSelling = false;
    var walletBalance = 0;
    var amountBought = 0;
    var tokenContract;
    var contractName;
    var decimal;
    var symbol;
    var loopdetails = true;

    while (loopdetails) {
      try {
        tokenContract = new ethers.Contract(tokenOut, BEP20_ABI, wallet);
        contractName = await tokenContract.name();
        decimal = await tokenContract.decimals();
        loopdetails = false;
      } catch (error) {
        console.log("\nError In getting contract info, sellToken function");
      }
    }

    for (var i = 0; i < walletNamesArr.length; i++) {
      if (contractName == walletNamesArr[i]) {
        allowSell = true;
      }
    }

    insideSell = false;

    if (inTransaction == false && allowSell == true) {
      console.log(`\nSELLING "${contractName}". PLEASE WAIT`);
      inTransaction = true;
      try {
        for (var i = 0; i < walletNamesArr.length; i++) {
          if (contractName == walletNamesArr[i]) {
            walletBalance = walletBalanceArr[i];
            amountBought = amountBoughtArr[i];
            tokenIn = liquidityUsedArr[i];
          }
        }
      } catch (err) {
        console.log(err);
        console.log("Error in getting walletbalance");
      }

      try {
        var amountIn = walletBalance;
        var amounts = await pancakeswapContract.getAmountsOut(amountIn, [
          tokenOut,
          tokenIn,
        ]);
        var amountOutMin = amounts[1].sub(amounts[1].div(sellSlippage));
      } catch (err) {
        console.log(err);
        console.log("Error in getsamountout. sellToken function");
      }

      if (tokenIn == wbnbAddress) {
        var loopApprove = true;

        while (loopApprove) {
          try {
            symbol = "BNB";
            await tokenContract.approve(pancakeswapAddress, amountIn, {
              gasLimit,
              gasPrice,
              nonce: await getNonce(),
            });
            console.log("\nApproved Done");
            loopApprove = false;
          } catch (error) {
            console.log("Sell token approve error");
          }
        }

          try {
            selling(contractName, bot);
            await sleep(8000);
            var nonce = await getNonce();
            var tx =
              await pancakeswapContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [tokenOut, tokenIn],
                receiver,
                Date.now() + 1000 * 60 * 1, //1 minutes
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: nonce,
                }
              );
            const receipt = await tx.wait();
            console.log("Transaction receipt");
            console.log(receipt);
            continueSelling = true;
          } catch (err) {
            console.log(err);
            console.log(`\nUNABLE TO SELL ${contractName}...`);
            unableToSell(contractName, bot);
            inTransaction = false;
            insideSell = false;
            
          }
        
      }

      if (tokenIn == usdtAddress) {
        var loopApprove = true;

        while (loopApprove) {
          try {
            symbol = "USDT";
            await tokenContract.approve(pancakeswapAddress, amountIn, {
              gasLimit,
              gasPrice,
              nonce: await getNonce(),
            });
            console.log("\nApproved Done");

            loopApprove = false;
          } catch (error) {
            console.log("Sell token approve error");
          }
        }

          try {
            selling(contractName, bot);
            await sleep(8000);
            var nonce = await getNonce();
            let tx =
              await pancakeswapContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [tokenOut, tokenIn],
                receiver,
                Date.now() + 1000 * 60 * 1, //1 minutes
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: nonce,
                }
              );
            const receipt = await tx.wait();
            console.log("Transaction receipt");
            console.log(receipt);
            continueSelling = true;
          } catch (err) {
            console.log(err);
            console.log(`\nUNABLE TO SELL ${contractName}...`);
            unableToSell(contractName, bot);
            inTransaction = false;
            insideSell = false;
            
          }
        
      }

      if (continueSelling == true) {
        console.log(
          `\nThis is the balance you hold: ${ethers.utils.formatUnits(
            walletBalance,
            decimal
          )} ${contractName}`
        );
        console.log(
          `Swapping ${contractName} for ${ethers.utils.formatUnits(
            amounts[1],
            18
          )} ${symbol}`
        );
        console.log(
          `Previous transaction is: ${amountBought} ${symbol}. Percentage for selling is ${Number(
            ((ethers.utils.formatUnits(amounts[1], 18) - amountBought) /
              amountBought) *
              100
          ).toFixed(2)} %`
        );

        //PROFIT
        profit =
          profit +
          ((ethers.utils.formatUnits(amounts[1], 18) - amountBought) /
            amountBought) *
            100;

        await removeFromOurWallet(contractName, profit, tokenOut);
        successfulSell(contractName, bot);
        inTransaction = false;
        insideSell = false;
      }
    }
  } catch (error) {
    console.log(`Error in sellToken`);
  }
}

async function sellHalfToken(address) {
  try {
    var tokenIn;
    var tokenOut = address;
    var allowSell = false;
    var continueSelling = false;
    var walletBalance = 0;
    var amountBought = 0;
    var tokenContract;
    var contractName;
    var decimal;
    var symbol;
    var loopdetails = true;
    var originalBalance = 0;
    var loop_getAmount = true;

    while (loopdetails) {
      try {
        tokenContract = new ethers.Contract(tokenOut, BEP20_ABI, wallet);
        contractName = await tokenContract.name();
        decimal = await tokenContract.decimals();
        loopdetails = false;
      } catch (error) {
        console.log("\nError In getting contract info, sellToken function");
      }
    }

    for (var i = 0; i < walletNamesArr.length; i++) {
      if (contractName == walletNamesArr[i]) {
        allowSell = true;
      }
    }

    insideSell = false;

    if (inTransaction == false && allowSell == true) {
      console.log(`\nSELLING 1/3 OF "${contractName}". PLEASE WAIT`);
      inTransaction = true;
      try {
        for (var i = 0; i < walletNamesArr.length; i++) {
          if (contractName == walletNamesArr[i]) {
            originalBalance = walletBalanceArr[i];
            var balance = ethers.utils.formatUnits(
              walletBalanceArr[i],
              walletDecimalsArr[i]
            );
            console.log(balance);
            var balance2 = (balance / 3).toFixed(walletDecimalsArr[i]);
            walletBalance = ethers.utils.parseUnits(
              balance2.toString(),
              walletDecimalsArr[i]
            );
            console.log(balance2)
            amountBought = amountBoughtArr[i];
            tokenIn = liquidityUsedArr[i];
          }
        }
      } catch (err) {
        console.log(err);
        console.log("Error in getting walletbalance");
      }

      try {
        var amountIn = walletBalance;
        var amounts = await pancakeswapContract.getAmountsOut(amountIn, [
          tokenOut,
          tokenIn,
        ]);
        var amountOutMin = amounts[1].sub(amounts[1].div(sellSlippage));
      } catch (err) {
        console.log(err);
        console.log("Error in getsamountout. sellToken function");
      }

      if (tokenIn == wbnbAddress) {
        var loopApprove = true;

        while (loopApprove) {
          try {
            symbol = "BNB";
            await tokenContract.approve(pancakeswapAddress, amountIn, {
              gasLimit,
              gasPrice,
              nonce: await getNonce(),
            });
            console.log("\nApproved Done");
            loopApprove = false;
          } catch (error) {
            console.log("Sell token approve error");
          }
        }

        
          try {
            selling(contractName, bot);
            await sleep(8000);
            var nonce = await getNonce();
            var tx =
              await pancakeswapContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                [tokenOut, tokenIn],
                receiver,
                Date.now() + 1000 * 60 * 1, //1 minutes
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: nonce,
                }
              );
            const receipt = await tx.wait();
            console.log("Transaction receipt");
            console.log(receipt);
            continueSelling = true;
           
          } catch (err) {
            console.log(err);
            console.log(`\nUNABLE TO SELL ${contractName}...`);
            unableToSell(contractName, bot);
           
            inTransaction = false;
            insideSell = false;
            
          }
        
      }

      if (tokenIn == usdtAddress) {
        var loopApprove = true;

        while (loopApprove) {
          try {
            symbol = "USDT";
            await tokenContract.approve(pancakeswapAddress, amountIn, {
              gasLimit,
              gasPrice,
              nonce: await getNonce(),
            });
            console.log("\nApproved Done");

            loopApprove = false;
          } catch (error) {
            console.log("Sell token approve error");
          }
        }

          try {
            selling(contractName, bot);
            await sleep(8000);
            var nonce = await getNonce();
            let tx =
              await pancakeswapContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                amountOutMin,
                [tokenOut, tokenIn],
                receiver,
                Date.now() + 1000 * 60 * 1, //1 minutes
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: nonce,
                }
              );
            const receipt = await tx.wait();
            console.log("Transaction receipt");
            console.log(receipt);
            continueSelling = true;
            
          } catch (err) {
            console.log(err);
            console.log(`\nUNABLE TO SELL ${contractName}...`);
            unableToSell(contractName, bot);
            
            inTransaction = false;
            insideSell = false;
            
          }
        }
      

      if (continueSelling == true) {
        await sleep(5000);
        var newTokenAmount;

        while (loop_getAmount) {
          try {
            newTokenAmount = await tokenContract.balanceOf(receiver);
            loop_getAmount = false;
          } catch (error) {
            console.log("\nGetting new token amount again...");
          }
        }

        console.log(
          `\nThis is the balance you hold: ${ethers.utils.formatUnits(
            originalBalance,
            decimal
          )} ${contractName}`
        );
        console.log(
          `Swapping ${contractName} for ${ethers.utils.formatUnits(
            amounts[1],
            18
          )} ${symbol}`
        );
        console.log(
          `Previous transaction is: ${amountBought} ${symbol}. Percentage for selling is ${Math.abs(Number(
            ((ethers.utils.formatUnits(amounts[1], 18) - amountBought) /
              amountBought) *
              100
          ).toFixed(2))} %`
        );
        //PROFIT IN WBNB
        var profitwbnb = Number(ethers.utils.formatUnits(
            amounts[1],
            18
          )).toFixed(3);

        //PROFIT
        profit =
          profit +
          Math.abs(((ethers.utils.formatUnits(amounts[1], 18) - amountBought) /
            amountBought) *
            100);

        await halfBalance(contractName, newTokenAmount, profitwbnb, profit);

        try {
          bot.sendMessage(
            chatId,
            `Successfully sold 1/3 tokens of ${contractName}`
          );
        } catch (error) {}

        inTransaction = false;
        insideSell = false;
      }
    }
  } catch (error) {
    console.log(`Error in sellHafToken`);
  }
}

async function loadingCryptoBot(){

  console.log("Loading crypto bot")

  bot.onText(/\/buy (.+) (.+)/, async (msg, match) => {
    try {
      var toBuyAddress = match[1];
      var pairToken = match[2];
      var autotrading = false;

      if (inTransaction == false && pairToken) {
        if (pairToken == "bnb" || pairToken == "usdt") {
          await buyToken(toBuyAddress, pairToken, autotrading);
        }
      }
    } catch (error) {
      console.log(`Error in bot /buy`);
    }
  });

  bot.onText(/\/sell (.+)/, async (msg, match) => {
    try {
      var nameOfCoin = match[1];
      var addressOfCoin;

      for (var i = 0; i < walletNamesArr.length; i++) {
        if (nameOfCoin.trim() == walletNamesArr[i].trim()) {
          addressOfCoin = walletAddressesArr[i];
           if (inTransaction == false) {
             await sellToken(addressOfCoin);
          }
        }
      }

     
    } catch (error) {
      console.log(`Error in bot /sell`);
    }
  });

  bot.onText(/\/half (.+)/, async (msg, match) => {
    try {
      var nameOfCoin = match[1];
      var addressOfCoin;

      for (var i = 0; i < walletNamesArr.length; i++) {
        if (nameOfCoin.trim() == walletNamesArr[i].trim()) {
          addressOfCoin = walletAddressesArr[i];
          if (inTransaction == false) {
           await sellHalfToken(addressOfCoin);
          }
        }
      }

      
    } catch (error) {
      console.log(`Error in bot /half`);
    }
  });

  bot.onText(/\/stat/, async (msg) => {
    try {
      try {
            bot.sendMessage(
              chatId,
              `Getting bot information. Please wait.`
            );
          } catch (error) {console.log(error.name)}

      const BNB = await provider.getBalance(receiver);
      const USDT = await USDTContract.balanceOf(receiver);
      const BUSD = await BUSDContract.balanceOf(receiver);
      const userBNB = await provider.getBalance(userAddress);
      var message = `
      YOUR BOT SETTINGS:

      WBNB per transactions: ${wbnbAmount} WBNB 
      USDT per transactions: ${usdtAmount} USDT
      Percent to sell (Upper Limit): ${percentToSellUpper}%
      Percent to sell (Lower Limit): ${percentToSellLower}%
      Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei
      Gas Limit: ${gasLimit}
      Buy slippage: ${buySlippage}%
      Sell slippage: ${sellSlippage}%
      Max Limit Buy Coins: ${limitCoins}
      Stop auto buy trading: ${stop}
      Stop auto sell trading: ${sell}

      User Address: ${userAddress}
      User BNB balance: ${Number(ethers.utils.formatUnits(userBNB, "18")).toFixed(
        5
      )} 
      
      Your Address: ${receiver}
      BNB balance: ${Number(ethers.utils.formatUnits(BNB, "18")).toFixed(5)} 
      USDT balance: ${Number(ethers.utils.formatUnits(USDT, "18")).toFixed(5)} 
      BUSD balance: ${Number(ethers.utils.formatUnits(BUSD, "18")).toFixed(5)} 
      
      PROFIT / DEFICIT: ${Number(parseFloat(profit)).toFixed(2)}%
    `;
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /stat`);
      try {
            bot.sendMessage(
              chatId,
              `Unable to get bot information.`
            );
          } catch (error) {}
    }
  });

  bot.onText(/\/remove (.+)/, async (msg, match) => {
    try {
      var arrayName = match[1];
      await remove(arrayName);
    } catch (error) {
      console.log(`Error in bot /remove`);
    }
  });

  bot.onText(/\/price (.+)/, async (msg, match) => {
    try {
      wbnbAmount = parseFloat(match[1]);
      usdtAmount = wbnbAmount * 300;
      var message = `Price of each transaction changed to ${wbnbAmount} BNB per shitcoin. Price of each transaction changed to ${usdtAmount} USDT per shitcoin.`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.howmuch = wbnbAmount;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`\nJson: Price changed to ${wbnbAmount}.`);
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /price`);
    }
  });

  bot.onText(/\/upper (.+)/, async (msg, match) => {
    try {
      var upperPercent = parseFloat(match[1]);
      percentToSellUpper = upperPercent;
      var message = `Upper sell percentage changed to ${upperPercent}%`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.upperpercent = upperPercent;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(
                    `\nJson: Upper sell percentage changed to ${upperPercent}.`
                  );
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /upper`);
    }
  });

  bot.onText(/\/lower (.+)/, async (msg, match) => {
    try {
      var lowerPercent = parseFloat(match[1]);
      percentToSellLower = lowerPercent;
      var message = `Lower sell percentage changed to ${lowerPercent}%`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.lowerpercent = lowerPercent;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(
                    `\nJson: Lower sell percentage changed to ${lowerPercent}}.`
                  );
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /lower`);
    }
  });

  bot.onText(/\/resumebuy/, async (msg, match) => {
    try {
      stop = false;

      var message = `Resume buy trading...`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.stop = false;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`\nJson: Resume buy trading...`);
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /resumebuy`);
    }
  });

  bot.onText(/\/stopbuy/, async (msg, match) => {
    try {
      stop = true;

      var message = `Stop buy trading...`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.stop = true;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`\nJson: Stop buy trading...`);
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /stopbuy`);
    }
  });

  bot.onText(/\/resumesell/, async (msg, match) => {
    try {
      sell = false;

      var message = `Resume sell trading...`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.sell = false;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`\nJson: Resume sell trading...`);
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (erro) {
      console.log(`Error in bot /resumesell`);
    }
  });

  bot.onText(/\/stopsell/, async (msg, match) => {
    try {
      sell = true;

      var message = `Stop sell trading...`;
      readJson(
        "/home/leeharuto86/TrailStopLossBot/wallet.json",
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            data.sell = true;
            fs.writeFile(
              "/home/leeharuto86/TrailStopLossBot/wallet.json",
              JSON.stringify(data, null, 2),
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`\nJson: Stop sell trading...`);
                }
              }
            );
          }
        }
      );
      bot.sendMessage(chatId, message, { disable_notification: true });
    } catch (error) {
      console.log(`Error in bot /stopsell`);
    }
  });

  bot.onText(/\/sample/, async (msg, match) => {

    var sampleBalance = 576518333320499
    var balance = ethers.utils.formatUnits(
              sampleBalance,
              9)
    console.log(balance);

    var balance2 = (balance / 3).toFixed(9);
    
    var walletBalance = ethers.utils.parseUnits(
              balance2.toString(),
              9
            );
            console.log(walletBalance)
  });

  bot.onText(/\/url/, async (msg, match) => {
    try {
      var msg = "";
      var no = 0;
      for(var i = 0 ; i < coinURL.length; i++){
        no++;
        msg += no + ". " + coinURL[i] +"\n"  ;
      }

      bot.sendMessage(chatId, msg);
    } catch (error) {
      console.log(`Error in bot /url`);
    }
  });
}

async function monitorCoins() {
  try {
    setInterval(async () => {
      if (inTransaction == false && removeInProgress == false) {
        console.log(
          `\n=============================================================`
        );
        console.log(`\nOUR WALLET AND BALANCE:`);
        if (walletNamesArr.length == 0) {
          console.log(`---> NO COINS YET <---\n`);
        } else {
          for (let i = 0; i < walletNamesArr.length; i++) {
            var amountIn;
            var amounts;
            var loop_getsamount = true;
            var buyTax = 0;
            var sellTax = 0;
            var loopTax = true;

            while (loop_getsamount) {
              try {
                amountIn = walletBalanceArr[i];
                amounts = await pancakeswapContract.getAmountsOut(amountIn, [
                  walletAddressesArr[i],
                  liquidityUsedArr[i],
                ]);
                loop_getsamount = false;
              } catch (err) {
                console.log("Error in getsamount, monitorcoins function");
              }
            }

            while (loopTax) {
              try {
                var RESPONSE =
                  await honeyPotContractChecker.callStatic.isHoneyPot(
                    pancakeswapAddress,
                    liquidityUsedArr[i],
                    walletAddressesArr[i],
                    {
                      value: ethers.utils.parseUnits(
                        amountBoughtArr[i].toString(),
                        18
                      ),
                    }
                  );

                buyTax = Math.round(
                  ((parseInt(RESPONSE.estimatedBuy) -
                    parseInt(RESPONSE.buyAmount)) /
                    parseInt(RESPONSE.estimatedBuy)) *
                    100
                );
                sellTax = Math.round(
                  ((parseInt(RESPONSE.estimatedSell) -
                    parseInt(RESPONSE.sellAmount)) /
                    parseInt(RESPONSE.estimatedSell)) *
                    100
                );

                buyTaxArr.push(Math.round(buyTax));
                sellTaxArr.push(Math.round(sellTax));
                loopTax = false;
              } catch (error) {}
            }

            var name = walletNamesArr[i];
            var address = walletAddressesArr[i];
            var compareBalance = walletBalanceArr[i];
            
            var balance = Number(
              ethers.utils.formatUnits(
                walletBalanceArr[i],
                walletDecimalsArr[i]
              )
            ).toFixed(2);

            var amountBought = amountBoughtArr[i];
            var profitPerCoinOwned = profitPerCoinArr[i];
            var percent = parseFloat(
              Number(
                ((ethers.utils.formatUnits(amounts[1], 18) -
                  amountBoughtArr[i]) /
                  amountBoughtArr[i]) *
                  100
              ).toFixed(2)
            );
            var upperPercent = upperPercentArr[i];
            var lowerPercent = lowerPercentArr[i];

            var totalUpperPercent = percent - sellTax;

            //DETAILS
            console.log(
              `${
                i + 1
              }. ${name} --> ${balance} --> SELL FOR: ${percent}% BT:${buyTax}% ST:${sellTax}%--> AMOUNT: ${amountBought}\n PROFIT: ${profitPerCoinOwned} / UP:${upperPercent}% LP:${lowerPercent}%`
            );

            if (telegramPercentages.length < walletNamesArr.length) {
              await sleep(500);
              telegramPercentages.push(percent);
            }

            if (totalUpperPercent > upperPercent && percent != Infinity && inTransaction == false && insideSell == false) {
              insideSell = true;
              await sellHalfToken(address);
            }
          }
        }

          notifUserWallet(
          walletNamesArr,
          telegramPercentages,
          amountBoughtArr,
          buyTaxArr,
          sellTaxArr,
          upperPercentArr,
          lowerPercentArr,
          profitPerCoinArr,
          bot
          );
      

        for (let i = 0; i < walletNamesArr.length; i++) {
          telegramPercentages.pop();
          buyTaxArr.pop();
          sellTaxArr.pop();
        }

        console.log(`\nPROFIT / DEFICIT: ${Number(profit).toFixed(2)}%`);
        console.log(
          `\n=============================================================`
        );

        await checkBalance();
      }
    }, 30000);
  } catch (error) {
    console.log("Error in monitorCoins");
  }
}

async function getTransactionOfUser() {
  setInterval(async () => {
    try {
      if (stop == false || sell == false) {
        var loop = true;
        var mydate = Date.now() - 1000 * 60 * 0.2; //12 seconds
        var time = Math.round(mydate / 1000);
        var nullAddress = "0x0000000000000000000000000000000000000000";
        var autotrading = true;

        while (loop) {
          try {
            var url = `https://api.bscscan.com/api?module=account&action=tokentx&address=${userAddress}&page=1&offset=2&startblock=0&endblock=999999999&sort=desc&apikey=${bscAPI}`;

            var response = await fetch(url);
            var json = await response.json();
            var info = json;
            loop = false;
          } catch (error) {}
        }
       
        try {
          for (var i = 0; i < info.result.length; i++) {
            if (time < info.result[i].timeStamp) {
              var contractAddress = info.result[i].contractAddress;

              //BUY TOKEN
              if (
                nullAddress != info.result[i].from &&
                userAddress.toLowerCase() == info.result[i].to &&
                inTransaction == false &&
                insideBuy == false &&
                stop == false
              ) {
                var wbnbAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
                var LP = await factoryContract.getPair(
                  contractAddress,
                  wbnbAddress
                );

                if (info.result[i].from.toLowerCase() == LP.toLowerCase()) {
                  insideBuy = true;
                  await buyToken(contractAddress, "bnb", autotrading);
                }
              }

              //SELLTOKEN
              if (
                userAddress.toLowerCase() == info.result[i].from &&
                inTransaction == false &&
                insideSell == false &&
                sell == false
              ) {
                insideSell = true;
                await sellToken(contractAddress);
              }
            }
          }
        } catch (error) {}
      }
    } catch (error) {
      console.log(`Error in getTransactionUser`);
    }
  }, 2000);
}

const main = async () => {
  await updateAll();
  await loadAiBot();
  await loadingCryptoBot()
  monitorCoins();
  getTransactionOfUser();

  setInterval(async () => {
  try{
    await bot.stopPolling();
    await bot.startPolling();
    }catch(err){
      console.log("Error in start and stop polling")}
  }, 20000)
}
  
main();
