
import { EngineInstance, IGLSpriteRenderer, ISound, Utils } from '../lib/definitions.mjs';
import { EngineInput } from '../lib/engineInput.mjs';
import { GLSpriteRenderer } from '../lib/GLSpriteRenderer.mjs';
import { EngineSound } from '../lib/index.mjs';
import { changeMode,ModeKind } from './gameMode.mjs';
import { Player } from './player.mjs';
import { BulletKind, IWeapon, Weapon } from './bullet.mjs';
import { Colour } from '../lib/colour.mjs';


enum Options{
    //weapons
    Simple = BulletKind.Simple,
    Flame = BulletKind.Flame,
    Missile = BulletKind.Missile,
    Mine = BulletKind.Mine,
    Sword = BulletKind.Sword,
    Beam = BulletKind.Beam,
    Shot = BulletKind.Shot,
    Machine = BulletKind.Machine,
    //stats
    Hp,
    FireRate,
    Regen,
    Speed
}
function shuffle(array:Array<any>) {
    for (let i = array.length - 1; i > 0; i-=1) {
        let j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
const scaleX = 6;
const scaleY = 6;
const sprY = 128;
class LevelUpMenu{
    sound_click:ISound;
    optionA:Options;
    optionB:Options;
    optionC:Options;
    constructor(instance:EngineInstance){
        this.sound_click=EngineSound.sound(instance,[1,.5]);
        LevelUpMenu.reset(this,null);
    }
    static reset(menu:LevelUpMenu,player:Player){
        menu.optionA = null;
        menu.optionB = null;
        menu.optionC = null;
        if(!player){return;}
        //TOOD: read player and reset
        //player can have up to 3 weapons and X stat boosts
        const options:Array<Options> = [
            Options.Hp,
            Options.FireRate,
            Options.Regen,
            Options.Speed
        ];
        //if player has a weapon, but it's not max level, add level up to the rotation
        if(player.weaponA && player.weaponA.level<2){
            options.push(player.weaponA.kind as unknown as Options);
        }
        if(player.weaponB && player.weaponB.level<2){
            options.push(player.weaponB.kind as unknown as Options);
        }
        if(player.weaponC && player.weaponC.level<2){
            options.push(player.weaponC.kind as unknown as Options);
        }
        //if player has an empty slot, add a random weapon
        const slotOptions = [
            Options.Simple,Options.Flame,Options.Missile,
            Options.Mine,Options.Sword,Options.Beam,
            Options.Shot,Options.Machine];
        //remove curren weapons from slot options
        if(player.weaponA){
            slotOptions.splice(
                slotOptions.indexOf(player.weaponA.kind as unknown as Options),1);
        }
        if(player.weaponB){
            slotOptions.splice(
                slotOptions.indexOf(player.weaponB.kind as unknown as Options),1);
        }
        if(player.weaponC){
            slotOptions.splice(
                slotOptions.indexOf(player.weaponC.kind as unknown as Options),1);
        }
        //for each empty slot, add a slot option
        if(!player.weaponA){
            const option = slotOptions[Math.floor(slotOptions.length*Math.random())];
            options.push(option);
            slotOptions.splice(slotOptions.indexOf(option),1);
        }
        if(!player.weaponB){
            const option = slotOptions[Math.floor(slotOptions.length*Math.random())];
            options.push(option);
            slotOptions.splice(slotOptions.indexOf(option),1);
        }
        if(!player.weaponC){
            const option = slotOptions[Math.floor(slotOptions.length*Math.random())];
            options.push(option);
            slotOptions.splice(slotOptions.indexOf(option),1);
        }
        shuffle(options);
        menu.optionA = options[0];
        menu.optionB = options[1];
        menu.optionC = options[2];
    }
    static updateLevelUpMenu(instance:EngineInstance,menu:LevelUpMenu,player:Player) {
        
        // play sound when mouse is pressed
        if (EngineInput.keyWasPressed(instance,0)){
            EngineSound.play(instance,
                instance.audio.sfx_powerup,
                undefined,1,1,1,false);
            EngineSound.play(instance,menu.sound_click,instance.mousePos);
            if(menu.optionA){
                const spr = LevelUpMenu.getSprOption(instance,menu.optionA);
                if(EngineInput.isMouseOver(instance,{
                        x:instance.domCanvas.width/4-(spr.srcWidth*scaleX)/4,
                        y:sprY-(spr.srcHeight*scaleY)/4,
                        w:(spr.srcWidth*scaleX)/2,
                        h:(spr.srcHeight*scaleY)/2,
                    })){
                    LevelUpMenu.givePlayerOption(instance,menu.optionA,player);
                }
            }
            if(menu.optionB){
                const spr = LevelUpMenu.getSprOption(instance,menu.optionB);
                if(EngineInput.isMouseOver(instance,{
                        x:instance.domCanvas.width/2-(spr.srcWidth*scaleX)/4,
                        y:sprY-(spr.srcHeight*scaleY)/4,
                        w:(spr.srcWidth*scaleX)/2,
                        h:(spr.srcHeight*scaleY)/2,
                    })){
                    LevelUpMenu.givePlayerOption(instance,menu.optionB,player);
                }
                
            }
            if(menu.optionC){
                const spr = LevelUpMenu.getSprOption(instance,menu.optionC);
                if(EngineInput.isMouseOver(instance,{
                        x:instance.domCanvas.width*.75-(spr.srcWidth*scaleX)/4,
                        y:sprY-(spr.srcHeight*scaleY)/4,
                        w:(spr.srcWidth*scaleX)/2,
                        h:(spr.srcHeight*scaleY)/2,
                    })){
                    LevelUpMenu.givePlayerOption(instance,menu.optionC,player);
                }
        }



            changeMode(instance,ModeKind.Game);
            //reset for next call
            LevelUpMenu.reset(menu,player);
        }
    }
    static givePlayerOption(instance:EngineInstance,option:Options,player:Player){
        //TODO: shouldn't update weapon directly
        //      need to update based on selection ++ slot
        //      i.e. if player has "simple" in "A" and level up shows "A" in slot "C"
        switch(option){
            case Options.Simple:
            case Options.Flame:
            case Options.Missile: 
            case Options.Mine:
            case Options.Sword: 
            case Options.Beam:
            case Options.Shot: 
            case Options.Machine: 
                if(player.weaponA && player.weaponA.kind as any == option){
                    player.weaponA.level+=1;
                    break;
                }
                if(player.weaponB && player.weaponB.kind as any == option){
                    player.weaponB.level+=1;
                    break;
                }
                if(player.weaponC && player.weaponC.kind as any == option){
                    player.weaponC.level+=1;
                    break;
                }
                if(!player.weaponA){
                    player.weaponA=Weapon.createWeapon(option as any);
                    break;
                }
                if(!player.weaponB){
                    player.weaponB=Weapon.createWeapon(option as any);
                    break;
                }
                if(!player.weaponC){
                    player.weaponC=Weapon.createWeapon(option as any);
                    break;
                }
                break;
            case Options.Hp:
                player.bonusHP+=10;
                player.hp+=10;
                break;
            case Options.FireRate:
                player.bonusFireRate+=0.2;
                break;
            case Options.Regen: 
                player.bonusRegen+=0.1;
                break;
            case Options.Speed:
                player.bonusSpeed+=0.2;
                break;
        }
    }
    static getSprOption(instance:EngineInstance,option:Options){
        switch(option){
            case Options.Simple: return instance.sprites.menuBulletSimple;
            case Options.Flame: return instance.sprites.menuBulletFlame;
            case Options.Missile: return instance.sprites.menuBulletMissile;
            case Options.Mine: return instance.sprites.menuBulletMine;
            case Options.Sword: return instance.sprites.menuBulletSword;
            case Options.Beam: return instance.sprites.menuBulletBeam;
            case Options.Shot: return instance.sprites.menuBulletShot;
            case Options.Machine: return instance.sprites.menuBulletMachine;
            case Options.Hp: return instance.sprites.menuHP;
            case Options.FireRate: return instance.sprites.menuFireRate;
            case Options.Regen: return instance.sprites.menuRegen;
            case Options.Speed: return instance.sprites.menuSpeed;
        }
    }
    static drawLevelUpMenu(instance:EngineInstance,menu:LevelUpMenu,spriteLayer:IGLSpriteRenderer){
        
        GLSpriteRenderer.beginFrame(instance,spriteLayer); 
        if(menu.optionA){
            const spr = LevelUpMenu.getSprOption(instance,menu.optionA);
            if(EngineInput.isMouseOver(instance,{
                    x:instance.domCanvas.width/4-(spr.srcWidth*scaleX)/4,
                    y:sprY-(spr.srcHeight*scaleY)/4,
                    w:(spr.srcWidth*scaleX)/2,
                    h:(spr.srcHeight*scaleY)/2,
                })){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                    instance.sprites.menuBulletSelect,
                    instance.domCanvas.width/4,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
            }
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                spr,
                instance.domCanvas.width/4,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
        }
        if(menu.optionB){
            const spr = LevelUpMenu.getSprOption(instance,menu.optionB);
            if(EngineInput.isMouseOver(instance,{
                    x:instance.domCanvas.width/2-(spr.srcWidth*scaleX)/4,
                    y:sprY-(spr.srcHeight*scaleY)/4,
                    w:(spr.srcWidth*scaleX)/2,
                    h:(spr.srcHeight*scaleY)/2,
                })){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                    instance.sprites.menuBulletSelect,
                    instance.domCanvas.width/2,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
            }
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                spr,
                instance.domCanvas.width/2,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
            
        }
        if(menu.optionC){
            const spr = LevelUpMenu.getSprOption(instance,menu.optionC);
            if(EngineInput.isMouseOver(instance,{
                    x:instance.domCanvas.width*.75-(spr.srcWidth*scaleX)/4,
                    y:sprY-(spr.srcHeight*scaleY)/4,
                    w:(spr.srcWidth*scaleX)/2,
                    h:(spr.srcHeight*scaleY)/2,
                })){
                GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                    instance.sprites.menuBulletSelect,
                    instance.domCanvas.width*.75,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
            }
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
                spr,
                instance.domCanvas.width*.75,sprY, scaleX, scaleY,0,Colour.rgbaInt(Colour.rgb()));
            
        }
        
        GLSpriteRenderer.glFlush(instance,spriteLayer);
    }
}



export {LevelUpMenu}