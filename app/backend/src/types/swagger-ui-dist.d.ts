declare module 'swagger-ui-dist' {
  interface SwaggerUiDistFunction {
    (): string;
    getAbsoluteFSPath(): string;
  }

  const absolutePath: SwaggerUiDistFunction;
  export = absolutePath;
}
