THREE.TessellationShader = {

    uniforms : THREE.UniformsUtils.merge([
      THREE.UniformsLib[ "lights" ],
        {
          "diffuse": {type: 'c', value: null},
          "amount": {type: 'f', value: 5.0},
          "amplitude": { type: "f", value: 0.0 },
          "animation": { type: "i", value: 0 }
        }
    ]),

    fragmentShader: [
      THREE.ShaderChunk[ "common" ],
      THREE.ShaderChunk[ "bsdfs" ],
      THREE.ShaderChunk[ "lights_pars" ],
      "uniform vec3 diffuse;",
      "varying vec3 vPos;",
      "varying vec3 vNormal;",
      "varying vec3 vColor;",
      "varying vec2 vUv;",
      "uniform float amount;",
      "uniform int animation;",

      "vec2 hash2( vec2 p )",
      "{",
          // procedural white noise
       " return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);",
      "}",

      "vec3 voronoi( in vec2 x )",
      "{",
          "vec2 n = floor(x);",
          "vec2 f = fract(x);",

          //----------------------------------
          // first pass: regular voronoi
          //----------------------------------
        "vec2 mg, mr;",

          "float md = 8.0;",
          "for( int j=-1; j<=1; j++ )",
          "for( int i=-1; i<=1; i++ )",
          "{",
              "vec2 g = vec2(float(i),float(j));",
              "vec2 o = hash2( n + g );",
              "vec2 r = g + o - f;",
              "float d = dot(r,r);",

              "if( d<md )",
              "{",
                  "md = d;",
                  "mr = r;",
                  "mg = g;",
              "}",
          "}",

          //----------------------------------
          // second pass: distance to borders
          //----------------------------------
          "md = 8.0;",
          "for( int j=-2; j<=2; j++ )",
          "for( int i=-2; i<=2; i++ )",
          "{",
              "vec2 g = mg + vec2(float(i),float(j));",
              "vec2 o = hash2( n + g );",
              "vec2 r = g + o - f;",

              "if( dot(mr-r,mr-r)>0.00001 )",
              "md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );",
          "}",

          "return vec3( md, mr );",
      "}",

      "float calcLightAttenuation( float lightDistance, float cutoffDistance, float decayExponent ) {",
        "if ( decayExponent > 0.0 ) {",
          "return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );",
        "}",
        "return 1.0;",
      "}",

      "void main() {",
        "if(animation==0)",
        "{",
          "vec4 addedLights = vec4(0.0,0.0,0.0, 1.0);",
          "for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {",
            "vec3 lVector = pointLights[ i ].position + vPos.xyz;",
            "float attenuation = calcLightAttenuation( length( lVector ), pointLights[ i ].distance, pointLights[ i ].decay );",
            "vec3 pointVector = normalize( lVector );",
            "float pointDiffuseWeight = max( dot( vNormal, pointVector ), 0.0 );",
            "addedLights.rgb += pointLights[ i ].color * ( pointDiffuseWeight * attenuation );",
          "}",
          "vec3 c = voronoi( 8.0*(vNormal.xy*vec2(amount)) );",
          "vec3 col = mix( vec3(0.0), addedLights.rgb, smoothstep( 0.35, (0.35), c.x ) );",
          "gl_FragColor = mix(vec4(diffuse.x, diffuse.y, diffuse.z, 1.0), addedLights, addedLights) + vec4(col, 1.0);",
          "gl_FragColor = vec4( gl_FragColor.xyz  * vColor, gl_FragColor.a );",
        "}",
        "else",
        "{",
          "gl_FragColor = vec4( vColor, 1.0 );",
        "}",
       
      "}",
    ].join("\n"),



    vertexShader: [
      "uniform float amplitude;",
      "uniform int animation;",
      "attribute vec3 customColor;",
      "attribute vec3 displacement;",

      "varying vec3 vNormal;",
      "varying vec2 vUv;",
      "varying vec3 vPos;",
      "varying vec3 vColor;",

      "void main() {",

        "vec3 newPosition = position + normal * amplitude * displacement;",
        "vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",
        "if(animation==0)",
        "{",
          "vPos = -mvPosition.xyz;",
          "vNormal = normalize( normalMatrix * normal);",
          "vUv = uv;",
        "}",
        "vColor = customColor;",
      "}"
    ].join("\n")

};