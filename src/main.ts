import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainSene');
  }
  preload() {
    // 이미지, 스프라이트 로딩을 여기서 한다고 한다.
  }
  create() {
    this.add.text(100, 100, 'Hellow Phaser!', {
      fontSize: '32px'
    })
  }
  update(time: number, delta: number) {
    // 매 프레임마다 호출되는 함수 (게임 루프)
    console.log('time: ', time, 'delta: ', delta)
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
