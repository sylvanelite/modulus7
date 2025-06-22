
import { ISpatialHash, SpatialHash } from '../spatialHash.mjs';
import { EngineInstance, ISpriteDescription, Utils } from '../lib/definitions.mjs';
import { World } from '../lib/index.mjs';
import { Physics } from './physics.mjs';
import { Position } from './position.mjs';
import { Drawing, SpriteComponent } from './sprite.mjs';

enum BulletKind{
    Simple,
    Flame,
    Missile,
    Mine,
    Sword,
    Beam,
    Shot,
    Machine,

    Explode
}
interface IWeapon{
    kind:BulletKind,//what to shoot
    level:0|1|2,//how much the weapon has been upgraded 
    rate:number,//how long between shots
    cooldown:number,//running count of time since last shot
    angle:number//only used by machine to keep track of where last shot was
}
class Weapon{
    static createWeapon(kind:BulletKind):IWeapon{
        let rate = 10;
        switch(kind){
            case BulletKind.Simple:  rate = 10;break;
            case BulletKind.Flame:   rate = 6;break;
            case BulletKind.Missile: rate = 12;break;
            case BulletKind.Mine:    rate = 15;break;
            case BulletKind.Sword:   rate = 40;break;
            case BulletKind.Beam:    rate = 20;break;
            case BulletKind.Shot:    rate = 30;break;
            case BulletKind.Machine: rate = 6;break;
        }
        return {
            kind,
            level:0,
            rate,
            cooldown:0,
            angle:0
        }
    }
    //call every frame to update shooting 
    static shoot(instance:EngineInstance,
        x:number,y:number,z:number,angle:number,
        weapon:IWeapon){
        weapon.cooldown-=1;
        if(weapon.cooldown>0){return;}//waiting for cooldown before next shot
        weapon.cooldown = weapon.rate;//shoot
        if(weapon.kind==BulletKind.Simple){
            if(weapon.level==0){
                //shoot x
                createBullet(instance,x,y,z,angle,weapon.kind);
                return;
            }
            const gap = 3;
            const xOff = Math.cos((angle+90)*Utils.DEG_TO_RAD)*gap;
            const yOff = Math.sin((angle+90)*Utils.DEG_TO_RAD)*gap;
            if(weapon.level==1){
                //shoot +x,-x
                createBullet(instance,x+xOff,y+yOff,z,angle,weapon.kind);
                createBullet(instance,x-xOff,y-yOff,z,angle,weapon.kind);
                return;
            }
            if(weapon.level==2){
                //shoot +x,x,-x
                createBullet(instance,x+xOff,y+yOff,z,angle,weapon.kind);
                createBullet(instance,x,y,z,angle,weapon.kind);
                createBullet(instance,x-xOff,y-yOff,z,angle,weapon.kind);
                return;
            }
        }
        if(weapon.kind==BulletKind.Flame){
            //base case, shoot ~1-2
            let amount = 1+Math.ceil(Math.random());
            if(weapon.level==1){
                //shoot ~1-4
                amount += Math.ceil(Math.random()*2);
            }
            if(weapon.level==2){
                //shoot ~1-6
                amount += Math.ceil(Math.random()*2);
            }
            for(let i=0;i<amount;i+=1){
                const flameAngle = angle+(Math.random()*10-Math.random()*10);
                createBullet(instance,x,y,z,flameAngle,weapon.kind);
            }
            return;
        }
        if(weapon.kind==BulletKind.Missile){
            //shoot x
            const gap = 4;
            const xOff = Math.cos((angle+90)*Utils.DEG_TO_RAD)*gap;
            const yOff = Math.sin((angle+90)*Utils.DEG_TO_RAD)*gap;
            if(weapon.level==0){
                //shoot x
                createBullet(instance,x,y,z,angle,weapon.kind);
                return;
            }
            if(weapon.level==1){
                weapon.cooldown = weapon.cooldown/2;
                //use angle to toggle shooting from left or right
                if(weapon.angle==0){
                    //-x
                    weapon.angle=1;
                    createBullet(instance,x-xOff,y-yOff,z,angle,weapon.kind);
                }
                if(weapon.angle==1){
                    //+x
                    weapon.angle=0;
                    createBullet(instance,x+xOff,y+yOff,z,angle,weapon.kind);
                }
                return;
            }
            if(weapon.level==2){
                weapon.cooldown = weapon.cooldown/2;
                //-x && +x
                createBullet(instance,x-xOff,y-yOff,z,angle,weapon.kind);
                createBullet(instance,x+xOff,y+yOff,z,angle,weapon.kind);
                return;
            }
        }
        if(weapon.kind==BulletKind.Mine){
            //shoot x
            createBullet(instance,x,y,z,Math.random()*360,weapon.kind);
            if(weapon.level==1){
                weapon.cooldown = weapon.cooldown/2;
            }
            if(weapon.level==2){
                weapon.cooldown = weapon.cooldown/3;
            }
        }
        if(weapon.kind==BulletKind.Sword){
            //shoot x
            createBullet(instance,x,y,z,angle,weapon.kind);
            if(weapon.level==1){
                weapon.cooldown = weapon.cooldown/2;
            }
            if(weapon.level==2){
                weapon.cooldown = weapon.cooldown/3;
            }
        }
        if(weapon.kind==BulletKind.Beam){
            //shoot x
            createBullet(instance,x,y,z,angle,weapon.kind);
        }
        if(weapon.kind==BulletKind.Shot){
            //shoot x
            for(let i=0;i<6;i+=1){
                const shotAngle = angle+Math.random()*15-Math.random()*15; 
                createBullet(instance,x,y,z,shotAngle,weapon.kind);
            }
            if(weapon.level==1){
                weapon.cooldown = weapon.cooldown/2;
            }
            if(weapon.level==2){
                weapon.cooldown = weapon.cooldown/3;
            }
        }
        if(weapon.kind==BulletKind.Machine){
            const maxAngle = 60;
            weapon.angle+=maxAngle/8;
            weapon.angle = weapon.angle % 60;
            createBullet(instance,x,y,z,angle+weapon.angle-maxAngle/2,weapon.kind);
            //shoot x+angle
            if(weapon.level==1){
                //shoot +angle+90
                createBullet(instance,x,y,z,angle+weapon.angle-maxAngle/2+maxAngle,weapon.kind);
            }
            if(weapon.level==2){
                //shoot +angle+33+33
                createBullet(instance,x,y,z,angle+weapon.angle-maxAngle/2+maxAngle/3,weapon.kind);
                createBullet(instance,x,y,z,angle+weapon.angle-maxAngle/2+maxAngle/3,weapon.kind);
            }
        }
    }
}
class Bullet{
    kind:BulletKind = BulletKind.Simple;
    hasCollided:boolean = false;
    duration:number = 100;
    damage:number = 0;
    pierce:boolean = false;
    static dims(kind:Bullet,pos:Position){
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

function createBullet(instance:EngineInstance,
        x:number,y:number,z:number,angle:number,
        kind:BulletKind,/**TODO: level, combo */){

    const entity =  instance.world.create(new SpriteComponent, new Drawing, new Position,new Physics, new Bullet);
    const drawing = instance.world.get(entity,Drawing);
    drawing.scaleX=8;
    drawing.scaleY=8;
    const position = instance.world.get(entity,Position);
    position.x = x;
    position.y = y;
    position.z = z;
    const physics = instance.world.get(entity,Physics);
    const moveSpeed = -3;
    physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
    physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
    const bullet = instance.world.get(entity,Bullet);
    bullet.kind = kind;
    
    let spriteDesc = instance.sprites.bulletSimple;
    switch(bullet.kind){
        case BulletKind.Simple:
            spriteDesc = instance.sprites.bulletSimple;
            bullet.duration = 100;
            bullet.damage = 10;
            break;
        case BulletKind.Flame:
            spriteDesc = instance.sprites.bulletFlame;
            bullet.duration = 30;
            bullet.damage = 1;
            bullet.pierce = true;
            const flameSpeed = -Math.random()*3;
            physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*flameSpeed;
            physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*flameSpeed;
            physics.velocityZ = Math.random();
            break;
        case BulletKind.Missile:
            spriteDesc = instance.sprites.bulletMissile;
            bullet.duration = 100;
            bullet.damage = 20;
            const missileAccel = 0.2;
            physics.accelerationX = Math.cos(angle*Utils.DEG_TO_RAD)*missileAccel;
            physics.accelerationY = Math.sin(angle*Utils.DEG_TO_RAD)*missileAccel;
            break;
        case BulletKind.Mine:
            spriteDesc = instance.sprites.bulletMine;
            bullet.damage = 10;
            bullet.duration = 100;
            physics.velocityX = 0;
            physics.velocityY = 0;
            physics.velocityZ = 0;
            break;
        case BulletKind.Sword:
            spriteDesc = instance.sprites.bulletSword;
            bullet.duration = 100;
            bullet.damage = 3;
            bullet.pierce = true;
            break;
        case BulletKind.Beam:
            spriteDesc = instance.sprites.bulletBeam;
            bullet.damage = 10;
            bullet.duration = 100;
            break;
        case BulletKind.Shot:
            spriteDesc = instance.sprites.bulletShot;
            bullet.damage = 10;
            const shotSpeed = -6;
            physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*shotSpeed;
            physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*shotSpeed;
            bullet.duration = 20;
            break;
        case BulletKind.Machine:
            spriteDesc = instance.sprites.bulletMachine;
            bullet.damage = 10;
            bullet.duration = 100;
            break;
        case BulletKind.Explode:
            bullet.duration = 10;
            bullet.damage = 2;
            bullet.pierce = true;
            physics.velocityX = 0;
            physics.velocityY = 0;
            physics.velocityZ = 0;
            break;
    }
    const sprite = instance.world.get(entity,SpriteComponent);
    sprite.srcWidth = spriteDesc.srcWidth;//TODO: wrap create() with props copy 
    sprite.srcHeight = spriteDesc.srcHeight;
    sprite.srcX = spriteDesc.srcX;
    sprite.srcY = spriteDesc.srcY;
    sprite.textureIndex = spriteDesc.textureIndex;
    return entity;
}

function updateBullets(instance:EngineInstance,collision:ISpatialHash) {
    instance.world.view(Bullet,Position).each((entity,bullet,position) => {
        if(bullet.hasCollided && !bullet.pierce){
            if(bullet.kind==BulletKind.Missile){
                //TODO: explode
            }
            instance.world.destroy(entity);
            return;
        }
        bullet.duration -=1;
        if(bullet.duration <=0){
            instance.world.destroy(entity);
            return;
        }
        //todo: set size based on bullet.kind
        const size =Bullet.dims(bullet,position);
        SpatialHash.add(collision,entity,size.x,size.y,size.width,size.height);

    });
}

export {Bullet,updateBullets,createBullet, BulletKind,Weapon, type IWeapon}