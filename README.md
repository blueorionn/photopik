# Crypticworld

![CrypticWorld Logo](https://raw.githubusercontent.com/blueorionn/crypticworld/refs/heads/main/public/img/crypticworld-site-img.png)

Crypticworld is a growing collection of browser-based tools for common security
and encoding tasks. It is built with Next.js and focuses on quick, local-first
utilities that are easy to reach from a single workspace.

## About

The project has been refactored into a tool-focused structure. The home page
acts as a dashboard for available and upcoming utilities, while each tool lives
in its own route and core module.

Current functionality centers on text hashing, with planned tools for inspecting
tokens and encoding or decoding data. Input text is encoded with UTF-8 before
operations are performed.

## Tools

| Tool Name              | Description                                                                           | Status      |
| ---------------------- | ------------------------------------------------------------------------------------- | ----------- |
| Hash Text              | Generate hashes from text with MD5, SHA, SHA-3, Keccak-256, Blake2, Blake3, and more. | Available   |
| JWT Decoder            | Decode and inspect JWT headers, payloads, and signatures.                             | Coming soon |
| Base64 Encode / Decode | Convert text to and from Base64.                                                      | Coming soon |
| URL Encode / Decode    | Percent-encode or decode strings for URLs.                                            | Coming soon |

## LICENSE

[Apache-2.0 license](https://github.com/blueorionn/crypticworld/blob/main/LICENSE)

## Author

[@blueorionn](https://www.github.com/blueorionn)
