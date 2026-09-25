# Shapes that win

Every small shape of one player's stones, checked with Six's forced-win solver: which ones must be answered, how to answer them, and which can't be answered at all.

## What the words mean

- **Shape:** some of one player's stones with nothing else nearby. Rotations, mirror images and shifts of a shape count as the same shape. Stones count as part of one shape when they're within 2 cells of each other, or on one line within 4.
- **Must-answer:** if the owner gets to move (two stones), they have a forced win, so the opponent has to spend their turn on it.
- **Forced win:** a win the solver proves: every one of the owner's turns makes threats (lines one turn from six) that need both of the opponent's stones to block, until there are more threats than two stones can block. It holds whatever the opponent does.
- **Holding reply:** two opponent stones after which the owner has no forced win any more.
- **Unstoppable:** no reply holds. The shape wins even with the opponent to move.
- **Minimal:** it doesn't contain a smaller must-answer shape. Bigger must-answer shapes usually just contain one of these.

In the diagrams the shape is yellow, outlined cells are the owner's winning first turn, and blue stones are the opponent's reply.

## Summary

| Stones | Shapes | Must-answer | Minimal must-answer | Unstoppable |
|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 |
| 2 | 5 | 0 | 0 | 0 |
| 3 | 41 | 16 | 16 | 0 |
| 4 | 779 | 529 | 61 | 21 |
| 5 | 18,237 | 15,536 | 196 | not checked |

- No shape of 1 or 2 stones is must-answer. Every must-answer shape needs at least 3 stones.
- No 3-stone shape is unstoppable: each one has replies that hold. The smallest unstoppable shapes have 4 stones.
- Checking every reply to every 5-stone shape would take many hours, so the 5-stone shapes are listed without defences.

## Unstoppable shapes

These 21 four-stone shapes win even with the opponent to move: the solver tried every two-stone reply within 5 cells of each (6,000 to 10,600 replies; a stone further away can't share a line of six with the shape) and the owner still forces a win after every one. Don't let the opponent build one.

### U1 · contains a chevron

<img src="shapes/s0x0_0x1_1xm3_1xm1.svg" alt="U1 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8515 tried): it wins with the opponent to move.

### U2 · contains a triangle

<img src="shapes/s0x0_0x1_1xm3_1x0.svg" alt="U2 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8646 tried): it wins with the opponent to move.

### U3 · contains a triangle

<img src="shapes/s0x0_0x1_1xm2_1x0.svg" alt="U3 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (7260 tried): it wins with the opponent to move.

### U4 · Diamond (two triangles)

<img src="shapes/s0x0_0x1_1xm1_1x0.svg" alt="U4 Diamond (two triangles)">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (5995 tried): it wins with the opponent to move.

### U5 · contains 2 chevrons

<img src="shapes/s0x0_0x1_1xm1_1x1.svg" alt="U5 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (6670 tried): it wins with the opponent to move.

### U6 · contains a chevron

<img src="shapes/s0x0_0x1_1xm1_2x0.svg" alt="U6 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (7260 tried): it wins with the opponent to move.

### U7 · contains a chevron

<img src="shapes/s0x0_0x1_1xm1_3x0.svg" alt="U7 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8646 tried): it wins with the opponent to move.

### U8

<img src="shapes/s0x0_0x1_2xm2_2xm1.svg" alt="U8 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (7381 tried): it wins with the opponent to move.

### U9

<img src="shapes/s0x0_0x1_2xm2_2x0.svg" alt="U9 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8128 tried): it wins with the opponent to move.

### U10

<img src="shapes/s0x0_0x1_2xm2_2x1.svg" alt="U10 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (9045 tried): it wins with the opponent to move.

### U11

<img src="shapes/s0x0_0x1_2xm2_3xm2.svg" alt="U11 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8128 tried): it wins with the opponent to move.

### U12

<img src="shapes/s0x0_0x1_2xm2_3x0.svg" alt="U12 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (9591 tried): it wins with the opponent to move.

### U13

<img src="shapes/s0x0_0x1_2xm1_2x0.svg" alt="U13 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (7260 tried): it wins with the opponent to move.

### U14

<img src="shapes/s0x0_0x1_2xm1_3x1.svg" alt="U14 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (9591 tried): it wins with the opponent to move.

### U15

<img src="shapes/s0x0_0x1_3xm2_3x0.svg" alt="U15 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (9591 tried): it wins with the opponent to move.

### U16

<img src="shapes/s0x0_0x2_1x0_2xm2.svg" alt="U16 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8646 tried): it wins with the opponent to move.

### U17

<img src="shapes/s0x0_0x2_1x0_3xm3.svg" alt="U17 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (10153 tried): it wins with the opponent to move.

### U18

<img src="shapes/s0x0_0x2_2xm3_2x0.svg" alt="U18 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (10585 tried): it wins with the opponent to move.

### U19

<img src="shapes/s0x0_0x2_2xm2_2x0.svg" alt="U19 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (9045 tried): it wins with the opponent to move.

### U20 · contains a chevron

<img src="shapes/s0x0_1xm3_1xm1_2xm1.svg" alt="U20 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (8515 tried): it wins with the opponent to move.

### U21 · contains 3 chevrons

<img src="shapes/s0x0_1xm2_1xm1_2xm1.svg" alt="U21 ">

Forced win in 4 turns for the owner to move.
No reply within 5 cells holds (7140 tried): it wins with the opponent to move.

## 3-stone must-answer shapes

All 16 of them, hardest to defend first. Every must-answer shape with more stones contains one of these or is listed below.

### A1 · Triangle

<img src="shapes/s0x0_0x1_1x0.svg" alt="A1 Triangle">

Forced win in 5 turns for the owner to move.
48 of 990 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_1x0_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_1x0_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_1x0_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_1x0_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_1x0_d3.svg" alt="holding defence 4">

### A2 · Chevron (boomerang)

<img src="shapes/s0x0_0x1_1xm1.svg" alt="A2 Chevron (boomerang)">

Forced win in 5 turns for the owner to move.
61 of 1128 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_1xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_1xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_1xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_1xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_1xm1_d3.svg" alt="holding defence 4">

### A3

<img src="shapes/s0x0_0x1_2xm1.svg" alt="A3 ">

Forced win in 5 turns for the owner to move.
68 of 1326 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_2xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_2xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_2xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_2xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_2xm1_d3.svg" alt="holding defence 4">

### A4

<img src="shapes/s0x0_0x2_2x0.svg" alt="A4 ">

Forced win in 5 turns for the owner to move.
78 of 1596 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_2x0_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x2_2x0_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_2x0_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_2x0_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_2x0_d3.svg" alt="holding defence 4">

### A5

<img src="shapes/s0x0_0x1_2xm2.svg" alt="A5 ">

Forced win in 5 turns for the owner to move.
95 of 1485 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_2xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_2xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_2xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_2xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_2xm2_d3.svg" alt="holding defence 4">

### A6

<img src="shapes/s0x0_0x1_3xm2.svg" alt="A6 ">

Forced win in 5 turns for the owner to move.
100 of 1711 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_3xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_3xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_3xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_3xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_3xm2_d3.svg" alt="holding defence 4">

### A7

<img src="shapes/s0x0_0x2_3xm1.svg" alt="A7 ">

Forced win in 5 turns for the owner to move.
110 of 2016 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_3xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x2_3xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_3xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_3xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_3xm1_d3.svg" alt="holding defence 4">

### A8

<img src="shapes/s0x0_0x3_3x0.svg" alt="A8 ">

Forced win in 5 turns for the owner to move.
126 of 2415 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_3x0_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x3_3x0_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_3x0_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_3x0_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_3x0_d3.svg" alt="holding defence 4">

### A9

<img src="shapes/s0x0_0x1_1xm2.svg" alt="A9 ">

Forced win in 5 turns for the owner to move.
300 of 1431 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_1xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_1xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_1xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_1xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_1xm2_d3.svg" alt="holding defence 4">

### A10

<img src="shapes/s0x0_0x2_2xm1.svg" alt="A10 ">

Forced win in 5 turns for the owner to move.
321 of 1711 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_2xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_2xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_2xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_2xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_2xm1_d3.svg" alt="holding defence 4">

### A11

<img src="shapes/s0x0_0x3_1x1.svg" alt="A11 ">

Forced win in 5 turns for the owner to move.
353 of 1711 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_1x1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 6 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_1x1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_1x1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_1x1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_1x1_d3.svg" alt="holding defence 4">

### A12

<img src="shapes/s0x0_0x2_2xm2.svg" alt="A12 ">

Forced win in 5 turns for the owner to move.
602 of 1891 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_2xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_2xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_2xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_2xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_2xm2_d3.svg" alt="holding defence 4">

### A13

<img src="shapes/s0x0_0x2_1xm2.svg" alt="A13 ">

Forced win in 5 turns for the owner to move.
649 of 1830 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_1xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_1xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_1xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_1xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_1xm2_d3.svg" alt="holding defence 4">

### A14

<img src="shapes/s0x0_0x1_3xm3.svg" alt="A14 ">

Forced win in 5 turns for the owner to move.
660 of 1891 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_3xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_3xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_3xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_3xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_3xm3_d3.svg" alt="holding defence 4">

### A15

<img src="shapes/s0x0_0x3_2xm1.svg" alt="A15 ">

Forced win in 5 turns for the owner to move.
705 of 2145 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_2xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_2xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_2xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_2xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_2xm1_d3.svg" alt="holding defence 4">

### A16

<img src="shapes/s0x0_0x2_3xm3.svg" alt="A16 ">

Forced win in 5 turns for the owner to move.
1088 of 2346 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_3xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 17 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_3xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_3xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_3xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_3xm3_d3.svg" alt="holding defence 4">

## 4-stone must-answer shapes

The 61 minimal ones (they contain no 3-stone must-answer shape), hardest to defend first.

### B1

<img src="shapes/s0x0_0x1_0x2_0x3.svg" alt="B1 ">

Forced win in 0 turns for the owner to move.
3 of 1431 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_0x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; no single cell is enough, both stones matter.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_0x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_0x3_d1.svg" alt="holding defence 2">

### B2

<img src="shapes/s0x0_0x1_0x2_0x4.svg" alt="B2 ">

Forced win in 0 turns for the owner to move.
61 of 1830 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_0x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 1 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_0x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_0x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x2_0x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x2_0x4_d3.svg" alt="holding defence 4">

### B3

<img src="shapes/s0x0_0x1_0x3_0x4.svg" alt="B3 ">

Forced win in 0 turns for the owner to move.
61 of 1830 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_0x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 1 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_0x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_0x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_0x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_0x4_d3.svg" alt="holding defence 4">

### B4

<img src="shapes/s0x0_0x1_0x2_0x5.svg" alt="B4 ">

Forced win in 0 turns for the owner to move.
133 of 2278 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_0x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 2 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_0x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_0x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x2_0x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x2_0x5_d3.svg" alt="holding defence 4">

### B5

<img src="shapes/s0x0_0x1_0x3_0x5.svg" alt="B5 ">

Forced win in 0 turns for the owner to move.
133 of 2278 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_0x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 2 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_0x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_0x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_0x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_0x5_d3.svg" alt="holding defence 4">

### B6

<img src="shapes/s0x0_0x1_0x4_0x5.svg" alt="B6 ">

Forced win in 0 turns for the owner to move.
133 of 2278 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x4_0x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 2 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x4_0x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x4_0x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x4_0x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x4_0x5_d3.svg" alt="holding defence 4">

### B7

<img src="shapes/s0x0_0x2_0x3_0x5.svg" alt="B7 ">

Forced win in 0 turns for the owner to move.
133 of 2278 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_0x3_0x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 2 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_0x3_0x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_0x3_0x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_0x3_0x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_0x3_0x5_d3.svg" alt="holding defence 4">

### B8

<img src="shapes/s0x0_0x1_2xm3_4xm3.svg" alt="B8 ">

Forced win in 4 turns for the owner to move.
177 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_2xm3_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 1 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_2xm3_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d3.svg" alt="holding defence 4">

### B9

<img src="shapes/s0x0_0x1_1xm3_4xm3.svg" alt="B9 ">

Forced win in 4 turns for the owner to move.
211 of 2926 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_1xm3_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 1 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_1xm3_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d3.svg" alt="holding defence 4">

### B10

<img src="shapes/s0x0_0x1_3xm1_4xm3.svg" alt="B10 ">

Forced win in 4 turns for the owner to move.
320 of 2346 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_3xm1_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 4 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_3xm1_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d3.svg" alt="holding defence 4">

### B11

<img src="shapes/s0x0_0x3_0x7_1x4.svg" alt="B11 ">

Forced win in 5 turns for the owner to move.
437 of 3655 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_0x7_1x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_0x7_1x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_0x7_1x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_0x7_1x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_0x7_1x4_d3.svg" alt="holding defence 4">

### B12

<img src="shapes/s0x0_0x1_0x2_4xm2.svg" alt="B12 ">

Forced win in 4 turns for the owner to move.
465 of 2415 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_4xm2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 7 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_4xm2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_4xm2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x2_4xm2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x2_4xm2_d3.svg" alt="holding defence 4">

### B13

<img src="shapes/s0x0_0x1_0x5_2x3.svg" alt="B13 ">

Forced win in 5 turns for the owner to move.
475 of 2926 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x5_2x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x5_2x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x5_2x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x5_2x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x5_2x3_d3.svg" alt="holding defence 4">

### B14

<img src="shapes/s0x0_0x1_0x2_4xm3.svg" alt="B14 ">

Forced win in 4 turns for the owner to move.
478 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 7 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x2_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x2_4xm3_d3.svg" alt="holding defence 4">

### B15

<img src="shapes/s0x0_0x1_0x2_4xm4.svg" alt="B15 ">

Forced win in 4 turns for the owner to move.
507 of 2775 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x2_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 7 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x2_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x2_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x2_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x2_4xm4_d3.svg" alt="holding defence 4">

### B16

<img src="shapes/s0x0_0x1_0x5_3x2.svg" alt="B16 ">

Forced win in 5 turns for the owner to move.
529 of 3403 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x5_3x2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x5_3x2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x5_3x2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x5_3x2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x5_3x2_d3.svg" alt="holding defence 4">

### B17

<img src="shapes/s0x0_0x2_0x6_2x4.svg" alt="B17 ">

Forced win in 5 turns for the owner to move.
549 of 3486 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_0x6_2x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_0x6_2x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_0x6_2x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_0x6_2x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_0x6_2x4_d3.svg" alt="holding defence 4">

### B18

<img src="shapes/s0x0_0x1_0x3_4xm1.svg" alt="B18 ">

Forced win in 4 turns for the owner to move.
586 of 2850 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 8 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4xm1_d3.svg" alt="holding defence 4">

### B19

<img src="shapes/s0x0_0x1_0x3_4x0.svg" alt="B19 ">

Forced win in 4 turns for the owner to move.
586 of 2850 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4x0_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 8 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4x0_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4x0_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4x0_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4x0_d3.svg" alt="holding defence 4">

### B20

<img src="shapes/s0x0_0x1_0x3_4x1.svg" alt="B20 ">

Forced win in 4 turns for the owner to move.
586 of 2926 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4x1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 8 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4x1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4x1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4x1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4x1_d3.svg" alt="holding defence 4">

### B21

<img src="shapes/s0x0_0x2_4xm2_7xm5.svg" alt="B21 ">

Forced win in 5 turns for the owner to move.
591 of 4095 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_4xm2_7xm5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_4xm2_7xm5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d3.svg" alt="holding defence 4">

### B22

<img src="shapes/s0x0_0x2_0x6_3x3.svg" alt="B22 ">

Forced win in 5 turns for the owner to move.
595 of 4005 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_0x6_3x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_0x6_3x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_0x6_3x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_0x6_3x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_0x6_3x3_d3.svg" alt="holding defence 4">

### B23

<img src="shapes/s0x0_0x1_0x5_1x3.svg" alt="B23 ">

Forced win in 5 turns for the owner to move.
611 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x5_1x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 9 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x5_1x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x5_1x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x5_1x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x5_1x3_d3.svg" alt="holding defence 4">

### B24

<img src="shapes/s0x0_0x1_0x3_4xm3.svg" alt="B24 ">

Forced win in 4 turns for the owner to move.
614 of 3081 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 8 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4xm3_d3.svg" alt="holding defence 4">

### B25

<img src="shapes/s0x0_0x1_2xm4_4xm4.svg" alt="B25 ">

Forced win in 4 turns for the owner to move.
623 of 2926 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_2xm4_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 6 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_2xm4_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d3.svg" alt="holding defence 4">

### B26

<img src="shapes/s0x0_0x4_0x8_1x3.svg" alt="B26 ">

Forced win in 5 turns for the owner to move.
644 of 4278 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_0x8_1x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 6 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_0x8_1x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_0x8_1x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_0x8_1x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_0x8_1x3_d3.svg" alt="holding defence 4">

### B27

<img src="shapes/s0x0_0x3_0x7_3x4.svg" alt="B27 ">

Forced win in 5 turns for the owner to move.
655 of 4656 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_0x7_3x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 5 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_0x7_3x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_0x7_3x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_0x7_3x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_0x7_3x4_d3.svg" alt="holding defence 4">

### B28

<img src="shapes/s0x0_0x4_0x8_2x3.svg" alt="B28 ">

Forced win in 5 turns for the owner to move.
673 of 4753 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_0x8_2x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 6 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_0x8_2x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_0x8_2x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_0x8_2x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_0x8_2x3_d3.svg" alt="holding defence 4">

### B29

<img src="shapes/s0x0_0x1_2xm3_4xm4.svg" alt="B29 ">

Forced win in 4 turns for the owner to move.
679 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_2xm3_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_2xm3_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d3.svg" alt="holding defence 4">

### B30

<img src="shapes/s0x0_0x1_0x5_1x4.svg" alt="B30 ">

Forced win in 5 turns for the owner to move.
717 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x5_1x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x5_1x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x5_1x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x5_1x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x5_1x4_d3.svg" alt="holding defence 4">

### B31

<img src="shapes/s0x0_0x2_0x6_1x4.svg" alt="B31 ">

Forced win in 5 turns for the owner to move.
745 of 3081 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_0x6_1x4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_0x6_1x4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_0x6_1x4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_0x6_1x4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_0x6_1x4_d3.svg" alt="holding defence 4">

### B32

<img src="shapes/s0x0_0x1_4xm3_6xm5.svg" alt="B32 ">

Forced win in 5 turns for the owner to move.
807 of 3081 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm3_6xm5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm3_6xm5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d3.svg" alt="holding defence 4">

### B33

<img src="shapes/s0x0_0x3_0x7_1x5.svg" alt="B33 ">

Forced win in 5 turns for the owner to move.
818 of 3655 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_0x7_1x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_0x7_1x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_0x7_1x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_0x7_1x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_0x7_1x5_d3.svg" alt="holding defence 4">

### B34

<img src="shapes/s0x0_0x2_3xm2_4xm4.svg" alt="B34 ">

Forced win in 4 turns for the owner to move.
836 of 3003 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_3xm2_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_3xm2_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d3.svg" alt="holding defence 4">

### B35

<img src="shapes/s0x0_0x1_0x3_4xm4.svg" alt="B35 ">

Forced win in 5 turns for the owner to move.
841 of 3321 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 9 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4xm4_d3.svg" alt="holding defence 4">

### B36

<img src="shapes/s0x0_0x1_0x3_4x3.svg" alt="B36 ">

Forced win in 5 turns for the owner to move.
841 of 3321 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x3_4x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 9 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x3_4x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x3_4x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x3_4x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x3_4x3_d3.svg" alt="holding defence 4">

### B37

<img src="shapes/s0x0_0x2_2xm3_4xm4.svg" alt="B37 ">

Forced win in 5 turns for the owner to move.
868 of 3081 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_2xm3_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_2xm3_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d3.svg" alt="holding defence 4">

### B38

<img src="shapes/s0x0_0x1_3xm4_4xm4.svg" alt="B38 ">

Forced win in 4 turns for the owner to move.
877 of 2556 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_3xm4_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 13 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_3xm4_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d3.svg" alt="holding defence 4">

### B39

<img src="shapes/s0x0_0x1_4xm3_7xm6.svg" alt="B39 ">

Forced win in 5 turns for the owner to move.
887 of 3655 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm3_7xm6_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm3_7xm6_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d3.svg" alt="holding defence 4">

### B40

<img src="shapes/s0x0_0x4_0x8_1x2.svg" alt="B40 ">

Forced win in 5 turns for the owner to move.
900 of 4278 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_0x8_1x2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 10 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_0x8_1x2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_0x8_1x2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_0x8_1x2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_0x8_1x2_d3.svg" alt="holding defence 4">

### B41

<img src="shapes/s0x0_0x3_3xm1_4x0.svg" alt="B41 ">

Forced win in 4 turns for the owner to move.
908 of 3160 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_3xm1_4x0_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 12 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_3xm1_4x0_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_3xm1_4x0_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_3xm1_4x0_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_3xm1_4x0_d3.svg" alt="holding defence 4">

### B42

<img src="shapes/s0x0_0x4_1x1_4x1.svg" alt="B42 ">

Forced win in 5 turns for the owner to move.
969 of 3403 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_1x1_4x1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 12 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_1x1_4x1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_1x1_4x1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_1x1_4x1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_1x1_4x1_d3.svg" alt="holding defence 4">

### B43

<img src="shapes/s0x0_0x1_0x5_1x5.svg" alt="B43 ">

Forced win in 5 turns for the owner to move.
982 of 2775 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_0x5_1x5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 14 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_0x5_1x5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_0x5_1x5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_0x5_1x5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_0x5_1x5_d3.svg" alt="holding defence 4">

### B44

<img src="shapes/s0x0_0x3_3xm3_3x1.svg" alt="B44 ">

Forced win in 4 turns for the owner to move.
1037 of 3828 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_3xm3_3x1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 12 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_3xm3_3x1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_3xm3_3x1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_3xm3_3x1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_3xm3_3x1_d3.svg" alt="holding defence 4">

### B45

<img src="shapes/s0x0_0x3_0x7_3x3.svg" alt="B45 ">

Forced win in 5 turns for the owner to move.
1078 of 4656 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_0x7_3x3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_0x7_3x3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_0x7_3x3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_0x7_3x3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_0x7_3x3_d3.svg" alt="holding defence 4">

### B46

<img src="shapes/s0x0_0x1_3xm4_4xm3.svg" alt="B46 ">

Forced win in 4 turns for the owner to move.
1083 of 2775 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_3xm4_4xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 16 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_3xm4_4xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d3.svg" alt="holding defence 4">

### B47

<img src="shapes/s0x0_0x4_0x8_2x2.svg" alt="B47 ">

Forced win in 5 turns for the owner to move.
1126 of 4753 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_0x8_2x2_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 11 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_0x8_2x2_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_0x8_2x2_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_0x8_2x2_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_0x8_2x2_d3.svg" alt="holding defence 4">

### B48

<img src="shapes/s0x0_0x1_4xm4_5xm4.svg" alt="B48 ">

Forced win in 5 turns for the owner to move.
1169 of 2775 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm4_5xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 17 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm4_5xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d3.svg" alt="holding defence 4">

### B49

<img src="shapes/s0x0_0x1_4xm4_6xm6.svg" alt="B49 ">

Forced win in 6 turns for the owner to move.
1225 of 3321 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm4_6xm6_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 16 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm4_6xm6_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d3.svg" alt="holding defence 4">

### B50

<img src="shapes/s0x0_0x3_3xm2_4xm1.svg" alt="B50 ">

Forced win in 4 turns for the owner to move.
1264 of 3321 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_3xm2_4xm1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 17 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_3xm2_4xm1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d3.svg" alt="holding defence 4">

### B51

<img src="shapes/s0x0_0x1_4xm3_6xm3.svg" alt="B51 ">

Forced win in 5 turns for the owner to move.
1313 of 3081 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm3_6xm3_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 18 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm3_6xm3_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d3.svg" alt="holding defence 4">

### B52

<img src="shapes/s0x0_0x3_3xm2_4xm4.svg" alt="B52 ">

Forced win in 5 turns for the owner to move.
1331 of 3570 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_3xm2_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 17 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_3xm2_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d3.svg" alt="holding defence 4">

### B53

<img src="shapes/s0x0_0x1_4xm4_7xm7.svg" alt="B53 ">

Forced win in 6 turns for the owner to move.
1343 of 3916 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm4_7xm7_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 16 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm4_7xm7_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d3.svg" alt="holding defence 4">

### B54

<img src="shapes/s0x0_0x2_2xm4_4xm4.svg" alt="B54 ">

Forced win in 5 turns for the owner to move.
1422 of 3486 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_2xm4_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 18 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_2xm4_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d3.svg" alt="holding defence 4">

### B55

<img src="shapes/s0x0_0x1_1xm4_4xm4.svg" alt="B55 ">

Forced win in 5 turns for the owner to move.
1497 of 3403 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_1xm4_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 19 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_1xm4_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d3.svg" alt="holding defence 4">

### B56

<img src="shapes/s0x0_0x1_4xm4_6xm4.svg" alt="B56 ">

Forced win in 5 turns for the owner to move.
1579 of 3321 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm4_6xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 21 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm4_6xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d3.svg" alt="holding defence 4">

### B57

<img src="shapes/s0x0_0x1_4xm3_8xm7.svg" alt="B57 ">

Forced win in 6 turns for the owner to move.
1630 of 4278 replies within 3 cells hold.

<img src="shapes/s0x0_0x1_4xm3_8xm7_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 18 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x1_4xm3_8xm7_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d3.svg" alt="holding defence 4">

### B58

<img src="shapes/s0x0_0x2_1xm4_4xm4.svg" alt="B58 ">

Forced win in 5 turns for the owner to move.
1648 of 4005 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_1xm4_4xm4_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 19 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_1xm4_4xm4_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d3.svg" alt="holding defence 4">

### B59

<img src="shapes/s0x0_0x4_0x8_3x1.svg" alt="B59 ">

Forced win in 5 turns for the owner to move.
1817 of 5356 replies within 3 cells hold.

<img src="shapes/s0x0_0x4_0x8_3x1_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 17 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x4_0x8_3x1_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x4_0x8_3x1_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x4_0x8_3x1_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x4_0x8_3x1_d3.svg" alt="holding defence 4">

### B60

<img src="shapes/s0x0_0x2_4xm2_8xm6.svg" alt="B60 ">

Forced win in 6 turns for the owner to move.
1892 of 4753 replies within 3 cells hold.

<img src="shapes/s0x0_0x2_4xm2_8xm6_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 20 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x2_4xm2_8xm6_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d3.svg" alt="holding defence 4">

### B61

<img src="shapes/s0x0_0x3_4xm1_8xm5.svg" alt="B61 ">

Forced win in 6 turns for the owner to move.
2031 of 5356 replies within 3 cells hold.

<img src="shapes/s0x0_0x3_4xm1_8xm5_map.svg" alt="defence map">

Defence map: the more holding replies use a cell, the bluer it is; the 20 darkest cells hold whatever the second stone does.

Some holding replies:

<img src="shapes/s0x0_0x3_4xm1_8xm5_d0.svg" alt="holding defence 1"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d1.svg" alt="holding defence 2"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d2.svg" alt="holding defence 3"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d3.svg" alt="holding defence 4">

## 5-stone must-answer shapes

The 196 minimal ones. They're spread out: every tighter 5-stone must-answer shape contains a smaller one above.

<img src="shapes/s0x0_0x1_0x2_0x6_1x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x2_0x6_2x5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x2_0x6_2x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x2_0x6_3x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x2_0x6_4x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x6_1x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x6_3x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x6_4x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x6_4x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x7_1x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x7_2x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x7_2x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x3_0x7_3x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x7_1x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x7_3x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x8_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x8_2x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x8_2x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_0x8_3x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_1x5_4x5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_3xm5_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_3x4_4x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_3x4_5x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_4xm4_7xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_4xm4_8xm8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_4xm3_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x4_4xm3_8xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x8_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x8_3x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x9_1x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x9_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x9_2x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_0x9_2x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_2x4_5x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_2x4_5x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_2x5_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_2x5_4x5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_2x5_5x5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_3xm5_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_3x3_4x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_4xm3_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_4x1_7xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x5_4x1_8xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_0x6_3x3_4x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_1xm3_4xm4_5xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_2xm6_3xm5_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_2xm4_4xm3_6xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_3xm5_3xm1_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_3xm5_4xm4_7xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm6_4xm4_8xm10.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm6_4xm3_7xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm6_4xm3_8xm10.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm5_4xm4_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm5_4xm3_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_4xm2_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_4xm2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_4xm1_7xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_4xm1_8xm5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_4xm1_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm4_5xm6_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_4xm2_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_4xm2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_4xm1_8xm5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_4xm1_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_5xm5_8xm8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x1_4xm3_5xm2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x6_1x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x6_3x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x6_4x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x7_1x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x7_2x6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x7_2x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x7_3x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x3_0x7_4x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x6_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x6_4xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x6_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_1x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_3x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x7_4x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x8_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x8_2x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x8_2x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_0x8_3x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_3xm5_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_4xm4_6xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_4xm4_7xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_4xm2_7xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x4_4xm2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_0x8_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_0x8_3x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_0x9_2x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_0x9_2x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_3xm5_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4xm4_6xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4xm4_7xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4xm2_7xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4xm2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4x0_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x5_4x1_7x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_3x4_4x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x0_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_5x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_6x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_6x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_7xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_7x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x6_4x2_8xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_0x7_3x4_4x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_2xm3_4xm2_6xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_3xm2_4xm1_4x2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm5_4xm4_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm5_4xm2_7xm8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm5_4xm2_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_4xm3_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_4xm1_7xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_4xm1_8xm5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_4xm1_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_5xm6_8xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_5xm5_8xm8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_5xm5_9xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm4_6xm6_9xm9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm3_4xm2_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm3_4x0_7xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm3_4x0_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm2_4xm1_8xm5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm2_4xm1_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm2_5xm4_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x2_4xm2_5xm1_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x7_1xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x7_3xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x7_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x7_4xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x7_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_1xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_1x9.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_2x7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_3xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_3x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x4_0x8_4x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_1xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_3xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_4xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x8_4x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x5_0x9_2x8.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x6_4x0_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_2x4_4x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_3x5_4x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x0_7xm3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x3_5x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x3_6x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x3_7x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x3_7x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x7_4x3_8xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x8_1x4_4x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x8_3x3_4x4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_0x8_3x5_4x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_1xm5_1xm2_3x3.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_1xm2_3xm1_5xm2.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_3xm5_3xm1_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm4_4xm3_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm4_4xm2_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm3_4xm1_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm3_4x0_7xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm3_4x0_8xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm2_4xm1_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm2_4x0_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm1_5xm3_8xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x3_4xm1_5x0_8x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_0x5_0x9_2xm1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_0x8_2x1_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_0x8_3x2_4x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_1x1_5x1_6x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_1x1_5x1_7x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_1x1_5x1_8x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x4_4x0_8xm4_8x0.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_0x5_1x1_4x1_5x1.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm7_1xm4_1x1_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm7_1xm3_1x1_4xm4.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm3_1x1_4xm4_5xm5.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm3_1x1_4xm4_6xm6.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm3_1x1_4xm4_7xm7.svg" alt="5-stone shape" width="160"> <img src="shapes/s0x0_1xm3_1x1_4xm4_8xm8.svg" alt="5-stone shape" width="160">

## What this doesn't cover

- **Wins that need a quiet move.** The solver only proves wins where every turn forces the opponent. Some shapes are probably still winning with a slower, non-forcing move first: the straight three (three in a row), for example, has no forcing win for the owner to move, but Six's deeper search thinks the owner wins. Those aren't listed as must-answer here, because that kind of win can't be proven the same way.
- **Shapes near other stones.** Every shape here stands alone. In a real game, the opponent's own threats (a counter-threat while defending) and other stones change everything.
- **Spread-out shapes.** Stones more than 2 cells apart only count as one shape when they share a line within 4 cells.

## Rebuilding this page

```bash
engine/build/release/sixshapes --stones 4 --defend 4 > runs/shapes/s4d.jsonl
engine/build/release/sixshapes --stones 5 --defend 0 > runs/shapes/s5.jsonl
python guide/make_shapes.py runs/shapes/s4d.jsonl runs/shapes/s5.jsonl
```

