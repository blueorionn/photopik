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

type Hasher = (text: string) => Promise<string>

const HASHERS: Record<string, Hasher> = {
  md5: (text) => md5(text),
  sha1: (text) => sha1(text),
  sha224: (text) => sha224(text),
  sha256: (text) => sha256(text),
  sha384: (text) => sha384(text),
  sha512: (text) => sha512(text),
  sha3_224: (text) => sha3(text, 224),
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
  text: string
): Promise<string> {
  const hasher = HASHERS[algorithm]

  if (!hasher) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`)
  }

  return hasher(text)
}

export const ALGORITHMS = [
  { name: 'blake2b512', title: 'Blake2b' },
  { name: 'blake2s256', title: 'Blake2s' },
  { name: 'md5', title: 'MD5' },
  { name: 'sha1', title: 'SHA1' },
  { name: 'sha224', title: 'SHA224' },
  { name: 'sha256', title: 'SHA256' },
  { name: 'sha384', title: 'SHA384' },
  { name: 'sha512', title: 'SHA512' },
  { name: 'sha3_224', title: 'SHA3-224' },
  { name: 'sha3_256', title: 'SHA3-256' },
  { name: 'sha3_384', title: 'SHA3-384' },
  { name: 'sha3_512', title: 'SHA3-512' },
  { name: 'keccak256', title: 'Keccak-256' },
  { name: 'blake3', title: 'Blake3' },
  { name: 'whirlpool', title: 'Whirlpool' },
  { name: 'ripemd160', title: 'RIPEMD-160' },
  { name: 'crc32', title: 'CRC32' },
]
