'use strict';
const pug = require('pug');
const Cookies = require('cookies');//これからクッキーオブジェクトを作るので大文字始まり
const Post = require('./post');
const util = require('./handler-util');
//const contents = [];//投稿内容一覧用配列 dbに保存する為不要に

const trackingIdKey = 'tracking_id'; //tracking_idの文字列がキーになるが、
　　　　　　　　　　　　　　　　　　　　　　//複数出るので変数にまとめる

function handle(req, res) {
  const cookies = new Cookies(req, res);//アクセスがあったらクッキー情報をもらう
  addTrackingCookie(cookies);

  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      //res.end(pug.renderFile('./views/posts.pug', {contents}));
      //Post.findAll().then((posts) => {
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => {
        // データ取得が終わったあとに実行される処理
        res.end(pug.renderFile('./views/posts.pug', { posts }));//降順に
        console.info(
          `BROWSED: user: ${req.user}
          trackingId: ${cookies.get(trackingIdKey)}
          remoteAddress: ${req.socket.remoteAddress}
          userAgent: ${req.headers['user-agent']} `
        );
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
          trackingCookie: cookies.get(trackingIdKey), // 追跡情報
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

function addTrackingCookie(cookies) {
  if (!cookies.get(trackingIdKey)) {//クッキーが無い時は作る
    const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));//24時間後
    cookies.set(trackingIdKey, trackingId, { expires: tomorrow });//有効期限
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
