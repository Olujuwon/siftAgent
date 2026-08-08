/** @type {import('next').NextConfig} */
const nextConfig = {
  // The agent runs server-side only (Node runtime), so nothing special is
  // needed here yet. If a LangGraph/LangChain dependency ever complains about
  // being bundled, add it to `serverExternalPackages` below.
  //
  // serverExternalPackages: ["@langchain/langgraph"],
};

module.exports = nextConfig;
