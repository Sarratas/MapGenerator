// Ambient declarations for non-code imports handled by webpack loaders.
declare module '*.scss';
declare module '*.css';

// Test-only canvas context mock (loaded by Jest; not type-checked here).
declare module '*.mock';
