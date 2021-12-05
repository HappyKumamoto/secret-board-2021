'use strict';
const crypto = require('crypto');
const pug = require('pug');
const Cookies = require('cookies');//これからクッキーオブジェクトを作るので大文字始まり
const Post = require('./post');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const util = require('./handler-util');
//const contents = [];//投稿内容一覧用配列 dbに保存する為不要に

const trackingIdKey = 'tracking_id'; //tracking_idの文字列がキーになるが、
　　　　　　　　　　　　　　　　　　　　　　//複数出るので変数にまとめる

const oneTimeTokenMap = new Map(); // キーをユーザー名、値をトークンとする連想配列

function handle(req, res) {
  const cookies = new Cookies(req, res);//アクセスがあったらクッキー情報をもらう
  const trackingId = addTrackingCookie(cookies, req.user);

  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
        //'Content-Security-Policy': "default-src 'self'; script-src https://*; style-src https://*"
      });
      //res.end(pug.renderFile('./views/posts.pug', {contents}));
      //Post.findAll().then((posts) => {
      Post.findAll({order:[['id', 'DESC']]}).then((posts) => {//降順に
        posts.forEach((post) => {
          //post.content = post.content.replace(/\n/g, '<br>');
          post.formattedCreatedAt = dayjs(post.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
        });

        const oneTimeToken = crypto.randomBytes(8).toString('hex');
        oneTimeTokenMap.set(req.user, oneTimeToken);

        // データ取得が終わったあとに実行される処理
        res.end(pug.renderFile('./views/posts.pug', {
          posts, 
          user: req.user,
          oneTimeToken
        }));
      });
        console.info(
          `*****BROWSED***** 
          USER : ${req.user}
          TRACKING ID : ${trackingId}
          REMOTE ADRESS : ${req.socket.remoteAddress}
          USER AGENT : ${req.headers['user-agent']} `
        );
      break;
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const params = new URLSearchParams(body);
        const content = params.get('content');//投稿されたデータはcontentに入っている
        const id = params.get('id');

        const requestedOneTimeToken = params.get('oneTimeToken');
        if (!(content && requestedOneTimeToken)) {
          util.handleBadRequest(req, res);
        } else {
          if(oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
            console.info(
              `*****POSTED*****
              USER : ${req.user}
              POSTED NUMBER : ${id}
              CONTENT : ${content}
              REMOTE ADDRESS : ${req.connection.remoteAddress}
              USER AGENT : ${req.headers['user-agent']}`
              );
        /*
        console.info(
          `*****POSTED*****
          USER : ${req.user}
          POSTED NUMBER : ${id}
          CONTENT : ${content}
          REMOTE ADDRESS : ${req.connection.remoteAddress}
          USER AGENT : ${req.headers['user-agent']}`
          );*/
        //contents.push(content);//投稿内容一覧用
        //console.info('Posted List:' + contents);//投稿内容一覧用
        //handleRedirectPosts(req, res);
        // データベースへの保存
        Post.create({
          content: content, //投稿内容
          trackingCookie: trackingId, // 追跡情報
          postedBy: req.user // アクセスしてきたユーザー
        }).then(() => {
          oneTimeTokenMap.delete(req, res);
          // データベースへの保存が終わったら実行する処理
          handleRedirectPosts(req, res); // 投稿一覧へのリダイレクト
        });
      } else{
        util.handleBadRequest(req, res);
      }
    }
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST' :
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
        //console.log(chunk);//chunkデータを見てみるとき
      }).on('end', () => {
        body =Buffer.concat(body).toString();
        const params = new URLSearchParams(body);
        const content = params.get('content');
        const id = params.get('id');

        /*Post.findByPk(id).then((post) => {
          if (req.user === post.postedBy || req.user === 'admin') {
            post.destroy().then(() => {
              console.info(
                `*****DELATED***** 
                USER : ${req.user}
                POSTED NUMBER : ${id}
                CONTENT : ${content}
                REMOTE ADDRESS : ${req.connection.remoteAddress}
                USER AGENT : ${req.headers['user-agent']}`
              )
              handleRedirectPosts(req, res);
            });
          }
        });*/
        const requestedOneTimeToken = params.get('oneTimeToken');//ここから
        if (!(id && requestedOneTimeToken)) {
          util.handleBadRequest(req, res);
        } else {
          if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
            Post.findByPk(id).then((post) => {
              if (req.user === post.postedBy || req.user === 'admin') {
                post.destroy().then( () => {
                  console.info(
                    `*****DELATED***** 
                    USER : ${req.user}
                    POSTED NUMBER : ${id}
                    CONTENT : ${content}
                    REMOTE ADDRESS : ${req.connection.remoteAddress}
                    USER AGENT : ${req.headers['user-agent']}`
                  );
                  oneTimeTokenMap.delete(req.user);
                  handleRedirectPosts(req, res);
                });
              } else {
                util.handleBadRequest(req, res);
              }
            });
          } else {
            util.handleBadRequest(req, res);
          }
        }//ここまで
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

/**
* Cookieに含まれているトラッキングIDに異常がなければその値を返し、
* 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
* @param {Cookies} cookies
* @param {String} userName
* @return {String} トラッキングID
*/

function addTrackingCookie(cookies, userName) {
    const requestedTrackingId = cookies.get(trackingIdKey);
    if (isValidTrackingId(requestedTrackingId, userName)) {
      return requestedTrackingId;
    } else {
      //const originalId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      const originalId = parseInt(crypto.randomBytes(8).toString('hex'), 16);
      const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
      const trackingId = originalId + '_' + createValidHash(originalId, userName);
      cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
      return trackingId;
    }
  }

function isValidTrackingId(trackingId, userName) {
  if (!trackingId) {
  return false;
  }
  const splitted = trackingId.split('_');
  const originalId = splitted[0];
  const requestedHash = splitted[1];
  return createValidHash(originalId, userName) === requestedHash;
}

  function createValidHash(originalId, userName) {
   const sha1sum = crypto.createHash('sha1');
   sha1sum.update(originalId + userName);
   return sha1sum.digest('hex');
  }

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location':'/posts'
  });
  res.end();
}

module.exports = {
  handle,
  handleDelete
};
