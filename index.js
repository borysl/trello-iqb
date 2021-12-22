const ERRORS = {
  NO_ERROR: 0,
  CANT_PARSE_DOTENV: 1,
  SOME_ERROR: 99,
};

if (process.env.NODE_ENV !== 'production') {
  console.log('Loading env from local file in non-production environment.');
  const dotenvParse = require('dotenv').config();
  if (dotenvParse.error) {
    console.log(dotenvParse.error);
    process.exit(ERRORS.CANT_PARSE_DOTENV);
  }
}

var Trello = require('trello');
var trello = new Trello(process.env.APP_KEY, process.env.API_TOKEN);

trello.getListsOnBoard(process.env.BOARD_ID, null, (err, result) => {
  handleError(err);
  trello.getCardsOnList(result[2].id, (err, cards) => {
    handleError(err);
    cards.forEach(card => {
      if (!card.desc) console.log(`Card ${card.url} doesn't have description!`);
    });
    process.exit(ERRORS.NO_ERROR);
  });
});

function handleError(err) {
  if (err) {
    if (err.message) {
      console.error(err.message);
      console.error(`Stack: ${err.stack}`);
    } else {
      console.error('Unknown Trello error.');
      console.error(JSON.stringify(err));
    }
    process.exit(ERRORS.SOME_ERROR);
  }
}
