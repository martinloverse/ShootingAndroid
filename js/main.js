
//iOS出音を鳴らす魔法の言葉
//enchant.Sound.enabledInMobileSafari = true;

enchant();


var PLAYER_WIDTH = 40;
var PLAYER_HEIGNT = 20;
var FRAME_SIZE_WIDTH = 480;
var FRAME_SIZE_HEIGHT = 300;

window.onload = function(){


    game = new Game(FRAME_SIZE_WIDTH, FRAME_SIZE_HEIGHT);
    game.fps = 24;

     //画像の読み込み
     game.preload('img/graphic.png','sound/bgm.mp3','sound/boss.mp3',
                         'img/effect0.gif','img/chara1.gif','sound/bomb1.wav',
                         'sound/bomb2.wav','sound/item.wav','img/bg.png','img/background.png'
                         ,'img/playershoot.png','img/player.png');

     //初期設定
    game.rate = 1;    game.life = 3;
    touching = false;
   
    shootSpeed = 8;
    shootSpeedHigh = 24;
   
    shootSpan = 5;          //標準の連射速度
    shootSpanHigh = 3;     //最大連射速度(短い方が高速)
    game.time = 0;
   
    bulletSpeed = 3;     //敵弾のスピード
    bulletSpan = 10;     //敵の連射速度
   
    game.bpm = 240;          //ゲーム全体のリズム(BPM)
    game.beatSpan = game.fps * 60 / game.bpm; //ゲームのビート
    game.beatCount = 0;
   
    introBeat = 0;
   
    items = [];
   
    bossBattle = false;     //ボス戦フラグ
   
    game.onload = function(){

        //自動的にスクロールする背景を設定
        background = new Background(); 

        //BGMを鳴らす
        bgm = game.assets['sound/bgm.mp3'].clone();
        bgm.play();
        bossBgm = game.assets['sound/boss.mp3'].clone(); //ボス用のBGMは鳴らさずにとっておく

        game.rootScene.backgroundColor = "#000000";

          //スコアを表示
        scoreLabel = new MutableText(8, 8, game.width, ""); //draw.text.jsプラグインを使用
        scoreLabel.score = 0;
        scoreLabel.addEventListener('enterframe', function(){ //毎フレーム自動的にスコアを更新する
            this.text = "SCORE " + this.score;
            this.score += Math.floor((game.score - this.score)/10);
        });

        game.rootScene.addChild(scoreLabel);
        game.score = 0;

         
          //コンボ数を表示(赤い敵を倒すとスコアがそれだけ倍加される)
        timeLabel = new MutableText(8, 32, game.width,'');
        timeLabel.addEventListener('enterframe', function(){
            this.text = "RATE x" + game.rate;
        });
        game.rootScene.addChild(timeLabel);

          //ライフを表示
        lifeLabel = new MutableText(480 - (32 * 4 + 8), 8, game.width, "");
        lifeLabel.addEventListener('enterframe', function(){
            this.text = "LIFE " + "OOOOOOOOO".substring(0, game.life);
        });
        game.rootScene.addChild(lifeLabel);

          //プレイヤー(自機)を表示する
        player = new Player(16, 160 - 16/2);
       
          //ゲーム全体の進行をrootSceneのenterframeイベントで行う
        game.rootScene.addEventListener('enterframe', function(){
            if(game.time == 0)bgm.currentTime = 0;

               //ビートにもとづいて新しい敵を出現させたり、ボス戦に移行させたりする
            game.beatCount = Math.floor(game.time / game.beatSpan) - introBeat;

            if(game.beatCount % 32 == 0 && game.time % (game.beatSpan) == 0){
                 if(bossBattle){//ボス戦の場合
                   if(game.beatCount % 32 == 0){
                     bgm.stop();
                     bossBgm.currentTime = 0;
                     bossBgm.play();
                    }
                 }else{
                     // 80ポートでないと、currentTime=0が動かない。。
                     bgm.stop();
                     bgm = game.assets['sound/bgm.mp3'].clone();
                     // bgm.currentTime = 0;
                     bgm.play();
                 }
            }
           
            if((game.beatCount) >= 0 && game.time % (game.beatSpan) == 0){
                if(game.beatCount > stages.length){
                    // ゲームクリア
                         alert("game clear");
                }else{
                         //新しい攻撃パターンに基づいて敵を出現させる
                    pattern = patterns[stages.charAt(game.beatCount)];
                    console.log(stages.charAt(game.beatCount));
   
                    for(var i in pattern){
                        var obj = pattern[i];
   
                        if(obj.typ == 'enemy'){     //敵が出現する場合
                            position = posTable[obj.pos];
                            (enemiesFunctionTable[obj.nam])(position.x, position.y);
                        }else if(obj.typ == 'item'){//アステムが出現する場合
                            position = posTable[obj.pos];
                            (itemFunctionTable[obj.nam])(position.x, position.y);
                        }else if(obj.typ){
                        }
                    }
                }
            }
            game.time ++;
        });

          //タッチ操作に対応する処理
        game.rootScene.addEventListener('touchstart', function(e){
            touching = true;
        });
        game.rootScene.addEventListener('touchend', function(e){
            touching = false;
        });
        game.rootScene.addEventListener('touchmove', function(e){
            player.targetY = e.localY;
        })

        var pad = new APad();
        pad.x = 0;
        pad.y = 200;
        game.rootScene.addChild(pad);
        game.pad = pad;
    }

    game.start(); //ゲーム開始
}

//各種配列のて意義
var shoots = [];     //プレイヤーの撃った弾の配列
var bullets = [];     //敵の撃った弾の配列
var enemies = [];     //敵の配列


//プレイヤーのクラス
var Player = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGNT;
        this.dead = false;
       
        this.image = game.assets['img/player.png'];
       
        this.frame = 0;
       
        this.power = 10;
       
        this.direction = 0;
       
        this.speed = shootSpeed;
        this.span = shootSpan;
       
        this.targetY = 0;
        this.charge = 0;
       
        this.muteki = false;
        this.mutekiTime = 0;
       
        this.addEventListener('enterframe', function(){
            if(touching){     //タッチしている間、弾を撃ち続ける
                if(game.time % this.span == 0){
                    if(this.multiShot){     //マルチショットの場合
                        var s = new Shoot(this.x+35, this.y+8);
                        s.key = shoots.length;
                        s.direction = -0.2;
                              s.vx = s.speed * Math.cos(s.direction);
                              s.vy = s.speed * Math.sin(s.direction);
                        shoots.push(s);
                        var s = new Shoot(this.x+35, this.y+2);
                        s.key = shoots.length;
                        s.direction = 0.2;
                              s.vx = s.speed * Math.cos(s.direction);
                              s.vy = s.speed * Math.sin(s.direction);
                        shoots.push(s);
                        var s = new Shoot(this.x+35, this.y+5);
                        s.key = shoots.length;
                        shoots.push(s);

                    }else if(this.hasBomb){ //ボムを持っている場合
                        var s = new Shoot(this.x + 35, this.y+2);
                        s.key = shoots.length;
                        shoots.push(s);
                        var s = new Shoot(this.x + 35, this.y+8);
                        s.key = shoots.length;
                        shoots.push(s);
                    }else{     //通常の場合
                    var s = new Shoot(this.x + 35, this.y + 5);
                    s.key = shoots.length;
                    shoots.push(s);
                    }
                }

                var input = game.input;
                var pad = game.pad;
                if (pad.isTouched) {
                    this.x += pad.vx * 4;
                    this.y += pad.vy * 4;
                }
                if (input.left) {
                    this.x -= SPEED;
                }
                if (input.right) {
                    this.x += SPEED;
                }
                if (input.up) {
                    this.y -= SPEED;
                }
                if (input.down) {
                    this.y += SPEED;
                }

        var SPEED = 16;
        var MOVE_RANGE_X = game.width - player.width;
        var MOVE_RANGE_Y = game.height - player.height;

                // 移動可能な範囲を制限
                var left = 0;
                var right = MOVE_RANGE_X;
                var top = 0;
                var bottom = MOVE_RANGE_Y;

                // X軸
                if (this.x < left) {
                    this.x = left;
                } else if (this.x > right) {
                    this.x = right;
                }
                // Y軸
                if (this.y < top) {
                    this.y = top;
                } else if (this.y > bottom) {
                    this.y = bottom;
                }

                //this.y += (this.targetY - (this.y - 8)) / 3;
            }
            for(var i in bullets){     //全ての敵弾について当たり判定を行う
                if(this.muteki)continue;
                if(this.within(bullets[i],10)){
                    // die;
                    game.life --;     //ライフをひとつ減らす
                    game.rate = 1;
                    if(game.life < 0){ //ライフが0になったらゲームオーバー
                        game.end(game.score, "GameOver Score: "+ game.score);
                    }
                    this.power -= bullets[i];
                    bullets[i].remove();
                    this.muteki = true;
                    this.mutekiTime = game.beatSpan * 8;
                    var blast = new Blast(this.x + 20,this.y + 10);
                    var se = game.assets['sound/bomb1.wav'].clone();
                    se.play();
                }
            }
            if(this.mutekiTime-- < 0){ //弾が当たってから一定時間は無敵状態
                this.muteki = false;
            }
           
            this.frame = this.muteki ? (game.frame % 2 == 0 ? 1 : 0) : 0;
        });
        game.rootScene.addChild(this);
    }
});

//爆発エフェクト
var Blast = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.image = game.assets['img/effect0.gif'];
        this.width = 16;
        this.height = 16;
        this.dead = false;
        this.time = 0;
        this.opacity = 1.0;
        this.duration = 20;
        this.frame = 0;
       
        this.addEventListener('enterframe', function(){//少しずつ半透明になって消える
            this.time++;
            this.opacity = 1.0 - this.time/this.duration;
            this.scaleX = 1.0 + this.time/this.duration;
            this.scaleY = 1.0 + this.time/this.duration;
            this.frame = Math.floor(this.time/this.duration *5)
            if(this.time == this.duration)this.remove();
        });
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
    }
});

//大爆発
var BigBlast = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.image = game.assets['img/effect0.gif'];
        this.width = 16;
        this.height = 16;
        this.dead = false;
        this.time = 0;
        this.opacity = 1.0;
        this.duration = 80;
        this.frame = 0;
       
        this.addEventListener('enterframe', function(){//少しずつ半透明になりながら消える
            this.time++;
            this.opacity = 1.0 - this.time/this.duration;
            this.scaleX = 4.0 + this.time/this.duration;
            this.scaleY = 4.0 + this.time/this.duration;
            this.frame = Math.floor(this.time/this.duration *5)
            if(this.time == this.duration)this.remove();
        });
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
    }
});

//敵を定義するクラス
var Enemy = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.dead = false;
        this.score = 100;
        this.targetX = x;
        this.targetY = y;
        this.onhit = function(){};       
        this.image = game.assets['img/graphic.png'];
        this.frame = 3;
        this.key = 0;

        this.power = 10;
       
        this.direction = 0;
       
        // グローバル
        this.speed = shootSpeed;
        this.span = shootSpan;
       
        this.charge = 0;
       
        this.addEventListener('enterframe', function(){
               //プレイヤーの撃った弾に当たったかどうかの当たり判定
            for(var i in shoots){
                if(shoots[i].within(this, this.width* this.scaleX/2)){
                    var blast = new Blast(shoots[i].x, shoots[i].y);
                    this.power -= shoots[i].power;
                    shoots[i].remove();
                    if(this.power <= 0){
                        game.score += game.rate * this.score;
                        this.onhit();
                        this.remove();
                        var se = game.assets['sound/bomb1.wav'].clone();
                        se.play();
                       
                    }
                }
            }
            this.x += Math.ceil((this.targetX - this.x)/30);
            this.y += Math.ceil((this.targetY - this.y)/30);
            if(this.time > game.beatSpan * 16 && (this.y > FRAME_SIZE_HEIGHT || this.x > FRAME_SIZE_WIDTH || this.x < -this.width || this.y < -this.height)){
                this.remove();
            }

        });
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
    }
});

//プレイヤーが撃つ弾のクラス
var Shoot = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.image = game.assets['img/graphic.png'];
        this.width = 16;
        this.height = 16;
        this.dead = false;
        this.frame = 2;
       
        this.key = 0;
       
        this.power = 10;
       
        this.direction = 0;
        this.speed = shootSpeed;
       
          this.vx = this.speed;
          this.vy = 0;
        this.addEventListener('enterframe', function(){ //ひたすらまっすぐ飛んで行く
            this.x += this.vx;
            this.y += this.vy;
            if(this.y > FRAME_SIZE_HEIGHT || this.x > FRAME_SIZE_WIDTH || this.x < -this.width || this.y < -this.height){
                this.remove(); //画面外にでたら消える
            }
        });
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
        delete shoots[this.key];
    }
});


//敵の撃つ弾のクラス
var Bullet = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.image = game.assets['img/graphic.png'];
        this.width = 16;
        this.height = 16;
        this.frame = 1;
       
        this.direction = 0;
        this.speed = shootSpeed;
       
        this.direction = Math.PI;
          this.vx = this.speed * Math.cos(this.direction);
          this.vy = this.speed * Math.sin(this.direction);
        this.speed = shootSpeed;
        this.tick = function(){//ひたすら前に飛ぶ
            this.x += this.vx;
            this.y += this.vy;
        }
        this.check = function(){
            if(this.y > FRAME_SIZE_HEIGHT || this.x > FRAME_SIZE_WIDTH || this.x < -this.width || this.y < -this.height){
                this.remove();
            }//画面外にでてたら消える
        }
       
       
        this.addEventListener('enterframe', this.tick);
        this.addEventListener('enterframe', this.check);
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
        delete bullets[this.key];
    }
});

//パワーアップアイテムのクラス
var Item = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y){
        enchant.Sprite.call(this);
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.dead = false;
       
        this.image = game.assets['img/graphic.png'];
        this.frame = 8;
        this.key = 0;

        this.onget = function(){};
       
        this.direction = -Math.PI;
       
        // グローバル
        this.speed = 4;
       
        this.addEventListener('enterframe', function(){
            if(this.intersect(player)){//プレイヤーと当たり判定
                this.remove();
                this.onget();//アイテムごとの処理をする
                var se = game.assets['sound/item.wav'].clone();
                se.play();//BGMを鳴らす
            }
            this.x += this.speed * Math.cos(this.direction);
            this.y += this.speed * Math.sin(this.direction);
            if(this.y > FRAME_SIZE_HEIGHT || this.x > FRAME_SIZE_WIDTH || this.x < -this.width || this.y < -this.height){
                this.remove();
            }
        });
        game.rootScene.addChild(this);
    },
    remove: function(){
        game.rootScene.removeChild(this);
    }
});

//背景クラス
var Background = enchant.Class.create(enchant.Sprite, {
    initialize: function(){
        enchant.Sprite.call(this,960,600);//ちょっと大きめの背景を用意する
        this.x = 0;
        this.y = 0;
       
        this.image = game.assets['img/background.png'];
       
        this.addEventListener('enterframe', function(){
               this.x--; //ひたすら背景をスクロール
               if(this.x<=-480)this.x=0; //端っこまで来たら、背景を巻き戻す。この繰り返し
        });
        game.rootScene.addChild(this);
    }
});


//乱数用の関数
function rand(max){
    return Math.floor(Math.random() * max);
}


//ステージデータ
var stages = "____ 22__ 1_12 __1_ 1__2_ __2_ _5__ W4_1 ___2 i___ _gg_ 4___ 5656 1212 ____ ____ ____ ____ 3434 3434 ____ ____ 5566 f___ f___ Z___ ____ 2ge_ ____ f222 ____ ____ ____ X___ ____ ____ ihih j___ ____ f___ ____ Y___ ivv_ ____ ____ ih43 ihkj ____ Z___ ih34 ihhi W___ ____ ih43 3434 v___ Z___ ____ 4_4_ i_h_ i_f_ ____ ____ P___ ____ hihi ____ ____ ihih f_g_ j___ ____ hihi k___ ____ ____ ihhi ____ ____ ____  ____ _ihk _kgi  _4gh 34ih __fg  ____ ____ ____  ";
stages = stages.replace(/ /g, ""); //空白を削除(空白があったほうがビートが解り易いため)

//var stages = "e_____________________________________"

//位置テーブル
var posTable = {
c:  {x: 240, y: 152},
a1: {x: 235, y: 152 + 32},
a2: {x: 235, y: 152 - 32},
b1: {x: 230, y: 152 + 48},
b2: {x: 230, y: 152 - 48},
c1: {x: 225, y: 152 + 64},
c2: {x: 225, y: 152 - 64},
d1: {x: 220, y: 152 + 72},
d2: {x: 220, y: 152 - 72},
e1: {x: 215, y: 152 + 96},
e2: {x: 215, y: 152 - 96},
f1: {x: 210, y: 152 + 108},
f2: {x: 210, y: 152 - 108},
g1: {x: 200, y: 152 + 132},
g2: {x: 200, y: 152 - 132},

cf:  {x: 200, y: 152},
a1f: {x: 195, y: 152 + 32},
a2f: {x: 195, y: 152 - 32},
b1f: {x: 190, y: 152 + 48},
b2f: {x: 190, y: 152 - 48},
c1f: {x: 185, y: 152 + 64},
c2f: {x: 185, y: 152 - 64},
d1f: {x: 180, y: 152 + 72},
d2f: {x: 180, y: 152 - 72},
e1f: {x: 175, y: 152 + 96},
e2f: {x: 175, y: 152 - 96},
f1f: {x: 170, y: 152 + 108},
f2f: {x: 170, y: 152 - 108},
g1f: {x: 165, y: 152 + 132},
g2f: {x: 165, y: 152 - 132},


a1i: {x: 320, y: 152 + 16},
a2i: {x: 320, y: 152 - 16},
b1i: {x: 320, y: 152 + 64},
b2i: {x: 320, y: 152 - 64},

};

//出現パターン これがステージデータの1文字に対応
var patterns = {
_: [],
1: [{typ: 'enemy', pos: 'a1', nam: 0}],
2: [{typ: 'enemy', pos: 'a2', nam: 0}],
3: [{typ: 'enemy', pos: 'c1', nam: 0},{typ: 'enemy', pos: 'd1f', nam: 0}],
4: [{typ: 'enemy', pos: 'c2', nam: 0},{typ: 'enemy', pos: 'd2f', nam: 0}],

5: [{typ: 'enemy', pos: 'a1', nam: 0}],
6: [{typ: 'enemy', pos: 'a2', nam: 0}],
7: [{typ: 'enemy', pos: 'b1', nam: 0}],
8: [{typ: 'enemy', pos: 'b2', nam: 0}],

9: [{typ: 'enemy', pos: 'b1f', nam: 0},{typ: 'enemy', pos: 'e1', nam: 0}],
0: [{typ: 'enemy', pos: 'd2f', nam: 0},{typ: 'enemy', pos: 'g2', nam: 0}],
a: [{typ: 'enemy', pos: 'd1f', nam: 0},{typ: 'enemy', pos: 'g1', nam: 0}],
b: [{typ: 'enemy', pos: 'b2f', nam: 0},{typ: 'enemy', pos: 'e2', nam: 0}],


d: [{typ: 'enemy', pos: 'c1', nam: 0},{typ: 'enemy', pos: 'c2', nam: 0}],
e: [{typ: 'enemy', pos: 'b1', nam: 1},{typ: 'enemy', pos: 'b2', nam: 1}],
f: [{typ: 'enemy', pos: 'f1f', nam: 0},{typ: 'enemy', pos: 'f2f', nam: 0}],
g: [{typ: 'enemy', pos: 'e1f', nam: 1},{typ: 'enemy', pos: 'e2f', nam: 1}],

i: [{typ: 'enemy', pos: 'a1', nam: 0},{typ: 'enemy', pos: 'c2', nam: 0}
   ,{typ: 'enemy', pos: 'a1f', nam: 0},{typ: 'enemy', pos: 'c2f', nam: 0}],
j: [{typ: 'enemy', pos: 'b1', nam: 1},{typ: 'enemy', pos: 'b2', nam: 1}
   ,{typ: 'enemy', pos: 'e1f', nam: 1},{typ: 'enemy', pos: 'e2f', nam: 1}],

h: [{typ: 'enemy', pos: 'a1', nam: 0},{typ: 'enemy', pos: 'c2', nam: 0}
   ,{typ: 'enemy', pos: 'a1f', nam: 0},{typ: 'enemy', pos: 'c2f', nam: 0}],
k: [{typ: 'enemy', pos: 'b1', nam: 1},{typ: 'enemy', pos: 'b2', nam: 1}
   ,{typ: 'enemy', pos: 'e1f', nam: 1},{typ: 'enemy', pos: 'e2f', nam: 1}],

l: [{typ: 'enemy', pos: 'c1', nam: 2}],
m: [{typ: 'enemy', pos: 'c2', nam: 2}],
n: [{typ: 'enemy', pos: 'a1', nam: 2}],
o: [{typ: 'enemy', pos: 'a2', nam: 2}],

p: [{typ: 'enemy', pos: 'd1f', nam: 1},{typ: 'enemy', pos: 'd2f', nam: 1}],
q: [{typ: 'enemy', pos: 'c1', nam: 1},{typ: 'enemy', pos: 'c2', nam: 1}],

v: [{typ: 'enemy', pos: 'b1f', nam: 1},{typ: 'enemy', pos: 'b2f', nam: 1},
    {typ: 'enemy', pos: 'c', nam: 2}],
w: [{typ: 'enemy', pos: 'a1f', nam: 0},{typ: 'enemy', pos: 'a1f', nam: 0}],
x: [{typ: 'enemy', pos: 'b1f', nam: 1},{typ: 'enemy', pos: 'b1f', nam: 1}],
y: [{typ: 'enemy', pos: 'c1', nam: 2},{typ: 'enemy', pos: 'c1', nam: 2}],
z: [{typ: 'enemy', pos: 'd1f', nam: 1},{typ: 'enemy', pos: 'd1f', nam: 1}],
A: [{typ: 'enemy', pos: 'e1f', nam: 0},{typ: 'enemy', pos: 'e1f', nam: 0}],
B: [{typ: 'enemy', pos: 'f1', nam: 1},{typ: 'enemy', pos: 'f1', nam: 1}],
C: [{typ: 'enemy', pos: 'g1f', nam: 0},{typ: 'enemy', pos: 'g1f', nam: 0}],
D: [{typ: 'enemy', pos: 'g1', nam: 1},{typ: 'enemy', pos: 'g1', nam: 1}],

P: [{typ: 'enemy', pos: 'a1', nam: 'boss'}],


W: [{typ: 'item', pos: 'a1i', nam: "speedUp"}],
X: [{typ: 'item', pos: 'a2i', nam: "bomb"}],
Y: [{typ: 'item', pos: 'b1i', nam: "multiShot"}],
Z: [{typ: 'item', pos: 'b2i', nam: "heart"}]
}


//敵の動きパターン
enemiesFunctionTable = {
0: function(x, y){
    var e = new Enemy(x, y);
    e.isPremium = (game.beatCount % 4) == 3;

    e.frame = e.isPremium ? 6 : 3;
    e.power = 10;
    e.span = game.beatSpan * 4;
    e.targetX = x;
    e.targetY = y;
     e.scaleX = 1.5;
    e.scaleY = 1.5;
   e.x = 320 ;
    e.y = 152 + (y - 152)*3;
    e.speed = 1;
    e.direction = 0;
    e.score = e.isPremium ? 100 : 100;
    e.moveSpeed = 8;
    e.movePattern = 0;
   
    if(e.isPremium)e.onhit = function(){
        game.rate ++;
    };
   
    e.tick = {};
    e.tick[0] = function(){
        e.direction += Math.PI / (game.beatSpan*12);
        e.x -= e.moveSpeed * Math.cos(e.direction);
        e.y += e.moveSpeed * Math.sin(e.direction)
    }
    e.tick[1] = function(){
        e.direction -= Math.PI / (game.beatSpan*12);
        e.x -= e.moveSpeed * Math.cos(e.direction);
        e.y += e.moveSpeed * Math.sin(e.direction)
    }
   
    e.addEventListener('enterframe', function(){
        e.movePattern = (e.targetY > 160) ? 1 : 0;
        if(game.time % this.span == 0){
            var b = new Bullet(this.x, this.y);
            b.key = bullets.length;
            bullets.push(b);
        }
        (e.tick[e.movePattern])();
//        this.rotation += 18;
    });
},


1: function(x, y){
    var e = new Enemy(x, y);
    e.frame = 4;
    e.power = 30;
    e.span = game.beatSpan * 2;
    e.speed = 0;
    e.targetX = x;
    e.targetY = y;
    e.scaleX = 1;
    e.scaleY = 1;

    e.x = 320;
    e.y = 152;
    e.score = 200;
    e.moveSpeed = 4;
    e.movePattern = 0;
    e.tick = {};
    e.tick[0] = function(){
        e.direction += Math.PI / (game.beatSpan*32);
        e.x -= e.moveSpeed * Math.cos(e.direction);
        e.y += e.moveSpeed * Math.sin(e.direction)
    }
    e.tick[1] = function(){
        e.direction -= Math.PI / (game.beatSpan*32);
        e.x -= e.moveSpeed * Math.cos(e.direction);
        e.y += e.moveSpeed * Math.sin(e.direction)
    }

    e.addEventListener('enterframe', function(){
        e.movePattern = (e.targetY > 160) ? 1 : 0;
        if(game.time % this.span == 0){
            var b = new Bullet(this.x, this.y);
            b.key = bullets.length;
            b.speed = 4;
            b.direction = Math.atan2(player.y-4 - y,player.x-32 - x);
            b.rotation = 180+(b.direction / Math.PI) * 180;
               b.vx = b.speed * Math.cos(b.direction);
               b.vy = b.speed * Math.sin(b.direction);
            b.addEventListener('enterframe', b.tick);
            bullets.push(b);
        }
        (e.tick[e.movePattern])();
        this.rotation += 18;
  //      this.rotation +=4;
    });
},
"1a": function(x, y){
    var e = new Enemy(x, y);
    e.frame = 4;
    e.span = game.beatSpan;
    e.speed = 0;
    e.power = 50;
    e.scaleX = 2;
    e.scaleY = 2;
    e.targetX = x;
    e.targetY = y;
    e.x = 320;
    e.y = 152;
    e.score = 200;
    e.addEventListener('enterframe', function(){
        if(game.time % this.span == 0){
            var b = new Bullet(this.x, this.y);
            b.key = bullets.length;
            b.speed = 7;
            b.direction = Math.atan2(player.y-4 - y,player.x-32 - x);
            b.rotation = (b.direction / Math.PI) * 180;
            b.addEventListener('enterframe', b.tick);
            bullets.push(b);
        }
//        this.rotation +=15;
    });
},



2: function(x, y){
    var e = new Enemy(x, y);
    e.frame = 5;
    e.scaleX = 2.5;
    e.scaleY = 2.5;
    e.span = game.beatSpan * 4;
    e.power = 100;
    e.targetX = x;
    e.targetY = y;
    e.x = 320;
    e.y = 152;   
    e.score = 300;
    e.addEventListener('enterframe', function(){
        if(game.time % this.span == 0){
            var b = new Bullet(this.x, this.y);
            b.key = bullets.length;
            b.speed = 3;
            b.direction = Math.atan2(player.y-4 - y,player.x-32 - x);
            b.tick = function(){
                this.x -= (this.x - player.x)/20;
                this.y -= (this.y - player.y)/20;
            }
            b.addEventListener('enterframe', b.tick);
            bullets.push(b);
        }
    });
},
"boss": function(x, y){
    var e = new Enemy(x, y);
    e.image = game.assets['img/chara1.gif'];
    e.width = 32;
    e.height = 32;
    e.scaleX = 3;
    e.scaleY = 3;
    e.frame = 5;
    e.power = 1500;
    e.span = game.beatSpan * 8;
    e.targetX = x;
    e.targetY = y;
    e.score = 2000;
    e.x = 1600;
    e.y = 152;
    e.onhit = function(){
               b = new BigBlast( e.x,
                                    e.y+50);
          for(i=0;i<40;i++){
               b = new Blast( Math.random()*100+e.x,
                                 Math.random()*100+e.y);
          }
          setTimeout(function(){
             game.end(game.score,'Clear! Score:' + game.score);},4000);
    };
    e.bulletpattern = {};
    e.bulletpattern[0] = function(){
        bs = 60;
        for(var i = 0; i < bs; i++){
            var b = new Bullet(this.x, this.y);
            b.parent = e;
            b.key = bullets.length;
            b.speed = 2;
            b.direction = (i / bs)* (Math.PI*2);
            b.time = 0;
            b.addEventListener('enterframe', function(){
                b.time ++;
                b.x = parent.x + Math.sin(b.direction) * b.dist;
                b.y = parent.y + Math.cos(b.direction) * b.dist;
            });
            bullets.push(b);
        }  
    }
    e.addEventListener('enterframe', function(){
        this.y = 100 + Math.sin(game.frame/60) * 100;
        if(game.time % this.span == 0){
            e.bulletpattern[0]
        }
    });
    bossBattle = true;
}



};

//アイテム機能テーブル
itemFunctionTable = {
"speedUp": function(x, y){
    var i = new Item(x, y);
    i.frame = 9;
    i.onget = function(){
        player.speed = shootSpeedHigh;
        player.span = shootSpanHigh;
    }
},
"bomb": function(x, y){
    var i = new Item(x, y);
    i.frame = 10;
    i.onget = function(){
        player.hasBomb = true;
    }
},
"multiShot": function(x, y){
    var i = new Item(x, y);
    i.frame = 11;
    i.onget = function(){
        player.multiShot = true;
    }
},
"heart": function(x, y){
    var i = new Item(x, y);
    i.frame = 8;
    i.onget = function(){
        game.life += 1;
       
    }
}
}

