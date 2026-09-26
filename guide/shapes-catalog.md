# Shapes that win: catalogue

Every must-answer shape, with its holding replies. The rules and the cheat sheet are on the [main page](shapes.md).

<img src="shapes/legend.svg" alt="Diagram key" width="520">

The threes are in the same order as the cheat sheet; the bigger shapes are sorted hardest first, by the share of replies (pairs of empty cells within 3 cells of the shape) that hold. In names like "Chevron 1+2", the numbers are the distances from the corner stone to the other two.

## Summary

| Stones | Shapes | Must-answer | Minimal must-answer | Unstoppable |
|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 |
| 2 | 5 | 0 | 0 | 0 |
| 3 | 41 | 16 | 16 | 0 |
| 4 | 779 | 529 | 61 | 21 |
| 5 | 18,237 | 15,536 | 196 | not checked |

A **shape** is some of one player's stones with nothing else nearby; rotations, mirror images and shifts count as the same shape, and stones count as one shape when they're within 2 cells or on one line within 4. **Must-answer:** its owner, to move, has a forced win. **Minimal:** it contains no smaller must-answer shape. **Replies tried:** every pair of empty cells within 3 cells of the shape (within 5 for the unstoppable shapes). **Six on turn N:** its owner makes a four on each of the first N − 1 turns.

## Unstoppable shapes

All 21, most compact first. Each wins even with the opponent to move.

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x0.svg" alt="U1" width="83"><br><b>U1</b> · Diamond (two triangles)<br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x1.svg" alt="U2" width="94"><br><b>U2</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1xm1_2xm1.svg" alt="U3" width="94"><br><b>U3</b><br><sub>3 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x0.svg" alt="U4" width="83"><br><b>U4</b><br><sub>3 tight threes inside</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_2x0.svg" alt="U5" width="104"><br><b>U5</b><br><sub>3 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_2x0.svg" alt="U6" width="104"><br><b>U6</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2xm1.svg" alt="U7" width="94"><br><b>U7</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2x0.svg" alt="U8" width="104"><br><b>U8</b><br><sub>3 tight threes inside</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1xm1_2xm1.svg" alt="U9" width="104"><br><b>U9</b><br><sub>3 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1xm1.svg" alt="U10" width="83"><br><b>U10</b><br><sub>2 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1x0.svg" alt="U11" width="94"><br><b>U11</b><br><sub>2 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_3x0.svg" alt="U12" width="124"><br><b>U12</b><br><sub>3 tight threes inside</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm2.svg" alt="U13" width="104"><br><b>U13</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_2xm2.svg" alt="U14" width="83"><br><b>U14</b><br><sub>2 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2x1.svg" alt="U15" width="114"><br><b>U15</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x0.svg" alt="U16" width="104"><br><b>U16</b><br><sub>2 tight threes inside</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_3x0.svg" alt="U17" width="124"><br><b>U17</b><br><sub>3 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_3x1.svg" alt="U18" width="135"><br><b>U18</b><br><sub>2 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_3x0.svg" alt="U19" width="124"><br><b>U19</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm3.svg" alt="U20" width="94"><br><b>U20</b><br><sub>2 tight threes inside</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm3_2x0.svg" alt="U21" width="104"><br><b>U21</b><br><sub>2 tight threes inside</sub></td></tr>
</table>

## 3-stone must-answer shapes

### A1 · Triangle 1+1

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1x0.svg" alt="A1" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1x0_d0.svg" alt="A1 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1x0_d1.svg" alt="A1 holding reply 2" width="208"><br>Holds</td></tr></table>

**4.8% of replies hold · needs both stones · all 48 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1x0_map.svg" alt="A1 defence map" width="250"> <img src="shapes/s0x0_0x1_1x0_d2.svg" alt="A1 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_1x0_d3.svg" alt="A1 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_1x0_d4.svg" alt="A1 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_1x0_d5.svg" alt="A1 holding reply 6" width="218">

</details>

### A2 · Triangle 1+2

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm1.svg" alt="A2" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm1_d0.svg" alt="A2 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm1_d1.svg" alt="A2 holding reply 2" width="187"><br>Holds</td></tr></table>

**5.1% of replies hold · needs both stones · all 20 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm1_map.svg" alt="A2 defence map" width="270"> <img src="shapes/s0x0_0x1_2xm1_d2.svg" alt="A2 holding reply 3" width="187"> <img src="shapes/s0x0_0x1_2xm1_d3.svg" alt="A2 holding reply 4" width="187"> <img src="shapes/s0x0_0x1_2xm1_d4.svg" alt="A2 holding reply 5" width="197"> <img src="shapes/s0x0_0x1_2xm1_d5.svg" alt="A2 holding reply 6" width="187">

</details>

### A3 · Triangle 1+3

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm2.svg" alt="A3" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm2_d0.svg" alt="A3 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm2_d1.svg" alt="A3 holding reply 2" width="197"><br>Holds</td></tr></table>

**5.8% of replies hold · needs both stones · all 24 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm2_map.svg" alt="A3 defence map" width="270"> <img src="shapes/s0x0_0x1_3xm2_d2.svg" alt="A3 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_3xm2_d3.svg" alt="A3 holding reply 4" width="197"> <img src="shapes/s0x0_0x1_3xm2_d4.svg" alt="A3 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_3xm2_d5.svg" alt="A3 holding reply 6" width="187">

</details>

### A4 · Triangle 2+2

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2x0.svg" alt="A4" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2x0_d0.svg" alt="A4 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2x0_d1.svg" alt="A4 holding reply 2" width="229"><br>Holds</td></tr></table>

**4.9% of replies hold · needs both stones · all 75 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2x0_map.svg" alt="A4 defence map" width="270"> <img src="shapes/s0x0_0x2_2x0_d2.svg" alt="A4 holding reply 3" width="229"> <img src="shapes/s0x0_0x2_2x0_d3.svg" alt="A4 holding reply 4" width="229"> <img src="shapes/s0x0_0x2_2x0_d4.svg" alt="A4 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_2x0_d5.svg" alt="A4 holding reply 6" width="229">

</details>

### A5 · Triangle 2+3

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm1.svg" alt="A5" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm1_d0.svg" alt="A5 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm1_d1.svg" alt="A5 holding reply 2" width="197"><br>Holds</td></tr></table>

**5.5% of replies hold · needs both stones · all 30 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm1_map.svg" alt="A5 defence map" width="291"> <img src="shapes/s0x0_0x2_3xm1_d2.svg" alt="A5 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_3xm1_d3.svg" alt="A5 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_3xm1_d4.svg" alt="A5 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_3xm1_d5.svg" alt="A5 holding reply 6" width="218">

</details>

### A6 · Triangle 3+3

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3x0.svg" alt="A6" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3x0_d0.svg" alt="A6 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3x0_d1.svg" alt="A6 holding reply 2" width="250"><br>Holds</td></tr></table>

**5.2% of replies hold · needs both stones · all 108 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3x0_map.svg" alt="A6 defence map" width="291"> <img src="shapes/s0x0_0x3_3x0_d2.svg" alt="A6 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_3x0_d3.svg" alt="A6 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_3x0_d4.svg" alt="A6 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_3x0_d5.svg" alt="A6 holding reply 6" width="250">

</details>

### A7 · Chevron 1+1

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm1.svg" alt="A7" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm1_d0.svg" alt="A7 holding reply 1" width="177"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm1_d1.svg" alt="A7 holding reply 2" width="197"><br>Holds</td></tr></table>

**5.4% of replies hold · needs both stones · all 16 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm1_map.svg" alt="A7 defence map" width="250"> <img src="shapes/s0x0_0x1_1xm1_d2.svg" alt="A7 holding reply 3" width="177"> <img src="shapes/s0x0_0x1_1xm1_d3.svg" alt="A7 holding reply 4" width="177"> <img src="shapes/s0x0_0x1_1xm1_d4.svg" alt="A7 holding reply 5" width="187"> <img src="shapes/s0x0_0x1_1xm1_d5.svg" alt="A7 holding reply 6" width="187">

</details>

### A8 · Chevron 1+2

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm2.svg" alt="A8" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm2_d0.svg" alt="A8 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm2_d1.svg" alt="A8 holding reply 2" width="187"><br>Holds</td></tr></table>

**6.4% of replies hold · needs both stones · all 20 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm2_map.svg" alt="A8 defence map" width="270"> <img src="shapes/s0x0_0x1_2xm2_d2.svg" alt="A8 holding reply 3" width="187"> <img src="shapes/s0x0_0x1_2xm2_d3.svg" alt="A8 holding reply 4" width="197"> <img src="shapes/s0x0_0x1_2xm2_d4.svg" alt="A8 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_2xm2_d5.svg" alt="A8 holding reply 6" width="177">

</details>

### A9 · Chevron 1+3

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm3.svg" alt="A9" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm3_d0.svg" alt="A9 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm3_d1.svg" alt="A9 holding reply 2" width="208"><br>Holds</td></tr></table>

**35% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm3_map.svg" alt="A9 defence map" width="270"> <img src="shapes/s0x0_0x1_3xm3_d2.svg" alt="A9 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_3xm3_d3.svg" alt="A9 holding reply 4" width="197"> <img src="shapes/s0x0_0x1_3xm3_d4.svg" alt="A9 holding reply 5" width="197"> <img src="shapes/s0x0_0x1_3xm3_d5.svg" alt="A9 holding reply 6" width="197">

</details>

### A10 · Chevron 2+2

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm2.svg" alt="A10" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm2_d0.svg" alt="A10 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm2_d1.svg" alt="A10 holding reply 2" width="187"><br>Holds</td></tr></table>

**32% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm2_map.svg" alt="A10 defence map" width="270"> <img src="shapes/s0x0_0x2_2xm2_d2.svg" alt="A10 holding reply 3" width="187"> <img src="shapes/s0x0_0x2_2xm2_d3.svg" alt="A10 holding reply 4" width="187"> <img src="shapes/s0x0_0x2_2xm2_d4.svg" alt="A10 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_2xm2_d5.svg" alt="A10 holding reply 6" width="187">

</details>

### A11 · Chevron 2+3

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm3.svg" alt="A11" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm3_d0.svg" alt="A11 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm3_d1.svg" alt="A11 holding reply 2" width="229"><br>Holds</td></tr></table>

**46% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm3_map.svg" alt="A11 defence map" width="291"> <img src="shapes/s0x0_0x2_3xm3_d2.svg" alt="A11 holding reply 3" width="229"> <img src="shapes/s0x0_0x2_3xm3_d3.svg" alt="A11 holding reply 4" width="229"> <img src="shapes/s0x0_0x2_3xm3_d4.svg" alt="A11 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_3xm3_d5.svg" alt="A11 holding reply 6" width="229">

</details>

### A12 · Pair + 1 (2,3)

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm2.svg" alt="A12" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm2_d0.svg" alt="A12 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm2_d1.svg" alt="A12 holding reply 2" width="187"><br>Holds</td></tr></table>

**21% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm2_map.svg" alt="A12 defence map" width="270"> <img src="shapes/s0x0_0x1_1xm2_d2.svg" alt="A12 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_1xm2_d3.svg" alt="A12 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_1xm2_d4.svg" alt="A12 holding reply 5" width="177"> <img src="shapes/s0x0_0x1_1xm2_d5.svg" alt="A12 holding reply 6" width="187">

</details>

### A13 · Split pair + 1 (2,3)

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm1.svg" alt="A13" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm1_d0.svg" alt="A13 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm1_d1.svg" alt="A13 holding reply 2" width="197"><br>Holds</td></tr></table>

**19% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm1_map.svg" alt="A13 defence map" width="270"> <img src="shapes/s0x0_0x2_2xm1_d2.svg" alt="A13 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_2xm1_d3.svg" alt="A13 holding reply 4" width="208"> <img src="shapes/s0x0_0x2_2xm1_d4.svg" alt="A13 holding reply 5" width="187"> <img src="shapes/s0x0_0x2_2xm1_d5.svg" alt="A13 holding reply 6" width="187">

</details>

### A14 · Split pair + 1 (2,4)

<table><tr><td align="center"><img src="shapes/s0x0_0x2_1xm2.svg" alt="A14" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_1xm2_d0.svg" alt="A14 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_1xm2_d1.svg" alt="A14 holding reply 2" width="208"><br>Holds</td></tr></table>

**35% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_1xm2_map.svg" alt="A14 defence map" width="270"> <img src="shapes/s0x0_0x2_1xm2_d2.svg" alt="A14 holding reply 3" width="208"> <img src="shapes/s0x0_0x2_1xm2_d3.svg" alt="A14 holding reply 4" width="208"> <img src="shapes/s0x0_0x2_1xm2_d4.svg" alt="A14 holding reply 5" width="208"> <img src="shapes/s0x0_0x2_1xm2_d5.svg" alt="A14 holding reply 6" width="208">

</details>

### A15 · Wide pair + 1 (2,2)

<table><tr><td align="center"><img src="shapes/s0x0_0x3_1x1.svg" alt="A15" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_1x1_d0.svg" alt="A15 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_1x1_d1.svg" alt="A15 holding reply 2" width="197"><br>Holds</td></tr></table>

**21% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_1x1_map.svg" alt="A15 defence map" width="250"> <img src="shapes/s0x0_0x3_1x1_d2.svg" alt="A15 holding reply 3" width="197"> <img src="shapes/s0x0_0x3_1x1_d3.svg" alt="A15 holding reply 4" width="208"> <img src="shapes/s0x0_0x3_1x1_d4.svg" alt="A15 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_1x1_d5.svg" alt="A15 holding reply 6" width="187">

</details>

### A16 · Wide pair + 1 (2,4)

<table><tr><td align="center"><img src="shapes/s0x0_0x3_2xm1.svg" alt="A16" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_2xm1_d0.svg" alt="A16 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_2xm1_d1.svg" alt="A16 holding reply 2" width="197"><br>Holds</td></tr></table>

**33% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_2xm1_map.svg" alt="A16 defence map" width="280"> <img src="shapes/s0x0_0x3_2xm1_d2.svg" alt="A16 holding reply 3" width="187"> <img src="shapes/s0x0_0x3_2xm1_d3.svg" alt="A16 holding reply 4" width="187"> <img src="shapes/s0x0_0x3_2xm1_d4.svg" alt="A16 holding reply 5" width="187"> <img src="shapes/s0x0_0x3_2xm1_d5.svg" alt="A16 holding reply 6" width="187">

</details>

## 4 stones: a three plus one

14 shapes. Three stones in one window of six, plus a fourth stone off that line.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3x2.svg" alt="B1" width="229"><br><b>B1</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x3.svg" alt="B2" width="218"><br><b>B2</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4.svg" alt="B3" width="197"><br><b>B3</b> · six on turn 5<br>18% hold · 7 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3.svg" alt="B4" width="208"><br><b>B4</b> · six on turn 5<br>19% hold · 7 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2.svg" alt="B5" width="208"><br><b>B5</b> · six on turn 5<br>19% hold · 7 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3.svg" alt="B6" width="197"><br><b>B6</b> · six on turn 5<br>20% hold · 8 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4x1.svg" alt="B7" width="239"><br><b>B7</b> · six on turn 5<br>20% hold · 8 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1.svg" alt="B8" width="218"><br><b>B8</b> · six on turn 5<br>21% hold · 8 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4x0.svg" alt="B9" width="229"><br><b>B9</b> · six on turn 5<br>21% hold · 8 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x3.svg" alt="B10" width="197"><br><b>B10</b> · six on turn 6<br>24% hold · 9 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4.svg" alt="B11" width="187"><br><b>B11</b> · six on turn 6<br>25% hold · 9 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_4x3.svg" alt="B12" width="260"><br><b>B12</b> · six on turn 6<br>25% hold · 9 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x4.svg" alt="B13" width="208"><br><b>B13</b> · six on turn 6<br>28% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x5.svg" alt="B14" width="218"><br><b>B14</b> · six on turn 6<br>35% hold · 14 one-stone cells</td>
</tr>
</table>

<details><summary>Holding replies for each</summary>

### B1

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2.svg" alt="B1" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_d0.svg" alt="B1 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_d1.svg" alt="B1 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_3x2_map.svg" alt="B1 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_3x2_d2.svg" alt="B1 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_0x5_3x2_d3.svg" alt="B1 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_0x5_3x2_d4.svg" alt="B1 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_0x5_3x2_d5.svg" alt="B1 holding reply 6" width="239">

</details>

### B2

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3.svg" alt="B2" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3_d0.svg" alt="B2 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3_d1.svg" alt="B2 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_2x3_map.svg" alt="B2 defence map" width="302"> <img src="shapes/s0x0_0x1_0x5_2x3_d2.svg" alt="B2 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_0x5_2x3_d3.svg" alt="B2 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_0x5_2x3_d4.svg" alt="B2 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_0x5_2x3_d5.svg" alt="B2 holding reply 6" width="229">

</details>

### B3

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4.svg" alt="B3" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4_d0.svg" alt="B3 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4_d1.svg" alt="B3 holding reply 2" width="208"><br>Holds</td></tr></table>

**Six on turn 5 · 18% of replies hold · one stone is enough on the 7 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x2_4xm4_map.svg" alt="B3 defence map" width="270"> <img src="shapes/s0x0_0x1_0x2_4xm4_d2.svg" alt="B3 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_0x2_4xm4_d3.svg" alt="B3 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_0x2_4xm4_d4.svg" alt="B3 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_0x2_4xm4_d5.svg" alt="B3 holding reply 6" width="208">

</details>

### B4

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3.svg" alt="B4" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3_d0.svg" alt="B4 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3_d1.svg" alt="B4 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 19% of replies hold · one stone is enough on the 7 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x2_4xm3_map.svg" alt="B4 defence map" width="239"> <img src="shapes/s0x0_0x1_0x2_4xm3_d2.svg" alt="B4 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_0x2_4xm3_d3.svg" alt="B4 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_0x2_4xm3_d4.svg" alt="B4 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_0x2_4xm3_d5.svg" alt="B4 holding reply 6" width="218">

</details>

### B5

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2.svg" alt="B5" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2_d0.svg" alt="B5 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2_d1.svg" alt="B5 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 19% of replies hold · one stone is enough on the 7 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x2_4xm2_map.svg" alt="B5 defence map" width="250"> <img src="shapes/s0x0_0x1_0x2_4xm2_d2.svg" alt="B5 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_0x2_4xm2_d3.svg" alt="B5 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_0x2_4xm2_d4.svg" alt="B5 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_0x2_4xm2_d5.svg" alt="B5 holding reply 6" width="229">

</details>

### B6

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3.svg" alt="B6" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3_d0.svg" alt="B6 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3_d1.svg" alt="B6 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 20% of replies hold · one stone is enough on the 8 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4xm3_map.svg" alt="B6 defence map" width="270"> <img src="shapes/s0x0_0x1_0x3_4xm3_d2.svg" alt="B6 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_0x3_4xm3_d3.svg" alt="B6 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_0x3_4xm3_d4.svg" alt="B6 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_0x3_4xm3_d5.svg" alt="B6 holding reply 6" width="218">

</details>

### B7

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4x1.svg" alt="B7" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x1_d0.svg" alt="B7 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x1_d1.svg" alt="B7 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 5 · 20% of replies hold · one stone is enough on the 8 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4x1_map.svg" alt="B7 defence map" width="280"> <img src="shapes/s0x0_0x1_0x3_4x1_d2.svg" alt="B7 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_0x3_4x1_d3.svg" alt="B7 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_0x3_4x1_d4.svg" alt="B7 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_0x3_4x1_d5.svg" alt="B7 holding reply 6" width="260">

</details>

### B8

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1.svg" alt="B8" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1_d0.svg" alt="B8 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1_d1.svg" alt="B8 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 5 · 21% of replies hold · one stone is enough on the 8 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4xm1_map.svg" alt="B8 defence map" width="291"> <img src="shapes/s0x0_0x1_0x3_4xm1_d2.svg" alt="B8 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_0x3_4xm1_d3.svg" alt="B8 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_0x3_4xm1_d4.svg" alt="B8 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_0x3_4xm1_d5.svg" alt="B8 holding reply 6" width="239">

</details>

### B9

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4x0.svg" alt="B9" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x0_d0.svg" alt="B9 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x0_d1.svg" alt="B9 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 5 · 21% of replies hold · one stone is enough on the 8 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4x0_map.svg" alt="B9 defence map" width="312"> <img src="shapes/s0x0_0x1_0x3_4x0_d2.svg" alt="B9 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_0x3_4x0_d3.svg" alt="B9 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_0x3_4x0_d4.svg" alt="B9 holding reply 5" width="250"> <img src="shapes/s0x0_0x1_0x3_4x0_d5.svg" alt="B9 holding reply 6" width="250">

</details>

### B10

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3.svg" alt="B10" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3_d0.svg" alt="B10 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3_d1.svg" alt="B10 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 9 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x3_map.svg" alt="B10 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_1x3_d2.svg" alt="B10 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d3.svg" alt="B10 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d4.svg" alt="B10 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d5.svg" alt="B10 holding reply 6" width="208">

</details>

### B11

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4.svg" alt="B11" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4_d0.svg" alt="B11 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4_d1.svg" alt="B11 holding reply 2" width="197"><br>Holds</td></tr></table>

**Six on turn 6 · 25% of replies hold · one stone is enough on the 9 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4xm4_map.svg" alt="B11 defence map" width="312"> <img src="shapes/s0x0_0x1_0x3_4xm4_d2.svg" alt="B11 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_0x3_4xm4_d3.svg" alt="B11 holding reply 4" width="197"> <img src="shapes/s0x0_0x1_0x3_4xm4_d4.svg" alt="B11 holding reply 5" width="197"> <img src="shapes/s0x0_0x1_0x3_4xm4_d5.svg" alt="B11 holding reply 6" width="197">

</details>

### B12

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4x3.svg" alt="B12" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x3_d0.svg" alt="B12 holding reply 1" width="280"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x3_d1.svg" alt="B12 holding reply 2" width="270"><br>Holds</td></tr></table>

**Six on turn 6 · 25% of replies hold · one stone is enough on the 9 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_4x3_map.svg" alt="B12 defence map" width="385"> <img src="shapes/s0x0_0x1_0x3_4x3_d2.svg" alt="B12 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_0x3_4x3_d3.svg" alt="B12 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_0x3_4x3_d4.svg" alt="B12 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_0x3_4x3_d5.svg" alt="B12 holding reply 6" width="260">

</details>

### B13

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4.svg" alt="B13" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4_d0.svg" alt="B13 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4_d1.svg" alt="B13 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x4_map.svg" alt="B13 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_1x4_d2.svg" alt="B13 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_0x5_1x4_d3.svg" alt="B13 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_0x5_1x4_d4.svg" alt="B13 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_0x5_1x4_d5.svg" alt="B13 holding reply 6" width="229">

</details>

### B14

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5.svg" alt="B14" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5_d0.svg" alt="B14 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5_d1.svg" alt="B14 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 35% of replies hold · one stone is enough on the 14 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x5_map.svg" alt="B14 defence map" width="280"> <img src="shapes/s0x0_0x1_0x5_1x5_d2.svg" alt="B14 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_0x5_1x5_d3.svg" alt="B14 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_0x5_1x5_d4.svg" alt="B14 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_0x5_1x5_d5.svg" alt="B14 holding reply 6" width="239">

</details>

</details>

## 4 stones: two pairs

40 shapes. No three of the stones share a window of six, so nothing looks like a line yet. These are the easiest to overlook.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3.svg" alt="B15" width="218"><br><b>B15</b> · six on turn 5<br>6.9% hold · 1 one-stone cell</td>
<td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3.svg" alt="B16" width="218"><br><b>B16</b> · six on turn 5<br>7.2% hold · 1 one-stone cell</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_1x4.svg" alt="B17" width="218"><br><b>B17</b> · six on turn 6<br>12% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3.svg" alt="B18" width="218"><br><b>B18</b> · six on turn 5<br>14% hold · 4 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x4.svg" alt="B19" width="250"><br><b>B19</b> · six on turn 6<br>14% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x3.svg" alt="B20" width="229"><br><b>B20</b> · six on turn 6<br>14% hold · 6 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5.svg" alt="B21" width="250"><br><b>B21</b> · six on turn 6<br>14% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_3x3.svg" alt="B22" width="239"><br><b>B22</b> · six on turn 6<br>15% hold · 5 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x8_1x3.svg" alt="B23" width="229"><br><b>B23</b> · six on turn 6<br>15% hold · 6 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_2x4.svg" alt="B24" width="229"><br><b>B24</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_1x2.svg" alt="B25" width="229"><br><b>B25</b> · six on turn 6<br>21% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4.svg" alt="B26" width="208"><br><b>B26</b> · six on turn 5<br>21% hold · 6 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_1x5.svg" alt="B27" width="218"><br><b>B27</b> · six on turn 6<br>22% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x3.svg" alt="B28" width="239"><br><b>B28</b> · six on turn 6<br>23% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x2.svg" alt="B29" width="229"><br><b>B29</b> · six on turn 6<br>24% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_1x4.svg" alt="B30" width="208"><br><b>B30</b> · six on turn 6<br>24% hold · 10 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6.svg" alt="B31" width="250"><br><b>B31</b> · six on turn 6<br>24% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5.svg" alt="B32" width="218"><br><b>B32</b> · six on turn 6<br>26% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4.svg" alt="B33" width="208"><br><b>B33</b> · six on turn 5<br>27% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1.svg" alt="B34" width="218"><br><b>B34</b> · six on turn 5<br>27% hold · 12 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4.svg" alt="B35" width="197"><br><b>B35</b> · six on turn 5<br>28% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4.svg" alt="B36" width="197"><br><b>B36</b> · six on turn 6<br>28% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_4x1.svg" alt="B37" width="239"><br><b>B37</b> · six on turn 6<br>28% hold · 12 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0.svg" alt="B38" width="229"><br><b>B38</b> · six on turn 5<br>29% hold · 12 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x8_3x1.svg" alt="B39" width="229"><br><b>B39</b> · six on turn 6<br>34% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7.svg" alt="B40" width="239"><br><b>B40</b> · six on turn 7<br>34% hold · 16 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4.svg" alt="B41" width="208"><br><b>B41</b> · six on turn 5<br>34% hold · 13 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6.svg" alt="B42" width="208"><br><b>B42</b> · six on turn 7<br>37% hold · 16 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4.svg" alt="B43" width="187"><br><b>B43</b> · six on turn 6<br>37% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5.svg" alt="B44" width="260"><br><b>B44</b> · six on turn 7<br>38% hold · 20 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1.svg" alt="B45" width="218"><br><b>B45</b> · six on turn 5<br>38% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7.svg" alt="B46" width="260"><br><b>B46</b> · six on turn 7<br>38% hold · 18 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3.svg" alt="B47" width="218"><br><b>B47</b> · six on turn 5<br>39% hold · 16 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6.svg" alt="B48" width="260"><br><b>B48</b> · six on turn 7<br>40% hold · 20 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4.svg" alt="B49" width="197"><br><b>B49</b> · six on turn 6<br>41% hold · 18 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4.svg" alt="B50" width="208"><br><b>B50</b> · six on turn 6<br>41% hold · 19 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4.svg" alt="B51" width="229"><br><b>B51</b> · six on turn 6<br>42% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3.svg" alt="B52" width="260"><br><b>B52</b> · six on turn 6<br>43% hold · 18 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4.svg" alt="B53" width="208"><br><b>B53</b> · six on turn 6<br>44% hold · 19 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4.svg" alt="B54" width="250"><br><b>B54</b> · six on turn 6<br>48% hold · 21 one-stone cells</td>
</tr>
</table>

<details><summary>Holding replies for each</summary>

### B15

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3.svg" alt="B15" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3_d0.svg" alt="B15 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3_d1.svg" alt="B15 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 6.9% of replies hold · one stone is enough on the 1 dotted cell in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm3_4xm3_map.svg" alt="B15 defence map" width="302"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d2.svg" alt="B15 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d3.svg" alt="B15 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d4.svg" alt="B15 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d5.svg" alt="B15 holding reply 6" width="229">

</details>

### B16

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3.svg" alt="B16" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3_d0.svg" alt="B16 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3_d1.svg" alt="B16 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 7.2% of replies hold · one stone is enough on the 1 dotted cell in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm3_4xm3_map.svg" alt="B16 defence map" width="302"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d2.svg" alt="B16 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d3.svg" alt="B16 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d4.svg" alt="B16 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d5.svg" alt="B16 holding reply 6" width="229">

</details>

### B17

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4.svg" alt="B17" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4_d0.svg" alt="B17 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4_d1.svg" alt="B17 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 12% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_1x4_map.svg" alt="B17 defence map" width="260"> <img src="shapes/s0x0_0x3_0x7_1x4_d2.svg" alt="B17 holding reply 3" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d3.svg" alt="B17 holding reply 4" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d4.svg" alt="B17 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d5.svg" alt="B17 holding reply 6" width="218">

</details>

### B18

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3.svg" alt="B18" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3_d0.svg" alt="B18 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3_d1.svg" alt="B18 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 14% of replies hold · one stone is enough on the 4 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm1_4xm3_map.svg" alt="B18 defence map" width="291"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d2.svg" alt="B18 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d3.svg" alt="B18 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d4.svg" alt="B18 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d5.svg" alt="B18 holding reply 6" width="197">

</details>

### B19

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4.svg" alt="B19" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4_d0.svg" alt="B19 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4_d1.svg" alt="B19 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_3x4_map.svg" alt="B19 defence map" width="312"> <img src="shapes/s0x0_0x3_0x7_3x4_d2.svg" alt="B19 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d3.svg" alt="B19 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d4.svg" alt="B19 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d5.svg" alt="B19 holding reply 6" width="250">

</details>

### B20

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3.svg" alt="B20" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3_d0.svg" alt="B20 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3_d1.svg" alt="B20 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_2x3_map.svg" alt="B20 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_2x3_d2.svg" alt="B20 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d3.svg" alt="B20 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d4.svg" alt="B20 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d5.svg" alt="B20 holding reply 6" width="229">

</details>

### B21

<table><tr><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5.svg" alt="B21" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5_d0.svg" alt="B21 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5_d1.svg" alt="B21 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_4xm2_7xm5_map.svg" alt="B21 defence map" width="302"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d2.svg" alt="B21 holding reply 3" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d3.svg" alt="B21 holding reply 4" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d4.svg" alt="B21 holding reply 5" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d5.svg" alt="B21 holding reply 6" width="239">

</details>

### B22

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3.svg" alt="B22" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3_d0.svg" alt="B22 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3_d1.svg" alt="B22 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 15% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_3x3_map.svg" alt="B22 defence map" width="302"> <img src="shapes/s0x0_0x2_0x6_3x3_d2.svg" alt="B22 holding reply 3" width="250"> <img src="shapes/s0x0_0x2_0x6_3x3_d3.svg" alt="B22 holding reply 4" width="250"> <img src="shapes/s0x0_0x2_0x6_3x3_d4.svg" alt="B22 holding reply 5" width="239"> <img src="shapes/s0x0_0x2_0x6_3x3_d5.svg" alt="B22 holding reply 6" width="239">

</details>

### B23

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3.svg" alt="B23" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3_d0.svg" alt="B23 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3_d1.svg" alt="B23 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 15% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_1x3_map.svg" alt="B23 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_1x3_d2.svg" alt="B23 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d3.svg" alt="B23 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d4.svg" alt="B23 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d5.svg" alt="B23 holding reply 6" width="229">

</details>

### B24

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4.svg" alt="B24" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4_d0.svg" alt="B24 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4_d1.svg" alt="B24 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_2x4_map.svg" alt="B24 defence map" width="302"> <img src="shapes/s0x0_0x2_0x6_2x4_d2.svg" alt="B24 holding reply 3" width="239"> <img src="shapes/s0x0_0x2_0x6_2x4_d3.svg" alt="B24 holding reply 4" width="239"> <img src="shapes/s0x0_0x2_0x6_2x4_d4.svg" alt="B24 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_0x6_2x4_d5.svg" alt="B24 holding reply 6" width="229">

</details>

### B25

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2.svg" alt="B25" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2_d0.svg" alt="B25 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2_d1.svg" alt="B25 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 21% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_1x2_map.svg" alt="B25 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_1x2_d2.svg" alt="B25 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d3.svg" alt="B25 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d4.svg" alt="B25 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d5.svg" alt="B25 holding reply 6" width="229">

</details>

### B26

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4.svg" alt="B26" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4_d0.svg" alt="B26 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4_d1.svg" alt="B26 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 21% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm4_4xm4_map.svg" alt="B26 defence map" width="291"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d2.svg" alt="B26 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d3.svg" alt="B26 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d4.svg" alt="B26 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d5.svg" alt="B26 holding reply 6" width="208">

</details>

### B27

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5.svg" alt="B27" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5_d0.svg" alt="B27 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5_d1.svg" alt="B27 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 22% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_1x5_map.svg" alt="B27 defence map" width="291"> <img src="shapes/s0x0_0x3_0x7_1x5_d2.svg" alt="B27 holding reply 3" width="218"> <img src="shapes/s0x0_0x3_0x7_1x5_d3.svg" alt="B27 holding reply 4" width="218"> <img src="shapes/s0x0_0x3_0x7_1x5_d4.svg" alt="B27 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_0x7_1x5_d5.svg" alt="B27 holding reply 6" width="218">

</details>

### B28

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3.svg" alt="B28" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3_d0.svg" alt="B28 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3_d1.svg" alt="B28 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 23% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_3x3_map.svg" alt="B28 defence map" width="302"> <img src="shapes/s0x0_0x3_0x7_3x3_d2.svg" alt="B28 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d3.svg" alt="B28 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d4.svg" alt="B28 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d5.svg" alt="B28 holding reply 6" width="250">

</details>

### B29

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2.svg" alt="B29" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2_d0.svg" alt="B29 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2_d1.svg" alt="B29 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_2x2_map.svg" alt="B29 defence map" width="302"> <img src="shapes/s0x0_0x4_0x8_2x2_d2.svg" alt="B29 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d3.svg" alt="B29 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d4.svg" alt="B29 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d5.svg" alt="B29 holding reply 6" width="229">

</details>

### B30

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4.svg" alt="B30" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4_d0.svg" alt="B30 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4_d1.svg" alt="B30 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_1x4_map.svg" alt="B30 defence map" width="291"> <img src="shapes/s0x0_0x2_0x6_1x4_d2.svg" alt="B30 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_0x6_1x4_d3.svg" alt="B30 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_0x6_1x4_d4.svg" alt="B30 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_0x6_1x4_d5.svg" alt="B30 holding reply 6" width="218">

</details>

### B31

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6.svg" alt="B31" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6_d0.svg" alt="B31 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6_d1.svg" alt="B31 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_7xm6_map.svg" alt="B31 defence map" width="302"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d2.svg" alt="B31 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d3.svg" alt="B31 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d4.svg" alt="B31 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d5.svg" alt="B31 holding reply 6" width="260">

</details>

### B32

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5.svg" alt="B32" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5_d0.svg" alt="B32 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5_d1.svg" alt="B32 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 26% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_6xm5_map.svg" alt="B32 defence map" width="302"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d2.svg" alt="B32 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d3.svg" alt="B32 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d4.svg" alt="B32 holding reply 5" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d5.svg" alt="B32 holding reply 6" width="250">

</details>

### B33

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4.svg" alt="B33" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4_d0.svg" alt="B33 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4_d1.svg" alt="B33 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 27% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm3_4xm4_map.svg" alt="B33 defence map" width="270"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d2.svg" alt="B33 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d3.svg" alt="B33 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d4.svg" alt="B33 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d5.svg" alt="B33 holding reply 6" width="218">

</details>

### B34

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1.svg" alt="B34" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1_d0.svg" alt="B34 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1_d1.svg" alt="B34 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 5 · 27% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm3_3x1_map.svg" alt="B34 defence map" width="302"> <img src="shapes/s0x0_0x3_3xm3_3x1_d2.svg" alt="B34 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d3.svg" alt="B34 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d4.svg" alt="B34 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d5.svg" alt="B34 holding reply 6" width="250">

</details>

### B35

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4.svg" alt="B35" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4_d0.svg" alt="B35 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4_d1.svg" alt="B35 holding reply 2" width="208"><br>Holds</td></tr></table>

**Six on turn 5 · 28% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm2_4xm4_map.svg" alt="B35 defence map" width="280"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d2.svg" alt="B35 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d3.svg" alt="B35 holding reply 4" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d4.svg" alt="B35 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d5.svg" alt="B35 holding reply 6" width="197">

</details>

### B36

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4.svg" alt="B36" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4_d0.svg" alt="B36 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4_d1.svg" alt="B36 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm3_4xm4_map.svg" alt="B36 defence map" width="291"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d2.svg" alt="B36 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d3.svg" alt="B36 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d4.svg" alt="B36 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d5.svg" alt="B36 holding reply 6" width="218">

</details>

### B37

<table><tr><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1.svg" alt="B37" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1_d0.svg" alt="B37 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1_d1.svg" alt="B37 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_1x1_4x1_map.svg" alt="B37 defence map" width="302"> <img src="shapes/s0x0_0x4_1x1_4x1_d2.svg" alt="B37 holding reply 3" width="250"> <img src="shapes/s0x0_0x4_1x1_4x1_d3.svg" alt="B37 holding reply 4" width="250"> <img src="shapes/s0x0_0x4_1x1_4x1_d4.svg" alt="B37 holding reply 5" width="250"> <img src="shapes/s0x0_0x4_1x1_4x1_d5.svg" alt="B37 holding reply 6" width="250">

</details>

### B38

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0.svg" alt="B38" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0_d0.svg" alt="B38 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0_d1.svg" alt="B38 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 5 · 29% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm1_4x0_map.svg" alt="B38 defence map" width="280"> <img src="shapes/s0x0_0x3_3xm1_4x0_d2.svg" alt="B38 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d3.svg" alt="B38 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d4.svg" alt="B38 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d5.svg" alt="B38 holding reply 6" width="229">

</details>

### B39

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1.svg" alt="B39" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1_d0.svg" alt="B39 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1_d1.svg" alt="B39 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 34% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_3x1_map.svg" alt="B39 defence map" width="312"> <img src="shapes/s0x0_0x4_0x8_3x1_d2.svg" alt="B39 holding reply 3" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d3.svg" alt="B39 holding reply 4" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d4.svg" alt="B39 holding reply 5" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d5.svg" alt="B39 holding reply 6" width="239">

</details>

### B40

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7.svg" alt="B40" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7_d0.svg" alt="B40 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7_d1.svg" alt="B40 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 7 · 34% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_7xm7_map.svg" alt="B40 defence map" width="270"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d2.svg" alt="B40 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d3.svg" alt="B40 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d4.svg" alt="B40 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d5.svg" alt="B40 holding reply 6" width="260">

</details>

### B41

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4.svg" alt="B41" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4_d0.svg" alt="B41 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4_d1.svg" alt="B41 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 34% of replies hold · one stone is enough on the 13 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm4_4xm4_map.svg" alt="B41 defence map" width="270"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d2.svg" alt="B41 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d3.svg" alt="B41 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d4.svg" alt="B41 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d5.svg" alt="B41 holding reply 6" width="218">

</details>

### B42

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6.svg" alt="B42" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6_d0.svg" alt="B42 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6_d1.svg" alt="B42 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 7 · 37% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_6xm6_map.svg" alt="B42 defence map" width="270"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d2.svg" alt="B42 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d3.svg" alt="B42 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d4.svg" alt="B42 holding reply 5" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d5.svg" alt="B42 holding reply 6" width="250">

</details>

### B43

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4.svg" alt="B43" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4_d0.svg" alt="B43 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4_d1.svg" alt="B43 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 37% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm2_4xm4_map.svg" alt="B43 defence map" width="291"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d2.svg" alt="B43 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d3.svg" alt="B43 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d4.svg" alt="B43 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d5.svg" alt="B43 holding reply 6" width="229">

</details>

### B44

<table><tr><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5.svg" alt="B44" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5_d0.svg" alt="B44 holding reply 1" width="302"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5_d1.svg" alt="B44 holding reply 2" width="302"><br>Holds</td></tr></table>

**Six on turn 7 · 38% of replies hold · one stone is enough on the 20 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_4xm1_8xm5_map.svg" alt="B44 defence map" width="332"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d2.svg" alt="B44 holding reply 3" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d3.svg" alt="B44 holding reply 4" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d4.svg" alt="B44 holding reply 5" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d5.svg" alt="B44 holding reply 6" width="302">

</details>

### B45

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1.svg" alt="B45" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1_d0.svg" alt="B45 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1_d1.svg" alt="B45 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 5 · 38% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm2_4xm1_map.svg" alt="B45 defence map" width="312"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d2.svg" alt="B45 holding reply 3" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d3.svg" alt="B45 holding reply 4" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d4.svg" alt="B45 holding reply 5" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d5.svg" alt="B45 holding reply 6" width="260">

</details>

### B46

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7.svg" alt="B46" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7_d0.svg" alt="B46 holding reply 1" width="280"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7_d1.svg" alt="B46 holding reply 2" width="280"><br>Holds</td></tr></table>

**Six on turn 7 · 38% of replies hold · one stone is enough on the 18 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_8xm7_map.svg" alt="B46 defence map" width="322"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d2.svg" alt="B46 holding reply 3" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d3.svg" alt="B46 holding reply 4" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d4.svg" alt="B46 holding reply 5" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d5.svg" alt="B46 holding reply 6" width="280">

</details>

### B47

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3.svg" alt="B47" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3_d0.svg" alt="B47 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3_d1.svg" alt="B47 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 39% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm4_4xm3_map.svg" alt="B47 defence map" width="280"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d2.svg" alt="B47 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d3.svg" alt="B47 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d4.svg" alt="B47 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d5.svg" alt="B47 holding reply 6" width="229">

</details>

### B48

<table><tr><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6.svg" alt="B48" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6_d0.svg" alt="B48 holding reply 1" width="302"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6_d1.svg" alt="B48 holding reply 2" width="302"><br>Holds</td></tr></table>

**Six on turn 7 · 40% of replies hold · one stone is enough on the 20 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_4xm2_8xm6_map.svg" alt="B48 defence map" width="332"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d2.svg" alt="B48 holding reply 3" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d3.svg" alt="B48 holding reply 4" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d4.svg" alt="B48 holding reply 5" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d5.svg" alt="B48 holding reply 6" width="302">

</details>

### B49

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4.svg" alt="B49" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4_d0.svg" alt="B49 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4_d1.svg" alt="B49 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 41% of replies hold · one stone is enough on the 18 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm4_4xm4_map.svg" alt="B49 defence map" width="312"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d2.svg" alt="B49 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d3.svg" alt="B49 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d4.svg" alt="B49 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d5.svg" alt="B49 holding reply 6" width="218">

</details>

### B50

<table><tr><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4.svg" alt="B50" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4_d0.svg" alt="B50 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4_d1.svg" alt="B50 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 41% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_1xm4_4xm4_map.svg" alt="B50 defence map" width="322"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d2.svg" alt="B50 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d3.svg" alt="B50 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d4.svg" alt="B50 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d5.svg" alt="B50 holding reply 6" width="218">

</details>

### B51

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4.svg" alt="B51" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4_d0.svg" alt="B51 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4_d1.svg" alt="B51 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 42% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_5xm4_map.svg" alt="B51 defence map" width="332"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d2.svg" alt="B51 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d3.svg" alt="B51 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d4.svg" alt="B51 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d5.svg" alt="B51 holding reply 6" width="239">

</details>

### B52

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3.svg" alt="B52" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3_d0.svg" alt="B52 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3_d1.svg" alt="B52 holding reply 2" width="270"><br>Holds</td></tr></table>

**Six on turn 6 · 43% of replies hold · one stone is enough on the 18 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_6xm3_map.svg" alt="B52 defence map" width="343"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d2.svg" alt="B52 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d3.svg" alt="B52 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d4.svg" alt="B52 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d5.svg" alt="B52 holding reply 6" width="260">

</details>

### B53

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4.svg" alt="B53" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4_d0.svg" alt="B53 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4_d1.svg" alt="B53 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 44% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm4_4xm4_map.svg" alt="B53 defence map" width="312"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d2.svg" alt="B53 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d3.svg" alt="B53 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d4.svg" alt="B53 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d5.svg" alt="B53 holding reply 6" width="218">

</details>

### B54

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4.svg" alt="B54" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4_d0.svg" alt="B54 holding reply 1" width="270"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4_d1.svg" alt="B54 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 6 · 48% of replies hold · one stone is enough on the 21 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_6xm4_map.svg" alt="B54 defence map" width="332"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d2.svg" alt="B54 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d3.svg" alt="B54 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d4.svg" alt="B54 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d5.svg" alt="B54 holding reply 6" width="260">

</details>

</details>

## 5 stones

The 196 minimal ones, quickest wins first. Their replies weren't checked (that would take many hours), so there are no defences.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm4_5xm3.svg" alt="C1" width="156"><br><b>C1</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm3_6xm4.svg" alt="C2" width="166"><br><b>C2</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm1_4xm4.svg" alt="C3" width="135"><br><b>C3</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_4xm2.svg" alt="C4" width="124"><br><b>C4</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_4x0.svg" alt="C5" width="146"><br><b>C5</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4xm2.svg" alt="C6" width="135"><br><b>C6</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4x0.svg" alt="C7" width="146"><br><b>C7</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4x2.svg" alt="C8" width="166"><br><b>C8</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm2_6xm3.svg" alt="C9" width="166"><br><b>C9</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm1_4x2.svg" alt="C10" width="177"><br><b>C10</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_4xm1.svg" alt="C11" width="135"><br><b>C11</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_4x0.svg" alt="C12" width="146"><br><b>C12</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4xm1.svg" alt="C13" width="146"><br><b>C13</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4x0.svg" alt="C14" width="146"><br><b>C14</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4x3.svg" alt="C15" width="177"><br><b>C15</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4x4.svg" alt="C16" width="187"><br><b>C16</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_4x1.svg" alt="C17" width="156"><br><b>C17</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_2x4_4x3.svg" alt="C18" width="177"><br><b>C18</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_1x4_4x4.svg" alt="C19" width="187"><br><b>C19</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_3x3_4x4.svg" alt="C20" width="187"><br><b>C20</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_1xm2_3xm1_5xm2.svg" alt="C21" width="146"><br><b>C21</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm5_3xm1_4xm4.svg" alt="C22" width="114"><br><b>C22</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_5x0_8x0.svg" alt="C23" width="229"><br><b>C23</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_3x2_4x0.svg" alt="C24" width="146"><br><b>C24</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_2x5.svg" alt="C25" width="156"><br><b>C25</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_2x6.svg" alt="C26" width="166"><br><b>C26</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_1x7.svg" alt="C27" width="156"><br><b>C27</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_3x6.svg" alt="C28" width="187"><br><b>C28</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_4x2.svg" alt="C29" width="166"><br><b>C29</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_2x6.svg" alt="C30" width="166"><br><b>C30</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_2x7.svg" alt="C31" width="177"><br><b>C31</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_1x8.svg" alt="C32" width="166"><br><b>C32</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_3x7.svg" alt="C33" width="197"><br><b>C33</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_2x7.svg" alt="C34" width="177"><br><b>C34</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_2x8.svg" alt="C35" width="187"><br><b>C35</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x4_1x5_4x5.svg" alt="C36" width="197"><br><b>C36</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3xm5_4xm4.svg" alt="C37" width="124"><br><b>C37</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm4_7xm4.svg" alt="C38" width="208"><br><b>C38</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm3_7xm3.svg" alt="C39" width="208"><br><b>C39</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm3_8xm3.svg" alt="C40" width="229"><br><b>C40</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x4_5x1.svg" alt="C41" width="177"><br><b>C41</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x4_5x4.svg" alt="C42" width="208"><br><b>C42</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_4x0.svg" alt="C43" width="156"><br><b>C43</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_4x5.svg" alt="C44" width="197"><br><b>C44</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3xm5_4xm4.svg" alt="C45" width="135"><br><b>C45</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3x3_4x1.svg" alt="C46" width="156"><br><b>C46</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4xm3_7xm3.svg" alt="C47" width="208"><br><b>C47</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4x1_7xm2.svg" alt="C48" width="197"><br><b>C48</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4x1_8xm3.svg" alt="C49" width="197"><br><b>C49</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x6_3x3_4x1.svg" alt="C50" width="156"><br><b>C50</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_2xm6_3xm5_4xm4.svg" alt="C51" width="124"><br><b>C51</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm5_4xm4_7xm9.svg" alt="C52" width="135"><br><b>C52</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm3_7xm9.svg" alt="C53" width="135"><br><b>C53</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm2_8xm6.svg" alt="C54" width="177"><br><b>C54</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm2_8xm2.svg" alt="C55" width="229"><br><b>C55</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_7xm1.svg" alt="C56" width="218"><br><b>C56</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm2_8xm6.svg" alt="C57" width="177"><br><b>C57</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm2_8xm2.svg" alt="C58" width="229"><br><b>C58</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm1_8xm5.svg" alt="C59" width="177"><br><b>C59</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm1_8xm1.svg" alt="C60" width="229"><br><b>C60</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm5_8xm8.svg" alt="C61" width="146"><br><b>C61</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm2_8xm2.svg" alt="C62" width="229"><br><b>C62</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x6_1x7.svg" alt="C63" width="156"><br><b>C63</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x6_3x6.svg" alt="C64" width="187"><br><b>C64</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x6_4x6.svg" alt="C65" width="208"><br><b>C65</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_2x6.svg" alt="C66" width="166"><br><b>C66</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_2x7.svg" alt="C67" width="177"><br><b>C67</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_1x8.svg" alt="C68" width="166"><br><b>C68</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_3x7.svg" alt="C69" width="197"><br><b>C69</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4x3.svg" alt="C70" width="177"><br><b>C70</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4x4.svg" alt="C71" width="187"><br><b>C71</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_2x7.svg" alt="C72" width="177"><br><b>C72</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_2x8.svg" alt="C73" width="187"><br><b>C73</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_3xm5_4xm4.svg" alt="C74" width="124"><br><b>C74</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm2_7xm2.svg" alt="C75" width="208"><br><b>C75</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm2_8xm2.svg" alt="C76" width="229"><br><b>C76</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_3xm5_4xm4.svg" alt="C77" width="135"><br><b>C77</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm2_7xm2.svg" alt="C78" width="208"><br><b>C78</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm2_8xm2.svg" alt="C79" width="229"><br><b>C79</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4x0_7xm3.svg" alt="C80" width="177"><br><b>C80</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4x1_7x1.svg" alt="C81" width="218"><br><b>C81</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_3x4_4x2.svg" alt="C82" width="166"><br><b>C82</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x0_7xm3.svg" alt="C83" width="177"><br><b>C83</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_5x2.svg" alt="C84" width="187"><br><b>C84</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_6x0.svg" alt="C85" width="187"><br><b>C85</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_6x2.svg" alt="C86" width="208"><br><b>C86</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_7xm1.svg" alt="C87" width="197"><br><b>C87</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_7x2.svg" alt="C88" width="229"><br><b>C88</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_8xm2.svg" alt="C89" width="208"><br><b>C89</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x7_3x4_4x2.svg" alt="C90" width="166"><br><b>C90</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm2_7xm8.svg" alt="C91" width="135"><br><b>C91</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_7xm1.svg" alt="C92" width="208"><br><b>C92</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm5_8xm8.svg" alt="C93" width="146"><br><b>C93</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4x0_7xm6.svg" alt="C94" width="156"><br><b>C94</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_4xm1_8xm5.svg" alt="C95" width="177"><br><b>C95</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_4xm1_8xm1.svg" alt="C96" width="229"><br><b>C96</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm1_8xm1.svg" alt="C97" width="229"><br><b>C97</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_1xm2.svg" alt="C98" width="146"><br><b>C98</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_3xm3.svg" alt="C99" width="146"><br><b>C99</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_4xm4.svg" alt="C100" width="146"><br><b>C100</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_2x7.svg" alt="C101" width="177"><br><b>C101</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_4xm1.svg" alt="C102" width="146"><br><b>C102</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_4x0.svg" alt="C103" width="146"><br><b>C103</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x6_4x0_7xm3.svg" alt="C104" width="177"><br><b>C104</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x5_4x3.svg" alt="C105" width="177"><br><b>C105</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x0_7xm3.svg" alt="C106" width="177"><br><b>C106</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_5x3.svg" alt="C107" width="197"><br><b>C107</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_6x3.svg" alt="C108" width="218"><br><b>C108</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_7x0.svg" alt="C109" width="208"><br><b>C109</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_7x3.svg" alt="C110" width="239"><br><b>C110</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_8xm1.svg" alt="C111" width="218"><br><b>C111</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_3x5_4x3.svg" alt="C112" width="177"><br><b>C112</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x1_4x0.svg" alt="C113" width="146"><br><b>C113</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_6x1.svg" alt="C114" width="197"><br><b>C114</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x4_4x0_8xm4_8x0.svg" alt="C115" width="229"><br><b>C115</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x5_1x1_4x1_5x1.svg" alt="C116" width="177"><br><b>C116</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm7_1xm4_1x1_4xm4.svg" alt="C117" width="156"><br><b>C117</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm7_1xm3_1x1_4xm4.svg" alt="C118" width="156"><br><b>C118</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_5xm5.svg" alt="C119" width="124"><br><b>C119</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_6xm6.svg" alt="C120" width="135"><br><b>C120</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_7xm7.svg" alt="C121" width="146"><br><b>C121</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_8xm8.svg" alt="C122" width="156"><br><b>C122</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_1x7.svg" alt="C123" width="156"><br><b>C123</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_3x6.svg" alt="C124" width="187"><br><b>C124</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_4x6.svg" alt="C125" width="208"><br><b>C125</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_1x8.svg" alt="C126" width="166"><br><b>C126</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_3x7.svg" alt="C127" width="197"><br><b>C127</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_1x9.svg" alt="C128" width="177"><br><b>C128</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_3x8.svg" alt="C129" width="208"><br><b>C129</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3x4_4x4.svg" alt="C130" width="187"><br><b>C130</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3x4_5x4.svg" alt="C131" width="208"><br><b>C131</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x8_1x9.svg" alt="C132" width="177"><br><b>C132</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x8_3x8.svg" alt="C133" width="208"><br><b>C133</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_1x7.svg" alt="C134" width="156"><br><b>C134</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_1x9.svg" alt="C135" width="177"><br><b>C135</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_2x8.svg" alt="C136" width="187"><br><b>C136</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_2x9.svg" alt="C137" width="197"><br><b>C137</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_5x5.svg" alt="C138" width="218"><br><b>C138</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm4_8xm10.svg" alt="C139" width="146"><br><b>C139</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm3_8xm10.svg" alt="C140" width="146"><br><b>C140</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm4_8xm9.svg" alt="C141" width="156"><br><b>C141</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm3_8xm9.svg" alt="C142" width="156"><br><b>C142</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_8xm5.svg" alt="C143" width="177"><br><b>C143</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_8xm1.svg" alt="C144" width="239"><br><b>C144</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm6_8xm9.svg" alt="C145" width="156"><br><b>C145</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_1x8.svg" alt="C146" width="166"><br><b>C146</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_3x7.svg" alt="C147" width="197"><br><b>C147</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_4x7.svg" alt="C148" width="218"><br><b>C148</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_4xm4.svg" alt="C149" width="124"><br><b>C149</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4xm4.svg" alt="C150" width="135"><br><b>C150</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_1x9.svg" alt="C151" width="177"><br><b>C151</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_3x8.svg" alt="C152" width="208"><br><b>C152</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm4_6xm6.svg" alt="C153" width="146"><br><b>C153</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm4_7xm7.svg" alt="C154" width="156"><br><b>C154</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x8_1x9.svg" alt="C155" width="177"><br><b>C155</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x8_3x8.svg" alt="C156" width="208"><br><b>C156</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x9_2x8.svg" alt="C157" width="187"><br><b>C157</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x9_2x9.svg" alt="C158" width="197"><br><b>C158</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm4_6xm6.svg" alt="C159" width="124"><br><b>C159</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm4_7xm7.svg" alt="C160" width="156"><br><b>C160</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm4_8xm9.svg" alt="C161" width="146"><br><b>C161</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm2_8xm9.svg" alt="C162" width="146"><br><b>C162</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm3_8xm7.svg" alt="C163" width="166"><br><b>C163</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_8xm5.svg" alt="C164" width="177"><br><b>C164</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_8xm1.svg" alt="C165" width="229"><br><b>C165</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm6_8xm9.svg" alt="C166" width="146"><br><b>C166</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm5_9xm9.svg" alt="C167" width="166"><br><b>C167</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_6xm6_9xm9.svg" alt="C168" width="166"><br><b>C168</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4xm2_8xm7.svg" alt="C169" width="166"><br><b>C169</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4x0_8xm7.svg" alt="C170" width="166"><br><b>C170</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm4_8xm7.svg" alt="C171" width="166"><br><b>C171</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_1xm2.svg" alt="C172" width="156"><br><b>C172</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_1x9.svg" alt="C173" width="177"><br><b>C173</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_3xm3.svg" alt="C174" width="156"><br><b>C174</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_3x8.svg" alt="C175" width="208"><br><b>C175</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4xm4.svg" alt="C176" width="156"><br><b>C176</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_4x8.svg" alt="C177" width="229"><br><b>C177</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_1xm2.svg" alt="C178" width="156"><br><b>C178</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_3xm3.svg" alt="C179" width="156"><br><b>C179</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x9_2x8.svg" alt="C180" width="187"><br><b>C180</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_1xm5_1xm2_3x3.svg" alt="C181" width="187"><br><b>C181</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm4_4xm3_8xm7.svg" alt="C182" width="156"><br><b>C182</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm4_4xm2_8xm6.svg" alt="C183" width="166"><br><b>C183</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4xm1_8xm7.svg" alt="C184" width="156"><br><b>C184</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4x0_7xm6.svg" alt="C185" width="146"><br><b>C185</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4x0_8xm7.svg" alt="C186" width="156"><br><b>C186</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm2_4xm1_8xm6.svg" alt="C187" width="166"><br><b>C187</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm2_4x0_8xm6.svg" alt="C188" width="166"><br><b>C188</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_5xm3_8xm6.svg" alt="C189" width="166"><br><b>C189</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x4_0x5_0x9_2xm1.svg" alt="C190" width="156"><br><b>C190</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_7x1.svg" alt="C191" width="218"><br><b>C191</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_8x1.svg" alt="C192" width="239"><br><b>C192</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_4x6.svg" alt="C193" width="208"><br><b>C193</b> · six on turn 8</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm4_8xm8.svg" alt="C194" width="177"><br><b>C194</b> · six on turn 8</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_4x7.svg" alt="C195" width="218"><br><b>C195</b> · six on turn 8</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_4xm4.svg" alt="C196" width="146"><br><b>C196</b> · six on turn 8</td>
</tr>
</table>

