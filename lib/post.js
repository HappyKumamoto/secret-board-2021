'use strict';
const { Sequelize, DataTypes } = require('sequelize');
//データベース全体の設定
/*const sequelize = new Sequelize(
  //データベースにログインするための設定
  'postgres://postgres:postgres@db/secret_board',
  {
    //起動ログなど様々なログをオフにする設定
    logging: false
  }
);*/

const dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
  const sequelize = process.env.DATABASE_URL ?
    // 本番環境
    new Sequelize(
      process.env.DATABASE_URL,
      {
        logging: false,
        dialectOptions
      }
    )
    :
    // 開発環境
    new Sequelize(
      'postgres://postgres:postgres@db/secret_board',
      {
        logging: false
      }
    );

//投稿データのデータモデル定義
const Post = sequelize.define(
  'Post',
  {
    //データのID
    id: {
      type: DataTypes.INTEGER, //数値型
      autoIncrement: true, //1から順に自動採番する設定
      primaryKey: true //検索に使うための設定
    },
    // 投稿されたメッセージの本文
    content: {
      type: DataTypes.TEXT //長い文字列の型
    },
    // 投稿者
    postedBy: {
      type: DataTypes.STRING //短い文字列の型
    },
    // 投稿者追跡情報
    trackingCookie: {
      type: DataTypes.STRING //短い文字列の型
    }
  },
  {
    // その他の設定
    freezeTableName: true, //テーブル名を固定する
    timestamps: true //投稿日、更新日を記録する設定
  }
);

//このファイルの起動時にデータベースの設定を同期する
Post.sync();

// 別ファイルからアクセスできるようにする
module.exports = Post;