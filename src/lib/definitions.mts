import { World } from "./ecs.mjs";

interface EngineInstance{
        sprites:Record<string,ISpriteDescription>,
        audio:Record<string,ISound>,
        world:World,
    //--
    //},Settings:{
        //camera settings
        //display settings
        canvasMaxSize:IVector2,//The max size of the canvas, centered if window is larger
        canvasFixedSize:IVector2, //Fixed size of the canvas, if enabled canvas size never changes
                                 // - you may also need to set mainCanvasSize if using screen space coords in startup
        headlessMode:boolean,//Disables all rendering, audio, and input for servers
        //Tile sheet settings
        tileFixBleedScale:number//How many pixels smaller to draw tiles to prevent bleeding from neighbors
        //Object setttings
        //Input settings
        gamepadsEnable:boolean;/** Should gamepads be allowed */
        gamepadDirectionEmulateStick:boolean;/** If true, the dpad input is also routed to the left analog stick (for better accessability) */
        inputWASDEmulateDirection :boolean;/** If true the WASD keys are also routed to the direction keys (for better accessability)*/
        touchInputEnable:boolean; /** True if touch input is enabled for mobile devices
                                    *  - Touch events will be routed to mouse events*/
        touchGamepadEnable :boolean; /** True if touch gamepad should appear on mobile devices
                                    *  - Supports left analog stick, 4 face buttons and start button (button 9)
                                    *  - Must be set by end of gameInit to be activated*/
        touchGamepadAnalog :boolean;/** True if touch gamepad should be analog stick or false to use if 8 way dpad */
        touchGamepadSize :number;/** Size of virtual gamepad for touch devices in pixels */
        touchGamepadAlpha :number;/** Transparency of touch gamepad overlay */
        vibrateEnable :boolean;/** Allow vibration hardware if it exists */
        
        inputData:Array<Array<number>> ;//[[]] store input as a bit field for each key: 1 = isDown, 2 = wasPressed, 4 = wasReleased
                                        // mouse and keyboard are stored together in device 0, gamepads are in devices > 0
        isTouchDevice:boolean,//True if a touch device has been detected
        touchGamepadTimer:ITimer,// touch gamepad internal variables
        touchGamepadButtons:Array<number>,
        touchGamepadStick:IVector2,
        mousePos:IVector2,//Mouse pos in world space
        mouseWheel:number,// Mouse wheel delta this frame
        isUsingGamepad:boolean,//Returns true if user is using gamepad (has more recently pressed a gamepad button)
        preventDefaultInput:boolean,//Prevents input continuing to the default browser handling (false by default)

        //Audio settings
        soundEnable:boolean,//All audio code can be disabled and removed from build
        soundVolume:number,//Volume scale to apply to all sound, music and speech
        soundDefaultRange:number,// Default range where sound no longer plays
        soundDefaultTaper:number,//Default range percent to start tapering off sound (0-1)
        audioContext:AudioContext,//Audio context used by the engine
        audioGainNode:GainNode,// Master gain node for all audio to pass through
        
    //},Engine:{
        engineName:'LittleJS-fork',//Name of engine
        engineVersion : '1.11.4--fork';//Version of engine
        frameRate:number,//Frames per second to update
        maxSkippedFrames:number,//max number of frames to process if animation frame is skipped
        frame:number,//Current update frame, used to calculate time
        time:number,//Current engine time since start in seconds
        timeReal:number,// //Actual clock time since start in seconds
    //},Draw:{
        domCanvas:HTMLCanvasElement,//The primary 2D canvas visible to the user
        context2d:OffscreenCanvasRenderingContext2D,//2d context for mainCanvas
        textures:Array<ITexture>,//Array containing texture info for batch rendering system
        drawCount:number//Keep track of how many draw calls there were each frame for debugging
        gamepadStickData:Array<any>,// gamepad internal variables
    //}WebGL
        glContext:WebGL2RenderingContext,// 2d context for glCanvas
        glAntialias:boolean//Should webgl be setup with anti-aliasing? must be set before calling engineInit
        // WebGL internal variables not exposed to documentation
        glActiveTexture:WebGLTexture,
        // Frame time tracking
        frameTimeLastMS:number,
        frameTimeBufferMS:number,
}

interface IVector2{
    x:number,y:number
}

interface IColour{
    r:number; /** @property {Number} - Red */
    g:number; /** @property {Number} - Green */
    b:number; /** @property {Number} - Blue */
    a:number; /** @property {Number} - Alpha */
}

interface ISpriteDescription{
    srcX:number,srcY:number,srcWidth:number,srcHeight:number,//location in the texture
    textureIndex:number;//texture to use, must be loaded on the engine instance
}
interface ITexture{
    width:number,height:number,
    texture:WebGLTexture
}

interface ISound{
    range:number;
    taper:number;
    randomness:number;
    sampleChannels:Array<Array<number>>;
    sampleRate:number;
    gainNode:GainNode;
    source:AudioBufferSourceNode;
}

interface IGLSpriteRenderer{
    glShader:WebGLProgram;
    glArrayBuffer:WebGLBuffer;
    glGeometryBuffer:WebGLBuffer;
    glPositionData:Float32Array;
    glColourData:Uint32Array;
    glInstanceCount:number;
    glAdditive:boolean;
    glBatchAdditive:boolean; 
}

interface ITimer{
    time:number;
    setTime:number;
}

class Utils{
    static hash (x:number) {
        //https://stackoverflow.com/questions/664014/what-integer-hash-function-are-good-that-accepts-an-integer-hash-key
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = ((x >> 16) ^ x) * 0x45d9f3b;
        x = (x >> 16) ^ x;
        return x;
    }
    static readonly DEG_TO_RAD = 0.0174533;
    static readonly RAD_TO_DEG = 57.2958;
    static xyToIdx (x:number,y:number,width:number):number{ return (y*width + x); }
    static idxToXy (idx:number,width:number):[number,number]{
        return [ Math.floor(idx%width),  //x
                Math.floor(idx/width) ];//y
    }

}

export {
    type EngineInstance,
    type IVector2,
    type IColour,
    type ISpriteDescription,
    type ITexture,
    type IGLSpriteRenderer,
    type ITimer,
    type ISound,
    Utils
}