'use strict';
const pug = require('pug');
const assert = require('assert');

// pugのテンプレートにおける xss 脆弱性のテスト
const html = pug.renderFile('./views/posts.pug', {
  posts: [
    {
      id: 1,
      content: "<script>alert('test');</script>",
      postedBy: 'guest1',
      trackingCookie: '7658404902596857_644b19f7797f0d422213a47759a09a3b2865adf3',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  user: 'guest1'
});
//console.log(html);

// スクリプトタグがエスケープされて含まれていることをチェック
assert(html.includes("&lt;script&gt;alert('test');&lt;/script&gt;"));
//トラッキングidの前半のみが表示されているかどうかをチェック
assert(!html.includes('644b19f7797f0d422213a47759a09a3b2865adf3'));

console.log('テストが正常に完了しました！')