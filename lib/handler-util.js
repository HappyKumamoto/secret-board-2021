'use strict';

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
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('THE PAGE NOT FOUND');
}

function handleBadRequest(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('UNSUPPORTED METHOD');
}
module.exports = {
  handleLogout,
  handleNotFound,
  handleBadRequest
};