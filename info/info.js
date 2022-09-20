export const GunInfo = {
  bite: {
    maxAmmo: 3,
    timeBetweenShots: 1000,
    bulletsPerShot: 1,
    spread: 0,
    reloadTime: 2000,
    bulletInfoKey: 'bite',
  },
  rifle: {
    maxAmmo: 30,
    timeBetweenShots: 100,
    bulletsPerShot: 1,
    spread: 0.1,
    reloadTime: 1000,
    bulletInfoKey: 'rifle',
  },
  shotgun: {
    maxAmmo: 8,
    timeBetweenShots: 500,
    bulletsPerShot: 6,
    spread: 0.2,
    reloadTime: 1500,
    bulletInfoKey: 'shotgun',
  }
}

export const BulletInfo = {
  bite: {
    type: 'attack',
    life: 1,
    damage: 10,
    speed: 0,
    lifeSpan: 1,
    size: 10,
    boundingPoints: [
      [ -1, -1 ],
      [  1,  0 ],
      [ -1,  1 ],
    ],
  },
  rifle: {
    type: 'attack',
    life: 1,
    damage: 10,
    speed: 0.9,
    size: 2,
    boundingPoints: [
      [ -1, -1 ],
      [  1,  0 ],
      [ -1,  1 ],
    ],
    color: 'gray',
    trailLength: 40,
  },
  shotgun: {
    type: 'attack',
    life: 1,
    damage: 10,
    speed: 1.2,
    size: 1,
    boundingPoints: [
      [ -1, -1 ],
      [  1,  0 ],
      [ -1,  1 ],
    ],
    color: 'darkgoldenrod',
    trailLength: 60,
  }
}

const CirclePath = new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' );

export const WallInfo = {
  rock: {
    type: 'wall',
    size: 1,
    life: Infinity,
    damage: 1,
    hit: {
      types: [ 'attack' ],
      count: 5,
      spread: 1,
      maxSpeed: 0.2,
      particle: {
        lifeSpan: 500,
        size: 4,
        drawPaths: [ {
          fillStyle: 'saddlebrown',
          path: CirclePath,
        } ],
      }
    },
    fillStyle: 'saddlebrown',
  }
}

const GUN_W = 0.15, GUN_LEN = 1.7;


function getBloodParticle( color ) {
  return {
    type: 'particle',
    lifeSpan: 500,
    size: 3,
    drawPaths: [ {
      fillStyle: color,
      path: CirclePath,
    } ],
  }
}

export const ActorInfo = {
  marine: {
    type: 'actor',
    life: 100,
    damage: 1,
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 14,
    boundingPoints: [
      [ -0.5, -1 ],
      [  2.0,  0 ],
      [ -0.5,  1 ],
    ],
    guns: [ {
      gunInfoKey: 'rifle',
      offset: { front: 2.6, side: 0, angle: 0 }
    } ],
    hit: {
      types: [ 'attack' ],
      count: 10,
      spread: 2,
      maxSpeed: 0.05,
      particle: getBloodParticle( 'red' ),
    },
    drawPaths: [ {
      fillStyle: 'gray',
      path: new Path2D( `M 0.5 ${ -GUN_W } L ${ GUN_LEN } ${ -GUN_W } L ${ GUN_LEN } ${ GUN_W } L 0.5 ${ GUN_W } Z` ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( `M 0 -1 L 1.5 ${ -GUN_W } L 1.2 ${ -GUN_W } L 0 -0.5 Z` ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( `M 0 1 L 1.2 ${ GUN_W } L 1 ${ GUN_W } L 0 0.5 Z` ),
    }, {
      fillStyle: 'darkblue',
      path: new Path2D( 'M 0 -1 A 0.3 1 0 0 1 0 1 A 0.3 1 0 0 1 0 -1' ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' ),
    } ],
  },
  alien: {
    type: 'actor',
    life: 50,
    damage: 1,
    maxSpeed: 0.06,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 10,
    boundingPoints: [
      [ -1,  0 ],
      [  1, -1 ],
      [  1,  1 ],
    ],
    guns: [ {
      gunInfoKey: 'bite',
      offset: { front: 2.6, side: 0, angle: 0 }
    } ],
    hit: {
      types: [ 'attack' ],
      count: 10,
      spread: 2,
      maxSpeed: 0.05,
      particle: getBloodParticle( 'cyan' ),
    },
    drawPaths: [ {
      fillStyle: 'green',
      path: new Path2D( 'M -1 0 L 0.75 -1 A 0.5 1 0 0 1 0.75 1 Z' ),
    } ],
  }
}