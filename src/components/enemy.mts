
import { ISpatialHash, SpatialHash } from '../spatialHash.mjs';
import { EngineInstance, Utils } from '../lib/definitions.mjs';
import { Colour, EngineSound } from '../lib/index.mjs';
import { Physics } from './physics.mjs';
import { Position } from './position.mjs';
import { Drawing, SpriteComponent } from './sprite.mjs';
import { Bullet, BulletKind } from './bullet.mjs';
import { Player } from './player.mjs';
import { createEmitter, EmitterKind } from './emitter.mjs';

enum EnemyKind{
    Simple,
    Green,
    Blue,
    Yellow,
    Orange,
    RedX,
    RedVert,
    RedHoriz,
}
class Enemy{
    hp = 0;
    kind:EnemyKind = EnemyKind.Simple;
    static dims(kind:Enemy,pos:Position){
        //TODO: switch on kind
        return {
            x:pos.x-2,
            y:pos.y-2,
            z:pos.z-2,
            width:4,
            height:4,
            depth:4
        };
    }
}

function createEnemy(instance:EngineInstance,
        x:number,y:number,z:number,
        kind:EnemyKind){

    EngineSound.play(instance,
        Math.random()<0.5?instance.audio.sfx_spawnA:instance.audio.sfx_spawnB,
        undefined,1,1,1,false);

    const entity =  instance.world.create(new SpriteComponent,new Drawing,new Position,new Physics, new Enemy);
    const position = instance.world.get(entity,Position);
    position.x = x;
    position.y = y;
    position.z = z;
    const drawing = instance.world.get(entity,Drawing);
    drawing.scaleX = 4;
    drawing.scaleY = 4;
    const enemy = instance.world.get(entity,Enemy);
    enemy.kind = kind;
    enemy.hp = 10;
    const sprite = instance.world.get(entity,SpriteComponent);
    let spriteDesc = instance.sprites.enemyGreen;
    switch(enemy.kind){
        case EnemyKind.Simple:
            spriteDesc = instance.sprites.enemySimple;
            enemy.hp= 10;
            break;
        case EnemyKind.Green:
            spriteDesc = instance.sprites.enemyGreen;
            enemy.hp= 50;
            break;
        case EnemyKind.Blue:
            spriteDesc = instance.sprites.enemyBlue;
            enemy.hp= 100;
            break;
        case EnemyKind.Yellow:
            spriteDesc = instance.sprites.enemyYellow;
            enemy.hp= 20;
            break;
        case EnemyKind.Orange:
            spriteDesc = instance.sprites.enemyOrange;
            enemy.hp= 30;
            break;
        case EnemyKind.RedX:
            spriteDesc = instance.sprites.enemyRedX;
            enemy.hp= 10;
            break;
        case EnemyKind.RedVert:
            spriteDesc = instance.sprites.enemyRedVert;
            enemy.hp= 10;
            break;
        case EnemyKind.RedHoriz:
            spriteDesc = instance.sprites.enemyRedHoriz;
            enemy.hp= 10;
            break;
        default:
            spriteDesc = instance.sprites.enemyDefault;
            enemy.hp= 10;
            break;
    }
    sprite.srcWidth = spriteDesc.srcWidth;
    sprite.srcHeight = spriteDesc.srcHeight;
    sprite.srcX = spriteDesc.srcX;
    sprite.srcY = spriteDesc.srcY;
    sprite.textureIndex = spriteDesc.textureIndex;
    enemy.kind = kind;
    return entity;
}

function updateEnemies(instance:EngineInstance,collision:ISpatialHash, player:Player) {
    instance.world.view(Enemy,Position,Physics).each((entity,enemy,position,physics) => {
        if(enemy.hp<=0){
            EngineSound.play(instance,
                Math.random()<0.5?instance.audio.sfx_explodeA:instance.audio.sfx_explodeB,
                undefined,1,1,1,false);

            //console.log("DESTROY",entity);
            instance.world.destroy(entity);
            createEmitter(instance,position.x,position.y,position.z,EmitterKind.Explode);
            switch(enemy.kind){
                case EnemyKind.Simple: player.expEarned+=10; break;
                case EnemyKind.Green: player.expEarned+=50; break;
                case EnemyKind.Blue: player.expEarned+=30; break;
                case EnemyKind.Yellow: player.expEarned+=30; break;
                case EnemyKind.Orange: player.expEarned+=30; break;
                case EnemyKind.RedX: player.expEarned+=55; break;
                case EnemyKind.RedVert: player.expEarned+=55; break;
                case EnemyKind.RedHoriz: player.expEarned+=55; break;
                default: player.expEarned+=10; break;
            }
            return;
        }
        //depth
        if(position.z>player.position.z){
            position.z-=10;
            if(position.z<player.position.z){
                position.z=player.position.z;
            }
        }
        //TODO: switch kind and update, e.g. shoot at player, move towards, etc...
        const selfDims =Enemy.dims(enemy,position);

        const collisions = SpatialHash.query(collision,selfDims.x,selfDims.y,selfDims.width,selfDims.height);
        let wasHit = false;
        for(const c of collisions){
            //if(!world.has(c,Bullet)){console.warn("colliding with something other than a bullet");return;}
            const bullet = instance.world.get(c,Bullet);
            const bulletPos = instance.world.get(c,Position);
            if(bullet.hasCollided){continue;}
            
            const bulletDims =Bullet.dims(bullet,bulletPos);
            if(!SpatialHash.collision(
                selfDims.x,selfDims.y,selfDims.z,selfDims.width,selfDims.height,selfDims.depth,
                bulletDims.x,bulletDims.y,bulletDims.z,bulletDims.width,bulletDims.height,bulletDims.depth,
                )){
                continue;
            }
            //console.log("COLLIDE")
            bullet.hasCollided = true;
            //TODO: rate limit damage?
            enemy.hp-=bullet.damage;

            EngineSound.play(instance,
                Math.random()<0.5?instance.audio.sfx_hitA:instance.audio.sfx_hitB,
                undefined,1,1,1,false);

            wasHit=true;

        }
        if(wasHit){
            const drawing = instance.world.get(entity,Drawing);
            drawing.colour = Colour.rgb(1,0,0,0.1);//set to red
            createEmitter(instance,position.x,position.y,position.z,EmitterKind.Hit);
        }else{
            const drawing = instance.world.get(entity,Drawing);
            drawing.colour.a+=0.1;//clear red
            if(drawing.colour.a>0.9){
                drawing.colour.a=1;
                drawing.colour.r=1;
                drawing.colour.g=1;
                drawing.colour.b=1;
            }
        }
        //check collision player
        if(SpatialHash.collision(
            selfDims.x,selfDims.y,selfDims.z,selfDims.width,selfDims.height,selfDims.depth,
            player.position.x,player.position.y,player.position.z,4,4,4)){
            player.hp-=0.2;
            
            
            if(Math.random()>0.95){
                EngineSound.play(instance,instance.audio.sfx_hitC,
                    undefined,0.5,1,1,false);
                createEmitter(instance,position.x,position.y,position.z,EmitterKind.Smoke);
            }
        }
        
        let tgtX = player.position.x;
        let tgtY = player.position.y;
        //if too far from player, teleport closeby but out of view (behind the player)
        const dist = Math.sqrt((tgtX - position.x)**2 + (tgtY - position.y)**2);
        if(dist>512){//arbitrary threshold           
            //not too close to player
            const distBehind = -50-Math.random()*100;
            //give a bit of spread to teleport
            const facing = player.facing+Math.random()*10-Math.random()*10;
            position.x = player.cameraPosition.x - Math.cos(facing*Utils.DEG_TO_RAD)*distBehind;
            position.y = player.cameraPosition.y - Math.sin(facing*Utils.DEG_TO_RAD)*distBehind;
            position.z = player.cameraPosition.z;
            return;
        }
        let moveSpeed = 0.4;
        //move towards player
        switch(enemy.kind){
            //move towards player
            case EnemyKind.Simple:  break;
            case EnemyKind.Green:  break;
            //move in front of player
            case EnemyKind.Blue:  
            case EnemyKind.Yellow:
                if(dist>36){
                    tgtX = player.position.x - Math.cos(player.facing*Utils.DEG_TO_RAD)*34;
                    tgtY = player.position.y - Math.sin(player.facing*Utils.DEG_TO_RAD)*34;
                }
                moveSpeed=1;
                break;
            //move in front and to the sides
            case EnemyKind.Orange: 
            case EnemyKind.RedX: 
                if(dist>36){
                    const facingAngle = entity%2==0?player.facing+20:player.facing-20;
                    tgtX = player.position.x - Math.cos(facingAngle*Utils.DEG_TO_RAD)*34;
                    tgtY = player.position.y - Math.sin(facingAngle*Utils.DEG_TO_RAD)*34;
                }
                moveSpeed=0.7;
                break;
            //move in from sides
            case EnemyKind.RedVert: 
            case EnemyKind.RedHoriz: 
                if(dist>36){   
                    const facingSide = entity%2==0?player.facing+90:player.facing-90;
                    tgtX = player.position.x - Math.cos(facingSide*Utils.DEG_TO_RAD)*34;
                    tgtY = player.position.y - Math.sin(facingSide*Utils.DEG_TO_RAD)*34;
                }
                moveSpeed = 0.4;
                break;
        }
        const angle = Math.atan2(tgtY-position.y, tgtX-position.x);
        physics.velocityX = Math.cos(angle)*moveSpeed;
        physics.velocityY = Math.sin(angle)*moveSpeed;

    });
}

export {Enemy,updateEnemies,createEnemy,EnemyKind}