import { type EngineInstance } from "./definitions.mjs";

// WebGL internal constants 
class EngineGL{

    
    /** Clear the canvas and setup the viewport
     *  @memberof WebGL */
    static glClearCanvas(instance:EngineInstance) {
        // clear and set to same size as main canvas
        instance.glContext.viewport(0, 0, 
            instance.glContext.canvas.width = instance.glContext.canvas.width, 
            instance.glContext.canvas.height= instance.glContext.canvas.height);
        instance.glContext.clear(instance.glContext.COLOR_BUFFER_BIT);
    }

    
    /**
     * @param gl The rendering context.
     * @param vertexSrc The vertex shader source as an array of strings.
     * @param fragmentSrc The fragment shader source as an array of strings.
     * @param attributeLocations A key value pair showing which location
     *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
     */
    static compileProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string, attributeLocations?: Record<string,number>): WebGLProgram {
        const glVertShader = EngineGL.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
        const glFragShader = EngineGL.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

        const program = gl.createProgram();

        gl.attachShader(program, glVertShader);
        gl.attachShader(program, glFragShader);

        // optionally, set the attributes manually for the program rather than letting WebGL decide..
        if (attributeLocations) {
            for (const k in attributeLocations) {
                if(! Object.prototype.hasOwnProperty.call(attributeLocations, k)){
                    continue;
                }
                const location = attributeLocations[k];
                if (location) {
                    gl.bindAttribLocation(program, location, k);
                }
            }
        }
        gl.linkProgram(program);
        // if linking fails, then log and cleanup
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errLog = gl.getProgramInfoLog(program);
            throw new Error(`Could not link shader program. Log:\n${errLog}`);
        }

        // clean up some shaders
        gl.deleteShader(glVertShader);
        gl.deleteShader(glFragShader);

        return program;
    }

    /**
     * Compiles source into a program.
     *
     * @param gl The rendering context.
     * @param type The type, can be either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
     * @param source The fragment shader source as an array of strings.
     */
    static compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (!shader){ throw new Error('Failed to create WebGL shader object.'); }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const errLog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Failed to compile shader. Log:\n${errLog}`);
        }
        return shader;
    }
    
    /** Create WebGL texture from an image and init the texture settings *  @param {HTMLImageElement} image
     *  @return {WebGLTexture}
     *  @memberof WebGL */
    static glCreateTexture(instance:EngineInstance,image:HTMLImageElement) {
        // build the texture
        const texture = instance.glContext.createTexture();
        instance.glContext.bindTexture(instance.glContext.TEXTURE_2D, texture);
        if (image && image.width){
            instance.glContext.texImage2D(instance.glContext.TEXTURE_2D, 0, instance.glContext.RGBA, instance.glContext.RGBA, instance.glContext.UNSIGNED_BYTE, image);
        } else {
            // create a white texture
            const whitePixel = new Uint8Array([255, 255, 255, 255]);
            instance.glContext.texImage2D(instance.glContext.TEXTURE_2D, 0, instance.glContext.RGBA, 1, 1, 0, instance.glContext.RGBA, instance.glContext.UNSIGNED_BYTE, whitePixel);
        }

        // use point filtering for pixelated rendering
        instance.glContext.texParameteri(instance.glContext.TEXTURE_2D, instance.glContext.TEXTURE_MIN_FILTER, instance.glContext.NEAREST );
        instance.glContext.texParameteri(instance.glContext.TEXTURE_2D, instance.glContext.TEXTURE_MAG_FILTER, instance.glContext.NEAREST );
        return texture;
    }

}

export {EngineGL}