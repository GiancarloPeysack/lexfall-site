// Statically named imports so esbuild keeps only the liquid metal shader (a dynamic import of the package
// namespace would pull in all of @paper-design/shaders).
export { ShaderMount, liquidMetalFragmentShader, getShaderColorFromString, ShaderFitOptions } from '@paper-design/shaders';
