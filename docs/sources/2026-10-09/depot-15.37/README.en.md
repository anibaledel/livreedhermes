# Deposit — A pointwise protocol for even-order magic squares

**How to cite** : doi:10.5281/zenodo.23269974 (all versions) — version 1.0,
doi:10.5281/zenodo.23269975. Cite the "all versions" DOI: it always resolves to
the latest.

**Self-contained archive.** It holds everything `DEPOT.md` cites: the
twenty-nine scripts of `tools/`, the corpus of 256 order-6 labellings
(`data/referent_256_v3.json`), the order-6 enumeration cache
(`tools/pavables6.json`), the 34 witnesses (`data/temoins.json`) and the paper.
Nothing has to be looked for elsewhere.

**A note on language.** The scripts, their headers, the execution logs and the
confidence map `DEPOT.md` are in French; the paper is in French. This file gives
the English reader the entry points, the statements and what each command
establishes, so that the archive can be checked without reading French: every
claim below is produced by a command, and a command's exit code — not its prose
— is what certifies it.

## To start, with nothing installed

```
python -I tools/verifie_temoins.py        # the 34 witnesses, no solver
python tools/fibres.py                    # the fibres, and their cross-check
python tools/construction.py              # the positive theorem, built and checked
python tools/identite.py                  # the exact identity on 18,432 + witnesses
python tools/compte_figures.py            # the formula for candidate figures
python tools/croix_auto.py --ordre 6      # the triple equivalence on the 18,432
python tools/compte_etiquetages.py --ordre 6
python tools/pavage_miroirs.py
```

These use the standard library alone. Self-containment was tested by making
`ortools` unavailable: they still run.

## For the rest

```
pip install -r requirements.txt           # ortools==9.15.6755
python tools/graine_sat.py --ordre 10
python tools/croix_existence.py --ordres 6,8,10,12
python tools/compte_croix.py --ordre 8 --sans-pretest
python tools/congruences.py --ordres 6,8
```

## Read first

`DEPOT.md` classifies every statement of the paper into six statuses, from
*proved* to *conjectured*, and says precisely what each script establishes and
what it does not. The six statuses, in the order of decreasing strength, are:
**démontré** (proved analytically), **vérifié exhaustivement sans solveur**
(exhaustively verified, plain Python), **vérifié exhaustivement par solveur**
(exhaustively verified, by solver), **obtenu par solveur** (obtained by solver,
with no independent certificate), **vérifié sur échantillon** (verified on a
sample) and **conjecturé** (conjectured).

## The protocol

On an n × n grid of even order, each cell receives one of four classes, and its
value then follows from its coordinates and its class alone:

    B(r,c) = n·r + c + 1,          V(r,c) = n·r + (n−1−c) + 1,
    R = n² + 1 − B,                J = n² + 1 − V.

No sequence of operations, no filling order, no backtracking: a cell is computed
without the others.

Three conditions bear on a labelling. **Condition I**: a cell has the same class
as its antipode exactly when it lies on a diagonal. **Criterion II**: each row
carries an odd number of horizontal traits. **Criterion III**: each column
carries an odd number of vertical traits. A trait joins two cells of a row
(horizontal) or of a column (vertical) whose classes are partners under
B ↔ J, R ↔ V. The three together draw an **ansate cross** on the grid.

## Two closed results

**Complete existence.** The protocol admits a normal diagonal magic labelling at
**every even order n ≥ 4**, and order 2 is the only impossible even order. Two
explicit branches: the classical two-class pattern at n ≡ 0 (mod 4), the
canonical ansate cross at n ≡ 2 (mod 4) with n ≥ 6.
`python tools/construction.py --existence` is the executable assertion of it,
order by order from 2 to 52, and exits non-zero if a branch fails. Order 2 is
**checked, not deduced**: the 256 labellings of order 2 are enumerated, none is
magic, and so are the 24 normal 2 × 2 squares, none with equal row and column
sums — for the reason that owes nothing to the protocol, a + b = c + d and
a + c = b + d forcing b = c.

**Classification of ansate crosses.** For n = 2m ≥ 6, a candidate figure is
realizable by a magic labelling **if and only if m is odd**, and the number of
*figures* is then exactly 2^(m²−3m+1), zero otherwise. Both directions are
proved, with no solver: a parity obstruction local to a single pair of rows
forbids everything at doubly even orders, and a local recipe realizes everything
at singly even orders. `python tools/construction.py --toutes` rebuilds every
candidate figure of orders 6 and 10 — 2 out of 2, then 2,048 out of 2,048.

**Figures are not labellings.** The number of *figures* is not the number of
*labellings* carrying one, which is far larger: 8,192 labellings for 2 figures
at order 6, and 583,454,127,292,416 for 2,048 figures at order 10. The paper and
the confidence map keep the two words apart throughout, and so should any
summary of this work.

## One open result, with its data

`tools/fibres.py` measures the fibre of the projection *labelling ↦ figure it
carries*. At order 6 that projection is uniform: 4,096 labellings per figure. At
order 10 it is not — the 2,048 figures split into three fibre sizes,

    260,919,263,232   for   648 figures
    289,910,292,480   for 1,136 figures
    322,122,547,200   for   264 figures

whose sum is exactly 583,454,127,292,416, the total that `recollement.py`
computes by pairs of rows without ever separating the figures. Two independent
decompositions of the same set, agreeing to the last digit. The three sizes are
3·2³⁰ times 81, 90 and 100 — that is 9², 9·10 and 10² — so the fibre factors
into two factors each equal to 9 or 10. Which invariant of a figure decides
those two factors is open; the multiplicities show the two factors are
correlated, so it is not two independent bits. This is the first known invariant
that tells the figures apart, where the classification treats them as
interchangeable.

## What the paper embeds

The embedded paper is **rev199**, in French. It carries the orbit reduction, the
state table, the centre of the quotient grid, the positive theorem with its
proof, the parametric construction, and the complete classification.

## AI tools

The verification scripts, the checking of claims and the drafting were carried
out with the assistance of generative AI tools. Every statement in this deposit
is computed or proved, and each is accompanied by the command that reproduces
it: nothing here is to be taken on trust.

## Licence

© Anibal Edelberto Amiot 2026 — AGPL v3, commercial licence on request:
anibaledel@gmail.com
