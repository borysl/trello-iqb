const ERRORS = {
  NO_ERROR: 0,
  CANT_PARSE_DOTENV: 1,
  SOME_ERROR: 99,
};

const express = require('express');
const { columns, validateTodo } = require('./trelloSettings.js');

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

async function populateCards(cards) {
  let populatePromises = cards.map(async card => {
    let checkListPromise = trello.getChecklistsOnCard(card.id);
    let attachmentPromise = trello.getAttachmentsOnCard(card.id);
    let [checklists, attachments] = await Promise.all([checkListPromise, attachmentPromise]);
    card.checklists = checklists;
    card.attachments = attachments;
  });

  await Promise.all(populatePromises);
}

const app = express();

app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    let boards = await trello.getBoards(process.env.TRELLO_USER_ID);
    let board = boards.find(_ => _.id === process.env.TRELLO_BOARD_ID);
    let lists = await trello.getListsOnBoard(board.id);
    var todoList = lists[columns['todo']];
    let todoCards = await trello.getCardsOnList(todoList.id);

    await populateCards(todoCards);

    let html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" type="text/css" href="iqb.css" /><title>Trello Shame</title><body>';
    html += `<h1>Dynamic Quality Bars for our <a href="${board.url}">Trello</a></h1>`;
    todoCards.forEach(card => {
      let sins = validateTodo(card);
      html += `<li>Card <a href="${card.url}">${card.name}</a> ${
        sins.length == 0 ? '<span class="right">is OK</span>' : '<span class="wrong">' + sins.join(', ') + '</span>'
      }. </li>`;
    });
    html += '</body></html>';
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': html.length,
      Expires: new Date().toUTCString(),
    });
    res.end(html, 'utf-8');
  } catch (err) {
    handleError(err, res);
  }
});

app.listen(port);
