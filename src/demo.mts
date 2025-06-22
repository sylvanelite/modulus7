
import { EngineInstance, IGLSpriteRenderer, ISpriteDescription, Utils } from './lib/definitions.mjs';
import {
    createInstance, Engine,  EngineInput,
    GLSpriteRenderer,
    EngineMath,
    Colour,
    EngineSound,
} from './lib/index.mjs';

import { updatePhysics } from './components/physics.mjs';
import { darwSprite } from './components/sprite.mjs';
import { GLMode7Renderer, IGLMode7Renderer } from './GLMode7Renderer.mjs';
import { Player } from './components/player.mjs';
import { updateBullets } from './components/bullet.mjs';
import { updateEnemies } from './components/enemy.mjs';
import { SpatialHash } from './spatialHash.mjs';
import { Background } from './components/background.mjs';
import { createEmitter, Emitter, EmitterKind, udpateParticle, updateEmitter } from './components/emitter.mjs';
import { Spawner, updateSpawner } from './components/spawner.mjs';
import { GameMode, IGameMode, ModeKind } from './components/gameMode.mjs';
import { MainMenu } from './components/mainMenu.mjs';
import { LevelUpMenu } from './components/levelUpMenu.mjs';
import { LevelOverMenu } from './components/levelOverMenu.mjs';
import { levelVictoryMenu } from './components/levelVictoryMenu.mjs';

const sprites:Record<string,ISpriteDescription> = {
    player:{srcX:0,srcY:65,srcWidth:48,srcHeight:24,textureIndex:0},
    playerLeft:{srcX:49,srcY:65,srcWidth:48,srcHeight:24,textureIndex:0},
    playerRight:{srcX:97,srcY:65,srcWidth:48,srcHeight:24,textureIndex:0},
    playerExp:{srcX:36,srcY:16,srcWidth:2,srcHeight:4,textureIndex:0},
    playerHp:{srcX:38,srcY:16,srcWidth:2,srcHeight:4,textureIndex:0},
    playerHpMax:{srcX:40,srcY:16,srcWidth:2,srcHeight:4,textureIndex:0},

    enemyDefault:{srcX:16,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},

    enemySimple:{srcX:16,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyGreen:{srcX:36,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyBlue:{srcX:52,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyYellow:{srcX:68,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyOrange:{srcX:84,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyRedX:{srcX:100,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyRedVert:{srcX:116,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},
    enemyRedHoriz:{srcX:132,srcY:0,srcWidth:16,srcHeight:16,textureIndex:0},

    
    moon:{srcX:0,srcY:24,srcWidth:48,srcHeight:48,textureIndex:0},
    cloudA:{srcX:48,srcY:24,srcWidth:64,srcHeight:32,textureIndex:0},
    cloudB:{srcX:112,srcY:24,srcWidth:64,srcHeight:32,textureIndex:0},
    gradient:{srcX:32,srcY:0,srcWidth:4,srcHeight:24,textureIndex:0},
    bulletSimple:{srcX:0,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletFlame:{srcX:4,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletMachine:{srcX:8,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletMissile:{srcX:12,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletBeam:{srcX:16,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletSword:{srcX:20,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletShot:{srcX:24,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},
    bulletMine:{srcX:28,srcY:16,srcWidth:4,srcHeight:4,textureIndex:0},


    particleEngineA:{srcX:0,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleEngineB:{srcX:16,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleEngineC:{srcX:32,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleExplodeA:{srcX:48,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleExplodeB:{srcX:64,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleExplodeC:{srcX:80,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleHitA:{srcX:96,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleHitB:{srcX:112,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleHitC:{srcX:128,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleShieldA:{srcX:144,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleShieldB:{srcX:160,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleShieldC:{srcX:176,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleSmokeA:{srcX:192,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleSmokeB:{srcX:208,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},
    particleSmokeC:{srcX:224,srcY:224,srcWidth:16,srcHeight:16,textureIndex:0},

    portraitA:{srcX:0,srcY:176,srcWidth:32,srcHeight:48,textureIndex:0},
    portraitB:{srcX:32,srcY:176,srcWidth:32,srcHeight:48,textureIndex:0},
    portraitHit:{srcX:64,srcY:176,srcWidth:32,srcHeight:48,textureIndex:0},
    portraitOverlay:{srcX:96,srcY:176,srcWidth:32,srcHeight:48,textureIndex:0},
    
    levelVictory:{srcX:128,srcY:176,srcWidth:80,srcHeight:48,textureIndex:0},
    levelGameOver:{srcX:128,srcY:128,srcWidth:80,srcHeight:48,textureIndex:0},

    weaponGui:{srcX:0,srcY:240,srcWidth:24,srcHeight:16,textureIndex:0},

    //sprite sheet 2 (menu)
    menuBulletSimple:{srcX:0,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletFlame:{srcX:24,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletMachine:{srcX:48,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletMissile:{srcX:72,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletBeam:{srcX:96,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletSword:{srcX:120,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletShot:{srcX:144,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletMine:{srcX:168,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},
    menuBulletSelect:{srcX:192,srcY:0,srcWidth:24,srcHeight:32,textureIndex:1},

    menuHP:{srcX:0,srcY:32,srcWidth:24,srcHeight:32,textureIndex:1},
    menuFireRate:{srcX:24,srcY:32,srcWidth:24,srcHeight:32,textureIndex:1},
    menuSpeed:{srcX:48,srcY:32,srcWidth:24,srcHeight:32,textureIndex:1},
    menuRegen:{srcX:72,srcY:32,srcWidth:24,srcHeight:32,textureIndex:1},

    menuMainTag:{srcX:0,srcY:64,srcWidth:96,srcHeight:32,textureIndex:1},
    menuMainBegin:{srcX:0,srcY:96,srcWidth:64,srcHeight:32,textureIndex:1},
    menuMainBeginHover:{srcX:0,srcY:128,srcWidth:64,srcHeight:32,textureIndex:1},

    
    menuBG:{srcX:96,srcY:32,srcWidth:160,srcHeight:135,textureIndex:1},
}

const sfx:Record<string,Array<number>> = {
//https://killedbyapixel.github.io/ZzFX/
    sfx_explodeA:[1.2,,79,.06,,.48,2,.8,-4,,,,.27,.3,93,.3,.45,.4,.25,.41,-3385],
    sfx_explodeB:[2,,67,.08,.13,.78,1,1.1,,,,,.27,1.8,,.8,.47,.37,.26,.22],
    sfx_explodeC:[1.1,,51,.02,.06,.7,,3.8,,7,,,,.7,,1,,.49,.14],

    sfx_spawnA:[,,150,.01,.04,.2,,.7,3,,,,,,,,,.81,.05],
    sfx_spawnB:[.9,,69,.05,.01,.13,1,.7,,58,,,,.3,,,,.82,.07,,233],

    sfx_hitA:[2.9,,400,.03,.04,.28,2,2.7,4,,,,.05,.1,3.7,.4,.07,.46,.06,.18,271],
    sfx_hitB:[2.9,,401,.04,.05,.28,,2.8,4,,,,.04,.1,3.7,.5,.07,.46,.06,.18,271],
    sfx_hitC:[2.1,,127,,.04,.19,3,3.3,,1,,,.05,.8,,.2,.03,.81,.05,.3],

    sfx_levelup:[,,248,.05,.13,.3,1,3.9,,144,267,.05,.05,,,,,.75,.29,.36],

    sfx_powerup:[,,476,.07,.18,.11,1,2.4,10,,303,.05,.1,,,,,.88,.3,.16],

    sfx_menu:[,,325,.01,.27,.4,,2.1,,30,-167,.06,.07,,,.1,,.54,.16,.38,101],

    sfx_win:[,,549,.1,.28,.13,,3,,4,191,.08,.04,,,,,.86,.3]

};

const mode7Renderers:Record<string,IGLMode7Renderer> = {};

const init = ()=>{
    const instance = createInstance();
    (instance as unknown as any ).mode = GameMode.gameMode();
    instance.canvasFixedSize.x = 320;
    instance.canvasFixedSize.y = 270;
    instance.domCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    // fix texture bleeding by shrinking tile slightly
    instance.tileFixBleedScale = .5;

    let spriteLayer:IGLSpriteRenderer;
    let mode7:IGLMode7Renderer;
    const collisions= SpatialHash.spatialHash(512);
    const background= Background.background();
    const player= new Player(instance);
    const levelSpawner = Spawner.spawner(1);
    const mainMenu = new MainMenu(instance);
    const levelUPMenu = new LevelUpMenu(instance);
    for(const [k,v] of Object.entries(sfx)){
        instance.audio[k] = EngineSound.sound(instance,v);
    }
    console.log(instance);
    ///////////////////////////////////////////////////////////////////////////////
    async function gameInit() {
        document.getElementById('imgLoading').remove();
        spriteLayer=GLSpriteRenderer.glSpriteRenderer(instance.glContext);
        instance.sprites = sprites;
        
        for(const elem of ['level1','level2','level3','level4','level5']){
            const img = document.getElementById(elem) as HTMLImageElement;
            const canv=  new OffscreenCanvas(img.width,img.height);
            canv.getContext('2d').drawImage(img, 0,0);

            const texture = instance.glContext.createTexture();
            instance.glContext.bindTexture(instance.glContext.TEXTURE_2D, texture);
            instance.glContext.texImage2D(instance.glContext.TEXTURE_2D, 0, 
                instance.glContext.RGBA, instance.glContext.RGBA, 
                instance.glContext.UNSIGNED_BYTE, canv);
            mode7Renderers[elem]=GLMode7Renderer.glMode7Renderer(instance.glContext,canv);
            mode7Renderers[elem].horizon=48;
        }
        mode7=mode7Renderers.level2;
        
        player.engineEmitter = createEmitter(instance,player.position.x,player.position.y,player.position.z,EmitterKind.Engine);
        player.shieldEmitter = createEmitter(instance,player.position.x,player.position.y,player.position.z,EmitterKind.Shield);
        instance.world.get(player.engineEmitter,Emitter).transient = false;
        instance.world.get(player.shieldEmitter,Emitter).transient = false;
        
        LevelUpMenu.reset(levelUPMenu,player);
    }

    function gameUpdate() {
        const mode:IGameMode = (instance as unknown as any ).mode;
        switch(mode.mode){
            case ModeKind.Game:
                Player.updatePlayer(instance,player);

                mode7.x0 = player.cameraPosition.x;
                mode7.y0 = player.cameraPosition.y;
                mode7.height = player.cameraPosition.z;
                mode7.theta = player.facing;

                updatePhysics(instance);
                updateBullets(instance,collisions);
                updateEnemies(instance,collisions,player);
                updateEmitter(instance);
                udpateParticle(instance);

                updateSpawner(instance,player,levelSpawner);
                return;
            case ModeKind.MainMenu:
                const lvl = MainMenu.updateMainMenu(instance,mainMenu,player,levelSpawner);
                if(lvl>0){ mode7 = mode7Renderers[`level${lvl}`]; }
                return;
            case ModeKind.LevelUpMenu:
                LevelUpMenu.updateLevelUpMenu(instance,levelUPMenu,player);
                return;
            case ModeKind.LevelOverMenu:
                LevelOverMenu.updateOverMenu(instance,player);
                return;
            case ModeKind.LevelVictoryMenu:
                levelVictoryMenu.updateVictoryMenu(instance,player);
                return;
        }
    }

    function gameUpdatePost() {
        const mode:IGameMode = (instance as unknown as any ).mode;
        switch(mode.mode){
            case ModeKind.Game:
                SpatialHash.clear(collisions);
                return;
            case ModeKind.MainMenu:
                return;
            case ModeKind.LevelUpMenu:
                return;
        }
    }

    function gameRender() {
        const mode:IGameMode = (instance as unknown as any ).mode;
        switch(mode.mode){
            case ModeKind.Game:
                GLMode7Renderer.draw(instance,mode7);
                Background.draw(instance,mode7,spriteLayer,player.facing,background,sprites.gradient,
                    sprites.moon,sprites.cloudA,sprites.cloudB);
                darwSprite(instance,spriteLayer,mode7);
                Player.drawPlayer(instance,player,spriteLayer);
                return;
            case ModeKind.MainMenu:
                MainMenu.drawMainMenu(instance,mainMenu,spriteLayer);
                return;
            case ModeKind.LevelUpMenu:
                //draw game behind level up menu
                GLMode7Renderer.draw(instance,mode7);
                Background.draw(instance,mode7,spriteLayer,player.facing,background,sprites.gradient,
                    sprites.moon,sprites.cloudA,sprites.cloudB)
                darwSprite(instance,spriteLayer,mode7);
                Player.drawPlayer(instance,player,spriteLayer);
                //draw level up menu
                LevelUpMenu.drawLevelUpMenu(instance,levelUPMenu,spriteLayer);
                return;
            case ModeKind.LevelOverMenu:
                GLMode7Renderer.draw(instance,mode7);
                Background.draw(instance,mode7,spriteLayer,player.facing,background,sprites.gradient,
                    sprites.moon,sprites.cloudA,sprites.cloudB);
                LevelOverMenu.drawOverMenu(instance,spriteLayer);
                return;
            case ModeKind.LevelVictoryMenu:
                GLMode7Renderer.draw(instance,mode7);
                Background.draw(instance,mode7,spriteLayer,player.facing,background,sprites.gradient,
                    sprites.moon,sprites.cloudA,sprites.cloudB);
                levelVictoryMenu.drawVictoryMenu(instance,spriteLayer);
                return;
        }
    }

    function gameRenderPost() { }

    Engine.engineInit(instance, gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost,
        ['media/tiles.png','media/menus.png'],
    ['./media/audio/level1.mp3',
        './media/audio/level2.mp3',
        './media/audio/level3.mp3',
        './media/audio/level4.mp3',
        './media/audio/level5.mp3',
        './media/audio/menu.mp3',
    ] );

}

export {init}