async function supportsModuleWorker(): Promise<boolean> {
  let supports = false;
  const tester = {
    get type(): WorkerType { supports = true; return 'module' }
  };
  try {
    // eslint-disable-next-line no-new
    new Worker('blob://', tester);
  } catch (e) {
    // ....
  }
  return supports;
}

export default async function supportedPlatform(): Promise<boolean> {
  const hasWorkerModule = await supportsModuleWorker();
  if (!hasWorkerModule) {
    return false;
  }
  return true;
}
