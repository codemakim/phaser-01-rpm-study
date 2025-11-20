import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  text!: Phaser.GameObjects.Text;
  constructor() {
    super('MainSene');
  }
  preload() {
    // 이미지, 스프라이트 로딩을 여기서 한다고 한다.
  }
  create() {
    this.text = this.add.text(100, 100, 'Hellow Phaser!', {
      fontSize: '32px'
    })
    this.cursorKeys = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

  }
  // time: 게임 시작 후 누적된 시간(ms)
  // delta: 직전 프레임과의 시간 차(ms) - 60fps면 대량 16.6
  update(time: number, delta: number) {
    // 매 프레임마다 호출되는 함수 (게임 루프)
    const speed = 200;
    const dt = delta / 1000;
    if (this.cursorKeys.left?.isDown) {
      this.text.x -= speed * dt;
    }
    if (this.cursorKeys.right?.isDown) {
      this.text.x += speed * dt;
    }
    if (this.cursorKeys.up?.isDown) {
      this.text.y -= speed * dt;
    }
    if (this.cursorKeys.down?.isDown) {
      this.text.y += speed * dt;
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#202033',
  parent: 'app', // index.html 내 div#app에 붙게 하기 위한 설정
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

new Phaser.Game(config);
