/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Keep these out of the server bundle — Next requires them at runtime instead.
   *
   * pdf-parse wraps pdfjs-dist, which detects its environment at load time and
   * pulls in Node builtins to polyfill DOMMatrix, ImageData and Path2D. Bundled,
   * that detection fails: it can't reach `require`, the polyfills never land,
   * and the first `new DOMMatrix()` throws ReferenceError.
   *
   * If a LangGraph/LangChain dependency ever complains about being bundled, it
   * goes here too.
   */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

module.exports = nextConfig;
