import type { ToolcraftCapabilityProofRecipe, ToolcraftCapabilityProofOwner } from "./types";
export const externalSiteCapabilityProof = Object.freeze({
  capabilityId: "document.external-site",
  ownerId: "external-site",
  proof: Object.freeze({ kind: "external-site" }),
} satisfies ToolcraftCapabilityProofRecipe);
// A managed website is not a generated transparent-foreground product. Its host gate owns its proof.
export const getExternalSiteProofErrors: ToolcraftCapabilityProofOwner = ({ activeCapabilities }) =>
  activeCapabilities.includes("document.external-site")
    ? [
        "document.external-site requires the project-host website verification workflow; generated product delivery cannot certify external websites.",
      ]
    : [];
