//based on:
// LittleJS - MIT License - Copyright 2021 Frank Force
//modifed to include native TS support and to instance the engine instead of using globals
import { type EngineInstance } from "./definitions.mjs";
import { createInstance,Engine } from "./engine.mjs";
import { EngineGL } from "./engineGL.mjs";
import { EngineInput } from "./engineInput.mjs";
import { EngineMath} from "./engineMath.mjs";
import { EngineSound } from "./engineSound.mjs";
import { Colour } from "./colour.mjs";
import { SpriteDescription } from "./spriteDefinition.mjs";
import { GLTilemap } from "./GLTilemap.mjs";
import { GLSpriteRenderer } from "./GLSpriteRenderer.mjs";
import { World } from "./ecs.mjs";

export {
    type EngineInstance,
    createInstance,
	// Engine
    Engine,
	// Utilities
	EngineMath,
	// WebGL
    EngineGL,
	// Input
    EngineInput,
	// Audio
    EngineSound,//glob funcs
    
	// Utility Classes
	Colour,

    //
    SpriteDescription,
    GLTilemap,
    GLSpriteRenderer,

    World,
};

