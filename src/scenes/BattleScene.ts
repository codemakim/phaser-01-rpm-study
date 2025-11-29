import Phaser from 'phaser';

type BattleState = 'START' | 'PLAYER_COMMAND' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'WIN' | 'LOSE';

type BattlerStance = 'NORMAL' | 'DEFENSE';

interface Battler {
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  stance: BattlerStance;
}

export class BattleScene extends Phaser.Scene {
  player!: Battler;
  enemy!: Battler;

  // 현재 전투 상태
  state: BattleState = 'START';

  // 화면에 띄울 텍스트 UI
  hpText!: Phaser.GameObjects.Text;
  infoText!: Phaser.GameObjects.Text;

  // 커맨드 UI
  commands = ['공격', '방어', '도망'];
  commandTexts: Phaser.GameObjects.Text[] = [];
  selectedCommandIndex = 0;

  constructor() {
    super('BattleScene');
  }

  create() {
    this.initBattlers();

    this.createTitleText();
    this.createHpText();
    this.createInfoText();

    this.createCommandUI();

    this.bindInput();

    this.startBattle();
  }

  private initBattlers() {
    this.player = {
      name: 'Hero',
      maxHp: 30,
      hp: 30,
      atk: 8,
      stance: 'NORMAL',
    }
    this.enemy = {
      name: 'Slime',
      maxHp: 20,
      hp: 20,
      atk: 5,
      stance: 'NORMAL',
    };
  };

  private createTitleText() {
    this.add.text(400, 80, 'Classic Turn Battle', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
  }

  private createHpText() {
    this.hpText = this.add.text(40, 140, '', {
      fontSize: '16px',
      color: '#ffffff',
    });
  }

  private createInfoText() {
    this.infoText = this.add.text(40, 220, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: {
        width: 720,
      }
    });
  }

  private bindInput() {
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => {
      if (this.state === 'PLAYER_COMMAND') {
        this.moveCommandSelection(-1);
      }
    });
    kb?.on('keydown-DOWN', () => {
      if (this.state === 'PLAYER_COMMAND') {
        this.moveCommandSelection(1);
      }
    });
    kb?.on('keydown-Z', () => {
      if (this.state === 'PLAYER_COMMAND') {
        this.executeSelectedCommand();
      }
    });
    kb?.on('keydown-ENTER', () => {
      if (this.state === 'PLAYER_COMMAND') {
        this.executeSelectedCommand();
      }
    });
  }

  private startBattle() {
    this.state = 'PLAYER_COMMAND';
    this.updateHpText();
    this.infoText.setText('플레이어의 턴입니다. 명령을 선택하세요.');
    this.selectedCommandIndex = 0;
    this.updateCommandHighlight();
  }

  private updateHpText() {
    this.hpText.setText(
      `${this.player.name}'s HP : ${this.player.hp} / ${this.player.maxHp}\n` +
      `${this.enemy.name}'s HP : ${this.enemy.hp} / ${this.enemy.maxHp}`
    );
  }

  private createCommandUI() {
    const baseX = 40;
    const baseY = 360;
    const lineHeight = 26;
    this.commands.forEach((cmd, index) => {
      const text = this.add.text(baseX, baseY + (index * lineHeight), cmd, {
        fontSize: '18px',
        color: '#cccccc',
      });
      this.commandTexts.push(text);
    })
    this.updateCommandHighlight();
  }

  private moveCommandSelection(delta: number) {
    const count = this.commands.length;
    this.selectedCommandIndex = (this.selectedCommandIndex + delta + count) % count;
    this.updateCommandHighlight();
  }

  private updateCommandHighlight() {
    this.commandTexts.forEach((text, index) => {
      const cmd = this.commands[index];
      if (index === this.selectedCommandIndex) {
        text.setText(`▶ ${cmd}`);
        text.setColor('#ffffff');
      } else {
        text.setText(`  ${cmd}`);
        text.setColor('#777777');
      }
    })
  }

  private executeSelectedCommand() {
    const cmd = this.commands[this.selectedCommandIndex];

    if (cmd === '공격') {
      this.state = 'PLAYER_TURN';
      this.runAttackTurn({
        attacker: this.player,
        defender: this.enemy,
        attackerSide: 'PLAYER',
      })
      return;
    }

    if (cmd === '방어') {
      this.player.stance = 'DEFENSE';
      this.infoText.setText(`${this.player.name} 은(는) 방어 태세를 갖추었습니다.`);
      this.startEnemyTurn();
    }

    if (cmd === '도망') {
      this.state = 'LOSE';
      this.infoText.setText(`${this.player.name} 은(는) 도망쳤습니다. (새로고침으로 재시작)`);
      return;
    }
  }

  private startPlayerCommandPhase() {
    this.state = 'PLAYER_COMMAND';
    this.player.stance = 'NORMAL';
    this.updateHpText();
    this.infoText.setText('플레이어의 턴입니다. 명령을 선택하세요.');
    this.selectedCommandIndex = 0;
    this.updateCommandHighlight();
  }

  private startEnemyTurn() {
    this.state = 'ENEMY_TURN';
    this.enemy.stance = 'NORMAL';

    this.time.delayedCall(800, () => {
      this.runAttackTurn({
        attacker: this.enemy,
        defender: this.player,
        attackerSide: 'ENEMY',
      });
    });
  }

  private runAttackTurn(options: {
    attacker: Battler;
    defender: Battler;
    attackerSide: 'PLAYER' | 'ENEMY';
  }) {
    const { attacker, defender, attackerSide } = options;
    const damage = this.getAttackDamage(attacker, defender);

    // 공격 이펙트 + 데미지 숫자 연출 후 실제 데미지 적용
    this.playAttackEffects(attackerSide, damage, () => {
      defender.hp = Math.max(0, defender.hp - damage);
      this.updateHpText();
      this.infoText.setText(`${attacker.name}의 공격! ${defender.name}에게 ${damage} 데미지!`);
      // 사망 체크
      if (defender.hp <= 0) {
        const result = attackerSide === 'PLAYER' ? 'WIN' : 'LOSE';
        this.state = result;
        this.time.delayedCall(800, () => {
          this.infoText.setText(`${result === 'WIN' ? '승리' : '패배'}했습니다. (새로고침으로 재시작)`);
        });
        return;
      }
      // 사망이 아닌 경우 턴 넘기기
      if (attackerSide === 'PLAYER') {
        this.time.delayedCall(800, () => {
          this.startEnemyTurn();
        });
      } else {
        this.time.delayedCall(800, () => {
          this.startPlayerCommandPhase();
        });
      }
    });
  }

  /**
   * 공격 데미지를 계산한다.
   * TODO: 버프 / 디버프 / 크리티컬이나 회피 등을 추가할 때 본 함수를 확장한다.
   */
  private getAttackDamage(attacker: Battler, defender: Battler): number {
    let dmg = attacker.atk;

    if (defender.stance === 'DEFENSE') {
      dmg *= 0.5;
    }
    return Math.max(1, Math.round(dmg));
  }

  /**
   * 공격 이펙트 실행
   */
  private playAttackEffects(
    attackerSide: 'PLAYER' | 'ENEMY',
    damage: number,
    onComplete: () => void,
  ) {

    // 실제 데미지 처리를 위한 콜백 호출
    this.time.delayedCall(420, onComplete);

    // 카메라를 살짝 흔든다.
    this.cameras.main.shake(120, 0.01);

    // 데미지 숫자 텍스트 표시 위치
    // TODO: 추후 캐릭터 속성에 위치 정보를 넣고 해당 캐릭터의 위치 정보를 활용하는 것으로 수정한다.
    const baseX = attackerSide === 'PLAYER' ? 520 : 260;
    const baseY = 170;

    const dmgText = this.add.text(baseX, baseY, `-${damage}`, {
      fontSize: '24px',
      color: '#ff5555',
      stroke: '#000000',
      strokeThickness: 3,
    });

    // Tween으로 위로 살짝 떠오르면서 사라지게 하기
    this.tweens.add({
      targets: dmgText,
      y: baseY - 20,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.Out',
      onComplete: () => {
        dmgText.destroy();
      },
    });
  }
}