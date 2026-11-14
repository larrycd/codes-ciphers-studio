# Notices

Codes & Ciphers Studio is by Larry Dalton.

- The studio follows the chapter structure of Sunil Tanna, *Codes, Ciphers, Steganography & Secret Messages*
  (Answers 2000 Limited, 2020). No text or images from the book are included; explanations and drawings are original.
- Beale cipher no. 2, its accepted solution and the Declaration of Independence as transcribed by John Burkardt
  (people.math.sc.edu/burkardt/datasets/beale_cipher), distributed under the GNU LGPL. The underlying historical texts are in the public domain.
- `src/app/data/quadgrams.json`: four-letter group frequencies counted from Shakespeare's plays (public domain,
  via the char-rnn "tinyshakespeare" file) and the Declaration of Independence.
- AES, ECDSA and SHA use the browser's built-in Web Crypto.
- The RSA-129 numbers and message are from Martin Gardner's 1977 Scientific American challenge and its 1994 solution.

Added in version 1.1:

- Fonts in `src/app/fonts`, cut down to the signs the cipher wheels use and renamed (as the SIL Open Font License
  requires for modified versions); licence texts in `src/app/licenses`:
  - `CCRunic.ttf` from Noto Sans Runic and `CCOgham.ttf` from Noto Sans Ogham, Copyright 2022 The Noto Project Authors, SIL OFL 1.1.
  - `CCTengwar.otf` from Alcarin Tengwar, Copyright (c) 2022 Toshi Omagari, SIL OFL 1.1 (Reserved Font Name: Alcarin).
    Tengwar is J.R.R. Tolkien's invented script; the studio is not associated with the Tolkien Estate.
  - `CCHiero.ttf` from NewGardiner, Copyright (c) 2020 Mark-Jan Nederhof, SIL OFL 1.1 (Reserved Font Name: NewGardiner).
  - `CCTheban.otf`: Theban letter outlines from Wikimedia Commons ("Theban glyph" files by User:Fuzzypeg), public domain.
- M-94 disk alphabets: the M-94 identification matrix courtesy of George Mace, as published at jproc.ca.
- Test examples: ADFGVX and Hill (Wikipedia), Chaocipher (Moshe Rubin, 2010), Solitaire (Bruce Schneier's published
  test vectors), Mexican Army wheel (dCode).
- The Janelle cipher, Enigma slide cipher and the modern Heath's deciphering dice are products of Creative Crafthouse;
  the studio describes how such devices work and draws its own models. No product artwork is copied.

Added in version 1.2:

- PURPLE switch wiring and part 1 of the 14-part message of 7 December 1941 (`src/app/data/purple14.json`): from
  W. Freeman, G. Sullivan and F. Weierud, "PURPLE Revealed: Simulation and Computer-aided Cryptanalysis of Angooki Taipu B",
  Cryptologia 27:1 (2003), as transcribed in Brian Neal's `purple` simulator (MIT licence, Copyright (c) 2013-2014 Brian Neal).
- A5/1 test frame: Briceno, Goldberg and Wagner's 1999 reference implementation. Salsa20 and Trivium: eSTREAM test vectors.
  RC4, straddling checkerboard, affine, Diffie-Hellman and the VIC key lines: the examples on Wikipedia.
- Crypto-1 was checked during development against the Proxmark3 crapto1 library (GPL); none of its code is included.
- SIGABA follows the mechanism described by Stamp and Chan; its rotor wirings are examples made for the studio.
