import { useEffect, useRef } from 'react';
import fragmentSource from './mesh-drift.frag?raw';

const vertexSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const colors = new Float32Array([
  0.012, 0.110, 0.149,
  0.106, 0.424, 0.659,
  0.353, 0.824, 0.957,
  0.918, 0.976, 1.000,
  0, 0, 0,
  0, 0, 0,
  0, 0, 0,
  0, 0, 0,
]);

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function MeshDriftBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let elapsedMs = 0;
    let previousTime = performance.now();
    let disposed = false;
    let isVisible = true;
    let cleanupScene: (() => void) | undefined;
    let resumeScene: (() => void) | undefined;

    const createScene = () => {
      const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      });
      if (!gl) throw new Error('WebGL1 is not available');

      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      if (!program) throw new Error('Unable to create WebGL program');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Unable to link WebGL program');
      }

      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uniforms = {
        colors: gl.getUniformLocation(program, 'u_colors[0]'),
        scene: gl.getUniformLocation(program, 'u_scene'),
        shape: gl.getUniformLocation(program, 'u_shape'),
        surface: gl.getUniformLocation(program, 'u_surface'),
        finish: gl.getUniformLocation(program, 'u_finish'),
        transform: gl.getUniformLocation(program, 'u_transform'),
        space: gl.getUniformLocation(program, 'u_space'),
        cursor: gl.getUniformLocation(program, 'u_cursor'),
      };

      gl.uniform3fv(uniforms.colors, colors);
      gl.uniform4f(uniforms.shape, 1.30, 0.56, 0.67, 0.19);
      gl.uniform4f(uniforms.surface, 2.02, 1.17, 0.00, 1.00);
      gl.uniform4f(uniforms.finish, 0.00, 0.30, 0.007, 0.10);
      gl.uniform4f(uniforms.transform, 5069.0, 2.72, 0.15, 0.0);
      gl.uniform4f(uniforms.space, 0.09, 0.15, 0.0, 0.0);
      gl.uniform4f(uniforms.cursor, 0.0, 2.0, 0.65, 0.46);

      const render = (seconds: number) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
        gl.uniform4f(uniforms.scene, width, height, seconds * -1.37, 4.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const tick = (now: number) => {
        if (disposed || document.hidden || reducedMotion.matches || !isVisible) return;
        elapsedMs += Math.min(now - previousTime, 50);
        previousTime = now;
        render(elapsedMs / 1000);
        animationFrame = requestAnimationFrame(tick);
      };

      const start = () => {
        cancelAnimationFrame(animationFrame);
        previousTime = performance.now();
        if (reducedMotion.matches) {
          render(0);
          return;
        }
        if (!document.hidden && isVisible) animationFrame = requestAnimationFrame(tick);
      };
      resumeScene = start;

      const onVisibilityChange = () => {
        if (document.hidden) cancelAnimationFrame(animationFrame);
        else start();
      };
      const onResize = () => render(reducedMotion.matches ? 0 : elapsedMs / 1000);

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('resize', onResize);
      reducedMotion.addEventListener('change', start);
      canvas.dataset.webgl = 'ready';
      start();

      return () => {
        cancelAnimationFrame(animationFrame);
        resumeScene = undefined;
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('resize', onResize);
        reducedMotion.removeEventListener('change', start);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    };

    const boot = () => {
      cleanupScene?.();
      try {
        cleanupScene = createScene();
      } catch (error) {
        canvas.dataset.webgl = 'fallback';
        console.warn('Mesh Drift background fallback:', error);
      }
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(animationFrame);
      canvas.dataset.webgl = 'fallback';
    };
    const onContextRestored = () => boot();

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    boot();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) resumeScene?.();
      else cancelAnimationFrame(animationFrame);
    }, { rootMargin: '160px' });
    visibilityObserver.observe(canvas);

    return () => {
      disposed = true;
      visibilityObserver.disconnect();
      cleanupScene?.();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }, []);

  return <canvas ref={canvasRef} className="mesh-drift" aria-hidden="true" />;
}
