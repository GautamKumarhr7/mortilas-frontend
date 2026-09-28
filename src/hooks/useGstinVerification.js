import { useState } from "react";

const GSTIN_PATTERN =
  /^([0-2][0-9]|[3][0-8])[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
const GSTIN_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function normalizeGstin(value) {
  return (value || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function hasValidChecksum(gstin) {
  let factor = 2;
  let sum = 0;

  for (let index = gstin.length - 2; index >= 0; index -= 1) {
    const codePoint = GSTIN_CHARACTERS.indexOf(gstin[index]);
    const digit = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    sum +=
      Math.floor(digit / GSTIN_CHARACTERS.length) +
      (digit % GSTIN_CHARACTERS.length);
  }

  const checksum =
    (GSTIN_CHARACTERS.length - (sum % GSTIN_CHARACTERS.length)) %
    GSTIN_CHARACTERS.length;
  return gstin[14] === GSTIN_CHARACTERS[checksum];
}

function validateGstin(gstin) {
  if (gstin.length !== 15) return "Enter a valid 15 character GSTIN";
  if (!GSTIN_PATTERN.test(gstin)) return "Invalid GSTIN format";
  if (!hasValidChecksum(gstin)) return "Invalid checksum character in GSTIN";
  return "Valid GSTIN";
}

export default function useGstinVerification() {
  const [status, setStatus] = useState("idle");
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState("");

  const verify = async (value) => {
    const gstin = normalizeGstin(value);
    setDetails(null);
    setMessage("");

    const validationMessage = validateGstin(gstin);
    if (validationMessage !== "Valid GSTIN") {
      setStatus("invalid");
      setMessage(validationMessage);
      return false;
    }

    setDetails(null);
    setStatus("verified");
    return true;
  };

  return { status, details, message, verify };
}
