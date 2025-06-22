
import { EngineInstance, IGLSpriteRenderer, Utils } from '../lib/definitions.mjs';
import { BulletKind, createBullet, IWeapon, Weapon } from './bullet.mjs';
import { Position } from './position.mjs';
import { EngineInput } from '../lib/engineInput.mjs';
import { Emitter } from './emitter.mjs';
import { EngineMath } from '../lib/engineMath.mjs';
import { GLSpriteRenderer } from '../lib/GLSpriteRenderer.mjs';
import { Colour } from '../lib/colour.mjs';
import { changeMode, IGameMode, ModeKind } from './gameMode.mjs';
import { EngineSound } from '../lib/index.mjs';


class Player{
    position:Position = new Position();//ship positions (in front of camera)
    cameraPosition:Position = new Position();//camera positions in pixels. z is height
    facing:number = 0;//camera angle in degrees
    hp:number=100;
    maxHp:number=100;
    weaponA:IWeapon;
    weaponB:IWeapon;
    weaponC:IWeapon;

    bonusHP:number=0;//should be an int, e.g. 10
    bonusSpeed:number=0;//should be a float, e.g. 0.2
    bonusFireRate:number=0;//1 tick per frame, should be a float, e.g 0.2
    bonusRegen:number=0;//float, e.g. 0.5

    engineEmitter:number = 0;
    shieldEmitter:number = 0;

    level:number = 1;
    exp:number = 0;
    expEarned:number = 0;

    constructor(instance:EngineInstance){
        Player.resetPlayer(this);
    }
    static resetPlayer(player:Player){
        player.hp = 100;
        player.maxHp=100;

        player.bonusHP = 0;
        player.bonusSpeed = 0;
        player.bonusFireRate = 0;
        player.bonusRegen = 0;
        
        player.cameraPosition.x=256;
        player.cameraPosition.y=256;
        player.cameraPosition.z=15;

        player.facing=90;
        player.weaponA = Weapon.createWeapon(BulletKind.Simple);
        player.weaponA.level = 0;
        player.weaponB = undefined;
        player.weaponC = undefined;
        player.level = 1;
        player.exp = 0;
        player.expEarned = 0;
    }
    static updatePlayer(instance:EngineInstance,player:Player,) {
        if(player.hp<=0){
            player.hp=0;
            //TODO: death animation
            //TDOO: reset game (spwan, hp, etc)
            EngineSound.play(instance,
                instance.audio.sfx_explodeC,
                undefined,1,1,1,false);
            changeMode(instance,ModeKind.LevelOverMenu);
            return;
        }
        const turnRate = 1;
        const moveSpeed =1+player.bonusSpeed;
        //doesn't need to be ECS, there's only 1 player
        if (EngineInput.keyIsDown(instance,'KeyW' as any) ||
            EngineInput.gamepadStick(instance,0)?.y>0.5){
            player.cameraPosition.x -= Math.cos(player.facing*Utils.DEG_TO_RAD)*moveSpeed;
            player.cameraPosition.y -= Math.sin(player.facing*Utils.DEG_TO_RAD)*moveSpeed;
        }
        if (EngineInput.keyIsDown(instance,'KeyS' as any) ||
            EngineInput.gamepadStick(instance,0)?.y<-0.5){
            player.cameraPosition.x += Math.cos(player.facing*Utils.DEG_TO_RAD)*(moveSpeed*0.5);
            player.cameraPosition.y += Math.sin(player.facing*Utils.DEG_TO_RAD)*(moveSpeed*0.5);
            
        }
        let strafe = EngineInput.keyIsDown(instance,'ShiftLeft' as any)||
                     EngineInput.keyIsDown(instance,'ShiftRight' as any);

        if (EngineInput.keyIsDown(instance,'KeyA' as any) ||
            EngineInput.gamepadStick(instance,0)?.x<-0.5){
            if(!strafe){
                player.facing-=turnRate;
                if(player.facing<0){player.facing+=360;}
            }else{
                player.cameraPosition.x += Math.cos((player.facing+90)*Utils.DEG_TO_RAD)*(moveSpeed*0.75);
                player.cameraPosition.y += Math.sin((player.facing+90)*Utils.DEG_TO_RAD)*(moveSpeed*0.75);
            }
        }
        if (EngineInput.keyIsDown(instance,'KeyD' as any) ||
            EngineInput.gamepadStick(instance,0)?.x>0.5){
            if(!strafe){
                player.facing+=turnRate;
                if(player.facing>=360){player.facing-=360;}
            }else{
                player.cameraPosition.x -= Math.cos((player.facing+90)*Utils.DEG_TO_RAD)*(moveSpeed*0.75);
                player.cameraPosition.y -= Math.sin((player.facing+90)*Utils.DEG_TO_RAD)*(moveSpeed*0.75);
            }
        }
        
        const playerDist = 32;
        player.position.x = player.cameraPosition.x - Math.cos(player.facing*Utils.DEG_TO_RAD)*playerDist;
        player.position.y = player.cameraPosition.y - Math.sin(player.facing*Utils.DEG_TO_RAD)*playerDist;
        player.position.z = player.cameraPosition.z;
        if(player.weaponA){
            player.weaponA.cooldown-=player.bonusFireRate;
            Weapon.shoot(instance,
                player.position.x,
                player.position.y,
                player.position.z,
                player.facing,player.weaponA);
        }
        if(player.weaponB){
            player.weaponB.cooldown-=player.bonusFireRate;
            Weapon.shoot(instance,
                player.position.x,
                player.position.y,
                player.position.z,
                player.facing,player.weaponB);
        }
        if(player.weaponC){
            player.weaponC.cooldown-=player.bonusFireRate;
            Weapon.shoot(instance,
                player.position.x,
                player.position.y,
                player.position.z,
                player.facing,player.weaponC);
        }
        if(player.bonusRegen && player.hp<player.maxHp){
            player.hp+=player.bonusRegen;
            if(player.hp>player.maxHp){
                player.hp=player.maxHp;
            }
        }
        
        //update effects locations
        const enginePos = instance.world.get(player.engineEmitter,Position);
        const shieldPos = instance.world.get(player.shieldEmitter,Position);
        enginePos.x = player.cameraPosition.x - Math.cos(player.facing*Utils.DEG_TO_RAD)*(playerDist-4);
        enginePos.y = player.cameraPosition.y - Math.sin(player.facing*Utils.DEG_TO_RAD)*(playerDist-4);
        enginePos.z = player.cameraPosition.z;
        shieldPos.x = player.cameraPosition.x - Math.cos(player.facing*Utils.DEG_TO_RAD)*(playerDist-4);
        shieldPos.y = player.cameraPosition.y - Math.sin(player.facing*Utils.DEG_TO_RAD)*(playerDist-4);
        shieldPos.z = player.cameraPosition.z;
        const engineEmit = instance.world.get(player.engineEmitter,Emitter);
        engineEmit.duration = 10;

        //convert earned exp into real exp
        const maxExpPerFrame = 4;
        const earningFactor  = player.level;
        let levelUp = false;
        if(player.expEarned>0){
            for(let i=0;i<maxExpPerFrame;i+=1){
                //expEarned goes up linearly, reduce player's gain based on level (earningFactor)
                const gain = 0.25/earningFactor;
                player.exp+=gain;
                player.expEarned-=1;
                if(player.expEarned<=0){
                    player.expEarned=0;
                    break;
                }
            }
            //check for level up
            if(player.exp>=100){
                player.exp-=100;
                player.level+=1;
                levelUp = true;
            }
        }
        //assumes can't get more than 1 level per increment
        if(levelUp){
            EngineSound.play(instance,
                instance.audio.sfx_levelup,
                undefined,1,1,1,false);
            changeMode(instance,ModeKind.LevelUpMenu);
        }


    }
    static drawPlayer(instance:EngineInstance,player:Player,spriteLayer:IGLSpriteRenderer){
        
        GLSpriteRenderer.beginFrame(instance,spriteLayer);    
        const screenPos = EngineMath.vec2( instance.domCanvas.width/2,
            instance.domCanvas.height/2+24);
        //draw ship
        let sprite = instance.sprites.player;
        
        const mode:IGameMode = (instance as unknown as any ).mode;
        if(mode.mode == ModeKind.Game){
            if (EngineInput.keyIsDown(instance,'KeyW' as any)){
                screenPos.y+=4;
            }
            if (EngineInput.keyIsDown(instance,'KeyS' as any)){
                screenPos.y-=4;
            }
            if (EngineInput.keyIsDown(instance,'KeyA' as any)){
                sprite=instance.sprites.playerRight;
                screenPos.x+=6;
            }
            if (EngineInput.keyIsDown(instance,'KeyD' as any)){
                sprite=instance.sprites.playerLeft;
                screenPos.x-=6;
            }
        }
        //draw engine
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprite,            
            screenPos.x,
            screenPos.y,
            2,2,0,Colour.rgbaInt(Colour.rgb()));
        
        //draw UI
        //playerExp
        const expBarWidth = 200;//arbitrary scale factor to match screen
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.playerExp,
            instance.domCanvas.width/2,4, player.exp/100 * expBarWidth,2,0,Colour.rgbaInt(Colour.rgb()));
        //player HP
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.playerHpMax,
            instance.domCanvas.width/2,8, expBarWidth,2,0,Colour.rgbaInt(Colour.rgb()));
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.playerHp,
            instance.domCanvas.width/2,8, player.hp/player.maxHp * expBarWidth,2,0,Colour.rgbaInt(Colour.rgb()));
        
        
        //which weapons player has unlocked
        if(player.weaponA){
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.weaponGui,
                instance.domCanvas.width/4-4, 32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
            const sprA = Player.getSprWeapon(instance,player.weaponA);
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprA,
                    instance.domCanvas.width/4, 32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                if(player.weaponA.level>=1){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprA,
                    instance.domCanvas.width/4+16,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
                if(player.weaponA.level>=2){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprA,
                    instance.domCanvas.width/4+32,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
        }
        if(player.weaponB){
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.weaponGui,
                instance.domCanvas.width/2-4,  32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
            const sprB = Player.getSprWeapon(instance,player.weaponB);
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprB,
                    instance.domCanvas.width/2, 32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                if(player.weaponB.level>=1){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprB,
                    instance.domCanvas.width/2+16,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
                if(player.weaponB.level>=2){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprB,
                    instance.domCanvas.width/2+32,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
        }
        if(player.weaponC){
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.weaponGui,
                instance.domCanvas.width*.75-4, 32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
            const sprC = Player.getSprWeapon(instance,player.weaponC);
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprC,
                    instance.domCanvas.width*.75, 32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                if(player.weaponC.level>=1){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprC,
                    instance.domCanvas.width*.75+16,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
                if(player.weaponC.level>=2){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprC,
                    instance.domCanvas.width*.75+32,32, 4,4,0,Colour.rgbaInt(Colour.rgb()));
                }
        }

        if(Player.#lastDrawnHP>player.hp){
            Player.#lastDrawnHP -=0.1;
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.portraitHit,
                16,32, 2,2,0,Colour.rgbaInt(Colour.rgb()));
        }else{
            Player.#lastDrawnHP =player.hp;
            const s = Math.floor(new Date().getMilliseconds()/100);
            if(s%10!=0){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.portraitA,
                    16,32, 2,2,0,Colour.rgbaInt(Colour.rgb()));
            }else{
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.portraitB,
                    16,32, 2,2,0,Colour.rgbaInt(Colour.rgb()));
            }
        }
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.portraitOverlay,
            16,32, 2,2,0,Colour.rgbaInt(Colour.rgb()));

        
        GLSpriteRenderer.glFlush(instance,spriteLayer);
    }
    static #lastDrawnHP = 0;//kludge to manage sprite state

    static getSprWeapon(instance:EngineInstance,weapon:IWeapon){
        switch(weapon.kind){
            case BulletKind.Simple: return instance.sprites.bulletSimple;
            case BulletKind.Flame: return instance.sprites.bulletFlame;
            case BulletKind.Missile: return instance.sprites.bulletMissile;
            case BulletKind.Mine: return instance.sprites.bulletMine;
            case BulletKind.Sword: return instance.sprites.bulletSword;
            case BulletKind.Beam: return instance.sprites.bulletBeam;
            case BulletKind.Shot: return instance.sprites.bulletShot;
            case BulletKind.Machine: return instance.sprites.bulletMachine;
        }
    }
}



export {Player}