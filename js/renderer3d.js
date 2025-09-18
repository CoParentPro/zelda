// 3D WebGL Renderer for modern Zelda experience
class Renderer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        this.setupWebGL();
        this.initShaders();
        this.initBuffers();
        
        // Camera properties
        this.camera = {
            position: [0, 1.7, 0], // Eye level height
            rotation: [0, 0], // pitch, yaw
            fov: 75 * Math.PI / 180,
            near: 0.1,
            far: 100.0
        };
        
        // Matrices
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.modelMatrix = mat4.create();
        
        this.updateProjectionMatrix();
    }
    
    setupWebGL() {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clearColor(0.1, 0.1, 0.2, 1.0);
    }
    
    initShaders() {
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute vec2 aTextureCoord;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            
            varying highp vec2 vTextureCoord;
            varying highp vec3 vLighting;
            
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vTextureCoord = aTextureCoord;
                
                // Apply lighting
                highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
                highp vec3 directionalLightColor = vec3(1, 1, 1);
                highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
                
                highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
                
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (directionalLightColor * directional);
            }
        `;
        
        const fsSource = `
            varying highp vec2 vTextureCoord;
            varying highp vec3 vLighting;
            
            uniform sampler2D uSampler;
            uniform highp vec3 uColor;
            
            void main(void) {
                highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
                if (texelColor.a < 0.1) discard;
                
                gl_FragColor = vec4(texelColor.rgb * vLighting * uColor, texelColor.a);
            }
        `;
        
        this.shaderProgram = this.createShaderProgram(vsSource, fsSource);
        
        // Get attribute and uniform locations
        this.programInfo = {
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
                vertexNormal: this.gl.getAttribLocation(this.shaderProgram, 'aVertexNormal'),
                textureCoord: this.gl.getAttribLocation(this.shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                normalMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
                uSampler: this.gl.getUniformLocation(this.shaderProgram, 'uSampler'),
                uColor: this.gl.getUniformLocation(this.shaderProgram, 'uColor'),
            },
        };
    }
    
    createShaderProgram(vsSource, fsSource) {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error('Unable to initialize shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
        }
        
        return shaderProgram;
    }
    
    loadShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            this.gl.deleteShader(shader);
            throw new Error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
        }
        
        return shader;
    }
    
    initBuffers() {
        // Cube geometry for walls, floor tiles, etc.
        this.cubeBuffer = this.createCubeBuffer();
        this.playerBuffer = this.createPlayerBuffer();
        
        // Create texture for stone/dungeon materials
        this.texture = this.createTexture();
    }
    
    createCubeBuffer() {
        const positions = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];
        
        const normals = [
            // Front
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
            
            // Back
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
            
            // Top
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
            
            // Bottom
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
            
            // Right
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
            
            // Left
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
        ];
        
        const textureCoords = [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            0.0,  0.0,
            // Top
            0.0,  1.0,
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            // Bottom
            1.0,  1.0,
            0.0,  1.0,
            0.0,  0.0,
            1.0,  0.0,
            // Right
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            0.0,  0.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
        ];
        
        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];
        
        return {
            position: this.createBuffer(positions),
            normal: this.createBuffer(normals),
            textureCoord: this.createBuffer(textureCoords),
            indices: this.createElementBuffer(indices),
            vertexCount: indices.length
        };
    }
    
    createPlayerBuffer() {
        // Simplified Link model - more realistic proportions
        const positions = [
            // Head (cube)
            -0.3, 1.4, -0.3,   0.3, 1.4, -0.3,   0.3, 2.0, -0.3,  -0.3, 2.0, -0.3,
            -0.3, 1.4,  0.3,  -0.3, 2.0,  0.3,   0.3, 2.0,  0.3,   0.3, 1.4,  0.3,
            // Body (rectangular)
            -0.4, 0.8, -0.2,   0.4, 0.8, -0.2,   0.4, 1.4, -0.2,  -0.4, 1.4, -0.2,
            -0.4, 0.8,  0.2,  -0.4, 1.4,  0.2,   0.4, 1.4,  0.2,   0.4, 0.8,  0.2,
        ];
        
        const normals = positions.map(() => [0, 0, 1]).flat(); // Simplified normals
        const textureCoords = positions.map(() => [0, 0]).flat(); // Simplified UVs
        
        return {
            position: this.createBuffer(positions),
            normal: this.createBuffer(normals),
            textureCoord: this.createBuffer(textureCoords),
            vertexCount: positions.length / 3
        };
    }
    
    createBuffer(data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
        return buffer;
    }
    
    createElementBuffer(data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), this.gl.STATIC_DRAW);
        return buffer;
    }
    
    createTexture() {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // Create a procedural stone texture
        const width = 64, height = 64;
        const pixels = new Uint8Array(width * height * 4);
        
        for (let i = 0; i < pixels.length; i += 4) {
            const noise = Math.random() * 0.3 + 0.4;
            const stone = Math.floor(120 * noise);
            pixels[i] = stone;     // R
            pixels[i + 1] = stone * 0.9; // G
            pixels[i + 2] = stone * 0.8; // B
            pixels[i + 3] = 255;   // A
        }
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        return texture;
    }
    
    updateProjectionMatrix() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        mat4.perspective(this.projectionMatrix, this.camera.fov, aspect, this.camera.near, this.camera.far);
    }
    
    updateViewMatrix() {
        mat4.identity(this.viewMatrix);
        
        // Apply camera rotations
        mat4.rotateX(this.viewMatrix, this.viewMatrix, this.camera.rotation[0]);
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.camera.rotation[1]);
        
        // Apply camera translation
        mat4.translate(this.viewMatrix, this.viewMatrix, [-this.camera.position[0], -this.camera.position[1], -this.camera.position[2]]);
    }
    
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    render3DLevel(level) {
        this.clear();
        this.updateViewMatrix();
        
        this.gl.useProgram(this.shaderProgram);
        
        // Set uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, this.projectionMatrix);
        
        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        
        // Render level geometry
        this.renderLevelGeometry(level);
        
        // Render player
        this.renderPlayer();
    }
    
    renderLevelGeometry(level) {
        const tileSize = 2.0; // 2 units per tile
        const wallHeight = 3.0;
        
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tileType = level.getTile(x, y);
                const worldX = (x - level.width / 2) * tileSize;
                const worldZ = (y - level.height / 2) * tileSize;
                
                // Render floor
                this.renderCube([worldX, -1, worldZ], [tileSize/2, 0.1, tileSize/2], [0.7, 0.7, 0.8]);
                
                // Render walls
                if (tileType === level.tileTypes.WALL) {
                    this.renderCube([worldX, wallHeight/2, worldZ], [tileSize/2, wallHeight/2, tileSize/2], [0.5, 0.4, 0.3]);
                }
            }
        }
    }
    
    renderPlayer() {
        // Render Link at camera position with offset for third-person view
        const offset = [0, -0.5, -3]; // Behind and below camera
        const playerPos = [
            this.camera.position[0] + offset[0],
            this.camera.position[1] + offset[1],
            this.camera.position[2] + offset[2]
        ];
        
        this.renderCube(playerPos, [0.3, 0.8, 0.2], [0.2, 0.8, 0.2]); // Green tunic
    }
    
    renderCube(position, scale, color) {
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, this.viewMatrix, this.modelMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, position);
        mat4.scale(modelViewMatrix, modelViewMatrix, scale);
        
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        
        // Set uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.normalMatrix, false, normalMatrix);
        this.gl.uniform3fv(this.programInfo.uniformLocations.uColor, color);
        
        // Bind buffers and draw
        this.bindBuffer(this.cubeBuffer.position, this.programInfo.attribLocations.vertexPosition, 3);
        this.bindBuffer(this.cubeBuffer.normal, this.programInfo.attribLocations.vertexNormal, 3);
        this.bindBuffer(this.cubeBuffer.textureCoord, this.programInfo.attribLocations.textureCoord, 2);
        
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeBuffer.indices);
        this.gl.drawElements(this.gl.TRIANGLES, this.cubeBuffer.vertexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    
    bindBuffer(buffer, location, size) {
        if (location >= 0) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(location);
        }
    }
    
    // Camera controls
    moveCamera(direction, distance) {
        const rad = this.camera.rotation[1];
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        switch(direction) {
            case 'forward':
                this.camera.position[0] += sin * distance;
                this.camera.position[2] += cos * distance;
                break;
            case 'backward':
                this.camera.position[0] -= sin * distance;
                this.camera.position[2] -= cos * distance;
                break;
            case 'left':
                this.camera.position[0] += cos * distance;
                this.camera.position[2] -= sin * distance;
                break;
            case 'right':
                this.camera.position[0] -= cos * distance;
                this.camera.position[2] += sin * distance;
                break;
        }
    }
    
    rotateCamera(pitchDelta, yawDelta) {
        this.camera.rotation[0] = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation[0] + pitchDelta));
        this.camera.rotation[1] += yawDelta;
    }
}

// Simple mat4 library for WebGL
const mat4 = {
    create() {
        return new Float32Array(16);
    },
    
    identity(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    },
    
    perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
        return out;
    },
    
    translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        for (let i = 0; i < 12; i++) out[i] = a[i];
        return out;
    },
    
    scale(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
        out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
        out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
    },
    
    rotateX(out, a, rad) {
        const s = Math.sin(rad), c = Math.cos(rad);
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        for (let i = 0; i < 4; i++) out[i] = a[i];
        out[4] = a10 * c + a20 * s; out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s; out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s; out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s; out[11] = a23 * c - a13 * s;
        for (let i = 12; i < 16; i++) out[i] = a[i];
        return out;
    },
    
    rotateY(out, a, rad) {
        const s = Math.sin(rad), c = Math.cos(rad);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a00 * c - a20 * s; out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s; out[3] = a03 * c - a23 * s;
        for (let i = 4; i < 8; i++) out[i] = a[i];
        out[8] = a00 * s + a20 * c; out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c; out[11] = a03 * s + a23 * c;
        for (let i = 12; i < 16; i++) out[i] = a[i];
        return out;
    },
    
    multiply(out, a, b) {
        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
        
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        
        a00 = a[4]; a01 = a[5]; a02 = a[6]; a03 = a[7];
        out[4] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[5] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[6] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[7] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        
        a00 = a[8]; a01 = a[9]; a02 = a[10]; a03 = a[11];
        out[8] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[9] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[10] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[11] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        
        a00 = a[12]; a01 = a[13]; a02 = a[14]; a03 = a[15];
        out[12] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[13] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[14] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        out[15] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        return out;
    },
    
    invert(out, a) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        
        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;
        
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        
        if (!det) return null;
        det = 1.0 / det;
        
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
        
        return out;
    },
    
    transpose(out, a) {
        if (out === a) {
            const a01 = a[1], a02 = a[2], a03 = a[3];
            const a12 = a[6], a13 = a[7];
            const a23 = a[11];
            
            out[1] = a[4]; out[2] = a[8]; out[3] = a[12];
            out[4] = a01; out[6] = a[9]; out[7] = a[13];
            out[8] = a02; out[9] = a12; out[11] = a[14];
            out[12] = a03; out[13] = a13; out[14] = a23;
        } else {
            out[0] = a[0]; out[1] = a[4]; out[2] = a[8]; out[3] = a[12];
            out[4] = a[1]; out[5] = a[5]; out[6] = a[9]; out[7] = a[13];
            out[8] = a[2]; out[9] = a[6]; out[10] = a[10]; out[11] = a[14];
            out[12] = a[3]; out[13] = a[7]; out[14] = a[11]; out[15] = a[15];
        }
        return out;
    }
};