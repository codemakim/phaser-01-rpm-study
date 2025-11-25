import Phaser from 'phaser';

type BattleState = 'START' | 'PLAYER_COMMAND' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'WIN' | 'LOSE';

interface Battler {
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
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
    this.player = {
      name: 'Hero',
      maxHp: 30,
      hp: 30,
      atk: 8
    };
    this.enemy = {
      name: 'slime',
      maxHp: 20,
      hp: 20,
      atk: 5
    }

    this.add.text(400, 80, 'Classic Turn Battle', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    this.hpText = this.add.text(40, 140, '', {
      fontSize: '16px',
      color: '#ffffff'
    })

    this.infoText = this.add.text(40, 220, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: {
        width: 720,
      }
    });

    this.createCommandUI();

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
    this.startBattle();
  }

  startBattle() {
    this.state = 'PLAYER_COMMAND';
    this.updateHpText();
    this.infoText.setText('플레이어의 턴입니다. 명령을 선택하세요.');
    this.selectedCommandIndex = 0;
    this.updateCommandHighlight();
  }

  updateHpText() {
    this.hpText.setText(
      `${this.player.name}'s HP : ${this.player.hp} / ${this.player.maxHp}\n` +
      `${this.enemy.name}'s HP : ${this.enemy.hp} / ${this.enemy.maxHp}`
    );
  }

  createCommandUI() {
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

  moveCommandSelection(delta: number) {
    const count = this.commands.length;
    this.selectedCommandIndex = (this.selectedCommandIndex + delta + count) % count;
    this.updateCommandHighlight();
  }

  updateCommandHighlight() {
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

  executeSelectedCommand() {
    const cmd = this.commands[this.selectedCommandIndex];
    if (cmd === '공격') {
      this.state = 'PLAYER_TURN';
      this.handleAction(this.player, this.enemy, 'WIN');
      return;
    }
    if (cmd === '방어') {
      this.infoText.setText('방어 기능은 아직 구현되지 않았습니다.');
      return;
    }
    if (cmd === '도망') {
      this.infoText.setText('도망 기능도 아직 구현되지 않았습니다.');
      return;
    }
  }

  handleAction(actor: Battler, target: Battler, killState: Extract<BattleState, 'WIN' | 'LOSE'>) {
    const dmg = actor.atk;
    target.hp = Math.max(0, target.hp - dmg);
    this.updateHpText();
    this.infoText.setText(`${actor.name}의 공격! ${target.name}에게 ${dmg} 데미지!`);

    if (target.hp <= 0) {
      this.state = killState;
      this.time.delayedCall(800, () => {
        this.infoText.setText((killState === 'WIN' ? '승리했습니다.' : '패배했습니다.') + ' (새로고침으로 재시작)');
      })
      return;
    }
    this.state = killState === 'WIN' ? 'ENEMY_TURN' : 'PLAYER_TURN';

    if (killState === 'WIN') {
      this.state = 'ENEMY_TURN';
      this.time.delayedCall(800, () => {
        this.handleAction(this.enemy, this.player, 'LOSE');
      });
    } else { // 적이 행동한 경우
      this.state = 'PLAYER_COMMAND';
      this.infoText.setText('플레이어의 턴입니다. 명령을 선택하세요.');
      this.updateCommandHighlight();
    }
  }

}