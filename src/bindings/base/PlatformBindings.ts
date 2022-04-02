/**
 * A base class for all platform bindings.
 * 
 * Platform bindings is the way how the application runs a platform specific logic.
 * 
 * For example, it implements how the application stores the state or implements file picker / file saver.
 * Depending on the platform (Electron, web, Chrome, more?)  it uses different set of bindings
 * defined in the target application. This creates a framework for the bindings to exist.
 */
export abstract class PlatformBindings {
  /**
   * Initializes the bindings.
   */
  abstract initialize(): Promise<void>;
}
