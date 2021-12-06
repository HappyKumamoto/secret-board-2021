'use strict';
const fs = require('fs');

const pug = require('pug');

function handleLogout(req, res) {
  res.writeHead(401, {
    'Content-Type': 'text/html; chrset=utf-8',//平文
  });
  //res.end('LOGGED OUT')
  res.end(pug.renderFile('./views/logout-page.pug'));
}

function handleNotFound(req,res) {
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.write('<h1>THE PAGE NOT FOUND</h1>');
  res.write('<h1><a href="/posts">THE SECRET BOARD</a></h1>');
}

function handleBadRequest(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('UNSUPPORTED REQUEST');
}

function handleFavicon(req, res) {
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon'
  });
  const favicon = fs.readFileSync('./favicon.ico');
  res.end(favicon);
}

module.exports = {
  handleLogout,
  handleNotFound,
  handleBadRequest,
  handleFavicon
};