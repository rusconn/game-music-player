type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const hash = async (algorithm: Algorithm, data: BufferSource) => {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
