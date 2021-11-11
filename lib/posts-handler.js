'use strict';
const pug = require('pug');
const Post = require('./post');
const util = require('./handler-util');
//const contents = [];//投稿内容一覧用配列 dbに保存する為不要に

function handle(req, res) {
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      //res.end(pug.renderFile('./views/posts.pug', {contents}));
      //Post.findAll().then((posts) => {
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => {
        // データ取得が終わったあとに実行される処理
        res.end(pug.renderFile('./views/posts.pug', { posts }));
      });
      break;
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const params = new URLSearchParams(body);
        const content = params.get('content');//投稿されたデータはcontentに入っている
        console.info('Posted:' + content);
        //contents.push(content);//投稿内容一覧用
        //console.info('Posted List:' + contents);//投稿内容一覧用
        //handleRedirectPosts(req, res);
        // データベースへの保存
        Post.create({
          content: content, //投稿内容
          rackingCookie: null, // 追跡情報
          postedBy: req.user // アクセスしてきたユーザー
        }).then(() => {
          // データベースへの保存が終わったら実行する処理
          handleRedirectPosts(req, res); // 投稿一覧へのリダイレクト
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location':'/posts'
  });
  res.end();
}

module.exports = {
  handle
};
