const chatId = 5645016327;
const msTime = 5000;

async function notifUserWallet(
  shitCoinName,
  percent,
  amount,
  buytax,
  selltax,
  upperpercent,
  lowerpercent,
  profitinwbnb,
  bot
) {
  var walletInfo = "Our Coin Wallet:\n";
  var shitCoins = "";

  for (var i = 0; i < shitCoinName.length; i++) {
    shitCoins =
      shitCoins +
      "\n" +
      (i + 1) +
      ". " +
      shitCoinName[i] +
      " (" +
      percent[i] +
      "%)" +
      "\n Amount: " +
      amount[i] +
      " / Profit: " +
       profitinwbnb[i] +
      "\n Buy Tax: " +
      buytax[i] +
      "% /" +
      " Sell Tax: " +
      selltax[i] +
      "%" +
      "\n Upper percent to sell: " +
      upperpercent[i] +
      "%\n    ";
  }

  if (shitCoinName.length === 0) {
    shitCoins = "---NONE---";
  }

  var message = walletInfo + shitCoins;
  bot.sendMessage(chatId, message, { disable_notification: true });

  //set delay interval
  // await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function buying(name, bot) {
  const msTime = 5000;
  var msg = `Buying ${name}...`;

  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function selling(name, bot) {
  const msTime = 5000;
  var msg = `Selling ${name}...`;

  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function successfulBuy(name, bot) {
  const msTime = 5000;
  var msg = `Successfully bought ${name}...`;
  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function successfulSell(name, bot) {
  const msTime = 5000;
  var msg = `Successfully sold ${name}...`;

  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function unableToBuy(name, bot) {
  const msTime = 5000;
  var msg = `Unable to buy ${name}...`;

  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}

async function unableToSell(name, bot) {
  const msTime = 5000;
  var msg = `Unable to sell ${name}...`;

  bot.sendMessage(chatId, msg);
  //set delay interval
  await new Promise((resolve) => setTimeout(resolve, msTime));
}
export {
  notifUserWallet,
  buying,
  selling,
  successfulBuy,
  successfulSell,
  unableToSell,
  unableToBuy,
};
