import { EngineGL } from "./engineGL.mjs";


//https://github.com/englercj/gl-tiled/blob/master/src/GLTilelayer.ts (MIT)
const tilelayerFS = `
precision mediump float;

varying vec2 vPixelCoord;
varying vec2 vTextureCoord;

uniform vec2 uTilesetTileSize;
uniform vec2 uInverseTilesetTextureSize;
uniform float uAlpha;

uniform sampler2D uLayer;
uniform sampler2D uTilesets;

void main()
{
    if (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0)
        discard;

    vec4 tile = texture2D(uLayer, vTextureCoord);
    vec2 tileSize = uTilesetTileSize;
    vec2 tileCoord = floor(tile.xy * 255.0);
    tileCoord.x = tileCoord.x * tileSize.x;
    vec2 offsetInTile = mod(vPixelCoord, tileSize);
    vec4 color = texture2D(uTilesets, (tileCoord + offsetInTile) * uInverseTilesetTextureSize); 

    gl_FragColor = vec4(color.rgb, color.a * uAlpha);
}
`;
const tilelayerVS = `
precision highp float;

attribute vec2 aPosition;
attribute vec2 aTexture;

uniform float uInverseTileScale;

uniform vec2 uOffset;
uniform vec2 uViewportSize;
uniform vec2 uInverseLayerTileCount;
uniform vec2 uInverseLayerTileSize;

varying vec2 vPixelCoord;
varying vec2 vTextureCoord;

void main()
{
    // round offset to the nearest multiple of the inverse scale
    // this essentially clamps offset to whole "pixels"
    vec2 offset = uOffset + (uInverseTileScale / 2.0);
    offset -= mod(offset, uInverseTileScale);

    vPixelCoord = (aTexture * uViewportSize) + offset;
    vTextureCoord = vPixelCoord * uInverseLayerTileCount * uInverseLayerTileSize;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
//exposed layer props that can be manipulated
interface ILayerProps{    
    x:number;
    y:number;
    scale:number;
    alpha:number;

}
//layer constructor, discarded after map init to free up [data] and [canvas]
interface ITileLayer{
    tileWidth:number;//size of tile in pixels
    tileHeight:number;
    
    width:number;//size of the layer in tiles
    height:number;

    data:Array<number>;//flattended array of tiles to show
    canvas:OffscreenCanvas;//canvas which acts as the tileset
}
//retained layer information after constructor
interface ILayerGl extends ILayerProps{

    x:number;
    y:number;
    scale:number;
    alpha:number;

    tileWidth:number;
    tileHeight:number;
    tileSetWidth:number;
    tileSetHeight:number;
    
    tileSetTexture: WebGLTexture;

    layerTexture: WebGLTexture;
    textureData: Uint8Array;
    inverseTileCount: Float32Array;// new Float32Array(2);
}


class GLTilemap {

    static getLayer(layerIdx:number,self:GLTilemap){
        return{
            x:self._layerGL[layerIdx].x,
            y:self._layerGL[layerIdx].y,
            scale:self._layerGL[layerIdx].scale,
            alpha:self._layerGL[layerIdx].alpha,
        }

    }
    static updateLayer(layerIdx:number,props:ILayerProps,self:GLTilemap){
        const layer = self._layerGL[layerIdx];
        layer.x = props.x;
        layer.y = props.y;
        layer.scale = props.scale;
        layer.alpha = props.alpha;
    }

    private static glTerminateLayer(gl: WebGLRenderingContext,layer:ILayerGl): void {
        console.log("TERMINATE LAYER")
        gl.deleteTexture(layer.layerTexture);
        gl.deleteTexture(layer.tileSetTexture);
    }

    private static _attribIndices = {
        //offset by engineGL attributes//TODO: is there a better way?
        aPosition: 6,
        aTexture: 7,
    };
    
    private uniforms: Record<string,WebGLUniformLocation> = {};

    private program: WebGLProgram | null = null;

    private _layerGL:ILayerGl[]=[];

    private _viewportSizeX:number = 0;
    private _viewportSizeY:number = 0;

    private _quadVerts = new Float32Array([
        //x  y  u  v
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,

        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0,
    ]);

    private _quadVertBuffer: WebGLBuffer | null = null;

    constructor(gl: WebGLRenderingContext,viewX:number,viewY:number,layers:Array<ITileLayer>) {
        //TODO: set from params
        this._viewportSizeX = viewX;
        this._viewportSizeY = viewY;
        for(const l of layers){
            //set up layer textures
            if ((l.width * l.height) !== l.data.length){ throw new Error('width,height mismatch'); }

            const textureData = new Uint8Array(l.width * l.height * 4);
            for(let i=0;i<l.data.length;i+=1){
                textureData[i*4]=l.data[i];//map idx to R
            }
            const inverseTileCount = new Float32Array(2);
            inverseTileCount[0] = 1 / l.width;
            inverseTileCount[1] = 1 / l.height;
            
            
            //setup tileset texture
            
            const tileSetTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tileSetTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, l.canvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


            //setup map texture
            const layerTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, layerTexture);

            // MUST be filtered with NEAREST or tile lookup fails
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            //updload data
            gl.texImage2D(gl.TEXTURE_2D,
                0,          // level
                gl.RGBA,    // internal format
                l.width,
                l.height,
                0,          // border
                gl.RGBA,    // format
                gl.UNSIGNED_BYTE, // type
                textureData
            );
            this._layerGL.push({
                x:0,y:0,scale:1,alpha:1,
                tileWidth:l.tileWidth,
                tileHeight:l.tileHeight,
                tileSetWidth:l.canvas.width,
                tileSetHeight:l.canvas.height,
                tileSetTexture,
                layerTexture,
                textureData,
                inverseTileCount
            });

        }

        // create buffers
        this._quadVertBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._quadVerts, gl.STATIC_DRAW);
        // create shaders
        this.program= EngineGL.compileProgram(
            gl,
            tilelayerVS,
            tilelayerFS,
            GLTilemap._attribIndices
        );
        
        // a list of uniform locations
        const uCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uCount; ++i) {
            const uniform = gl.getActiveUniform(this.program, i);
            const loc = gl.getUniformLocation(this.program,uniform.name);
            this.uniforms[uniform.name] = loc;
        } 

    }
    
    static draw(gl:WebGLRenderingContext,self:GLTilemap): void {
        gl.enable(gl.BLEND);
        gl.blendFunc(WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA);
        gl.blendEquation( WebGLRenderingContext.FUNC_ADD);

        // Enable attributes, these are the same for all shaders.
        gl.bindBuffer(gl.ARRAY_BUFFER, self._quadVertBuffer);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aPosition);
        gl.enableVertexAttribArray(GLTilemap._attribIndices.aTexture);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aPosition, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(GLTilemap._attribIndices.aTexture, 2, gl.FLOAT, false, 16, 8);

        // Bind tileset textures
        for (let i = 0; i < self._layerGL.length; ++i) {
            const tilesetTexture = self._layerGL[i].tileSetTexture;
            gl.activeTexture(gl.TEXTURE1 + i);
            gl.bindTexture(gl.TEXTURE_2D, tilesetTexture);
        }

        // Draw each layer of the map
        gl.activeTexture(gl.TEXTURE0);

        //bind shader
        gl.useProgram(self.program);


        gl.uniform1i(self.uniforms.uLayer, 0);//location of the map texture
        //draw layers
        for (let i = 0; i < self._layerGL.length; ++i) {
            const layer = self._layerGL[i];
            const inverseLayerTileSizeX = 1 / layer.tileWidth;
            const inverseLayerTileSizeY = 1 / layer.tileHeight;
            gl.uniform1i(self.uniforms.uTilesets, 1+i );//location of the tileset texture to use
            //tile sizing information
            gl.uniform2fv(self.uniforms.uInverseLayerTileSize!, [
                inverseLayerTileSizeX,
                inverseLayerTileSizeY
            ]);
            gl.uniform2fv(self.uniforms.uViewportSize, 
                    [self._viewportSizeX / layer.scale,
                     self._viewportSizeY / layer.scale]);
            gl.uniform1f(self.uniforms.uInverseTileScale, 1.0 / layer.scale);
            gl.uniform2fv(self.uniforms.uTilesetTileSize, [
                layer.tileWidth, layer.tileHeight
            ]);
            gl.uniform2fv(self.uniforms.uInverseTilesetTextureSize,
                [1 / layer.tileSetWidth,1 / layer.tileSetHeight]
            );

            gl.uniform2f( self.uniforms.uOffset!,-layer.x,-layer.y );

            gl.uniform1f(self.uniforms.uAlpha!, layer.alpha);
            gl.uniform2fv(self.uniforms.uInverseLayerTileCount!, layer.inverseTileCount);
            
            gl.bindTexture(gl.TEXTURE_2D, layer.layerTexture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

}



export {
    GLTilemap
}