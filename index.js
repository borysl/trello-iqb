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

const port = process.env.PORT || 8080;

var Trello = require('trello');
var trello = new Trello(process.env.TRELLO_APP_KEY, process.env.TRELLO_API_TOKEN);

/*
displayBoards(process.env.TRELLO_USER_ID);
function displayBoards(user) {
  trello.getBoards(user, (err, boards) => {
    handleError(err);
    boards.forEach(board => {
      console.log(`Board ${board.name}(${board.id})`);
    });
  });
}

function getListsOnBoard(boardId) {
  return new Promise((resolve, reject) => {
    trello.getListsOnBoard(boardId, null, (err, lists) => {
      if (err) {
        reject(err);
      } else {
        resolve(lists);
      }
    });
  });
}
*/

function handleError(err, res) {
  if (err) {
    res.write(500);
    if (err.message) {
      res.error(err.message);
      res.error(`Stack: ${err.stack}`);
    } else {
      res.error('Unknown Trello error.');
      res.error(JSON.stringify(err));
    }
    res.end();
  }
}

function validateToDo(card) {
  let sins = [];
  if (card.labels.length === 0) sins.push('No labels for classification!');
  if (!card.desc) sins.push('Empty description!');
  // if (card.labels.find(_ => _.name == 'FE')) {
  //   card
  // }
  return sins;
}

const http = require('http');

const server = http.createServer((req, res) => {
  trello.getListsOnBoard(process.env.TRELLO_BOARD_ID, null, (err, lists) => {
    handleError(err);
    trello.getCardsOnList(lists[2].id, (err, cards) => {
      handleError(err);
      let html =
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Trello Shame</title><body><h1>Input Quality Bar for our <a href="https://trello.com/b/VkJo4Kd7/website">Trello</a></h1>';
      cards.forEach(card => {
        // let checkListPromise = trello.getChecklistsOnCard(card.id);
        // let attachmentPromise = trello.getAttachmentsOnCard(card.id);
        // Promise.all()

        let sins = validateToDo(card);
        html += `<li>Card <a href="${card.url}">${card.name}</a> ${sins.length == 0 ? 'is OK' : sins.join(', ')} </li>`;
      });
      html += '</body></html>';
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': html.length,
        Expires: new Date().toUTCString(),
      });
      res.end(html);
    });
  });
});

server.listen(port);
