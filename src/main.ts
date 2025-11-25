import Phaser from "phaser";
import { BattleScene } from "./scenes/BattleScene";

class MainScene extends Phaser.Scene {
  // 방향키 입력에 대한 헬퍼 타입 (up, down, left, right 등을 포함)
  cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Arcade Physics 가 붙은 스프라이트.
  // 그냥 Sprite 가 아니라, body(충돌 박스, 속도, 중력 등)를 가지는 물리 객체다.
  player!: Phaser.Physics.Arcade.Sprite;

  constructor() {
    // 이 씬의 키(이름). 다른 씬에서 this.scene.start('MainScene') 식으로 사용할 수 있다.
    super("MainScene");
  }

  preload() {
    // 🔹 플레이어 스프라이트 로딩
    // - spritesheet: 하나의 큰 이미지에 여러 프레임이 들어있는 시트를 로드할 때 사용
    // - frameWidth / frameHeight: "한 프레임"의 원본 크기 (여백 포함 전체)
    this.load.spritesheet("player", "assets/player.png", {
      frameWidth: 384,
      frameHeight: 1024,
    });

    // 🔹 타일맵 json, 타일셋 이미지 로드
    // - tilemapTiledJSON: Tiled 에서 export 한 JSON 포맷의 맵
    // - image: Tiled 에서 참조하는 tileset 원본 이미지
    this.load.tilemapTiledJSON("map", "assets/sample_map.json");
    this.load.image("tiles", "assets/roguelikeSheet_transparent.png");
  }

  create() {
    // ===============================
    // 1. 타일맵 및 레이어 생성
    // ===============================

    // Tiled 에서 만든 맵 데이터를 Phaser Tilemap 객체로 변환
    const map = this.make.tilemap({ key: "map" });

    // Tiled 의 tileset 이름("Roguelike")과 preload에서 로드한 이미지 키("tiles")를 연결
    const tileset = map.addTilesetImage(
      "Roguelike", // Tiled 안에서의 tileset 이름
      "tiles",     // preload 에서 사용한 이미지 키
      16,          // tileWidth
      16,          // tileHeight
      0,           // margin
      1            // spacing
    ) as Phaser.Tilemaps.Tileset;

    // 각 레이어 이름은 Tiled 레이어 이름과 정확히 일치해야 한다.
    const ground = map.createLayer("Ground/terrain", tileset, 0, 0);
    const groundOverlay = map.createLayer(
      "Ground overlay",
      tileset,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    const objectsLayer = map.createLayer(
      "Objects",
      tileset,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;

    // 🔹 충돌 설정에 대한 두 가지 방식 (지금은 2번 사용 중)

    // 1) 비어있지 않은 모든 타일을 충돌 대상으로 취급하는 방식
    //    - Tiled 가 빈 칸을 -1로 저장하므로, [-1]만 제외하고 나머지는 모두 충돌
    // objectsLayer?.setCollisionByExclusion([-1]);

    // 2) Tiled 타일셋에서 collides: true 라는 property 를 가진 타일만 충돌 대상으로 설정하는 방식
    //    - tileset 편집 화면에서 특정 타일에 사용자 정의 속성(collides: true)을 달아주면,
    //      해당 타일이 있는 부분만 충돌.
    objectsLayer.setCollisionByProperty({ collides: true });

    // physics world의 bounds를 맵 크기로 맞춰 world의 크기를 맵 사이즈와 맞춘다.
    this.physics.world.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels,
    )
    // ===============================
    // 2. 플레이어 생성 및 히트박스 설정
    // ===============================

    // 플레이어 생성
    // ⚠️ this.add.sprite(...) 로 만들면 physics body가 없기 때문에 충돌 처리가 안 된다.
    //    그래서 반드시 this.physics.add.sprite(...) 를 사용해야 Arcade Physics 가 붙는다.
    // this.player = this.add.sprite(400, 300, 'player', 0);
    this.player = this.physics.add.sprite(400, 300, "player", 0);

    // 기본 origin은 (0.5, 0.5) (가운데)이므로 setOrigin(0.5, 0.5)는 생략해도 동일.
    // this.player.setOrigin(0.5, 0.5);
    // this.player.setScale(0.025);

    // 🔹 body 기본 크기/위치에 대한 메모 (실험용 코드)
    // 캐릭터의 충돌 박스를 지정한다. 이걸 안 하면 위에서 지정한 스프라이트 프레임 크기(384x1024)가 그대로 body 크기가 된다.
    // Arcade Sprite 는 기본적으로 "프레임 전체"를 body 로 쓰므로, 여백이 많은 스프라이트는 히트박스도 크게 잡힌다.
    // this.player.body?.setSize(280, 550);

    // 🔹 body offset 에 대한 메모 (실험용 코드)
    // 충돌 박스의 위치를 설정한다.
    // setOffset(x, y)는 body 기준 좌상단에서 얼마나 떨어진 위치에 박스를 둘지 정하는 값이다.
    // (0, 0)이면 원본 프레임의 좌상단에 딱 붙고, 값이 커질수록 우하단으로 내려간다.
    // this.player.body?.setOffset(20, 50);

    // 🔹 실제 사용 중인 설정

    // 캐릭터가 **화면에 보이는** 사이즈를 절대값으로 맞춘다.
    // - 여기서 12x26 은 스프라이트 전체(캐릭터 + 위/아래 여백)를 이 크기로 스케일링한다는 의미다.
    // - 즉, 보이는 크기 기준으로 "이 정도면 타일과 잘 어울린다" 정도로 맞춘 값.
    this.player.setDisplaySize(12, 26);

    // displayWidth/Height는 "화면 픽셀" 기준,
    // body.setSize 는 "원본 텍스처 좌표계" 기준이다.
    // 그래서 displaySize 값은 10단위 정도인데, body.setSize는 200~400대 수치가 나오는 것처럼 보인다.
    // (실제 히트박스의 화면 크기는 bodySize * scale 이라서, 둘이 비례관계에 있다.)
    this.player.body?.setSize(240, 460);

    // body의 기준 좌표(보통 프레임 좌상단 기준)에서 x,y 만큼 떨어진 위치에 히트박스를 배치.
    // 여기서는 긴 이미지 아래쪽 캐릭터 부분에 맞게 히트박스를 내려주는 역할.
    this.player.body?.setOffset(60, 320);

    // 월드 밖으로 못 나가게 하는 설정
    this.player.setCollideWorldBounds(true);

    // ===============================
    // 3. 입력 및 애니메이션 설정
    // ===============================

    // Phaser에서 제공하는 방향키 헬퍼 만들기
    this.cursorKeys = this.input.keyboard
      ?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

    // 걷기 애니메이션 정의
    // - generateFrameNumbers('player', { start: 0, end: 3 })
    //   ⇒ 로드한 spritesheet 의 프레임 인덱스 0~3을 사용해서 애니메이션 클립 생성
    // - frameRate: 초당 8프레임
    // - repeat: -1 이면 무한 반복
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // 위와 같이 타일맵을 먼저 생성해서 화면에 뿌린 후, 캐릭터를 정의해서 화면에 뿌려야 맵 위에 캐릭터가 나온다.
    // 그리고 아래와 같이 depth(그리기 순서)를 지정해줄 수도 있다.
    // ground?.setDepth(0);
    // groundOverlay?.setDepth(1);
    // objectsLayer?.setDepth(2);
    // this.player.setDepth(3); // ← 플레이어를 제일 위로

    // 플레이어와 충돌 대상 레이어 간 충돌할 수 있도록 하는 설정
    // - objectsLayer 에서 collides: true 타일들만 실제로 충돌 처리가 된다.
    this.physics.add.collider(this.player, objectsLayer);

    // ===============================
    // 4. 카메라 설정
    // ===============================

    const cam = this.cameras.main;

    // 카메라가 움직일 수 있는 범위를 맵 전체 크기로 제한
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // 맵 전체 범위

    // 카메라가 플레이어를 따라다니도록 설정
    cam.startFollow(this.player);

    // 카메라 줌(확대 수준)을 5배로 설정
    cam.setZoom(5);

    // 카메라가 플레이어를 따라가면서 x, y가 400.123 이런 식으로 부동소수점이 되면
    // 타일 경계에서 픽셀 샘플링이 애매해져서 라인이 잘 보인다.
    // 따라서 아래와 같이 픽셀 단위로 반올림 처리하면 픽셀 틈이 줄어든다.
    cam.setRoundPixels(true);
  }

  // time: 게임 시작 후 누적된 시간(ms)
  // delta: 직전 프레임과의 시간 차(ms) - 60fps면 대략 16.6ms
  update(time: number, delta: number) {
    // 매 프레임마다 호출되는 함수 (게임 루프)
    const speed = 100;
    const dt = delta / 1000; // 예전 "좌표 직접 이동" 할 때 쓰던 값. 지금은 참고용이라 안 써도 된다.

    let vx = 0;
    let vy = 0;

    // 방향키 입력에 따라 속도 벡터 계산
    if (this.cursorKeys.left?.isDown) {
      vx = -speed;           // 음수 속도 ⇒ 왼쪽으로 이동
      this.player.setFlipX(true); // 왼쪽 바라보게 스프라이트 좌우 반전
    }
    if (this.cursorKeys.right?.isDown) {
      vx = speed;            // 양수 속도 ⇒ 오른쪽으로 이동
      this.player.setFlipX(false); // 오른쪽 바라보게 기본 방향
    }
    if (this.cursorKeys.up?.isDown) {
      vy = -speed;           // 위쪽은 y 감소(좌표계 기준)
    }
    if (this.cursorKeys.down?.isDown) {
      vy = speed;            // 아래쪽은 y 증가
    }

    // 🔹 이동 처리 - 직접 좌표 수정 (지금은 사용 안 하는 버전)
    //   - vx, vy 에 dt를 곱해서 this.player.x/y 에 직접 더해주는 방식
    //   - 단, 이 방식은 Physics 충돌 처리와 섞으면 이상해지기 쉽다.
    // if (vx !== 0 || vy !== 0) {
    //   this.player.x += vx * dt;
    //   this.player.y += vy * dt;
    //   if (!this.player.anims.isPlaying) {
    //     this.player.anims.play('walk');
    //   }
    // } else {
    //   this.player.anims.stop();
    //   this.player.setFrame(0);
    // }

    // 🔹 이동 처리 - Arcade Physics 기반 속도 부여 (현재 사용하는 방식)
    //   - setVelocity 로 속도를 설정하면, Arcade Physics 가 delta, 충돌 등을 반영해서 위치를 자동 업데이트 해준다.
    if (vx !== 0 || vy !== 0) {
      this.player.setVelocity(vx, vy); // ★ 여기! 속도 벡터 지정
      if (!this.player.anims.isPlaying) {
        this.player.anims.play("walk");
      }
    } else {
      this.player.setVelocity(0, 0);   // ★ 멈출 때 속도 0으로
      this.player.anims.stop();
      this.player.setFrame(0);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#202033",
  parent: "app", // index.html 내 div#app에 붙게 하기 위한 설정
  scene: [BattleScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: true, // 히트박스, 타일 충돌 영역을 눈으로 확인하기 위한 디버그 모드
    },
  },
  render: {
    pixelArt: true,   // 픽셀 단위 렌더링 (블러 없이 칸칸이 그리기)
    antialias: false, // 부드럽게 섞지 말고 딱딱하게 (도트 느낌 유지)
  },
};

new Phaser.Game(config);