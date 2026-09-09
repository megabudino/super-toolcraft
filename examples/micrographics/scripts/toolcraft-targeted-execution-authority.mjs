import path from "node:path";

import { executeToolcraftTargetedVerificationCore } from "./toolcraft-targeted-verification-execution.mjs";

function getTargetedExecutionFingerprint({
  changedFiles,
  files,
  sourceHash,
  verification,
  verificationTier,
}) {
  return JSON.stringify({
    changedFiles,
    files,
    sourceHash,
    verification,
    verificationTier,
  });
}

function createTargetedExecutionAuthorityRegistry(executeVerification) {
  const authorities = new WeakMap();
  const reservations = new WeakMap();

  function getAuthorityError() {
    return new Error(
      "Toolcraft targeted checkpoint commit requires protected targeted execution authority from the successful same-process runner.",
    );
  }

  function getReservationError() {
    return new Error(
      "Toolcraft targeted execution authority reservation is invalid or no longer active.",
    );
  }

  async function execute(options) {
    const result = await executeVerification(options);
    const authority = Object.freeze(Object.create(null));
    authorities.set(authority, {
      fingerprint: getTargetedExecutionFingerprint({
        changedFiles: options.context.changedFiles,
        files: result.verifiedInventory.entries,
        sourceHash: result.verifiedInventory.sourceHash,
        verification: result.verification,
        verificationTier: result.verificationTier,
      }),
      projectDir: path.resolve(options.projectDir),
      reservation: null,
    });
    return { ...result, targetedExecutionAuthority: authority };
  }

  function reserve({ authority, deliveryReceipt, projectDir }) {
    if (
      (typeof authority !== "object" && typeof authority !== "function") ||
      authority === null
    ) {
      throw getAuthorityError();
    }
    const binding = authorities.get(authority);
    const fingerprint = deliveryReceipt
      ? getTargetedExecutionFingerprint({
          changedFiles: deliveryReceipt.changedFiles,
          files: deliveryReceipt.files,
          sourceHash: deliveryReceipt.sourceHash,
          verification: deliveryReceipt.verification,
          verificationTier: deliveryReceipt.verificationTier,
        })
      : null;
    if (
      binding === undefined ||
      binding.reservation !== null ||
      binding.projectDir !== path.resolve(projectDir) ||
      binding.fingerprint !== fingerprint
    ) {
      throw getAuthorityError();
    }
    const reservation = Object.freeze(Object.create(null));
    binding.reservation = reservation;
    reservations.set(reservation, { authority, binding });
    return reservation;
  }

  function finalize(reservation) {
    const reserved = reservations.get(reservation);
    if (reserved?.binding.reservation !== reservation) {
      throw getReservationError();
    }
    reservations.delete(reservation);
    authorities.delete(reserved.authority);
  }

  function release(reservation) {
    const reserved = reservations.get(reservation);
    if (reserved?.binding.reservation !== reservation) {
      throw getReservationError();
    }
    reserved.binding.reservation = null;
    reservations.delete(reservation);
  }

  return Object.freeze({ execute, finalize, release, reserve });
}

const authorityRegistry = createTargetedExecutionAuthorityRegistry(
  executeToolcraftTargetedVerificationCore,
);

export const executeToolcraftTargetedVerification = authorityRegistry.execute;
export const finalizeToolcraftTargetedExecutionAuthority =
  authorityRegistry.finalize;
export const releaseToolcraftTargetedExecutionAuthority =
  authorityRegistry.release;
export const reserveToolcraftTargetedExecutionAuthority = authorityRegistry.reserve;
