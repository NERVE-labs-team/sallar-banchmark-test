const isMobileDevice = () => {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

function tryCreateContext(canvas) {
  let gl = null;

  try {
    gl = canvas.getContext("webgl2", { antialias: false });
    if (gl) {
      console.log("✅ WebGL2 context created");
      return gl;
    }
  } catch (e) {
    console.warn("⚠️ WebGL2 creation failed:", e);
  }

  try {
    gl =
      canvas.getContext("webgl", { antialias: false }) ||
      canvas.getContext("experimental-webgl", { antialias: false });
    if (gl) {
      console.log("✅ WebGL1 context created");
      return gl;
    }
  } catch (e) {
    console.warn("⚠️ WebGL1 creation failed:", e);
  }

  console.error("❌ WebGL not supported at all on this device (EGL_BAD_ATTRIBUTE?)");
  return null;
}

const getGpuInfo = () => {
  const canvas = document.createElement("canvas");
  const gl = tryCreateContext(canvas);

  if (!gl) {
    return { vendor: "N/A", renderer: "N/A", error: "WebGL not supported" };
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : "unknown";
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : "unknown";

  return {
    vendor,
    renderer,
    glVersion: gl.getParameter(gl.VERSION),
    shadingLang: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    extensions: gl.getSupportedExtensions(),
  };
};

const runTestCase = async () => {
  const isMobile = isMobileDevice();

  // === 1. WebGPU available ===
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error("❌ WebGPU adapter not available");
        return 0;
      }

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
        layout: "auto",
        compute: { module: shaderModule, entryPoint: "main" },
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
    } catch (err) {
      console.error("❌ WebGPU execution failed:", err);
      return 0;
    }
  }

  // === 2. WebGPU not available ===
  if (!isMobile) {
    console.warn("⚠️ Desktop without WebGPU → no support");
    return 0;
  }

  console.log("📱 Mobile → fallback to WebGL...");
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const gl = tryCreateContext(canvas);

  if (!gl) {
    return 0;
  }

  const hasFragDepth = !!gl.getExtension("EXT_frag_depth");

  const vsSource = `
    attribute vec4 aPosition;
    void main(void) {
      gl_Position = aPosition;
    }`;

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
      const msg = gl.getShaderInfoLog(shader);
      console.error("❌ Shader compile error:", msg);
      throw new Error(msg);
    }
    return shader;
  }

  let program;
  try {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const msg = gl.getProgramInfoLog(program);
      console.error("❌ Program link error:", msg);
      throw new Error(msg);
    }

    gl.useProgram(program);
  } catch (err) {
    console.error("❌ Shader/Program setup failed:", err);
    return 0;
  }

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  if (positionLocation === -1) {
    console.error("❌ Attribute 'aPosition' not found in shader");
    return 0;
  }
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
        if (score === 0) {
          console.warn("⚠️ GPU test produced 0 score – possible driver/extension issue");
        }
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

    const avg = Math.round(sum / ITERATIONS);
    if (avg === 0) {
      console.warn("⚠️ Final GPU score is 0 – test failed on this device");
    }
    return { gpuPoints: avg, gpuInfo };
  } catch (err) {
    console.error("❌ GPU test crashed:", err);
    return { gpuPoints: 0, gpuInfo, error: String(err) };
  }
};
