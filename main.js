const config = {
    type: Phaser.AUTO,
    width: 1850,
    height: 925,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

let player;
let groundVisual;
let groundCollider;

let enemies;
let fruits;

let cursors;
let speed;
let gameState;

let jumpSound;
let fruitSound;
let bgMusic;
let gameOverSound;
let startSound;

let score;
let scoreText;
let speedText;

let startText;
let gameOverText;

let background;
let nightOverlay;

let jumps = 0;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'assets/background.jpg');
    this.load.image('chao', 'assets/chao.png');
    this.load.image('inimigo', 'assets/inimigo.png');

    this.load.image('walk1', 'assets/walk1.png');
    this.load.image('walk2', 'assets/walk2.png');

    this.load.image('morango', 'assets/morango.png');
    this.load.image('cereja', 'assets/cereja.png');
    this.load.image('banana', 'assets/banana.png');
    this.load.image('apple', 'assets/apple.png');

    this.load.audio('pulo', 'assets/pulo.mp3');
    this.load.audio('fruta', 'assets/floraphonic.mp3');
    this.load.audio('bg', 'assets/fundo.mp3');
    this.load.audio('gameover', 'assets/game-over.mp3');
    this.load.audio('start', 'assets/game-start.mp3');
}

function create() {

    fruitSound = this.sound.add('fruta');
    bgMusic = this.sound.add('bg', { loop: true, volume: 0.4 });
    jumpSound = this.sound.add('pulo', { volume: 0.4 });
    gameOverSound = this.sound.add('gameover', { volume: 0.9 });
    startSound = this.sound.add('start', { volume: 0.7 });

    background = this.add.tileSprite(0, 0, 1850, 925, 'background').setOrigin(0);

    nightOverlay = this.add.rectangle(0, 0, 1850, 925, 0x000022)
        .setOrigin(0)
        .setAlpha(0);

    groundVisual = this.add.tileSprite(0, 861, 1850, 64, 'chao').setOrigin(0);

    groundCollider = this.add.rectangle(925, 893, 1850, 64, 0x000000, 0);
    this.physics.add.existing(groundCollider, true);

    player = this.physics.add.sprite(245, 790, 'walk1');
    player.setScale(1.3);
    player.setCollideWorldBounds(true);
    player.setSize(55, 75).setOffset(20, 18);

    this.anims.create({
        key: 'run',
        frames: [{ key: 'walk1' }, { key: 'walk2' }],
        frameRate: 6,
        repeat: -1
    });

    player.play('run');

    this.physics.add.collider(player, groundCollider);

    enemies = this.physics.add.group();
    this.physics.add.collider(player, enemies, hit, null, this);

    fruits = this.physics.add.group();
    this.physics.add.overlap(player, fruits, collectFruit, null, this);

    cursors = this.input.keyboard.createCursorKeys();

    startText = this.add.text(925, 310, 'Pressione ESPAÇO para começar', {
        fontSize: '34px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);

    gameOverText = this.add.text(925, 440, '', {
        fontSize: '42px',
        fontStyle: 'bold',
        fill: '#ff3b3b',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);

    scoreText = this.add.text(25, 20, '', {
        fontSize: '28px',
        fill: '#ffff66',
        stroke: '#000000',
        strokeThickness: 4
    });

    speedText = this.add.text(25, 60, '', {
        fontSize: '26px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
    });

    resetGame.call(this);
}

function update(time) {

    let cycle = Math.sin(time * 0.0002);
    nightOverlay.setAlpha((cycle + 1) / 2 * 0.6);

    if (gameState === 'gameover') {
        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            resetGame.call(this);
        }
        return;
    }

    if (gameState === 'menu') {
        groundVisual.tilePositionX += 1;
        background.tilePositionX += 0.3;

        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            startGame.call(this);
        }
        return;
    }

    background.tilePositionX += speed * 0.005;
    groundVisual.tilePositionX += speed * 0.02;

    if (player.body.touching.down) jumps = 0;

    if (Phaser.Input.Keyboard.JustDown(cursors.space) && jumps < 2) {
        player.setVelocityY(-460);
        jumpSound.play();
        jumps++;
    }

    enemies.getChildren().forEach(enemy => {
        enemy.setVelocityX(-speed);
        enemy.angle += 5;

        if (enemy.x < -enemy.width) {
            enemy.destroy();
            speed += 10;
        }
    });

    fruits.getChildren().forEach(fruit => {
        fruit.setVelocityX(-speed);
        if (fruit.x < -fruit.width) fruit.destroy();
    });

    scoreText.setText('Pontos: ' + score);
    speedText.setText('Velocidade: ' + (speed / 200).toFixed(1));
}

function startGame() {
    gameState = 'playing';

    startText.setVisible(false);
    gameOverText.setText('');

    player.play('run', true);

    startSound.play();
    this.time.delayedCall(500, () => bgMusic.play());

    spawnEnemy.call(this);
    spawnFruit.call(this);
}

function resetGame() {
    gameState = 'menu';
    speed = 200;
    score = 0;
    jumps = 0;

    enemies.clear(true, true);
    fruits.clear(true, true);

    player.setPosition(245, 790);
    player.setVelocity(0);

    player.play('run', true);

    bgMusic.stop();

    startText.setVisible(true);
    gameOverText.setText('');
}

// 👾 SPAWN COM DISTÂNCIA MAIOR
function spawnEnemy() {
    if (gameState !== 'playing') return;

    let lastEnemy = enemies.getChildren().slice(-1)[0];

    // só cria se tiver distância suficiente
    if (!lastEnemy || lastEnemy.x < 1400) {
        let enemy = enemies.create(1900, 829, 'inimigo');

        enemy.body.allowGravity = false;
        enemy.setScale(1.0);
        enemy.setVelocityX(-speed);
        enemy.setImmovable(true);
    }

    this.time.delayedCall(1200, () => spawnEnemy.call(this));
}

// 🍎 SEM SOBREPOSIÇÃO COM INIMIGO
function spawnFruit() {
    if (gameState !== 'playing') return;

    if (fruits.getChildren().length >= 5) {
        this.time.delayedCall(1000, () => spawnFruit.call(this));
        return;
    }

    const fruitsList = ['morango', 'cereja', 'banana', 'apple'];
    const fruitKey = Phaser.Utils.Array.GetRandom(fruitsList);

    let height = Phaser.Math.Between(600, 820);

    // 🚫 evitar sobreposição direta
    let tooClose = enemies.getChildren().some(e =>
        Math.abs(e.x - 1900) < 120
    );

    if (tooClose) {
        this.time.delayedCall(800, () => spawnFruit.call(this));
        return;
    }

    let fruit = fruits.create(1900, height, fruitKey);

    fruit.setScale(0.9);
    fruit.body.allowGravity = false;

    this.time.delayedCall(1500, () => spawnFruit.call(this));
}

function collectFruit(player, fruit) {
    score += 5;
    fruitSound.play();
    fruit.destroy();
}

function hit() {
    if (gameState !== 'playing') return;

    gameState = 'gameover';

    player.anims.stop();
    player.setVelocity(0);

    enemies.getChildren().forEach(e => e.setVelocity(0));
    fruits.getChildren().forEach(f => f.setVelocity(0));

    bgMusic.stop();
    gameOverSound.play();

    gameOverText.setText(
        'GAME OVER\nPontos: ' + score + '\nPressione ESPAÇO'
    );
}