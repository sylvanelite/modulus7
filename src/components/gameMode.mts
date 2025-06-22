import { EngineInstance } from "../lib/definitions.mjs";
import { EngineSound } from "../lib/engineSound.mjs";
enum ModeKind{
    MainMenu,
    Game,
    LevelUpMenu,
    LevelOverMenu,
    LevelVictoryMenu
}
interface IGameMode{
    mode:ModeKind,
}
class GameMode{
    static gameMode():IGameMode{
        return {
            mode:ModeKind.MainMenu
        };
    }
}
function changeMode(instance:EngineInstance,kind:ModeKind){
    const currentMode:IGameMode = (instance as unknown as any ).mode;
    currentMode.mode = kind;

    if(kind==ModeKind.MainMenu){
        
            EngineSound.stop(instance.audio['./media/audio/menu.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level1.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level2.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level3.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level4.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level5.mp3']);
            EngineSound.play(instance,instance.audio[`./media/audio/menu.mp3`],undefined,1,1,1,true);
    }

}

export{GameMode,ModeKind,changeMode, type IGameMode}
