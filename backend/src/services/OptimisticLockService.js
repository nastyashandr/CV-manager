import ApiError from '../utils/ApiError.js';

class OptimisticLockService {
  static async applyUpdate(instance, incomingVersion, patch) {
    const currentVersion = Number(instance.version);
    const incoming = Number(incomingVersion);

    if (incoming !== currentVersion) {
      throw ApiError.conflict(
        `Record was modified by someone else (current version ${currentVersion})`,
        { currentVersion }
      );
    }
    await instance.update({ ...patch, version: currentVersion + 1 });
    return instance;
  }
}

export default OptimisticLockService;