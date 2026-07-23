import {
  md5,
  sha1,
  sha224,
  sha256,
  sha384,
  sha512,
  sha3,
  keccak,
  blake2b,
  blake2s,
  blake3,
  whirlpool,
  ripemd160,
  crc32,
} from 'hash-wasm'

type Hasher = (text: string, outputByte: number) => Promise<string>

// Map each `algorithms.json` `name` to the hash-wasm function that produces
// it. Add an entry here whenever a new algorithm shows up in algorithms.json.
const HASHERS: Record<string, Hasher> = {
  md5: (text) => md5(text),
  sha1: (text) => sha1(text),
  sha224: (text) => sha224(text),
  sha256: (text) => sha256(text),
  sha384: (text) => sha384(text),
  sha512: (text) => sha512(text),
  sha3_256: (text) => sha3(text, 256),
  sha3_384: (text) => sha3(text, 384),
  sha3_512: (text) => sha3(text, 512),
  keccak256: (text) => keccak(text, 256),
  blake2b512: (text) => blake2b(text, 512),
  blake2s256: (text) => blake2s(text, 256),
  blake3: (text) => blake3(text),
  whirlpool: (text) => whirlpool(text),
  ripemd160: (text) => ripemd160(text),
  crc32: (text) => crc32(text),
}

export async function hashText(
  algorithm: string,
  text: string,
  outputByte = 64
): Promise<string> {
  const hasher = HASHERS[algorithm]

  if (!hasher) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`)
  }

  return hasher(text, outputByte)
}
