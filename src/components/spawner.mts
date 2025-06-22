import { EngineSound } from "../lib/engineSound.mjs";
import { EngineInstance, Utils } from "../lib/definitions.mjs";
import { createEmitter, EmitterKind } from "./emitter.mjs";
import { EnemyKind,Enemy,createEnemy } from "./enemy.mjs";
import { Player } from "./player.mjs";
import { changeMode, ModeKind } from "./gameMode.mjs";


interface ISequence{
    kinds:Array<EnemyKind>,
    angleMin:number,angleMax:number, 
    timestamp:number
}
interface ISpawner{
    time:number,
    sequence:Array<ISequence>,
}
class Spawner{
    static setLevel(spawner:ISpawner,level:number){
        if(level != 1&&level != 2&&level != 3&&level != 4&&level != 5){
            level =1;
        }
        spawner.time = 0;
        if(level==1){
            spawner.sequence=[
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:1},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:2},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:3},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:4},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:5},

                 
                {kinds:Array(10).fill(EnemyKind.Green),
                 angleMin:100,angleMax:200, timestamp:7},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:6},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:7},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:8},
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:300,angleMax:300, timestamp:9},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:10},

                {kinds:Array(3).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:11},

                {kinds:Array(4).fill(EnemyKind.Orange),
                 angleMin:270,angleMax:15, timestamp:15},
                 
                {kinds:Array(4).fill(EnemyKind.RedX),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedHoriz),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedVert),
                 angleMin:270,angleMax:15, timestamp:20},
                 
                {kinds:Array(4).fill(EnemyKind.Yellow),
                 angleMin:270,angleMax:15, timestamp:30},


                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:31},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:32},

                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:33},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:34},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:35},

                {kinds:Array(180).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:40},
            ];
        }
        if(level==2){
            spawner.sequence=[
                {kinds:Array(30).fill(EnemyKind.Simple),
                 angleMin:300,angleMax:300, timestamp:1},
                 
                {kinds:Array(2).fill(EnemyKind.Green),
                 angleMin:300,angleMax:300, timestamp:2},

                {kinds:Array(2).fill(EnemyKind.Green),
                 angleMin:300,angleMax:300, timestamp:3},
                 
                {kinds:Array(2).fill(EnemyKind.Green),
                 angleMin:300,angleMax:300, timestamp:4},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:300,angleMax:300, timestamp:5},

                 
                {kinds:Array(4).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:7},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:6},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:7},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:8},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:9},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:10},

                {kinds:Array(3).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:11},

                {kinds:Array(4).fill(EnemyKind.Orange),
                 angleMin:270,angleMax:15, timestamp:15},
                 
                {kinds:Array(4).fill(EnemyKind.RedX),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedHoriz),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedVert),
                 angleMin:270,angleMax:15, timestamp:20},
                 
                {kinds:Array(4).fill(EnemyKind.Yellow),
                 angleMin:270,angleMax:15, timestamp:30},


                 
                {kinds:Array(20).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:31},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:32},

                {kinds:Array(20).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:33},
                 
                {kinds:Array(20).fill(EnemyKind.RedVert),
                 angleMin:180,angleMax:180, timestamp:34},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:35},

                {kinds:Array(180).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:40},
            ];
        }
        if(level==3){
            spawner.sequence=[
                {kinds:Array(180).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:40},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:1},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:2},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:3},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:4},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:5},

                 
                {kinds:Array(4).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:7},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:6},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:7},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:8},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:9},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:10},

                {kinds:Array(3).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:11},

                {kinds:Array(4).fill(EnemyKind.Orange),
                 angleMin:270,angleMax:15, timestamp:15},
                 
                {kinds:Array(4).fill(EnemyKind.RedX),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedHoriz),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedVert),
                 angleMin:270,angleMax:15, timestamp:20},
                 
                {kinds:Array(4).fill(EnemyKind.Yellow),
                 angleMin:270,angleMax:15, timestamp:30},


                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:31},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:32},

                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:33},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:34},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:35},

            ];
        }
        if(level==4){
            spawner.sequence=[
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:1},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:2},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:3},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:35},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:4},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:5},

                 
                {kinds:Array(4).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:7},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:6},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:7},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:8},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:9},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:10},

                {kinds:Array(3).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:11},

                {kinds:Array(4).fill(EnemyKind.Orange),
                 angleMin:270,angleMax:15, timestamp:15},
                 
                {kinds:Array(4).fill(EnemyKind.RedX),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedHoriz),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedVert),
                 angleMin:270,angleMax:15, timestamp:20},
                 
                {kinds:Array(4).fill(EnemyKind.Yellow),
                 angleMin:270,angleMax:15, timestamp:30},


                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:31},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:32},

                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:33},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:34},

                {kinds:Array(180).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:40},
            ];
        }
        if(level==5){
            spawner.sequence=[
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:1},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:2},

                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:3},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:4},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:5},

                 
                {kinds:Array(4).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:7},
                 
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:6},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:7},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:8},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:9},
                {kinds:Array(2).fill(EnemyKind.Simple),
                 angleMin:270,angleMax:15, timestamp:10},

                {kinds:Array(3).fill(EnemyKind.Green),
                 angleMin:270,angleMax:15, timestamp:11},

                {kinds:Array(4).fill(EnemyKind.Orange),
                 angleMin:270,angleMax:15, timestamp:15},
                 
                {kinds:Array(4).fill(EnemyKind.RedX),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedHoriz),
                 angleMin:270,angleMax:15, timestamp:20},
                {kinds:Array(4).fill(EnemyKind.RedVert),
                 angleMin:270,angleMax:15, timestamp:20},
                 
                {kinds:Array(4).fill(EnemyKind.Yellow),
                 angleMin:270,angleMax:15, timestamp:30},

                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:31},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:32},

                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:33},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:34},
                 
                {kinds:Array(20).fill(EnemyKind.Simple),
                 angleMin:180,angleMax:180, timestamp:35},

                {kinds:Array(180).fill(EnemyKind.Green),
                 angleMin:180,angleMax:180, timestamp:40},
            ];
        }
    }
    static spawner(level:number){
        const res:ISpawner={
            time: 0,
            sequence:[]
        };
        Spawner.setLevel(res,level);
        return res;
    }
}
function updateSpawner(instance:EngineInstance,player:Player,spawner:ISpawner){
    spawner.time+=16;//assuming 60fps, probably not accurate
    for(const seq of spawner.sequence){
        if(seq.timestamp==0){continue;}
        if(seq.timestamp*1000>spawner.time){continue;}
        seq.timestamp=0;
        for(const e of seq.kinds){
            const distance = 34+Math.random()*64;
            const variance = Math.random()*seq.angleMax-Math.random()*seq.angleMin;
            
            const x = -Math.cos((player.facing+variance)*Utils.DEG_TO_RAD)*distance;
            const y = -Math.sin((player.facing+variance)*Utils.DEG_TO_RAD)*distance;
            const z = 100+Math.random()*100;
            createEnemy(instance,
                player.position.x+x,
                player.position.y+y,
                player.position.z+z,
                e);
                
            createEmitter(instance,
                player.position.x+x,
                player.position.y+y,
                player.position.z+z,
                EmitterKind.Shield);
        }
    }
    if(spawner.time>48000){
    EngineSound.play(instance,
        instance.audio.sfx_win,
        undefined,1,1,1,false);
            changeMode(instance,ModeKind.LevelVictoryMenu);
    }

}
export{updateSpawner,Spawner, type ISpawner}
