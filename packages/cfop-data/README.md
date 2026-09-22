# @cube/cfop-data

Standard, verified CFOP (Fridrich Method) algorithm catalog for 3x3x3 Rubik's cube speedsolving.

## Overview

This package provides authoritative, typed datasets for learning and mastering CFOP:
- **Cross:** 4 beginner insertion scenarios
- **F2L (First Two Layers):** 4 fundamental pairing cases
- **OLL (Orientation of Last Layer):** 2-Look (10 cases) & Full OLL (57 cases)
- **PLL (Permutation of Last Layer):** 2-Look (6 cases) & Full PLL (21 cases)

All algorithms are verified against `cubing.js` KPuzzle physical simulation to ensure mathematical correctness, identity preservation, and orientation validity.

## Exports

- `CROSS_CASES`: Beginner Cross cases
- `F2L_HIGHLIGHTS`: Fundamental F2L pairs
- `OLL_2LOOK_CASES`: 2-Look OLL cases
- `PLL_2LOOK_CASES`: 2-Look PLL cases
- `OLL_FULL_CASES`: Full OLL 57 cases
- `PLL_FULL_CASES`: Full PLL 21 cases
- `CFOP_METHODS`: Multi-tier CFOP method configurations (4-Look, 3-Look, Full CFOP)
