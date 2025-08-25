const isMobileDevice = () => {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const getGpuInfo = () => {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl2') ||
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl');

  if (!gl) {
    return 'WebGL not supported';
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return {
      vendor,
      renderer,
      extensions: gl.getSupportedExtensions(),
    };
  } else {
    return {
      vendor: 'unknown',
      renderer: 'unknown',
      extensions: gl.getSupportedExtensions(),
    };
  }
};

const runTestCase = async () => {
  const isMobile = isMobileDevice();

  // === 1. WebGPU available ===
  if (navigator.gpu) {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const shaderCode = `
      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        let index = global_id.x;
        for (var i = 0u; i < 1000u; i++) {
          let x = f32(index) * 1.01;
          let y = x * x * 0.0001;
        }
      }
    `;

    const shaderModule = device.createShaderModule({ code: shaderCode });
    const pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module: shaderModule, entryPoint: 'main' },
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.dispatchWorkgroups(1000000 / 64);
    passEncoder.end();

    const start = performance.now();
    device.queue.submit([commandEncoder.finish()]);
    await device.queue.onSubmittedWorkDone();
    const end = performance.now();

    const durationMs = end - start;
    return Math.round(1_000_000 / durationMs);
  }

  // === 2. WebGPU not available ===
  if (!isMobile) {
    console.log('Desktop without WebGPU → no support');
    return 0; // no result
  }

  console.log('Mobile → fallback to WebGL...');
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    console.log('WebGL not available too');
    return 0;
  }

  const hasFragDepth = !!gl.getExtension('EXT_frag_depth');

  const vsSource = `
    attribute vec4 aPosition;
    void main(void) {
      gl_Position = aPosition;
    }`;

  // jeśli mamy EXT_frag_depth → użyjemy go, jeśli nie → prostszy shader
  const fsSource = hasFragDepth
    ? `
      #ifdef GL_EXT_frag_depth
      #extension GL_EXT_frag_depth : enable
      #endif

      precision highp float;
      void main(void) {
        vec4 color = vec4(0.0);
        for (int i = 0; i < 100; i++) {
          color += vec4(0.01);
        }
        gl_FragColor = color;

        #ifdef GL_EXT_frag_depth
          gl_FragDepthEXT = gl_FragColor.r;
        #endif
      }`
    : `
      precision highp float;
      void main(void) {
        vec4 color = vec4(0.0);
        for (int i = 0; i < 100; i++) {
          color += vec4(0.01);
        }
        gl_FragColor = color;
      }`;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const start = performance.now();
  let frames = 0;

  return new Promise((resolve) => {
    function render() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frames++;
      const elapsed = performance.now() - start;

      if (elapsed < 2000) {
        requestAnimationFrame(render);
      } else {
        const fps = frames / (elapsed / 1000);
        const score = Math.round(fps * 100);
        resolve(score);
      }
    }
    render();
  });
};

export const runWebGpuTest = async () => {
  let gpuInfo = null;

  try {
    gpuInfo = getGpuInfo();

    const ITERATIONS = 20;
    let sum = 0;

    for (let i = 0; i < ITERATIONS; ++i) {
      const result = await runTestCase();
      sum += result;
    }

    return { gpuPoints: Math.round(sum / ITERATIONS), gpuInfo };
  } catch (err) {
    console.error('GPU test error:', err);
    return { gpuPoints: 0, gpuInfo };
  }
};
