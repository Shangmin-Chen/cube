# Glossary

Repository terminology and definitions at commit `5157ef2` on `main`.

---

## CFOP Look-Count Naming System

**N-Look LL** refers to the number of **Last Layer recognition steps inside CFOP**, not the total steps for the whole cube solve.

| Repo Term | Meaning | Clarification |
|-----------|---------|---------------|
| **4-Look LL** / `cfop-4look` | Beginner CFOP Last Layer: 2-Look OLL + 2-Look PLL (4 LL recognitions). **Default.** | Beginner method, not a non-CFOP method. |
| **3-Look LL** / `cfop-3look` | Intermediate CFOP: 2-Look OLL + Full PLL (3 LL recognitions). | Intermediate step before learning Full OLL. |
| **2-Look LL** / `cfop-2look` | Advanced Full CFOP: Full OLL + Full PLL (2 LL recognitions). | **Advanced tier.** Does NOT mean beginner 2-Look OLL/PLL. |
| **2-Look OLL** | Edge orientation (Look 1), then corner orientation (Look 2). | 10 algorithms total. |
| **2-Look PLL** | Corner permutation (Look 1), then edge permutation (Look 2). | 6 algorithms total. |
| **Full OLL** | Orient all last layer pieces in a single algorithm. | 57 algorithms. |
| **Full PLL** | Permute all last layer pieces in a single algorithm. | 21 algorithms. |
| **CFOP** | Cross, First Two Layers (F2L), Orient Last Layer (OLL), Permute Last Layer (PLL). | The primary speedsolving system implemented in this repository. |

> [!IMPORTANT]
> `cfop-2look` represents **Full CFOP** (57 OLL + 21 PLL). Beginner CFOP is designated as **`cfop-4look`**.

---

## Product Surfaces & Architecture

| Term | Description |
|------|-------------|
| **Cube** | Application brand name (`a1e74bf`). |
| **Timer** | `/timer` — Speedsolving timer with WCA random-state scrambles, 15s inspection, 3D preview, and session history. |
| **Flashcards** | `/train` — Active recall algorithm trainer with isolated round mastery states. |
| **Algorithms** | `/algs`, `/algs/:step`, `/algs/:step/:caseId` — Algorithm reference library with 3D playback inspector. |
| **Notion Dark** | Dark design aesthetic: background `#191919`, cards `#202020`, borders `#2d2d2d`, accent `#eab308`. |

---

## Case ID Prefixes

| Prefix Pattern | Dataset / Step |
|----------------|----------------|
| `cross-*` | Hand-authored Cross insertions (4 beginner cases in `src/data/cfopData.ts`) |
| `f2l-basic-*` | Hand-authored F2L fundamentals (4 core cases in `src/data/cfopData.ts`) |
| `oll-2look-*` | 2-Look OLL cases (10 cases in `src/data/generated/oll-2look.json`) |
| `pll-2look-*` | 2-Look PLL cases (6 cases in `src/data/generated/pll-2look.json`) |
| `oll-{1–57}` | Full OLL cases (57 cases in `src/data/generated/oll-full.json`) |
| `pll-{letter}` | Full PLL cases (21 cases in `src/data/generated/pll-full.json`) |

---

## Algorithm Case Fields (`AlgCase`)

| Field | Purpose |
|-------|---------|
| `id` | Unique string identifier (e.g. `pll-t`, `oll-2look-sune`) |
| `name` | Human-readable case name (e.g. `T Permutation`, `Sune`) |
| `category` | CFOP step: `cross`, `f2l`, `oll`, or `pll` |
| `subcategory` | Fine-grained deck grouping (e.g. `2-Look OLL`, `Adjacent Corners`) |
| `group` | Recognition group (e.g. `Look 1`, `Look 2`, `Fish Shape`) |
| `primaryAlg` | Authoritative primary algorithm solution |
| `alternativeAlgs` | Alternative valid algorithm variations |
| `why` | Pedagogical explanation of the trigger mechanics |
| `description` | Hold orientation guidance and piece tracking cues |
| `probability` | Mathematical occurrence probability |
| `is2Look` | Boolean flag indicating beginner 2-look dataset inclusion |

---

## Pipeline & Verification

| Term | Definition |
|------|------------|
| **Upstream Lockfile** | `scripts/ingest/upstream.lock.json` — SHA-256 digests pinning upstream J Perm JS sources. |
| **Rotation Balancer** | Pipeline rule searching half-turns and rotation pairs to avoid redundant whole-cube rotations. |
| **AUF Alignment** | Normalization of Adjust-U-Face rotations before and after algorithm execution. |
| **Semantic Invariants** | Algorithmic tests asserting that simulated execution leaves required pieces invariant. |
| **WCA Random Scramble** | Random-state scrambles generated via `cubing/scramble` compliant with WCA regulations. |
| **Inspection Mode** | 15s WCA-style inspection countdown with automatic +2 and DNF evaluation. |
