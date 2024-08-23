import chalk from 'chalk';
import readlineSync from 'readline-sync';

class Player {
  constructor() {
    this.hp = 100;
    this.attackPower = 10;
    this.defensePower = 5;
    this.stageClearCount = 0; 
  }

  get maxHp() {
    return 100 + this.stageClearCount * 30; 
  }

  attack(monster, stage) {
    const baseDamage = Math.floor(Math.random() * this.attackPower) + 1;
    const isCritical = Math.random() < 0.1 + 0.01 * stage;
    const damage = isCritical ? baseDamage * 2 : baseDamage;
    monster.hp -= damage;
    return { damage, isCritical };
  }

  multiAttack(monster, stage) {
    const numAttacks = Math.random() < 0.2 ? Math.floor(Math.random() * 2) + 2 : 1;
    let totalDamage = 0;
    for (let i = 0; i < numAttacks; i++) {
      const damage = Math.floor(Math.random() * this.attackPower) + 1;
      monster.hp -= damage;
      totalDamage += damage;
    }
    return { totalDamage, numAttacks };
  }

  defend() {
    return Math.random() < 0.5 ? Math.floor(Math.random() * this.defensePower) + 1 : 0;
  }

  heal() {
    this.hp = Math.min(this.hp + 20, this.maxHp); 
  }

  increaseStats() {
    this.attackPower += Math.floor(Math.random() * 5) + 5;
    this.defensePower += Math.floor(Math.random() * 4) + 3;
    this.stageClearCount++; 
    this.hp = Math.min(this.hp + 20, this.maxHp); 
  }

  tryPersist(stage) {
    if (Math.random() < 0.5) {
      this.hp = Math.max(this.hp, Math.floor(50 + stage * 15 / 2)); 
      return true;
    }
    return false;
  }

  counterAttack(monster, stage) {
    const baseDamage = Math.floor(Math.random() * this.attackPower) + 1;
    const isCritical = Math.random() < 0.1 + 0.01 * stage;
    const damage = isCritical ? baseDamage * 2 : baseDamage;
    monster.hp -= damage;
    return { damage, isCritical };
  }
}

class Monster {
  constructor(stage) {
    this.hp = 50 + stage * 10;
    this.attackPower = 5 + stage;
    this.counterChance = Math.min(0.1 + 0.01 * stage, 0.5);
  }

  attack(player) {
    const damage = Math.floor(Math.random() * this.attackPower) + 1;
    const counter = Math.random() < this.counterChance;
    return { damage, counter };
  }

  increaseStats(stage) {
    this.hp += Math.floor(Math.random() * (stage * 10)) + 10;
    this.attackPower += Math.floor(Math.random() * stage) + 1;
  }
}

function displayStatus(stage, player, monster) {
  console.log(chalk.magentaBright(`\n=== Current Status ===`));
  console.log(
    chalk.cyanBright(`| Stage: ${stage} `) +
    chalk.blueBright(`| 플레이어 HP: ${player.hp} `) +
    chalk.blueBright(`| 플레이어 공격력: ${player.attackPower} `) +
    chalk.blueBright(`| 플레이어 방어력: ${player.defensePower} `) +
    chalk.redBright(`| 몬스터 HP: ${monster.hp} `) +
    chalk.redBright(`| 몬스터 공격력: ${monster.attackPower} |`)
  );
  console.log(chalk.magentaBright(`=====================\n`));
}

function handleMonsterAttack(player, monster, logs, defense, counterSuccess) {
  if (counterSuccess) {
    const { damage } = monster.attack(player);
    const counterDamage = Math.floor(damage * 1.5);
    monster.hp -= counterDamage;
    return true;
  }

  const { damage, counter } = monster.attack(player);
  let effectiveDamage = damage;

  if (defense > 0) {
    if (defense >= damage) {
      logs.push(chalk.blue(`플레이어가 완벽히 방어했습니다. 몬스터의 공격을 차단하고 물약을 마십니다.`));
      player.hp = Math.min(player.hp + 30, player.maxHp);
      logs.push(chalk.green(`플레이어가 물약을 사용해 체력을 30 회복하였습니다. 현재 HP: ${player.hp}`));
      return false; 
    } else {
      logs.push(chalk.blue(`플레이어가 몬스터의 공격을 일부 방어했습니다.`));
      effectiveDamage -= defense;
      player.hp -= effectiveDamage;
      logs.push(chalk.red(`몬스터가 플레이어에게 ${effectiveDamage}의 피해를 주었습니다.`));
    }
  } else {
    player.hp -= effectiveDamage;
    logs.push(chalk.red(`몬스터가 플레이어에게 ${effectiveDamage}의 피해를 주었습니다.`));
  }

  return false;
}

const battle = async (stage, player, monster) => {
  let logs = [];

  const getStageIncrease = () => Math.random() * 0.02 + 0.01;

  const attackBaseChance = 0.20;
  const multiAttackBaseChance = 0.15;
  const fleeBaseChance = 0.03;
  const counterBaseChance = 0.25;

  const attackChance = Math.min(attackBaseChance + getStageIncrease() * (stage - 1), 0.35);
  const multiAttackChance = Math.min(multiAttackBaseChance + getStageIncrease() * (stage - 1), 0.30);
  const fleeChance = Math.min(fleeBaseChance + getStageIncrease() * (stage - 1), 0.10);
  const counterChance = Math.min(counterBaseChance + getStageIncrease() * (stage - 1), 0.40);

  while (player.hp > 0 && monster.hp > 0) {
    console.clear();
    displayStatus(stage, player, monster);

    logs.forEach((log) => console.log(log));

    console.log(
      chalk.green(
        `\n1. 공격 (${Math.round(attackChance * 100)}%, 데미지 2배) ` +
        `2. 연속공격 (${Math.round(multiAttackChance * 100)}%, 1~3회) ` +
        `3. 방어 후 회복 (50%) ` +
        `4. 카운터 (${Math.round(counterChance * 100)}%, 데미지 1.5배) ` +
        `5. 도망치기 (${Math.round(fleeChance * 100)}%) `,
      ),
    );

    const choice = readlineSync.question('당신의 선택은? ');

    let defense = 0;
    let counterSuccess = Math.random() < counterChance;

    switch (choice) {
      case '1': 
        const { damage: attackDamage, isCritical: attackIsCritical } = player.attack(monster, stage);
        const attackCriticalMessage = attackIsCritical ? ` 크리티컬!` : ``;
        logs.push(chalk.green(`플레이어가 몬스터에게 ${attackDamage}${attackCriticalMessage}의 피해를 주었습니다.`));

        if (monster.hp <= 0) {
          logs.push(chalk.yellow(`몬스터를 처치하였습니다!`));
          player.heal();
          return;
        }

        handleMonsterAttack(player, monster, logs, defense, false);
        break;

      case '2':
        const { totalDamage: multiAttackDamage, numAttacks: multiAttackCount } = player.multiAttack(monster, stage);
        logs.push(chalk.green(`플레이어가 ${multiAttackCount}회 공격하여 몬스터에게 ${multiAttackDamage}의 피해를 주었습니다.`));

        if (monster.hp <= 0) {
          logs.push(chalk.yellow(`몬스터를 처치하였습니다!`));
          player.heal();
          return;
        }

        handleMonsterAttack(player, monster, logs, defense, false);
        break;

      case '3': 
        defense = player.defend();
        logs.push(chalk.blue(`플레이어가 방어를 시도하였습니다.`));

        handleMonsterAttack(player, monster, logs, defense, false);
        break;

      case '4': 
        const { damage: counterDamage, isCritical: counterIsCritical } = player.counterAttack(monster, stage);
        const counterCriticalMessage = counterIsCritical ? ` 크리티컬!` : ``;

        if (counterSuccess) {
          logs.push(chalk.blue(`플레이어가 카운터 공격을 성공하였습니다. 몬스터에게 ${counterDamage}${counterCriticalMessage}의 피해를 주었습니다.`));
        } else {
          logs.push(chalk.red(`카운터 공격이 실패하였습니다. 몬스터가 플레이어에게 ${counterDamage}의 피해를 주었습니다.`));
          player.hp -= counterDamage;
        }

        if (monster.hp <= 0) {
          logs.push(chalk.yellow(`몬스터를 처치하였습니다!`));
          player.heal();
          return;
        }

        break;

      case '5': 
        if (Math.random() < fleeChance) {
          logs.push(chalk.yellow(`플레이어가 도망쳤습니다.`));
          return;
        } else {
          logs.push(chalk.red(`도망치는 데 실패하였습니다.`));
          handleMonsterAttack(player, monster, logs, defense, false);
        }
        break;

      default:
        logs.push(chalk.red(`잘못된 선택입니다.`));
        break;
    }

    if (player.hp <= 0) {
      if (player.tryPersist(stage)) { 
        logs.push(chalk.yellow(`투지가 발동하였습니다! 플레이어의 체력이 ${Math.floor(50 + stage * 15 / 2)}으로 회복되었습니다.`));
      } else {
        logs.push(chalk.red(`플레이어가 패배하였습니다.`));
        return;
      }
    }
  }
};
export async function startGame() {
  console.clear();
  const player = new Player();
  let stage = 1;

  while (stage <= 100) {
    const monster = new Monster(stage);
    await battle(stage, player, monster);

    if (player.hp <= 0) {
      console.log(chalk.red(`게임 오버!`));
      break;
    }

    player.increaseStats();
    monster.increaseStats(stage);
    stage++;
  }

  if (stage > 100) {
    console.log(chalk.green(`축하합니다! 모든 스테이지를 클리어했습니다.`));
  }
}