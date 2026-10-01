---
title: "A Generative Construction of the Level-Set Family of a Square-Plate Eigenmode"
author: "Anibal Edelberto Amiot"
date: "October 2026 — version 1.1"
---

# Abstract

A finite, purely combinatorial construction — sets of axes on a $12 \times 12$
square with periodic offsets, combined by a parity rule — was developed independently of any physical
model, as a pattern grammar. We show that what it produces is a classical object
of plate theory, reached by another route.

Precisely: twelve of the sixteen axis families are complete level sets of the
single function $\varphi(x) = \cos(\pi x/3)$, taken at the seven levels
$\cos\theta$ for $\theta = 0^\circ, 30^\circ, \dots, 180^\circ$; the two
remaining families are the two halves of the level $\theta = 90^\circ$. The
construction's involution — what its author calls *mutation* — is exactly the
reflection $\theta \mapsto 180^\circ - \theta$. The construction's two reading
directions, orthogonal and diagonal, are the same function read with period $12$
and with period $6$ — a periodicity of the function, not an identification of
lines — and that difference of period accounts quantitatively for a structural
asymmetry observed before it was explained: $30$ shared axes, all diagonal.
On the *second cut* of the diagonal vocabulary introduced in the companion paper,
the diagonal side becomes as clean as the orthogonal one: each of the seven
levels has its own generator, the exceptions of the drawn inventory disappear,
and the mutation is $\theta \mapsto 180^\circ - \theta$ on the diagonals as
well. Of the $4095$ drawings of that cut, exactly $127 = 2^7-1$ are unions of
complete level sets, and only those have a counterpart on a plate.

We then show that $\varphi$ itself is an exact eigenfunction of the Kirchhoff
plate with all four edges *guided* — the cylindrical mode (4,0), $k^2 = 16$ —
so that the orthogonal families are the iso-amplitude lines of a genuine plate
mode. The two-dimensional product $\varphi(x)\varphi(y)$ is likewise exact, of
index (4,4) and $k^2 = 32$, and its nodal set is exactly the orthogonal
level-$0$ family. For the diagonal families the situation is different and we
state it separately: the degenerate combinations
$\cos(4\pi x/a) \pm \cos(4\pi y/a)$ are exact guided modes of the same
eigenvalue, and their nodal sets are exactly the two diagonal level-$0$ families —
Colwell's mechanism for diagonal symmetry — while the six other diagonal levels
have no guided mode behind them. The carrier (4,0) and the figure (4,4) are
a factor $2$ apart in frequency. One of those two nodal sets is corroborated from
outside: it is the $48$-cell skeleton that all sixty plates of an independent,
earlier corpus carry in common, so the same family is selected once by the
differential equation and once by a construction with no equation in view.

The same function is also the exact eigenfunction of a *second* physical system,
and that one is trivially realisable: the acoustic pressure in a rectangular
cavity with rigid walls, where the Neumann condition holds identically. There the
governing equation is Helmholtz rather than biharmonic, so the frequency law is
$f \propto \sqrt{m^2+n^2}$ instead of $f \propto m^2+n^2$. Measuring a ratio of
two frequencies therefore discriminates between the two systems, which turns a
reservation into a test.

Of the seven levels only one is nodal, so powder shows one of them. The other six
are observable by time-averaged holographic interferometry, whose fringes are
iso-amplitude contours, and we give the drive-amplitude ratios — $1 : 1.155 : 2$
— that bring them successively onto the first dark fringe. That is the one
falsifiable prediction here. For a *free* plate the cosine product is the
classical approximation and not the exact mode. No physical measurement was
performed.

---

# 1. What is being claimed

Two routes lead to the same family of curves.

The first is analytic and two centuries old: one writes the plate equation,
imposes boundary conditions, and solves. The nodal lines of the solution are
drawn by sand on a vibrating plate, and have been since Chladni.

The second route is the subject of this paper's companion construction: one
posits a small vocabulary of straight lines on the square, combines chosen subsets
by a parity rule, and obtains figures. Nothing in that construction mentions a
plate, a frequency, or a differential equation.

The claim here is that the second route reaches the level-set family of the
first, exactly, and that the identification is not approximate, not statistical,
and not a fit. The identification is checked line by line against the
construction's own published plates, all of which were verified region by region
beforehand.

We are careful about what such a statement is worth. Arriving at a known object
by an unusual road is a result about the road, not about the object. What the
construction contributes is a generative grammar — with an algebra, an
involution, and a closure — for a family that analysis produces only by solving.

Three kinds of statement are made, and they are kept apart throughout (§6):

| status | statements |
|---|---|
| exact, checked on finite sets of lines | the identification with the level sets of $\varphi$ (§3), on both cuts of the diagonals |
| exact in a model, not realised | the guided plate (§4.1–§4.4); "exact" for the plate always means *for guided edges* — for free edges the same statements are approximations |
| exhaustive on a finite corpus | the $48$-cell skeleton common to the sixty published images (§4.2) |
| exact, and realisable | the rigid-walled cavity (§4.5) |
| predicted, not measured | the fringe ratio $1 : 1.155 : 2$ (§5) and the plate/cavity frequency ratio (§4.5) |

# 2. The construction, in brief

The construction is stated fully in the companion paper; we recall only what is
needed.

The plate is the square $[0,12]^2$ divided into $144$ unit cells.

An *axis* is a line of one of four natures — horizontal, vertical, and
the two diagonal directions — specified by its signed offset from the centre,
measured in cells; diagonal offsets are the perpendicular coordinate rescaled to
cells.

Two axes of the same nature and different offsets are **different lines**, and
offsets lie in $(-6,6]$; every count in this paper is a count of drawn lines.

One periodicity must be kept apart from another, because conflating them produces
contradictions. The function $\varphi$ of §3 has period $6$ along a diagonal, so
two diagonal offsets differing by $6$ lie on the **same level** of $\varphi$ —
they are not the same line. The parity of §3 is taken over periodic stripe
systems, and a lattice translation by (12,0) carries a diagonal line to the one
$6$ further along, so a single stripe system can show two of its lines inside the
square and is counted once there. Seven of the sixteen families contain such
pairs.

Sixteen *families* of axes are given, indexed by a level $T_0,\dots,T_3$ and by
one of four names, YIN, YIN MUT, YANG, YANG MUT. The YIN families are purely
orthogonal, the YANG families purely diagonal, at every level, without
exception. Counted as drawn segments their union has $94$ distinct axes, $30$
of which lie in two families at once (§3.4); counted as band systems, the
generating objects of the parity, there are $72$.

A figure is obtained from a chosen union of families by a parity rule: a region
is dark according to the parity of the number of axis bands separating it from a
reference. The construction is reversible — a figure determines the families
that produced it — and it was verified exactly, region by region, on the
published corpus.

# 3. The identification

Let
$$ \varphi(x) \;=\; \cos\!\left(\frac{\pi x}{3}\right) . $$

## 3.1 The orthogonal families

Reading offsets as positions $p = 6 + e$ in $[0,12)$, the eight orthogonal
families are exactly the level sets $\varphi^{-1}(\cos\theta)$:

| $\theta$ | level | positions | family |
|---|---|---|---|
| $0^\circ$ | $1$ | $0,\ 6$ | $T_0$ YIN |
| $30^\circ$ | $\tfrac{\sqrt3}{2}$ | $0.5,\ 5.5,\ 6.5,\ 11.5$ | $T_3$ YIN |
| $60^\circ$ | $\tfrac12$ | $1,\ 5,\ 7,\ 11$ | $T_2$ YIN |
| $90^\circ$ | $0$ | $1.5,\ 4.5,\ 7.5,\ 10.5$ | $T_1$ YIN $\cup$ $T_1$ YIN MUT |
| $120^\circ$ | $-\tfrac12$ | $2,\ 4,\ 8,\ 10$ | $T_2$ YIN MUT |
| $150^\circ$ | $-\tfrac{\sqrt3}{2}$ | $2.5,\ 3.5,\ 8.5,\ 9.5$ | $T_3$ YIN MUT |
| $180^\circ$ | $-1$ | $3,\ 9$ | $T_0$ YIN MUT |

Six of these seven are complete families. The level $\theta = 90^\circ$ is the
one exception: the construction splits it into two families, $T_1$ YIN
($1.5,\ 10.5$) and $T_1$ YIN MUT ($4.5,\ 7.5$), whose union is the level.

## 3.2 The mutation is a reflection of the angle

**Proposition 1.** *For each level $t \in \{0,2,3\}$, if $T_t$ YIN is the level
set at angle $\theta$, then $T_t$ YIN MUT is the level set at $180^\circ -
\theta$.*

The map $\theta \mapsto 180^\circ - \theta$ is $\varphi \mapsto -\varphi$, i.e.
the exchange of the two phases of the standing wave. The level $T_1$ is its own
mutant because $90^\circ$ is the fixed point of the reflection, and it is there,
and only there, that base and mutant coincide — which is why the construction
lists them as two families with a single level set.

## 3.3 The diagonal families: the same function, half the period

Let $v = (x+y)/2$ be the diagonal coordinate in cells. A lattice translation by
(12,0) shifts $v$ by $6$, so along a diagonal the function is periodic of
period $6$, not $12$. Reducing modulo $6$:

| family | $=$ | levels |
|---|---|---|
| $T_0$ YANG | $T_0$ YIN | $0^\circ$ |
| $T_0$ YANG MUT | $T_0$ YIN MUT | $180^\circ$ |
| $T_1$ YANG | $T_0$ YIN $\cup$ $T_0$ YIN MUT | $0^\circ,\ 180^\circ$ |
| $T_1$ YANG MUT | $T_1$ YIN $\cup$ $T_1$ YIN MUT | $90^\circ$ |
| $T_2$ YANG | $T_2$ YIN $\cup$ $T_2$ YIN MUT | $60^\circ,\ 120^\circ$ |
| $T_2$ YANG MUT | $T_3$ YIN $\cup$ $T_3$ YIN MUT | $30^\circ,\ 150^\circ$ |
| $T_3$ YANG | $T_3$ YIN $\cup$ $T_3$ YIN MUT | $30^\circ,\ 150^\circ$ |
| $T_3$ YANG MUT | $T_2$ YIN $\cup$ $T_2$ YIN MUT | $60^\circ,\ 120^\circ$ |

**Theorem 1.** *Every one of the sixteen families is contained in a union of
level sets of $\varphi$ at angles that are multiples of $30^\circ$. Twelve are
complete — a whole level, or the whole union of two. The four exceptions are:*

- *$T_1$ YIN and $T_1$ YIN MUT, the two halves of the level $90^\circ$: positions
  $\{4.5,\ 7.5\}$ and $\{1.5,\ 10.5\}$;*
- *$T_2$ YANG, the level $120^\circ$ together with the level $60^\circ$ less its
  two corner lines, offsets $\pm 5$;*
- *$T_3$ YANG, the level $150^\circ$ together with the level $30^\circ$ less its
  two corner lines, offsets $\pm 5.5$.*

*The four missing corner lines are carried by $T_3$ YANG MUT and $T_2$ YANG MUT
respectively, and that is why those pairs share axes.*

The last two exceptions are exceptions of the *inventory of drawn segments*, not
of the identification. A diagonal offset and its translate by $6$ define the same
band system, so as band systems $T_2$ YANG and $T_3$ YANG MUT are one and the
same object, as are $T_3$ YANG and $T_2$ YANG MUT; the two corner lines that the
inventory assigns to one member of each pair are already carried by the other.
Read on figures — which is what the parity rule produces and what the plates show
— the identification with the level sets is therefore exact for all sixteen
families, and the pair of exceptions at $90^\circ$ is the only one that survives.
The companion paper on the construction records the same fact as two of the three
relations of its code.

## 3.4 Two consequences that were observed before they were explained

**The shared axes.** Of the $94$ axes, $30$ belong to two families each, and all
$30$ are diagonal; no orthogonal axis is shared. The table above gives the
reason: $T_2$ YANG and $T_3$ YANG MUT are the same pair of levels, as are $T_2$
YANG MUT and $T_3$ YANG. On the orthogonal side, period $12$ keeps the seven
levels disjoint; on the diagonal side, period $6$ folds them onto each other.

**The asymmetry of the mutation.** The construction's rule
"offset $+\,3 \pmod 6$" relates base to mutant on all four orthogonal levels and
on none of the diagonal ones. The table shows why: each diagonal family already
contains both $\theta$ and $180^\circ - \theta$, so base and mutant are not
separated there and no shift can relate them.

Neither fact was used to obtain the identification; both follow from it. And
both are facts of the *first cut* of the diagonals, not of the diagonals
themselves, as the next section shows.

## 3.5 The second cut: one level per generator

The companion paper (§5.5 there) examines a second cut of the diagonal
vocabulary, drawn after the first and after the identification above, so that it
is a cleaner vocabulary and not further independent evidence: twelve elements, YA1–YA6 and AY1–AY6, made of
unit segments along cell diagonals, pairwise disjoint and together exactly the
$288$ cell diagonals of the square. Read against $\varphi$, with $c = 2e$ the
signed offset of a diagonal line ($x+y = 12+c$ or $y-x = c$) and its level
$\cos(\pi c/6)$:

| $\theta$ | level | second cut | first cut |
|---|---|---|---|
| $0^\circ$ | $1$ | YA6 | $T_0$ YANG |
| $30^\circ$ | $\tfrac{\sqrt3}{2}$ | YA5 $\cup$ AY1 | $T_2$ YANG MUT, $T_3$ YANG (with $150^\circ$) |
| $60^\circ$ | $\tfrac12$ | YA4 $\cup$ AY2 | $T_2$ YANG, $T_3$ YANG MUT (with $120^\circ$) |
| $90^\circ$ | $0$ | YA3 $\cup$ AY3 | $T_1$ YANG MUT |
| $120^\circ$ | $-\tfrac12$ | YA2 $\cup$ AY4 | $T_2$ YANG, $T_3$ YANG MUT (with $60^\circ$) |
| $150^\circ$ | $-\tfrac{\sqrt3}{2}$ | YA1 $\cup$ AY5 | $T_2$ YANG MUT, $T_3$ YANG (with $30^\circ$) |
| $180^\circ$ | $-1$ | AY6 | $T_0$ YANG MUT |

Every element lies on a single level — YA$k$ on $180^\circ - 30k^\circ$, AY$k$ on
$30k^\circ$ — and the elements of a level tile its lines exactly, checked segment
by segment. As band systems YA$(6-j)$ and AY$j$ coincide, so the second cut gives
seven generators, one per level, against five level sets for the eight diagonal
families of the first cut. Three consequences, each an exact check:

- **No exceptions.** Every generator of the second cut is a complete level set.
  The inventory exceptions of Theorem 1 — corner lines carried by the wrong member
  of a pair — have no analogue, and the second cut has no shared axis at all.
- **The mutation is the reflection on the diagonals too.** The lines of AY$k$ are
  those of YA$k$ shifted by $3$ in offset, and YA$k$, AY$k$ sit at $\theta$ and
  $180^\circ - \theta$. The asymmetry of §3.4 was a property of the first cut.
- **Which drawings a plate can show.** Of the $4095$ non-empty unions of the
  twelve elements, exactly $127 = 2^7 - 1$ are unions of complete level sets —
  the two elements of a level taken together or not at all. A level set of
  $\varphi$ is a set of whole lines, so these $127$ drawings, and no others, have
  a counterpart among the iso-amplitude figures of §4 and §5.

On the second cut the diagonal reading is thus as complete as the orthogonal
one: seven levels, seven generators, and the involution
$\theta \mapsto 180^\circ - \theta$ exchanging the yang element with its
mutable twin.

# 4. The plate

## 4.1 The orthogonal carrier is a one-dimensional mode

The orthogonal families of §3 are level sets of the one-variable function
$\varphi$, and this must be said precisely, because the distinction decides what
is measurable.

Let $W(x,y) = \cos(m\pi x/a)$, constant in $y$. Symbolic evaluation gives

$$ \nabla^4 W = \frac{\pi^4 m^4}{a^4}\,W , \qquad
\frac{\partial W}{\partial n} = 0 \ \text{ and } \ V_n = 0 \ \text{ on all four edges,}$$

which are the conditions of a **guided** (also *sliding*) edge.

**Theorem 2.** *$\varphi(x) = \cos(4\pi x/12)$ is an exact eigenfunction of the
square Kirchhoff plate of side $12$ with all four edges guided: the mode (4,0),
cylindrical bending, with $k^2 = m^2+n^2 = 16$.*

Its level sets are straight lines parallel to the edges, and they are the eight
orthogonal families of §3, taken in $x$ and in $y$.

## 4.2 The diagonal families are not level sets of a guided mode

It would be convenient to write the diagonal families as level sets of
$\cos\!\left(2\pi(x+y)/a\right)$. That function is not a mode of the guided plate: symbolic
evaluation gives, at $x=0$,

$$ \frac{\partial W}{\partial n} = -\frac{2\pi}{a}\sin\frac{2\pi y}{a} \neq 0 ,$$

so the guided condition fails on every edge. It is a mode of the torus, not of
the plate, and we do not use it.

What is true is stronger, and it is Colwell's mechanism [5]. The modes (4,0)
and (0,4) are degenerate — both have $k^2 = 16$ — and their combinations

$$ \cos\frac{4\pi x}{a} \pm \cos\frac{4\pi y}{a} $$

are exact guided modes of that same eigenvalue $256\pi^4/a^4$, verified
symbolically on all four edges.

**Theorem 3.** *The nodal set of $\cos(4\pi x/a) + \cos(4\pi y/a)$ is exactly the
family $T_1$ YANG MUT (diagonal offsets $\pm 1.5, \pm 4.5$ in both senses), and
the nodal set of the difference is exactly $T_1$ YANG (offsets $0, \pm 3$).*

The mechanism is the one Colwell exploited [5], stated in its general form: for
any pair (m,n), the difference
$\cos\frac{m\pi x}{a}\cos\frac{n\pi y}{a} - \cos\frac{n\pi x}{a}\cos\frac{m\pi y}{a}$
vanishes on $x = y$, and the sum vanishes on $x + y = a$ according to the parity
of $m+n$. Colwell's own statement concerns pairs of *different* parity, where the
principal diagonals are nodal; Theorem 3 is the same mechanism applied to the
pair (4,0), (0,4), which have the same parity and give not the principal
diagonals but the parallels at offsets $\pm 1.5, \pm 4.5$ and $0, \pm 3$. We say
this so that a reader does not look in Colwell for a sentence that is not there.

The six remaining diagonal levels are iso-amplitude lines of a one-variable
function in $x+y$, and **no guided plate mode stands behind them**. We state this
rather than paper over it: the correspondence is complete on the orthogonal side
and partial on the diagonal one.

**A corroboration that comes from outside this paper.** Theorem 3 singles out one
family, $T_1$ YANG, as the nodal set of $\cos(4\pi x/a) - \cos(4\pi y/a)$. That
family was not selected here for its physical status; it was selected by the
equation. It turns out to be the one family that a *different* corpus — sixty
plates built years earlier under a separate set of rules, and described in the
companion paper on the construction — carries in common. In each of the sixty,
the $48$ cells whose centres lie on the axes of $T_1$ YANG form one monochrome
region, identically in all sixty; the remaining $96$ cells carry the parity of a
chord of the four $T_0$ families, which is what varies from plate to plate. The
skeleton those sixty images share is therefore exactly the nodal set of a
degenerate guided mode of eigenvalue $256\pi^4/a^4$. We did not arrange this: the
selection was made once by the differential equation and once by an author who
had no equation in view, and the two selections agree. It is the strongest
corroboration in the paper that does not require a measurement.

## 4.3 Only the zero level belongs to the two-dimensional mode

The product $\varphi(x)\varphi(y) = \cos(4\pi x/12)\cos(4\pi y/12)$ is likewise an
exact guided mode, of index (4,4) and $k^2 = 32$, with the same eigenvalue
formula $\pi^4(m^2+n^2)^2/a^4$.

Its level sets, however, are **not** straight except at zero. Along the line
$x = 1$ of the family $T_2$ YIN, where $\varphi(x) = \tfrac12$, the product
$\varphi(x)\varphi(y)$ runs from $+\tfrac12$ to $-\tfrac12$ as $y$ varies. Only at
$\varphi = 0$ does a straight line lie wholly in a level set of the product, and
there it lies in the zero set.

**Corollary.** *The orthogonal level-$0$ family, $T_1$ YIN $\cup$ $T_1$ YIN MUT,
is exactly the nodal set of the guided mode (4,4). The diagonal level-$0$
families are not: they are the nodal sets of the degenerate combinations of
§4.2, by Theorem 3. The remaining six levels are iso-amplitude lines of the
one-dimensional mode (4,0), and are not level sets of any two-dimensional
product mode.*

We state this because the looser formulation — "the families are level curves of
a square-plate mode" — is false for six of the seven levels, and a reader would
find it out.

## 4.4 Spectrum, and a convention on $k^2$

For the square, the cosine and the sine families share the eigenvalue
$\pi^4(m^2+n^2)^2/a^4$, so the guided plate and the simply supported plate have
the same spectrum and differ only in eigenfunction. Hence

$$ f = C\,k^2, \qquad k^2 = m^2+n^2, \qquad
C = \frac{\pi}{2}\sqrt{\frac{D}{\rho h}}\,\frac{1}{a^2} .$$

The constant $C$ is a calibration and not a result: it fixes the plate, not the
geometry.

Two conventions for $k^2$ are in circulation in the associated material and must
not be confused. Counting half-wavelengths across the side $a$ — the standard
plate convention, used here — gives (4,4) and $k^2 = 32$. Counting whole
periods across the $12$-cell grid, as a discrete Fourier transform of the figure
does, gives (2,2) and $k^2 = 8$. The two are related by

$$ k^2_{\text{grid}} \;=\; \tfrac14 \left(m^2+n^2\right) , $$

so a calibration written $f = 128\,k^2_{\text{grid}}$ is the same law as
$f = 32\,(m^2+n^2)$.

The two modes of §4.1 and §4.3 are not at the same frequency, and it matters
which one a stated figure refers to. The **carrier** (4,0) has $k^2 = 16$,
$k^2_{\text{grid}} = 4$, hence $f = 512$ Hz at this calibration. The **figure**
(4,4) — the parity of the orthogonal families together, and the pattern powder
would draw — has $k^2 = 32$, $k^2_{\text{grid}} = 8$, hence $f = 1024$ Hz. The
ratio is exactly $2$, and the fringe experiment of §5 is performed on the
carrier, therefore at half the frequency of the sand figure.

## 4.5 The same function, a second equation, a realisable system

The guided plate is an idealisation. The function is not.

Let $W(x,y) = \cos(m\pi x/a)\cos(n\pi y/b)$ and let it now be a pressure field
rather than a displacement. Symbolic evaluation gives

$$ \nabla^2 W = -\pi^2\!\left(\frac{m^2}{a^2}+\frac{n^2}{b^2}\right) W , \qquad
\frac{\partial W}{\partial n} = 0 \ \text{ on all four walls.}$$

That is the Helmholtz equation with the Neumann condition, which is exactly the
acoustic problem for a rectangular cavity with rigid walls. The condition is
satisfied identically, not approximately, and such a cavity is any rectangular
box. One qualification: the modes in play are those of vertical index zero, the
pressure being constant over the height, so the figure is read on a horizontal
section and the box must be driven below the first vertical cut-off, or be
shallow enough that it is. With a non-zero vertical index the field varies
through the height and the horizontal figure is unchanged but its amplitude is
not.

**Theorem 4.** *On the rectangle $a \times b$, the function
$\cos(m\pi x/a)\cos(n\pi y/b)$ is simultaneously an exact eigenfunction of two
different problems: the biharmonic problem with guided edges, with eigenvalue*

$$ \pi^4\!\left(\frac{m^2}{a^2}+\frac{n^2}{b^2}\right)^{\!2} ,$$

*and the Helmholtz problem with rigid walls, with eigenvalue*

$$ \pi^2\!\left(\frac{m^2}{a^2}+\frac{n^2}{b^2}\right) .$$

*The same is true of the one-dimensional carrier. On the square $a = b$ these
read $\pi^4(m^2+n^2)^2/a^4$ and $\pi^2(m^2+n^2)/a^2$, which is the case
$\varphi(x)\varphi(y)$ of §4.3.*

The two problems share their eigenfunctions and not their spectra; on the square,

$$ \text{plate:}\quad f \propto m^2+n^2 , \qquad\qquad
\text{cavity:}\quad f \propto \sqrt{m^2+n^2} . $$

This is the useful part. A ratio of two measured frequencies separates the two
laws immediately — for the carrier and the figure of §4.4, the plate gives
$f_{4,4}/f_{4,0} = 2$ and the cavity gives $\sqrt2$. And for the grid values
$k^2 = 1, 4, 9$ the plate law gives frequencies in the ratio $1 : 4 : 9$ while the
cavity law gives $1 : 2 : 3$, the harmonic series.

A third realisation has the same separable form under linear theory: the free
surface of a liquid in a rectangular basin with vertical walls, where the
elevation of a sloshing mode is $\cos(m\pi x/a)\cos(n\pi y/b)$ and the seven
levels are iso-elevation lines. Its frequency law is neither of the two above:
sloshing is dispersive, $\omega^2 = gk\tanh kh$ with $k$ the horizontal
wavenumber and $h$ the depth, so what the three systems share is the *figure* and
not the spectrum, and the discriminating ratio of the previous paragraph does not
transfer to the tank. Excited in a one-dimensional mode, those lines
are straight, and they are visible under grazing light. This is the least
expensive experiment in the whole programme: a rectangular tank, a loudspeaker
beneath it, a lamp.

# 5. What is nodal, what is not, and what can be seen

Of the seven levels, exactly one is a zero set: $\theta = 90^\circ$. The other six
are iso-amplitude lines. Powder on a plate accumulates only on the first, so the
six others are invisible to Chladni's method.

They are not invisible to optics. In time-averaged holographic interferometry
(Powell and Stetson, 1965) and in its digital successor, electronic speckle
pattern interferometry, the reconstructed intensity of a harmonically vibrating
surface is modulated by $J_0^2$ of the local amplitude, so the dark fringes lie
at the **zeros of $J_0$** and each fringe is a contour of constant vibration
amplitude. The six remaining levels are therefore observable by a method
established for sixty years.

The correspondence is not automatic, and we state the experiment rather than
gesture at it. The fringes fall at amplitudes $w$ satisfying
$4\pi w/\lambda = j_{0,k}$, where $j_{0,1} = 2.405, \ j_{0,2} = 5.520, \dots$ —
values fixed by optics, not by the mode. To bring a chosen level $\cos\theta$
onto the first dark fringe one sets the drive amplitude $A$ so that
$A\left|\cos\theta\right| = j_{0,1}\lambda/4\pi$. For the three non-zero level
pairs this is a ratio of drive amplitudes

$$ \cos\theta = 1 \ :\ \tfrac{\sqrt3}{2} \ :\ \tfrac12
\qquad\Longrightarrow\qquad A \ \propto\ 1 \ :\ 1.155 \ :\ 2 .$$

On the one-dimensional mode (4,0) the fringes are straight, and this is the
configuration in which the prediction is sharp: **three drive amplitudes in the
ratio $1 : 1.155 : 2$ should bring the families $T_0$, $T_3$ and $T_2$
successively onto the first dark fringe, at the positions tabulated in §3.1.**
On the two-dimensional mode (4,4) the fringes are the curves
$\varphi(x)\varphi(y) = \text{const}$, which are not straight, and the prediction
does not apply — by §4.3.

Two precisions complete the protocol. The optical constant is
$\Omega \approx (4\pi/\lambda)\,w$ at normal illumination and observation, and it
is the only one. And since the intensity goes as $J_0^2$, the fringe pattern does
not see the sign of the amplitude: each drive level shows the pair
$(\theta,\ 180^\circ - \theta)$ at once, so a family and its mutant appear
together — the involution of §3.2 is directly visible in a single exposure. At
$\cos\theta = \pm 1$ the fringe falls on the lines of maximum amplitude, while
the nodal line remains the bright fringe of order zero throughout.

One design consequence follows from §4.2 and improves the protocol. On a square
plate the modes (4,0) and (0,4) are degenerate, so a point excitation generally
produces a combination of the two, whose fringes are curved — which is exactly
what Theorem 3 describes. For the ratio $1 : 1.155 : 2$ to be clean, the
degeneracy must be lifted: either by driving along a line parallel to one edge
rather than at a point, or by using a **rectangular** plate $a \times b$ with
$b \neq a$. Since $\cos(4\pi x/a)$ does not depend on $b$, the prediction carries
over to the rectangle unchanged, and the square is not required. The experiment
is therefore easier than the identification that motivates it.

This converts a reservation into a falsifiable statement, and it is the only one
in this paper that a laboratory can refute.

# 6. What is established, what is measurable, and what is not

It is worth separating three kinds of statement, because they do not carry the
same weight.

**Verified on the data, and needing no measurement.** The containment of the
sixteen families in the level sets of $\varphi$ (§3), complete for twelve of
them and explicit about the four exceptions; on the second cut of the diagonals,
one complete level per generator, the mutation as reflection, and the $127$
drawings that are unions of whole level sets (§3.5). It is an identity between
two finite sets of lines, checked exactly. To it we add the coincidence of §4.2:
the family the equation selects, $T_1$ YANG, is the $48$-cell skeleton common to
all sixty plates of the independent corpus — again an exact check on a finite
set, not an estimate.

**A theorem, and likely to remain one.** The guided plate (§4.1, §4.2). No plate
with guided edges appears to have been realised; the condition is a mathematical
idealisation, and we do not present it as a physical claim.

**Measurable, and not yet measured.** Four things, and the first is new.

The discriminating frequency ratio of §4.5. The two equations share the
eigenfunction and differ in the spectrum, so a single ratio of measured
frequencies says which law governs a given realisation: $2$ against $\sqrt2$ for
the carrier and the figure, $1:4:9$ against $1:2:3$ for the grid values
$k^2 = 1,4,9$. This is cheap, and it is the first measurement we would make.

Then three more. First, the cosine product as
an approximation for the *free* square plate — Chladni's own object — where the
exact modes are products of free–free beam functions, combinations of $\cosh$ and
$\cos$; the cosine form was introduced for square plates by Colwell in 1932 [2],
and Ritz's 1909 treatment, reproduced by Gander and Wanner [10], remains the
oldest quantitative agreement with measurement on the free square plate. Second,
the law $f \propto m^2 + n^2$, exact for the simply supported and the guided
plate: the sharp test is the ratio $f_{4,4}/f_{2,2}$, which is exactly $4$ for
both, and is not $4$ for a free plate. Third, the fringe experiment of §5.

For calibration of what counts as agreement: a recent free-plate study reports a
maximum deviation of $6\%$ between measurement and computation [11], so a
discrepancy below that threshold distinguishes nothing. A free acrylic square of
side $24$ cm gives measured frequencies $107, 283, 511, 744, 1181$ Hz [12], whose
ratios $2.64,\ 4.78,\ 6.95,\ 11.0$ are not those of $m^2+n^2$ — as expected for a
free plate, and a useful reminder of the size of the effect.

**Not done.** No plate was excited, no powder observed, no frequency measured, no
fringe recorded. Everything here is computation on published drawings and
symbolic verification of a differential equation.

**Crossings.** The figures are unions of straight lines and therefore have
crossings. In the zero set of a generic real function crossings do not occur;
they require a symmetry. A point-driven plate away from resonance responds as a
weighted superposition of modes, whose nodal lines avoid crossing, while at an
isolated resonance a single mode dominates and the straight-line grid returns
[3,4]. The family described here is the symmetry-determined subclass, and we
claim nothing about the generic case.

# 7. Prior work

The equation of a square Chladni plate in the cosine form,
$A\cos\frac{m\pi x}{a}\cos\frac{n\pi y}{a} + B\cos\frac{n\pi x}{a}\cos\frac{m\pi
y}{a} = 0$, is Colwell's [2]; his companion paper on diagonal symmetry shows
that when $m$ is even and $n$ odd, or the converse, one diagonal of the square is
a nodal line [5], which is the diagonal family of the present construction, named
and dated. Colwell and Hill later found that patterns produced by electrical
excitation and by mechanical impact were "exactly similar" [6]. Waller's studies
of compounded modes on free square plates remain the reference for the
superposition regime [7]. Warburton's fifteen cases for the rectangular plate [8]
and Leissa's catalogue [9] situate the boundary conditions; Tuan and co-workers
give the modern point-driven account [3,4].

# 8. Reproducibility

Every table in this paper is printed by a script that reads the published
drawings and reruns in minutes; the table and the counts of §3.5 are printed by
`niveaux_v2.py`, from `axes-v2.json`, in the deposit of the companion paper. Axis offsets are extracted from the vector
sources and compared to level sets by exact arithmetic, not by numerical fitting.
The plate identity of §4.1 is verified symbolically. The underlying plates were
themselves checked region by region — $1152$ regions each — before any
identification was attempted, and two corrupt files found in that check were
corrected before use.

# References

[1] Y. Xing, G. Li, Y. Yuan, *A review of the analytical solution methods for the
eigenvalue problems of rectangular plates*, Int. J. Mech. Sci. 221 (2022) 107171.

[2] R. C. Colwell, *The vibrations of quartz plates*, Proc. Inst. Radio Eng.
20(5) (1932) 808–812.

[3] P. H. Tuan, J. C. Tung, H. C. Liang, P. Y. Chiang, K. F. Huang, Y. F. Chen,
*Resolving the formation of modern Chladni figures*, EPL 111 (2015) 64004.

[4] P. H. Tuan et al., *Point-driven modern Chladni figures with symmetry
breaking*, Sci. Rep. 8 (2018) 10844, doi:10.1038/s41598-018-29244-6.

[5] R. C. Colwell, *Diagonal symmetry in Chladni plates*, J. Franklin Inst.
215(2) (1933) 169–177.

[6] R. C. Colwell, L. R. Hill, *The magnetostrictive oscillation of quartz
plates*, J. Appl. Phys. 8(1) (1937) 68–70.

[7] M. D. Waller, *Vibrations of free square plates: part II, compounded normal
modes*, Proc. Phys. Soc. 52 (1940) 452.

[8] G. B. Warburton, *The vibration of rectangular plates*, Proc. Inst. Mech.
Eng. 168(1) (1954) 371–384.

[9] A. W. Leissa, *The free vibration of rectangular plates*, J. Sound Vib. 31
(1973) 257–293.

[10] W. Gander, G. Wanner, *From Euler, Ritz, and Galerkin to Modern Computing*,
SIAM Review 54(4) (2012) 627–666.

[11] Azhar, Abdul Kudus, Jamadin, Mustaffa, *Comparison of Modal Parameters of a
Square Steel Plate Using Finite Element Method and Operational Modal Analysis*,
Int. J. Integrated Eng. (2023), Universiti Tun Hussein Onn Malaysia.

[12] A. K. F. Val Baker et al., *Exploration of Resonant Modes for Circular and
Polygonal Chladni Plates*, Entropy 26(3) (2024) 264.

[13] R. L. Powell, K. A. Stetson, *Interferometric vibration analysis by
wavefront reconstruction*, J. Opt. Soc. Am. 55 (1965) 1593–1598.
