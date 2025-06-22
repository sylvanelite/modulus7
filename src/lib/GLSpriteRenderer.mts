import { EngineInstance, ISpriteDescription, type IGLSpriteRenderer } from "./definitions.mjs";
import { EngineGL } from "./engineGL.mjs";


const tilelayerVS = `#version 300 es       // specify GLSL ES version
precision highp float; // use highp for better accuracy
in vec2 g;             // in: geometry
in vec4 p,u,c,a;       // in: position/size, uvs, colour, additiveColour
in float r;            // in: rotation
out vec2 v;            // out: uv
out vec4 d,e;          // out: colour, additiveColour
uniform vec2 in_Resolution;// size of the canvas in pixels
void main(){           // shader entry point
    vec2 s=(g-.5)*p.zw;    // get size offset
    float w = in_Resolution.x;
    float h = in_Resolution.y;
    gl_Position=vec4(
        //transform position
         (1.0 + 2.0*p.x - w + s.x*cos(r) + s.y*sin(r))/w,
        -(1.0 + 2.0*p.y - h - s.y*cos(r) + s.x*sin(r))/h,
        1,1);

    v=mix(u.xw,u.zy,g);    // pass uv to fragment shader
    d=c;e=a;               // pass colours to fragment shader
}                       // end of shader
`;
const tilelayerFS = `#version 300 es       // specify GLSL ES version
precision highp float; // use highp for better accuracy
uniform sampler2D s;   // texture
in vec2 v;             // in: uv
in vec4 d,e;           // in: colour, additiveColour
out vec4 c;            // out: colour
void main(){           // shader entry point
    c=texture(s,v)*d+e;    // modulate texture by colour plus additive
}                      // end of shader
`;

//internal constants 
const gl_MAX_INSTANCES = 1e4;
const gl_INDICES_PER_INSTANCE = 11;
const gl_INSTANCE_BYTE_STRIDE = gl_INDICES_PER_INSTANCE * 4;
const gl_INSTANCE_BUFFER_SIZE = gl_MAX_INSTANCES * gl_INSTANCE_BYTE_STRIDE;
class GLSpriteRenderer {

    private static _attribIndices:Record<string,number> = {
        //offset by engineGL attributes//TODO: is there a better way?
        'g': 0,
        'p': 1,
        'u': 2,
        'c': 3,
        'a': 4,
        'r': 5
    };

    static glSpriteRenderer(gl: WebGLRenderingContext) {
        const glInstanceData = new ArrayBuffer(gl_INSTANCE_BUFFER_SIZE);
        const glShader = EngineGL.compileProgram(gl,tilelayerVS,tilelayerFS);

        const glSprite:IGLSpriteRenderer= {
            glShader:glShader,
            glArrayBuffer:gl.createBuffer(),
            glGeometryBuffer:gl.createBuffer(),
            glPositionData:new Float32Array(glInstanceData),
            glColourData:new Uint32Array(glInstanceData),
            glInstanceCount:0,
            glAdditive:false,
            glBatchAdditive:false, 

        }
        
        // create the geometry buffer, triangle strip square
        const geometry = new Float32Array([glSprite.glInstanceCount,0,1,0,0,1,1,1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, glSprite.glGeometryBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
        return glSprite;
    }

    static beginFrame(instance:EngineInstance,self:IGLSpriteRenderer): void {
        const gl = instance.glContext;
        //pre render
        // set up the shader and canvas
        gl.useProgram(self.glShader);
        gl.activeTexture(gl.TEXTURE0);
        if (instance.textures[0]){
            instance.glActiveTexture = instance.textures[0].texture;
            gl.bindTexture(gl.TEXTURE_2D, instance.glActiveTexture );
        }
        // set vertex attributes
        self.glAdditive = false;
        self.glBatchAdditive = false; 
        let offset = 0;
        let initVertexAttribArray = (name:string, type:GLenum, typeSize:number, size:GLint)=> {
            const stride = typeSize && gl_INSTANCE_BYTE_STRIDE; // only if not geometry
            const divisor = typeSize && 1; // only if not geometry
            const normalize = typeSize==1; // only if colour
            const location = GLSpriteRenderer._attribIndices[name];
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
            gl.vertexAttribDivisor(location, divisor);
            offset += size*typeSize;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, self.glGeometryBuffer);
        initVertexAttribArray('g', gl.FLOAT, 0, 2); // geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, self.glArrayBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gl_INSTANCE_BUFFER_SIZE, gl.DYNAMIC_DRAW);
        initVertexAttribArray('p', gl.FLOAT, 4, 4); // position & size
        initVertexAttribArray('u', gl.FLOAT, 4, 4); // texture coords
        initVertexAttribArray('c', gl.UNSIGNED_BYTE, 1, 4); // colour
        initVertexAttribArray('a', gl.UNSIGNED_BYTE, 1, 4); // additiveColour
        initVertexAttribArray('r', gl.FLOAT, 4, 1); // rotation

        const in_Resolution = gl.getUniformLocation(self.glShader, "in_Resolution");
        gl.uniform2f(in_Resolution, gl.canvas.width,gl.canvas.height);

    }
    
    static glFlush(instance:EngineInstance,self:IGLSpriteRenderer){
        const gl = instance.glContext;
        const destBlend = self.glBatchAdditive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA;
        gl.blendFuncSeparate(gl.SRC_ALPHA, destBlend, gl.ONE, destBlend);
        gl.enable(gl.BLEND);

        // draw all the sprites in the batch and reset the buffer
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, self.glPositionData);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, self.glInstanceCount);
        self.glInstanceCount = 0;
        self.glBatchAdditive = self.glAdditive;
    }

    // Add a sprite to the gl draw list,
    static addSpriteToDrawList(instance:EngineInstance,self:IGLSpriteRenderer,sprite:ISpriteDescription,
        destX:number, destY:number, sizeX:number, sizeY:number, angle:number, 
        rgba:number, rgbaAdditive:number=0) {
        if (instance.headlessMode){return;}
        const textureInfo =instance.textures[sprite.textureIndex];
        
        // calculate uvs and render
        const x = sprite.srcX/textureInfo.width;
        const y = sprite.srcY/textureInfo.height;
        const w = sprite.srcWidth/textureInfo.width;
        const h = sprite.srcHeight/textureInfo.height;

        const tileImageFixBleedX = instance.tileFixBleedScale/textureInfo.width;
        const tileImageFixBleedY = instance.tileFixBleedScale/textureInfo.height;
        
        const uv0X = x + tileImageFixBleedX;
        const uv0Y = y + tileImageFixBleedY;
        const uv1X = x - tileImageFixBleedX + w;
        const uv1Y = y - tileImageFixBleedY + h; 

        if(textureInfo.texture!= instance.glActiveTexture){
            GLSpriteRenderer.glFlush(instance,self);
            instance.glActiveTexture = textureInfo.texture;
            instance.glContext.bindTexture(instance.glContext.TEXTURE_2D,instance.glActiveTexture);

        }
        // flush if there is not enough room or if different blend mode
        if (self.glInstanceCount >= gl_MAX_INSTANCES || self.glBatchAdditive != self.glAdditive){
            GLSpriteRenderer.glFlush(instance,self);
        }

        let offset = self.glInstanceCount++ * gl_INDICES_PER_INSTANCE;
        self.glPositionData[offset++] = destX;
        self.glPositionData[offset++] = destY;

        const scaleFactorX = sprite.srcWidth ;
        const scaleFactorY = sprite.srcHeight;

        self.glPositionData[offset++] = sizeX*scaleFactorX;
        self.glPositionData[offset++] = sizeY*scaleFactorY;
        self.glPositionData[offset++] = uv0X;
        self.glPositionData[offset++] = uv0Y;
        self.glPositionData[offset++] = uv1X;
        self.glPositionData[offset++] = uv1Y;
        self.glColourData[offset++] = rgba;
        self.glColourData[offset++] = rgbaAdditive;
        self.glPositionData[offset++] = angle;
    }
}



export {
    GLSpriteRenderer
}