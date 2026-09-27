# Shapes that win: catalogue

Every must-answer shape of up to 4 stones except the fours (on the [main page](shapes.md#fours)), with its best holding replies. The rules and the cheat sheet are on the [main page](shapes.md).

**On this page:** [Summary](#summary) · [Unstoppable shapes](#unstoppable-shapes) · [Not proven](#not-proven) · [3-stone must-answer shapes](#3-stone-must-answer-shapes) · [4 stones: a three plus one](#4-stones-a-three-plus-one) · [4 stones: spread out](#4-stones-spread-out) · [4 stones containing a must-answer three](#4-stones-containing-a-must-answer-three) · [5 stones](#5-stones)

<img src="shapes/legend.svg" alt="Diagram key" width="520">

The threes are in the same order as the cheat sheet; the 4-stone must-answer shapes are sorted hardest first, by the share of replies (pairs of empty cells within 3 cells of the shape) that hold. In names like "Chevron 1+2", the numbers are the distances from the corner stone to the other two.

## Summary

| Stones | Shapes | Must-answer | Minimal must-answer | Unstoppable (opponent moves first) |
|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 |
| 2 | 5 | 0 | 0 | 0 |
| 3 | 41 | 18 | 18 | 1 |
| 4 | 779 | 539 | 51 | 55 |
| 5 | 18,237 | 15,588 | 144 | not checked |

The minimal 4-stone count includes 1 four, shown on the [main page](shapes.md#fours); the other 50 are below.

A **shape** is some of one player's stones with nothing else nearby; rotations, mirror images and shifts count as the same shape, and stones count as one shape when they're within 2 cells or on one line within 4. **Must-answer:** its owner, to move, has a forced win (a four every turn that takes both stones). **Minimal:** it contains no smaller must-answer shape. **Unstoppable:** its owner wins even when the opponent moves first, whatever two stones the opponent places within 5 cells, in open space. **Replies tried:** every pair of empty cells within 3 cells of the shape (within 5 for the unstoppable shapes). **Six on turn N:** its owner makes a four on each of the first N − 1 turns.

## Unstoppable shapes

All 56, smallest and most compact first. Each wins even with the opponent to move, in open space; the tag says how.

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2.svg" alt="U1" width="229"><br><b>U1</b> · Three in a row<br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x0.svg" alt="U2" width="83"><br><b>U2</b> · Diamond (two triangles)<br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_1x0.svg" alt="U3" width="83"><br><b>U3</b><br><sub>forced win · contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x1.svg" alt="U4" width="94"><br><b>U4</b><br><sub>forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm2_1xm1_2xm1.svg" alt="U5" width="94"><br><b>U5</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_0x3.svg" alt="U6" width="94"><br><b>U6</b><br><sub>non-forced win · contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_1xm1.svg" alt="U7" width="83"><br><b>U7</b><br><sub>non-forced win · contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_2x0.svg" alt="U8" width="104"><br><b>U8</b><br><sub>forced win · contains U1</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_1xm1.svg" alt="U9" width="73"><br><b>U9</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x0.svg" alt="U10" width="83"><br><b>U10</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_2x0.svg" alt="U11" width="104"><br><b>U11</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_2x0.svg" alt="U12" width="104"><br><b>U12</b><br><sub>forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_1x0.svg" alt="U13" width="94"><br><b>U13</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2xm1.svg" alt="U14" width="94"><br><b>U14</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x2.svg" alt="U15" width="104"><br><b>U15</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x1.svg" alt="U16" width="94"><br><b>U16</b><br><sub>non-forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_2x1.svg" alt="U17" width="114"><br><b>U17</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2x0.svg" alt="U18" width="104"><br><b>U18</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm1_2xm1.svg" alt="U19" width="104"><br><b>U19</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1xm1.svg" alt="U20" width="94"><br><b>U20</b><br><sub>non-forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_2x1.svg" alt="U21" width="114"><br><b>U21</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1xm1.svg" alt="U22" width="83"><br><b>U22</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1x0.svg" alt="U23" width="94"><br><b>U23</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_2xm3.svg" alt="U24" width="73"><br><b>U24</b><br><sub>non-forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_3x0.svg" alt="U25" width="124"><br><b>U25</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm2.svg" alt="U26" width="104"><br><b>U26</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_3x0.svg" alt="U27" width="124"><br><b>U27</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_1x0.svg" alt="U28" width="83"><br><b>U28</b><br><sub>non-forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1x0_2xm2.svg" alt="U29" width="83"><br><b>U29</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2xm2.svg" alt="U30" width="83"><br><b>U30</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_2x1.svg" alt="U31" width="114"><br><b>U31</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x0.svg" alt="U32" width="104"><br><b>U32</b><br><sub>forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_3x0.svg" alt="U33" width="124"><br><b>U33</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2x0.svg" alt="U34" width="104"><br><b>U34</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3x0.svg" alt="U35" width="124"><br><b>U35</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_3x1.svg" alt="U36" width="135"><br><b>U36</b><br><sub>forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_3x0.svg" alt="U37" width="124"><br><b>U37</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm1_3xm1.svg" alt="U38" width="124"><br><b>U38</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_1x0.svg" alt="U39" width="94"><br><b>U39</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm3.svg" alt="U40" width="94"><br><b>U40</b><br><sub>forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_3x0.svg" alt="U41" width="124"><br><b>U41</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm3_2x0.svg" alt="U42" width="104"><br><b>U42</b><br><sub>forced win</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm3_1x0.svg" alt="U43" width="104"><br><b>U43</b><br><sub>non-forced win</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm3_2x0.svg" alt="U44" width="104"><br><b>U44</b><br><sub>non-forced win</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_2xm1.svg" alt="U45" width="94"><br><b>U45</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_0x4.svg" alt="U46" width="104"><br><b>U46</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_1xm2.svg" alt="U47" width="83"><br><b>U47</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_2xm2.svg" alt="U48" width="83"><br><b>U48</b><br><sub>contains U1</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm1.svg" alt="U49" width="114"><br><b>U49</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm2.svg" alt="U50" width="104"><br><b>U50</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_0x5.svg" alt="U51" width="114"><br><b>U51</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm3.svg" alt="U52" width="94"><br><b>U52</b><br><sub>contains U1</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2.svg" alt="U53" width="124"><br><b>U53</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3.svg" alt="U54" width="114"><br><b>U54</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_0x6.svg" alt="U55" width="124"><br><b>U55</b><br><sub>contains U1</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4.svg" alt="U56" width="104"><br><b>U56</b><br><sub>contains U1</sub></td></tr>
</table>

## Not proven

Every shape of 2 to 4 stones that no proof settled with the defender moving first. Under each: Six's estimate of the owner's chance, and why there's no proof: too many defences survived to check them all; the proof ran out of time.

### 2 stones

<details><summary>Not proven, by Six's estimate of the owner's chance</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_open.svg" alt="shape" width="73"><br><sub>owner 46%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_open.svg" alt="shape" width="83"><br><sub>owner 31%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm2_open.svg" alt="shape" width="62"><br><sub>owner 30%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_open.svg" alt="shape" width="94"><br><sub>owner 24%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_open.svg" alt="shape" width="104"><br><sub>owner 17%<br>too many defences</sub></td></tr>
</table>

</details>

### 3 stones

<details><summary>Not proven, by Six's estimate of the owner's chance</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1x0_open.svg" alt="shape" width="83"><br><sub>owner 67%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_open.svg" alt="shape" width="73"><br><sub>owner 66%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_open.svg" alt="shape" width="114"><br><sub>owner 66%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_open.svg" alt="shape" width="94"><br><sub>owner 66%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_open.svg" alt="shape" width="104"><br><sub>owner 65%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_open.svg" alt="shape" width="94"><br><sub>owner 64%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 64%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 63%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_open.svg" alt="shape" width="83"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 62%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 62%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 62%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_open.svg" alt="shape" width="114"><br><sub>owner 61%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_open.svg" alt="shape" width="73"><br><sub>owner 61%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_open.svg" alt="shape" width="83"><br><sub>owner 61%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 61%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 60%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x4_open.svg" alt="shape" width="104"><br><sub>owner 60%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 60%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_open.svg" alt="shape" width="104"><br><sub>owner 59%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 59%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 59%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_open.svg" alt="shape" width="94"><br><sub>owner 58%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1xm2_open.svg" alt="shape" width="104"><br><sub>owner 58%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 57%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_open.svg" alt="shape" width="83"><br><sub>owner 56%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2x0_open.svg" alt="shape" width="104"><br><sub>owner 56%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3x0_open.svg" alt="shape" width="124"><br><sub>owner 55%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 52%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 50%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 38%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_open.svg" alt="shape" width="124"><br><sub>owner 25%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_open.svg" alt="shape" width="124"><br><sub>owner 23%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_open.svg" alt="shape" width="135"><br><sub>owner 21%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_open.svg" alt="shape" width="146"><br><sub>owner 18%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 7%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 7%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 6%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm4_open.svg" alt="shape" width="62"><br><sub>owner 6%<br>out of time</sub></td></tr>
</table>

</details>

### 4 stones

<details><summary>Not proven, by Six's estimate of the owner's chance</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm3_1xm1_open.svg" alt="shape" width="94"><br><sub>owner 96%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 95%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 95%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 95%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm2_3xm2_open.svg" alt="shape" width="114"><br><sub>owner 94%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm1_2xm3_open.svg" alt="shape" width="83"><br><sub>owner 94%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 94%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 94%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 94%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 94%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm2_2xm5_open.svg" alt="shape" width="73"><br><sub>owner 94%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 94%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x0_open.svg" alt="shape" width="124"><br><sub>owner 94%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1x1_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 93%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_3x0_open.svg" alt="shape" width="124"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm2_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_2x1_open.svg" alt="shape" width="114"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2x0_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 93%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm2_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm4_open.svg" alt="shape" width="83"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_1x1_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_2xm2_3xm1_open.svg" alt="shape" width="124"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x0_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x0_open.svg" alt="shape" width="124"><br><sub>owner 93%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm1_open.svg" alt="shape" width="114"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 93%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 93%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm4_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1x0_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm3_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_1x0_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1x1_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_2xm2_open.svg" alt="shape" width="94"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_5xm5_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_1xm1_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x1_open.svg" alt="shape" width="114"><br><sub>owner 92%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_3x2_open.svg" alt="shape" width="146"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm3_1x1_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 92%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm4_open.svg" alt="shape" width="83"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm2_2xm4_open.svg" alt="shape" width="83"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_3xm5_open.svg" alt="shape" width="94"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_6xm6_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2x0_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm1_3xm1_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_2x0_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x0_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x1_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_3xm4_open.svg" alt="shape" width="83"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x5_1x2_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_3x0_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_2x1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2xm1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1x0_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm3_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm4_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_2x0_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x1_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4xm4_open.svg" alt="shape" width="114"><br><sub>owner 91%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 91%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_3x0_open.svg" alt="shape" width="135"><br><sub>owner 91%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_2x3_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_1x2_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm4_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm4_1x0_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1x1_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x2_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm5_1xm1_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_5xm1_open.svg" alt="shape" width="156"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_1x1_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm3_2xm2_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x3_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm3_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_1x2_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2xm1_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_2xm1_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x1_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm1_2xm1_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_3xm2_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm1_3xm2_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm4_open.svg" alt="shape" width="83"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_6xm1_open.svg" alt="shape" width="177"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3x3_open.svg" alt="shape" width="156"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1xm3_1x1_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm5_1xm2_open.svg" alt="shape" width="114"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_open.svg" alt="shape" width="135"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1x1_3x0_open.svg" alt="shape" width="124"><br><sub>owner 90%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_3xm1_open.svg" alt="shape" width="146"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm1_2xm3_open.svg" alt="shape" width="94"><br><sub>owner 90%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 90%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm5_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_1x1_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm4_2xm2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_1x3_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_6xm1_open.svg" alt="shape" width="177"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm4_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2x1_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x1_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_1xm2_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4x3_open.svg" alt="shape" width="177"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x3_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_3x2_open.svg" alt="shape" width="146"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4x2_open.svg" alt="shape" width="166"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_1x3_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x2_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm4_1xm1_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm4_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm6_1xm2_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2xm2_open.svg" alt="shape" width="83"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_open.svg" alt="shape" width="146"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm4_open.svg" alt="shape" width="104"><br><sub>owner 89%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4_open.svg" alt="shape" width="146"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2x2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5_open.svg" alt="shape" width="156"><br><sub>owner 89%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2x0_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 89%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3x2_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm5_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4x2_open.svg" alt="shape" width="166"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm5_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x4_open.svg" alt="shape" width="187"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm4_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_2x2_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2x2_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm4_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm1_2xm3_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_6xm6_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x5_2x1_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_4x0_open.svg" alt="shape" width="156"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x3_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm2_3xm2_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x5_open.svg" alt="shape" width="156"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x1_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x2_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm5_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm1_7xm5_open.svg" alt="shape" width="156"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_7xm1_open.svg" alt="shape" width="197"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_7xm6_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_6xm6_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2xm1_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3x1_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_7xm7_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_3x0_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_2x2_open.svg" alt="shape" width="124"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1xm1_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm5_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x7_1x1_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm7_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2xm2_open.svg" alt="shape" width="114"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 88%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm2_3xm4_open.svg" alt="shape" width="94"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_7xm3_open.svg" alt="shape" width="177"><br><sub>owner 88%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm1_2xm1_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3xm3_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_5xm2_open.svg" alt="shape" width="166"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x4_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x2_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm1_4xm1_open.svg" alt="shape" width="156"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3xm1_open.svg" alt="shape" width="124"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm2_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm6_open.svg" alt="shape" width="94"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1xm2_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm5_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm3_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm3_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm3_2x1_open.svg" alt="shape" width="114"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_1xm1_open.svg" alt="shape" width="94"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1xm2_open.svg" alt="shape" width="124"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_1xm2_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3x0_5xm1_open.svg" alt="shape" width="156"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm6_open.svg" alt="shape" width="83"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2xm2_open.svg" alt="shape" width="124"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4x2_open.svg" alt="shape" width="166"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x2_open.svg" alt="shape" width="124"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm6_1xm2_3xm2_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x0_open.svg" alt="shape" width="135"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_5x0_open.svg" alt="shape" width="166"><br><sub>owner 87%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3_open.svg" alt="shape" width="146"><br><sub>owner 87%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 87%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_2x1_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm5_2xm2_5xm2_open.svg" alt="shape" width="156"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm4_1x0_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_4xm2_open.svg" alt="shape" width="166"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_7xm7_open.svg" alt="shape" width="135"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x5_0x9_open.svg" alt="shape" width="156"><br><sub>owner 86%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm2_3xm4_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x1_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm6_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x2_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_2xm5_2xm1_open.svg" alt="shape" width="114"><br><sub>owner 86%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_4xm2_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x2_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm5_2xm2_open.svg" alt="shape" width="94"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm5_2xm2_4xm2_open.svg" alt="shape" width="135"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm5_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x1_open.svg" alt="shape" width="135"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm6_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4_open.svg" alt="shape" width="166"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm5_1xm1_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm6_2xm2_open.svg" alt="shape" width="114"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x5_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm6_2xm2_4xm2_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_4x0_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_5xm2_open.svg" alt="shape" width="177"><br><sub>owner 86%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3x2_open.svg" alt="shape" width="146"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm6_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 86%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm1_4xm1_open.svg" alt="shape" width="166"><br><sub>owner 86%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x1_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x1_open.svg" alt="shape" width="146"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x6_open.svg" alt="shape" width="146"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm1_open.svg" alt="shape" width="156"><br><sub>owner 85%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 85%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm2_4x2_open.svg" alt="shape" width="166"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_7xm3_open.svg" alt="shape" width="177"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_4xm2_open.svg" alt="shape" width="156"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_0x7_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 85%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1x1_open.svg" alt="shape" width="104"><br><sub>owner 85%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_2x0_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm7_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3xm3_open.svg" alt="shape" width="114"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 85%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6_open.svg" alt="shape" width="124"><br><sub>owner 85%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3_open.svg" alt="shape" width="156"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm6_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x3_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm5_1xm1_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 85%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_3xm3_open.svg" alt="shape" width="124"><br><sub>owner 85%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 85%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_3xm7_open.svg" alt="shape" width="104"><br><sub>owner 84%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm4_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x2_open.svg" alt="shape" width="146"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm6_2xm2_5xm2_open.svg" alt="shape" width="166"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4x1_open.svg" alt="shape" width="156"><br><sub>owner 84%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7_open.svg" alt="shape" width="156"><br><sub>owner 84%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4x2_open.svg" alt="shape" width="166"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 84%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 84%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3_open.svg" alt="shape" width="156"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm7_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1_open.svg" alt="shape" width="156"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 84%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3x5_open.svg" alt="shape" width="177"><br><sub>owner 83%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2_open.svg" alt="shape" width="146"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7_open.svg" alt="shape" width="135"><br><sub>owner 83%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_open.svg" alt="shape" width="177"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6_open.svg" alt="shape" width="166"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_6xm1_open.svg" alt="shape" width="177"><br><sub>owner 83%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 83%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_5xm1_open.svg" alt="shape" width="156"><br><sub>owner 83%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 83%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_4x1_open.svg" alt="shape" width="156"><br><sub>owner 82%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x5_4xm4_open.svg" alt="shape" width="114"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_4x0_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_8xm8_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_5xm1_open.svg" alt="shape" width="187"><br><sub>owner 82%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_4x0_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_4x1_open.svg" alt="shape" width="156"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_open.svg" alt="shape" width="146"><br><sub>owner 82%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm4_open.svg" alt="shape" width="114"><br><sub>owner 82%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm6_1xm2_3xm4_open.svg" alt="shape" width="124"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm5_1xm1_open.svg" alt="shape" width="104"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_4x2_open.svg" alt="shape" width="166"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm8_open.svg" alt="shape" width="104"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm2_open.svg" alt="shape" width="187"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm3_open.svg" alt="shape" width="177"><br><sub>owner 81%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm6_1xm2_4xm5_open.svg" alt="shape" width="135"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_open.svg" alt="shape" width="166"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2xm2_open.svg" alt="shape" width="83"><br><sub>owner 81%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_5xm2_open.svg" alt="shape" width="187"><br><sub>owner 80%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_4x0_open.svg" alt="shape" width="146"><br><sub>owner 80%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_2x0_open.svg" alt="shape" width="104"><br><sub>owner 80%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x5_0x9_open.svg" alt="shape" width="156"><br><sub>owner 80%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 80%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 80%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 79%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x5_open.svg" alt="shape" width="156"><br><sub>owner 79%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x4_1x0_open.svg" alt="shape" width="104"><br><sub>owner 78%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_0x8_open.svg" alt="shape" width="146"><br><sub>owner 78%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm6_2xm2_open.svg" alt="shape" width="124"><br><sub>owner 78%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 78%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 78%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 78%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x5_4x5_open.svg" alt="shape" width="197"><br><sub>owner 77%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_4xm4_open.svg" alt="shape" width="114"><br><sub>owner 76%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm5_2xm2_open.svg" alt="shape" width="94"><br><sub>owner 76%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 76%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 75%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_open.svg" alt="shape" width="177"><br><sub>owner 75%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_3x0_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 75%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 75%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1xm2_open.svg" alt="shape" width="94"><br><sub>owner 75%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1x0_3xm1_open.svg" alt="shape" width="114"><br><sub>owner 75%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 75%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_0x9_open.svg" alt="shape" width="156"><br><sub>owner 74%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 74%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x3_open.svg" alt="shape" width="156"><br><sub>owner 74%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_7xm4_open.svg" alt="shape" width="166"><br><sub>owner 74%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5_open.svg" alt="shape" width="177"><br><sub>owner 74%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 74%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_2xm6_2xm2_6xm2_open.svg" alt="shape" width="187"><br><sub>owner 74%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_3xm3_open.svg" alt="shape" width="124"><br><sub>owner 73%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_5xm1_open.svg" alt="shape" width="156"><br><sub>owner 73%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 73%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x2_open.svg" alt="shape" width="104"><br><sub>owner 73%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm5_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 73%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_7xm7_open.svg" alt="shape" width="135"><br><sub>owner 72%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_4xm4_7xm4_open.svg" alt="shape" width="166"><br><sub>owner 72%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2x0_open.svg" alt="shape" width="104"><br><sub>owner 72%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1xm1_open.svg" alt="shape" width="114"><br><sub>owner 72%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_8xm8_open.svg" alt="shape" width="146"><br><sub>owner 72%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2xm1_open.svg" alt="shape" width="114"><br><sub>owner 71%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x0_open.svg" alt="shape" width="114"><br><sub>owner 71%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm2_open.svg" alt="shape" width="83"><br><sub>owner 71%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 71%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 71%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4x1_open.svg" alt="shape" width="156"><br><sub>owner 71%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_1x0_open.svg" alt="shape" width="104"><br><sub>owner 70%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 70%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_7xm2_open.svg" alt="shape" width="187"><br><sub>owner 70%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_3xm6_3xm3_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 70%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x3_open.svg" alt="shape" width="114"><br><sub>owner 69%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 69%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_3x1_open.svg" alt="shape" width="135"><br><sub>owner 69%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x3_0x5_open.svg" alt="shape" width="114"><br><sub>owner 68%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 68%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_6xm1_open.svg" alt="shape" width="177"><br><sub>owner 68%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1xm2_open.svg" alt="shape" width="104"><br><sub>owner 68%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x6_open.svg" alt="shape" width="166"><br><sub>owner 67%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_4x0_open.svg" alt="shape" width="146"><br><sub>owner 67%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x1_open.svg" alt="shape" width="114"><br><sub>owner 67%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 67%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_4x1_open.svg" alt="shape" width="156"><br><sub>owner 66%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 66%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 66%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3x1_open.svg" alt="shape" width="135"><br><sub>owner 66%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 66%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_3xm6_3xm3_open.svg" alt="shape" width="94"><br><sub>owner 65%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_2xm2_open.svg" alt="shape" width="94"><br><sub>owner 65%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_3xm3_open.svg" alt="shape" width="135"><br><sub>owner 65%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3x0_open.svg" alt="shape" width="124"><br><sub>owner 65%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 65%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1xm2_open.svg" alt="shape" width="114"><br><sub>owner 65%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_6xm2_open.svg" alt="shape" width="166"><br><sub>owner 64%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm6_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 64%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm6_1xm2_open.svg" alt="shape" width="114"><br><sub>owner 64%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 64%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 64%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 64%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_2xm2_open.svg" alt="shape" width="94"><br><sub>owner 64%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2x2_open.svg" alt="shape" width="124"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x1_open.svg" alt="shape" width="114"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2xm1_open.svg" alt="shape" width="94"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_4x3_open.svg" alt="shape" width="177"><br><sub>owner 63%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x5_2x0_open.svg" alt="shape" width="114"><br><sub>owner 63%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3x1_open.svg" alt="shape" width="135"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3x1_open.svg" alt="shape" width="135"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2x1_open.svg" alt="shape" width="114"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x2_open.svg" alt="shape" width="124"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm5_1xm2_open.svg" alt="shape" width="104"><br><sub>owner 62%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_open.svg" alt="shape" width="135"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_6xm2_open.svg" alt="shape" width="166"><br><sub>owner 62%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x3_open.svg" alt="shape" width="114"><br><sub>owner 61%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm3_open.svg" alt="shape" width="73"><br><sub>owner 60%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x3_0x6_open.svg" alt="shape" width="124"><br><sub>owner 60%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x6_open.svg" alt="shape" width="187"><br><sub>owner 60%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 59%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3xm2_open.svg" alt="shape" width="104"><br><sub>owner 59%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x6_open.svg" alt="shape" width="166"><br><sub>owner 59%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2xm2_open.svg" alt="shape" width="114"><br><sub>owner 59%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4x1_open.svg" alt="shape" width="156"><br><sub>owner 59%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2xm2_open.svg" alt="shape" width="104"><br><sub>owner 59%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3_open.svg" alt="shape" width="135"><br><sub>owner 58%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4_open.svg" alt="shape" width="124"><br><sub>owner 58%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x1_open.svg" alt="shape" width="114"><br><sub>owner 58%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_open.svg" alt="shape" width="156"><br><sub>owner 58%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm5_open.svg" alt="shape" width="114"><br><sub>owner 58%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_4x0_open.svg" alt="shape" width="146"><br><sub>owner 57%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm5_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 57%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5_open.svg" alt="shape" width="135"><br><sub>owner 57%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x5_open.svg" alt="shape" width="135"><br><sub>owner 57%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm7_3xm3_open.svg" alt="shape" width="104"><br><sub>owner 57%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x4_open.svg" alt="shape" width="146"><br><sub>owner 57%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm4_open.svg" alt="shape" width="73"><br><sub>owner 57%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 57%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3xm2_open.svg" alt="shape" width="114"><br><sub>owner 56%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x5_open.svg" alt="shape" width="177"><br><sub>owner 56%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3x1_open.svg" alt="shape" width="135"><br><sub>owner 56%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x2_open.svg" alt="shape" width="104"><br><sub>owner 56%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_1xm2_open.svg" alt="shape" width="94"><br><sub>owner 55%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm3_1xm2_open.svg" alt="shape" width="83"><br><sub>owner 55%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 55%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_open.svg" alt="shape" width="146"><br><sub>owner 55%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2x1_open.svg" alt="shape" width="114"><br><sub>owner 55%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 55%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_0x4_open.svg" alt="shape" width="104"><br><sub>owner 55%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4x1_open.svg" alt="shape" width="156"><br><sub>owner 54%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4x1_open.svg" alt="shape" width="156"><br><sub>owner 54%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3_open.svg" alt="shape" width="114"><br><sub>owner 54%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_0x5_open.svg" alt="shape" width="114"><br><sub>owner 54%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3x3_open.svg" alt="shape" width="156"><br><sub>owner 53%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4x1_open.svg" alt="shape" width="156"><br><sub>owner 53%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x6_open.svg" alt="shape" width="146"><br><sub>owner 53%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x7_open.svg" alt="shape" width="197"><br><sub>owner 53%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 53%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x4_open.svg" alt="shape" width="124"><br><sub>owner 53%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x4_open.svg" alt="shape" width="124"><br><sub>owner 53%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_2x3_open.svg" alt="shape" width="135"><br><sub>owner 53%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm4_open.svg" alt="shape" width="166"><br><sub>owner 52%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 52%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_4x1_open.svg" alt="shape" width="156"><br><sub>owner 52%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_7xm4_open.svg" alt="shape" width="166"><br><sub>owner 52%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 51%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_0x7_open.svg" alt="shape" width="135"><br><sub>owner 51%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 51%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x3_open.svg" alt="shape" width="135"><br><sub>owner 50%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm4_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 50%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_4x1_open.svg" alt="shape" width="156"><br><sub>owner 50%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 50%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm3_open.svg" alt="shape" width="197"><br><sub>owner 50%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_4x0_open.svg" alt="shape" width="146"><br><sub>owner 50%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x4_open.svg" alt="shape" width="146"><br><sub>owner 49%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 49%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_8xm4_open.svg" alt="shape" width="187"><br><sub>owner 49%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 49%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_3xm4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 49%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_2xm4_2x0_open.svg" alt="shape" width="104"><br><sub>owner 49%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x2_open.svg" alt="shape" width="114"><br><sub>owner 49%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_0x8_open.svg" alt="shape" width="146"><br><sub>owner 49%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_0x6_open.svg" alt="shape" width="124"><br><sub>owner 48%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 48%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 48%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_3xm7_3xm3_6xm3_open.svg" alt="shape" width="166"><br><sub>owner 48%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm7_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 48%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm2_open.svg" alt="shape" width="208"><br><sub>owner 47%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_8xm8_open.svg" alt="shape" width="146"><br><sub>owner 47%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm1_open.svg" alt="shape" width="218"><br><sub>owner 47%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2x3_open.svg" alt="shape" width="135"><br><sub>owner 47%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x4_3x0_open.svg" alt="shape" width="124"><br><sub>owner 47%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x1_open.svg" alt="shape" width="135"><br><sub>owner 47%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm4_open.svg" alt="shape" width="124"><br><sub>owner 47%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_4x0_open.svg" alt="shape" width="146"><br><sub>owner 47%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm7_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 47%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_4x2_open.svg" alt="shape" width="166"><br><sub>owner 47%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_4xm4_open.svg" alt="shape" width="124"><br><sub>owner 46%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 46%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x0_open.svg" alt="shape" width="124"><br><sub>owner 46%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3x4_open.svg" alt="shape" width="166"><br><sub>owner 46%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm6_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 46%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x3_open.svg" alt="shape" width="177"><br><sub>owner 46%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 45%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_open.svg" alt="shape" width="135"><br><sub>owner 45%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_0x6_open.svg" alt="shape" width="124"><br><sub>owner 45%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_2xm1_open.svg" alt="shape" width="146"><br><sub>owner 45%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_0x5_open.svg" alt="shape" width="114"><br><sub>owner 44%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_open.svg" alt="shape" width="124"><br><sub>owner 44%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_4xm2_6xm3_open.svg" alt="shape" width="156"><br><sub>owner 44%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm4_8xm4_open.svg" alt="shape" width="187"><br><sub>owner 43%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_1xm2_open.svg" alt="shape" width="146"><br><sub>owner 42%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_open.svg" alt="shape" width="124"><br><sub>owner 42%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_8xm4_open.svg" alt="shape" width="187"><br><sub>owner 42%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_4x4_open.svg" alt="shape" width="187"><br><sub>owner 42%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_4xm8_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 41%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_4xm4_open.svg" alt="shape" width="135"><br><sub>owner 41%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_open.svg" alt="shape" width="135"><br><sub>owner 41%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_open.svg" alt="shape" width="135"><br><sub>owner 40%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm5_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 40%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm3_open.svg" alt="shape" width="135"><br><sub>owner 40%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm2_3x2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 39%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_4x4_open.svg" alt="shape" width="187"><br><sub>owner 39%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 38%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_open.svg" alt="shape" width="146"><br><sub>owner 38%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_4xm8_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 38%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_4x5_open.svg" alt="shape" width="197"><br><sub>owner 37%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_4xm6_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 36%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_open.svg" alt="shape" width="156"><br><sub>owner 36%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_4x3_open.svg" alt="shape" width="177"><br><sub>owner 36%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm4_open.svg" alt="shape" width="146"><br><sub>owner 35%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x8_open.svg" alt="shape" width="166"><br><sub>owner 34%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_2xm1_open.svg" alt="shape" width="104"><br><sub>owner 34%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_4x6_open.svg" alt="shape" width="208"><br><sub>owner 33%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 33%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm5_open.svg" alt="shape" width="135"><br><sub>owner 33%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm4_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 33%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_3xm7_3xm3_7xm3_open.svg" alt="shape" width="187"><br><sub>owner 32%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_3x3_open.svg" alt="shape" width="156"><br><sub>owner 31%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_3xm7_3xm3_open.svg" alt="shape" width="114"><br><sub>owner 29%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_0x8_open.svg" alt="shape" width="146"><br><sub>owner 29%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x7_open.svg" alt="shape" width="156"><br><sub>owner 29%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_4x7_open.svg" alt="shape" width="218"><br><sub>owner 28%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm7_4xm3_open.svg" alt="shape" width="114"><br><sub>owner 27%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 27%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x7_0x10_open.svg" alt="shape" width="166"><br><sub>owner 26%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 25%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_0x9_open.svg" alt="shape" width="156"><br><sub>owner 25%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_0x11_open.svg" alt="shape" width="177"><br><sub>owner 25%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_0x9_open.svg" alt="shape" width="156"><br><sub>owner 24%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_4xm2_open.svg" alt="shape" width="124"><br><sub>owner 24%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_0x10_open.svg" alt="shape" width="166"><br><sub>owner 24%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm5_1xm2_open.svg" alt="shape" width="124"><br><sub>owner 24%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 23%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm6_1xm2_open.svg" alt="shape" width="135"><br><sub>owner 23%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x7_0x11_open.svg" alt="shape" width="177"><br><sub>owner 22%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm5_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 22%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_0x10_open.svg" alt="shape" width="166"><br><sub>owner 22%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 22%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm3_4xm5_open.svg" alt="shape" width="94"><br><sub>owner 21%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm8_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 20%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_4x0_open.svg" alt="shape" width="146"><br><sub>owner 20%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm1_open.svg" alt="shape" width="124"><br><sub>owner 19%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_0x6_0x10_open.svg" alt="shape" width="166"><br><sub>owner 19%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 18%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4x3_open.svg" alt="shape" width="177"><br><sub>owner 18%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 18%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_4xm4_5xm6_open.svg" alt="shape" width="104"><br><sub>owner 18%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm4_5xm2_open.svg" alt="shape" width="146"><br><sub>owner 17%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_4xm7_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 17%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4xm1_open.svg" alt="shape" width="135"><br><sub>owner 17%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_3xm4_open.svg" alt="shape" width="104"><br><sub>owner 17%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_4xm1_6xm2_open.svg" alt="shape" width="166"><br><sub>owner 15%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_2xm4_open.svg" alt="shape" width="104"><br><sub>owner 15%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_3xm3_4xm5_open.svg" alt="shape" width="104"><br><sub>owner 15%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_0x8_4xm4_open.svg" alt="shape" width="146"><br><sub>owner 15%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_0x8_0x12_open.svg" alt="shape" width="187"><br><sub>owner 15%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1xm2_open.svg" alt="shape" width="135"><br><sub>owner 13%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_1xm2_open.svg" alt="shape" width="124"><br><sub>owner 13%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm5_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 13%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_1x4_open.svg" alt="shape" width="124"><br><sub>owner 13%<br>out of time</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_4xm4_4x4_open.svg" alt="shape" width="187"><br><sub>owner 12%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_4x0_6xm1_open.svg" alt="shape" width="177"><br><sub>owner 12%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm3_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 11%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_1x2_open.svg" alt="shape" width="104"><br><sub>owner 11%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2xm4_open.svg" alt="shape" width="94"><br><sub>owner 11%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 11%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm1_open.svg" alt="shape" width="135"><br><sub>owner 10%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm6_1xm2_open.svg" alt="shape" width="146"><br><sub>owner 10%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_3xm5_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 10%<br>out of time</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_1x5_open.svg" alt="shape" width="135"><br><sub>owner 10%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_2x3_open.svg" alt="shape" width="135"><br><sub>owner 9%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_4xm8_4xm4_open.svg" alt="shape" width="104"><br><sub>owner 9%<br>too many defences</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1xm2_4x4_open.svg" alt="shape" width="187"><br><sub>owner 8%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_0x4_4xm4_4x0_open.svg" alt="shape" width="146"><br><sub>owner 8%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_4xm8_4xm4_8xm4_open.svg" alt="shape" width="187"><br><sub>owner 7%<br>too many defences</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm4_3xm6_open.svg" alt="shape" width="62"><br><sub>owner 5%<br>too many defences</sub></td></tr>
</table>

</details>


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

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm1.svg" alt="A5" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm1_d0.svg" alt="A5 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm1_d1.svg" alt="A5 holding reply 2" width="218"><br>Holds</td></tr></table>

**5.5% of replies hold · needs both stones · all 30 two-lines pairs hold**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm1_map.svg" alt="A5 defence map" width="291"> <img src="shapes/s0x0_0x2_3xm1_d2.svg" alt="A5 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_3xm1_d3.svg" alt="A5 holding reply 4" width="197"> <img src="shapes/s0x0_0x2_3xm1_d4.svg" alt="A5 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_3xm1_d5.svg" alt="A5 holding reply 6" width="218">

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

<img src="shapes/s0x0_0x2_2xm2_map.svg" alt="A10 defence map" width="270"> <img src="shapes/s0x0_0x2_2xm2_d2.svg" alt="A10 holding reply 3" width="187"> <img src="shapes/s0x0_0x2_2xm2_d3.svg" alt="A10 holding reply 4" width="187"> <img src="shapes/s0x0_0x2_2xm2_d4.svg" alt="A10 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_2xm2_d5.svg" alt="A10 holding reply 6" width="208">

</details>

### A11 · Chevron 2+3

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm3.svg" alt="A11" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm3_d0.svg" alt="A11 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm3_d1.svg" alt="A11 holding reply 2" width="229"><br>Holds</td></tr></table>

**46% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm3_map.svg" alt="A11 defence map" width="291"> <img src="shapes/s0x0_0x2_3xm3_d2.svg" alt="A11 holding reply 3" width="229"> <img src="shapes/s0x0_0x2_3xm3_d3.svg" alt="A11 holding reply 4" width="229"> <img src="shapes/s0x0_0x2_3xm3_d4.svg" alt="A11 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_3xm3_d5.svg" alt="A11 holding reply 6" width="229">

</details>

### A12 · Line 1+2

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x3.svg" alt="A12" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x3_d0.svg" alt="A12 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x3_d1.svg" alt="A12 holding reply 2" width="197"><br>Holds</td></tr></table>

**18% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x3_map.svg" alt="A12 defence map" width="218"> <img src="shapes/s0x0_0x1_0x3_d2.svg" alt="A12 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_0x3_d3.svg" alt="A12 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_0x3_d4.svg" alt="A12 holding reply 5" width="187"> <img src="shapes/s0x0_0x1_0x3_d5.svg" alt="A12 holding reply 6" width="197">

</details>

### A13 · One-gap pair + 1 (2,3)

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm1.svg" alt="A13" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm1_d0.svg" alt="A13 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm1_d1.svg" alt="A13 holding reply 2" width="197"><br>Holds</td></tr></table>

**19% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm1_map.svg" alt="A13 defence map" width="270"> <img src="shapes/s0x0_0x2_2xm1_d2.svg" alt="A13 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_2xm1_d3.svg" alt="A13 holding reply 4" width="208"> <img src="shapes/s0x0_0x2_2xm1_d4.svg" alt="A13 holding reply 5" width="187"> <img src="shapes/s0x0_0x2_2xm1_d5.svg" alt="A13 holding reply 6" width="187">

</details>

### A14 · One-gap pair + 1 (2,4)

<table><tr><td align="center"><img src="shapes/s0x0_0x2_1xm2.svg" alt="A14" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_1xm2_d0.svg" alt="A14 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_1xm2_d1.svg" alt="A14 holding reply 2" width="208"><br>Holds</td></tr></table>

**35% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_1xm2_map.svg" alt="A14 defence map" width="270"> <img src="shapes/s0x0_0x2_1xm2_d2.svg" alt="A14 holding reply 3" width="208"> <img src="shapes/s0x0_0x2_1xm2_d3.svg" alt="A14 holding reply 4" width="208"> <img src="shapes/s0x0_0x2_1xm2_d4.svg" alt="A14 holding reply 5" width="208"> <img src="shapes/s0x0_0x2_1xm2_d5.svg" alt="A14 holding reply 6" width="208">

</details>

### A15 · Pair + 1 (2,3)

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm2.svg" alt="A15" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm2_d0.svg" alt="A15 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm2_d1.svg" alt="A15 holding reply 2" width="187"><br>Holds</td></tr></table>

**21% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm2_map.svg" alt="A15 defence map" width="270"> <img src="shapes/s0x0_0x1_1xm2_d2.svg" alt="A15 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_1xm2_d3.svg" alt="A15 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_1xm2_d4.svg" alt="A15 holding reply 5" width="177"> <img src="shapes/s0x0_0x1_1xm2_d5.svg" alt="A15 holding reply 6" width="187">

</details>

### A16 · Three in a row · unstoppable in open space (U1)

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2.svg" alt="A16" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x2_d0.svg" alt="A16 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x2_d1.svg" alt="A16 holding reply 2" width="197"><br>Holds</td></tr></table>

**16% of replies hold · one stone is enough on the 4 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x2_map.svg" alt="A16 defence map" width="229"> <img src="shapes/s0x0_0x1_0x2_d2.svg" alt="A16 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_0x2_d3.svg" alt="A16 holding reply 4" width="187"> <img src="shapes/s0x0_0x1_0x2_d4.svg" alt="A16 holding reply 5" width="197"> <img src="shapes/s0x0_0x1_0x2_d5.svg" alt="A16 holding reply 6" width="197">

</details>

### A17 · Two-gap pair + 1 (2,2)

<table><tr><td align="center"><img src="shapes/s0x0_0x3_1x1.svg" alt="A17" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_1x1_d0.svg" alt="A17 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_1x1_d1.svg" alt="A17 holding reply 2" width="197"><br>Holds</td></tr></table>

**21% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_1x1_map.svg" alt="A17 defence map" width="250"> <img src="shapes/s0x0_0x3_1x1_d2.svg" alt="A17 holding reply 3" width="197"> <img src="shapes/s0x0_0x3_1x1_d3.svg" alt="A17 holding reply 4" width="208"> <img src="shapes/s0x0_0x3_1x1_d4.svg" alt="A17 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_1x1_d5.svg" alt="A17 holding reply 6" width="187">

</details>

### A18 · Two-gap pair + 1 (2,4)

<table><tr><td align="center"><img src="shapes/s0x0_0x3_2xm1.svg" alt="A18" width="177"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_2xm1_d0.svg" alt="A18 holding reply 1" width="187"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_2xm1_d1.svg" alt="A18 holding reply 2" width="197"><br>Holds</td></tr></table>

**33% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_2xm1_map.svg" alt="A18 defence map" width="280"> <img src="shapes/s0x0_0x3_2xm1_d2.svg" alt="A18 holding reply 3" width="187"> <img src="shapes/s0x0_0x3_2xm1_d3.svg" alt="A18 holding reply 4" width="187"> <img src="shapes/s0x0_0x3_2xm1_d4.svg" alt="A18 holding reply 5" width="187"> <img src="shapes/s0x0_0x3_2xm1_d5.svg" alt="A18 holding reply 6" width="197">

</details>

## 4 stones: a three plus one

10 shapes. Three stones in one window of six, plus a fourth stone outside that window (on the same line or off it), and no must-answer three inside.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x7.svg" alt="B1" width="250"><br><b>B1</b> · six on turn 6<br>9.6% hold · 4 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_0x4_0x8.svg" alt="B2" width="250"><br><b>B2</b> · six on turn 6<br>11% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x8.svg" alt="B3" width="239"><br><b>B3</b> · six on turn 6<br>11% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x7.svg" alt="B4" width="250"><br><b>B4</b> · six on turn 6<br>12% hold · 5 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x6.svg" alt="B5" width="239"><br><b>B5</b> · six on turn 6<br>13% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3x2.svg" alt="B6" width="229"><br><b>B6</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x3.svg" alt="B7" width="218"><br><b>B7</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x3.svg" alt="B8" width="197"><br><b>B8</b> · six on turn 6<br>24% hold · 9 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x4.svg" alt="B9" width="208"><br><b>B9</b> · six on turn 6<br>28% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_1x5.svg" alt="B10" width="218"><br><b>B10</b> · six on turn 6<br>35% hold · 14 one-stone cells</td>
</tr>
</table>

<details><summary>Holding replies for each</summary>

### B1

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x4_0x7.svg" alt="B1" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_d0.svg" alt="B1 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x7_d1.svg" alt="B1 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 9.6% of replies hold · one stone is enough on the 4 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x4_0x7_map.svg" alt="B1 defence map" width="239"> <img src="shapes/s0x0_0x3_0x4_0x7_d2.svg" alt="B1 holding reply 3" width="218"> <img src="shapes/s0x0_0x3_0x4_0x7_d3.svg" alt="B1 holding reply 4" width="218"> <img src="shapes/s0x0_0x3_0x4_0x7_d4.svg" alt="B1 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_0x4_0x7_d5.svg" alt="B1 holding reply 6" width="218">

</details>

### B2

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x4_0x8.svg" alt="B2" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_d0.svg" alt="B2 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x4_0x8_d1.svg" alt="B2 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 11% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x4_0x8_map.svg" alt="B2 defence map" width="229"> <img src="shapes/s0x0_0x3_0x4_0x8_d2.svg" alt="B2 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_0x4_0x8_d3.svg" alt="B2 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_0x4_0x8_d4.svg" alt="B2 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_0x4_0x8_d5.svg" alt="B2 holding reply 6" width="229">

</details>

### B3

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x5_0x8.svg" alt="B3" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_d0.svg" alt="B3 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x5_0x8_d1.svg" alt="B3 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 11% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x5_0x8_map.svg" alt="B3 defence map" width="229"> <img src="shapes/s0x0_0x3_0x5_0x8_d2.svg" alt="B3 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_0x5_0x8_d3.svg" alt="B3 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_0x5_0x8_d4.svg" alt="B3 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_0x5_0x8_d5.svg" alt="B3 holding reply 6" width="229">

</details>

### B4

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x4_0x7.svg" alt="B4" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_d0.svg" alt="B4 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x7_d1.svg" alt="B4 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 12% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x4_0x7_map.svg" alt="B4 defence map" width="229"> <img src="shapes/s0x0_0x2_0x4_0x7_d2.svg" alt="B4 holding reply 3" width="229"> <img src="shapes/s0x0_0x2_0x4_0x7_d3.svg" alt="B4 holding reply 4" width="229"> <img src="shapes/s0x0_0x2_0x4_0x7_d4.svg" alt="B4 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_0x4_0x7_d5.svg" alt="B4 holding reply 6" width="218">

</details>

### B5

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x4_0x6.svg" alt="B5" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_d0.svg" alt="B5 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x4_0x6_d1.svg" alt="B5 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 13% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x4_0x6_map.svg" alt="B5 defence map" width="229"> <img src="shapes/s0x0_0x2_0x4_0x6_d2.svg" alt="B5 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_0x4_0x6_d3.svg" alt="B5 holding reply 4" width="229"> <img src="shapes/s0x0_0x2_0x4_0x6_d4.svg" alt="B5 holding reply 5" width="208"> <img src="shapes/s0x0_0x2_0x4_0x6_d5.svg" alt="B5 holding reply 6" width="208">

</details>

### B6

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2.svg" alt="B6" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_d0.svg" alt="B6 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_d1.svg" alt="B6 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_3x2_map.svg" alt="B6 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_3x2_d2.svg" alt="B6 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_0x5_3x2_d3.svg" alt="B6 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_0x5_3x2_d4.svg" alt="B6 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_0x5_3x2_d5.svg" alt="B6 holding reply 6" width="239">

</details>

### B7

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3.svg" alt="B7" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3_d0.svg" alt="B7 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x3_d1.svg" alt="B7 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_2x3_map.svg" alt="B7 defence map" width="302"> <img src="shapes/s0x0_0x1_0x5_2x3_d2.svg" alt="B7 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_0x5_2x3_d3.svg" alt="B7 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_0x5_2x3_d4.svg" alt="B7 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_0x5_2x3_d5.svg" alt="B7 holding reply 6" width="229">

</details>

### B8

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3.svg" alt="B8" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3_d0.svg" alt="B8 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x3_d1.svg" alt="B8 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 9 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x3_map.svg" alt="B8 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_1x3_d2.svg" alt="B8 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d3.svg" alt="B8 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d4.svg" alt="B8 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_0x5_1x3_d5.svg" alt="B8 holding reply 6" width="208">

</details>

### B9

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4.svg" alt="B9" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4_d0.svg" alt="B9 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x4_d1.svg" alt="B9 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x4_map.svg" alt="B9 defence map" width="291"> <img src="shapes/s0x0_0x1_0x5_1x4_d2.svg" alt="B9 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_0x5_1x4_d3.svg" alt="B9 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_0x5_1x4_d4.svg" alt="B9 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_0x5_1x4_d5.svg" alt="B9 holding reply 6" width="229">

</details>

### B10

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5.svg" alt="B10" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5_d0.svg" alt="B10 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x5_d1.svg" alt="B10 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 35% of replies hold · one stone is enough on the 14 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_0x5_1x5_map.svg" alt="B10 defence map" width="280"> <img src="shapes/s0x0_0x1_0x5_1x5_d2.svg" alt="B10 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_0x5_1x5_d3.svg" alt="B10 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_0x5_1x5_d4.svg" alt="B10 holding reply 5" width="270"> <img src="shapes/s0x0_0x1_0x5_1x5_d5.svg" alt="B10 holding reply 6" width="218">

</details>

</details>

## 4 stones: spread out

40 shapes. No three of the stones share a window of six, and there's no must-answer three inside: usually two close pairs, sometimes stones 4 apart on one line plus one more. These are the easiest to overlook.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3.svg" alt="B11" width="218"><br><b>B11</b> · six on turn 5<br>6.9% hold · 1 one-stone cell</td>
<td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3.svg" alt="B12" width="218"><br><b>B12</b> · six on turn 5<br>7.2% hold · 1 one-stone cell</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_1x4.svg" alt="B13" width="218"><br><b>B13</b> · six on turn 6<br>12% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3.svg" alt="B14" width="218"><br><b>B14</b> · six on turn 5<br>14% hold · 4 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x4.svg" alt="B15" width="250"><br><b>B15</b> · six on turn 6<br>14% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x3.svg" alt="B16" width="229"><br><b>B16</b> · six on turn 6<br>14% hold · 6 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5.svg" alt="B17" width="250"><br><b>B17</b> · six on turn 6<br>14% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_3x3.svg" alt="B18" width="239"><br><b>B18</b> · six on turn 6<br>15% hold · 5 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x8_1x3.svg" alt="B19" width="229"><br><b>B19</b> · six on turn 6<br>15% hold · 6 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_2x4.svg" alt="B20" width="229"><br><b>B20</b> · six on turn 6<br>16% hold · 5 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_1x2.svg" alt="B21" width="229"><br><b>B21</b> · six on turn 6<br>21% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4.svg" alt="B22" width="208"><br><b>B22</b> · six on turn 5<br>21% hold · 6 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_1x5.svg" alt="B23" width="218"><br><b>B23</b> · six on turn 6<br>22% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x3.svg" alt="B24" width="239"><br><b>B24</b> · six on turn 6<br>23% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x2.svg" alt="B25" width="229"><br><b>B25</b> · six on turn 6<br>24% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_1x4.svg" alt="B26" width="208"><br><b>B26</b> · six on turn 6<br>24% hold · 10 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6.svg" alt="B27" width="250"><br><b>B27</b> · six on turn 6<br>24% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5.svg" alt="B28" width="218"><br><b>B28</b> · six on turn 6<br>26% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4.svg" alt="B29" width="208"><br><b>B29</b> · six on turn 5<br>27% hold · 10 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1.svg" alt="B30" width="218"><br><b>B30</b> · six on turn 5<br>27% hold · 12 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4.svg" alt="B31" width="197"><br><b>B31</b> · six on turn 5<br>28% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4.svg" alt="B32" width="197"><br><b>B32</b> · six on turn 6<br>28% hold · 11 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_4x1.svg" alt="B33" width="239"><br><b>B33</b> · six on turn 6<br>28% hold · 12 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0.svg" alt="B34" width="229"><br><b>B34</b> · six on turn 5<br>29% hold · 12 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x8_3x1.svg" alt="B35" width="229"><br><b>B35</b> · six on turn 6<br>34% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7.svg" alt="B36" width="239"><br><b>B36</b> · six on turn 7<br>34% hold · 16 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4.svg" alt="B37" width="208"><br><b>B37</b> · six on turn 5<br>34% hold · 13 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6.svg" alt="B38" width="208"><br><b>B38</b> · six on turn 7<br>37% hold · 16 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4.svg" alt="B39" width="187"><br><b>B39</b> · six on turn 6<br>37% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5.svg" alt="B40" width="260"><br><b>B40</b> · six on turn 7<br>37% hold · 19 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7.svg" alt="B41" width="260"><br><b>B41</b> · six on turn 7<br>38% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1.svg" alt="B42" width="218"><br><b>B42</b> · six on turn 5<br>38% hold · 17 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3.svg" alt="B43" width="218"><br><b>B43</b> · six on turn 5<br>39% hold · 16 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6.svg" alt="B44" width="260"><br><b>B44</b> · six on turn 7<br>39% hold · 19 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4.svg" alt="B45" width="197"><br><b>B45</b> · six on turn 6<br>41% hold · 18 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4.svg" alt="B46" width="208"><br><b>B46</b> · six on turn 6<br>41% hold · 19 one-stone cells</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4.svg" alt="B47" width="229"><br><b>B47</b> · six on turn 6<br>42% hold · 17 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3.svg" alt="B48" width="260"><br><b>B48</b> · six on turn 6<br>43% hold · 18 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4.svg" alt="B49" width="208"><br><b>B49</b> · six on turn 6<br>44% hold · 19 one-stone cells</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4.svg" alt="B50" width="250"><br><b>B50</b> · six on turn 6<br>48% hold · 21 one-stone cells</td>
</tr>
</table>

<details><summary>Holding replies for each</summary>

### B11

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3.svg" alt="B11" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3_d0.svg" alt="B11 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm3_d1.svg" alt="B11 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 6.9% of replies hold · one stone is enough on the 1 dotted cell in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm3_4xm3_map.svg" alt="B11 defence map" width="302"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d2.svg" alt="B11 holding reply 3" width="197"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d3.svg" alt="B11 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d4.svg" alt="B11 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_2xm3_4xm3_d5.svg" alt="B11 holding reply 6" width="229">

</details>

### B12

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3.svg" alt="B12" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3_d0.svg" alt="B12 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm3_d1.svg" alt="B12 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 7.2% of replies hold · one stone is enough on the 1 dotted cell in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm3_4xm3_map.svg" alt="B12 defence map" width="302"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d2.svg" alt="B12 holding reply 3" width="208"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d3.svg" alt="B12 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d4.svg" alt="B12 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_1xm3_4xm3_d5.svg" alt="B12 holding reply 6" width="229">

</details>

### B13

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4.svg" alt="B13" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4_d0.svg" alt="B13 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x4_d1.svg" alt="B13 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 12% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_1x4_map.svg" alt="B13 defence map" width="260"> <img src="shapes/s0x0_0x3_0x7_1x4_d2.svg" alt="B13 holding reply 3" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d3.svg" alt="B13 holding reply 4" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d4.svg" alt="B13 holding reply 5" width="218"> <img src="shapes/s0x0_0x3_0x7_1x4_d5.svg" alt="B13 holding reply 6" width="218">

</details>

### B14

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3.svg" alt="B14" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3_d0.svg" alt="B14 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm1_4xm3_d1.svg" alt="B14 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 14% of replies hold · one stone is enough on the 4 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm1_4xm3_map.svg" alt="B14 defence map" width="291"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d2.svg" alt="B14 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d3.svg" alt="B14 holding reply 4" width="208"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d4.svg" alt="B14 holding reply 5" width="208"> <img src="shapes/s0x0_0x1_3xm1_4xm3_d5.svg" alt="B14 holding reply 6" width="197">

</details>

### B15

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4.svg" alt="B15" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4_d0.svg" alt="B15 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x4_d1.svg" alt="B15 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_3x4_map.svg" alt="B15 defence map" width="312"> <img src="shapes/s0x0_0x3_0x7_3x4_d2.svg" alt="B15 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d3.svg" alt="B15 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d4.svg" alt="B15 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_0x7_3x4_d5.svg" alt="B15 holding reply 6" width="250">

</details>

### B16

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3.svg" alt="B16" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3_d0.svg" alt="B16 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x3_d1.svg" alt="B16 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_2x3_map.svg" alt="B16 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_2x3_d2.svg" alt="B16 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d3.svg" alt="B16 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d4.svg" alt="B16 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_2x3_d5.svg" alt="B16 holding reply 6" width="229">

</details>

### B17

<table><tr><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5.svg" alt="B17" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5_d0.svg" alt="B17 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_7xm5_d1.svg" alt="B17 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 14% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_4xm2_7xm5_map.svg" alt="B17 defence map" width="302"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d2.svg" alt="B17 holding reply 3" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d3.svg" alt="B17 holding reply 4" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d4.svg" alt="B17 holding reply 5" width="239"> <img src="shapes/s0x0_0x2_4xm2_7xm5_d5.svg" alt="B17 holding reply 6" width="239">

</details>

### B18

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3.svg" alt="B18" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3_d0.svg" alt="B18 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x3_d1.svg" alt="B18 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 15% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_3x3_map.svg" alt="B18 defence map" width="302"> <img src="shapes/s0x0_0x2_0x6_3x3_d2.svg" alt="B18 holding reply 3" width="250"> <img src="shapes/s0x0_0x2_0x6_3x3_d3.svg" alt="B18 holding reply 4" width="250"> <img src="shapes/s0x0_0x2_0x6_3x3_d4.svg" alt="B18 holding reply 5" width="239"> <img src="shapes/s0x0_0x2_0x6_3x3_d5.svg" alt="B18 holding reply 6" width="239">

</details>

### B19

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3.svg" alt="B19" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3_d0.svg" alt="B19 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x3_d1.svg" alt="B19 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 15% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_1x3_map.svg" alt="B19 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_1x3_d2.svg" alt="B19 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d3.svg" alt="B19 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d4.svg" alt="B19 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_1x3_d5.svg" alt="B19 holding reply 6" width="229">

</details>

### B20

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4.svg" alt="B20" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4_d0.svg" alt="B20 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x4_d1.svg" alt="B20 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 16% of replies hold · one stone is enough on the 5 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_2x4_map.svg" alt="B20 defence map" width="302"> <img src="shapes/s0x0_0x2_0x6_2x4_d2.svg" alt="B20 holding reply 3" width="239"> <img src="shapes/s0x0_0x2_0x6_2x4_d3.svg" alt="B20 holding reply 4" width="239"> <img src="shapes/s0x0_0x2_0x6_2x4_d4.svg" alt="B20 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_0x6_2x4_d5.svg" alt="B20 holding reply 6" width="229">

</details>

### B21

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2.svg" alt="B21" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2_d0.svg" alt="B21 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_1x2_d1.svg" alt="B21 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 21% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_1x2_map.svg" alt="B21 defence map" width="291"> <img src="shapes/s0x0_0x4_0x8_1x2_d2.svg" alt="B21 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d3.svg" alt="B21 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d4.svg" alt="B21 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_1x2_d5.svg" alt="B21 holding reply 6" width="229">

</details>

### B22

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4.svg" alt="B22" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4_d0.svg" alt="B22 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm4_d1.svg" alt="B22 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 21% of replies hold · one stone is enough on the 6 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm4_4xm4_map.svg" alt="B22 defence map" width="291"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d2.svg" alt="B22 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d3.svg" alt="B22 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d4.svg" alt="B22 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_2xm4_4xm4_d5.svg" alt="B22 holding reply 6" width="229">

</details>

### B23

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5.svg" alt="B23" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5_d0.svg" alt="B23 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x5_d1.svg" alt="B23 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 22% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_1x5_map.svg" alt="B23 defence map" width="291"> <img src="shapes/s0x0_0x3_0x7_1x5_d2.svg" alt="B23 holding reply 3" width="218"> <img src="shapes/s0x0_0x3_0x7_1x5_d3.svg" alt="B23 holding reply 4" width="218"> <img src="shapes/s0x0_0x3_0x7_1x5_d4.svg" alt="B23 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_0x7_1x5_d5.svg" alt="B23 holding reply 6" width="239">

</details>

### B24

<table><tr><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3.svg" alt="B24" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3_d0.svg" alt="B24 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x3_d1.svg" alt="B24 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 23% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_0x7_3x3_map.svg" alt="B24 defence map" width="302"> <img src="shapes/s0x0_0x3_0x7_3x3_d2.svg" alt="B24 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d3.svg" alt="B24 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d4.svg" alt="B24 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_0x7_3x3_d5.svg" alt="B24 holding reply 6" width="250">

</details>

### B25

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2.svg" alt="B25" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2_d0.svg" alt="B25 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_2x2_d1.svg" alt="B25 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_2x2_map.svg" alt="B25 defence map" width="302"> <img src="shapes/s0x0_0x4_0x8_2x2_d2.svg" alt="B25 holding reply 3" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d3.svg" alt="B25 holding reply 4" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d4.svg" alt="B25 holding reply 5" width="229"> <img src="shapes/s0x0_0x4_0x8_2x2_d5.svg" alt="B25 holding reply 6" width="229">

</details>

### B26

<table><tr><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4.svg" alt="B26" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4_d0.svg" alt="B26 holding reply 1" width="208"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x4_d1.svg" alt="B26 holding reply 2" width="208"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_0x6_1x4_map.svg" alt="B26 defence map" width="291"> <img src="shapes/s0x0_0x2_0x6_1x4_d2.svg" alt="B26 holding reply 3" width="208"> <img src="shapes/s0x0_0x2_0x6_1x4_d3.svg" alt="B26 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_0x6_1x4_d4.svg" alt="B26 holding reply 5" width="229"> <img src="shapes/s0x0_0x2_0x6_1x4_d5.svg" alt="B26 holding reply 6" width="250">

</details>

### B27

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6.svg" alt="B27" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6_d0.svg" alt="B27 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_7xm6_d1.svg" alt="B27 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 6 · 24% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_7xm6_map.svg" alt="B27 defence map" width="302"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d2.svg" alt="B27 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d3.svg" alt="B27 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d4.svg" alt="B27 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm3_7xm6_d5.svg" alt="B27 holding reply 6" width="260">

</details>

### B28

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5.svg" alt="B28" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5_d0.svg" alt="B28 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm5_d1.svg" alt="B28 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 6 · 26% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_6xm5_map.svg" alt="B28 defence map" width="302"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d2.svg" alt="B28 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d3.svg" alt="B28 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d4.svg" alt="B28 holding reply 5" width="250"> <img src="shapes/s0x0_0x1_4xm3_6xm5_d5.svg" alt="B28 holding reply 6" width="250">

</details>

### B29

<table><tr><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4.svg" alt="B29" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4_d0.svg" alt="B29 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_2xm3_4xm4_d1.svg" alt="B29 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 5 · 27% of replies hold · one stone is enough on the 10 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_2xm3_4xm4_map.svg" alt="B29 defence map" width="270"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d2.svg" alt="B29 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d3.svg" alt="B29 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d4.svg" alt="B29 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_2xm3_4xm4_d5.svg" alt="B29 holding reply 6" width="218">

</details>

### B30

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1.svg" alt="B30" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1_d0.svg" alt="B30 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x1_d1.svg" alt="B30 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 5 · 27% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm3_3x1_map.svg" alt="B30 defence map" width="302"> <img src="shapes/s0x0_0x3_3xm3_3x1_d2.svg" alt="B30 holding reply 3" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d3.svg" alt="B30 holding reply 4" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d4.svg" alt="B30 holding reply 5" width="250"> <img src="shapes/s0x0_0x3_3xm3_3x1_d5.svg" alt="B30 holding reply 6" width="250">

</details>

### B31

<table><tr><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4.svg" alt="B31" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4_d0.svg" alt="B31 holding reply 1" width="197"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm4_d1.svg" alt="B31 holding reply 2" width="208"><br>Holds</td></tr></table>

**Six on turn 5 · 28% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_3xm2_4xm4_map.svg" alt="B31 defence map" width="280"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d2.svg" alt="B31 holding reply 3" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d3.svg" alt="B31 holding reply 4" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d4.svg" alt="B31 holding reply 5" width="197"> <img src="shapes/s0x0_0x2_3xm2_4xm4_d5.svg" alt="B31 holding reply 6" width="197">

</details>

### B32

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4.svg" alt="B32" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4_d0.svg" alt="B32 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm4_d1.svg" alt="B32 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 11 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm3_4xm4_map.svg" alt="B32 defence map" width="291"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d2.svg" alt="B32 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d3.svg" alt="B32 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d4.svg" alt="B32 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_2xm3_4xm4_d5.svg" alt="B32 holding reply 6" width="218">

</details>

### B33

<table><tr><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1.svg" alt="B33" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1_d0.svg" alt="B33 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_1x1_4x1_d1.svg" alt="B33 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 28% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_1x1_4x1_map.svg" alt="B33 defence map" width="302"> <img src="shapes/s0x0_0x4_1x1_4x1_d2.svg" alt="B33 holding reply 3" width="239"> <img src="shapes/s0x0_0x4_1x1_4x1_d3.svg" alt="B33 holding reply 4" width="239"> <img src="shapes/s0x0_0x4_1x1_4x1_d4.svg" alt="B33 holding reply 5" width="239"> <img src="shapes/s0x0_0x4_1x1_4x1_d5.svg" alt="B33 holding reply 6" width="239">

</details>

### B34

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0.svg" alt="B34" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0_d0.svg" alt="B34 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm1_4x0_d1.svg" alt="B34 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 29% of replies hold · one stone is enough on the 12 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm1_4x0_map.svg" alt="B34 defence map" width="280"> <img src="shapes/s0x0_0x3_3xm1_4x0_d2.svg" alt="B34 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d3.svg" alt="B34 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d4.svg" alt="B34 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_3xm1_4x0_d5.svg" alt="B34 holding reply 6" width="250">

</details>

### B35

<table><tr><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1.svg" alt="B35" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1_d0.svg" alt="B35 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x4_0x8_3x1_d1.svg" alt="B35 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 34% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x4_0x8_3x1_map.svg" alt="B35 defence map" width="312"> <img src="shapes/s0x0_0x4_0x8_3x1_d2.svg" alt="B35 holding reply 3" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d3.svg" alt="B35 holding reply 4" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d4.svg" alt="B35 holding reply 5" width="239"> <img src="shapes/s0x0_0x4_0x8_3x1_d5.svg" alt="B35 holding reply 6" width="239">

</details>

### B36

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7.svg" alt="B36" width="239"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7_d0.svg" alt="B36 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_7xm7_d1.svg" alt="B36 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 7 · 34% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_7xm7_map.svg" alt="B36 defence map" width="270"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d2.svg" alt="B36 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d3.svg" alt="B36 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d4.svg" alt="B36 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm4_7xm7_d5.svg" alt="B36 holding reply 6" width="260">

</details>

### B37

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4.svg" alt="B37" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4_d0.svg" alt="B37 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm4_d1.svg" alt="B37 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 34% of replies hold · one stone is enough on the 13 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm4_4xm4_map.svg" alt="B37 defence map" width="270"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d2.svg" alt="B37 holding reply 3" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d3.svg" alt="B37 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d4.svg" alt="B37 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_3xm4_4xm4_d5.svg" alt="B37 holding reply 6" width="218">

</details>

### B38

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6.svg" alt="B38" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6_d0.svg" alt="B38 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm6_d1.svg" alt="B38 holding reply 2" width="250"><br>Holds</td></tr></table>

**Six on turn 7 · 37% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_6xm6_map.svg" alt="B38 defence map" width="270"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d2.svg" alt="B38 holding reply 3" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d3.svg" alt="B38 holding reply 4" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d4.svg" alt="B38 holding reply 5" width="250"> <img src="shapes/s0x0_0x1_4xm4_6xm6_d5.svg" alt="B38 holding reply 6" width="250">

</details>

### B39

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4.svg" alt="B39" width="187"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4_d0.svg" alt="B39 holding reply 1" width="229"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm4_d1.svg" alt="B39 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 37% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm2_4xm4_map.svg" alt="B39 defence map" width="291"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d2.svg" alt="B39 holding reply 3" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d3.svg" alt="B39 holding reply 4" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d4.svg" alt="B39 holding reply 5" width="229"> <img src="shapes/s0x0_0x3_3xm2_4xm4_d5.svg" alt="B39 holding reply 6" width="229">

</details>

### B40

<table><tr><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5.svg" alt="B40" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5_d0.svg" alt="B40 holding reply 1" width="302"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_4xm1_8xm5_d1.svg" alt="B40 holding reply 2" width="302"><br>Holds</td></tr></table>

**Six on turn 7 · 37% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_4xm1_8xm5_map.svg" alt="B40 defence map" width="374"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d2.svg" alt="B40 holding reply 3" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d3.svg" alt="B40 holding reply 4" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d4.svg" alt="B40 holding reply 5" width="302"> <img src="shapes/s0x0_0x3_4xm1_8xm5_d5.svg" alt="B40 holding reply 6" width="302">

</details>

### B41

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7.svg" alt="B41" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7_d0.svg" alt="B41 holding reply 1" width="280"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_8xm7_d1.svg" alt="B41 holding reply 2" width="280"><br>Holds</td></tr></table>

**Six on turn 7 · 38% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_8xm7_map.svg" alt="B41 defence map" width="364"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d2.svg" alt="B41 holding reply 3" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d3.svg" alt="B41 holding reply 4" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d4.svg" alt="B41 holding reply 5" width="280"> <img src="shapes/s0x0_0x1_4xm3_8xm7_d5.svg" alt="B41 holding reply 6" width="280">

</details>

### B42

<table><tr><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1.svg" alt="B42" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1_d0.svg" alt="B42 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x3_3xm2_4xm1_d1.svg" alt="B42 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 5 · 38% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x3_3xm2_4xm1_map.svg" alt="B42 defence map" width="312"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d2.svg" alt="B42 holding reply 3" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d3.svg" alt="B42 holding reply 4" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d4.svg" alt="B42 holding reply 5" width="260"> <img src="shapes/s0x0_0x3_3xm2_4xm1_d5.svg" alt="B42 holding reply 6" width="260">

</details>

### B43

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3.svg" alt="B43" width="218"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3_d0.svg" alt="B43 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_3xm4_4xm3_d1.svg" alt="B43 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 5 · 39% of replies hold · one stone is enough on the 16 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_3xm4_4xm3_map.svg" alt="B43 defence map" width="280"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d2.svg" alt="B43 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d3.svg" alt="B43 holding reply 4" width="229"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d4.svg" alt="B43 holding reply 5" width="229"> <img src="shapes/s0x0_0x1_3xm4_4xm3_d5.svg" alt="B43 holding reply 6" width="229">

</details>

### B44

<table><tr><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6.svg" alt="B44" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6_d0.svg" alt="B44 holding reply 1" width="302"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_4xm2_8xm6_d1.svg" alt="B44 holding reply 2" width="302"><br>Holds</td></tr></table>

**Six on turn 7 · 39% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_4xm2_8xm6_map.svg" alt="B44 defence map" width="374"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d2.svg" alt="B44 holding reply 3" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d3.svg" alt="B44 holding reply 4" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d4.svg" alt="B44 holding reply 5" width="302"> <img src="shapes/s0x0_0x2_4xm2_8xm6_d5.svg" alt="B44 holding reply 6" width="302">

</details>

### B45

<table><tr><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4.svg" alt="B45" width="197"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4_d0.svg" alt="B45 holding reply 1" width="218"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_2xm4_4xm4_d1.svg" alt="B45 holding reply 2" width="229"><br>Holds</td></tr></table>

**Six on turn 6 · 41% of replies hold · one stone is enough on the 18 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_2xm4_4xm4_map.svg" alt="B45 defence map" width="312"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d2.svg" alt="B45 holding reply 3" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d3.svg" alt="B45 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d4.svg" alt="B45 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_2xm4_4xm4_d5.svg" alt="B45 holding reply 6" width="218">

</details>

### B46

<table><tr><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4.svg" alt="B46" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4_d0.svg" alt="B46 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x2_1xm4_4xm4_d1.svg" alt="B46 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 41% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x2_1xm4_4xm4_map.svg" alt="B46 defence map" width="322"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d2.svg" alt="B46 holding reply 3" width="229"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d3.svg" alt="B46 holding reply 4" width="218"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d4.svg" alt="B46 holding reply 5" width="218"> <img src="shapes/s0x0_0x2_1xm4_4xm4_d5.svg" alt="B46 holding reply 6" width="218">

</details>

### B47

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4.svg" alt="B47" width="229"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4_d0.svg" alt="B47 holding reply 1" width="239"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm4_d1.svg" alt="B47 holding reply 2" width="239"><br>Holds</td></tr></table>

**Six on turn 6 · 42% of replies hold · one stone is enough on the 17 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_5xm4_map.svg" alt="B47 defence map" width="332"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d2.svg" alt="B47 holding reply 3" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d3.svg" alt="B47 holding reply 4" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d4.svg" alt="B47 holding reply 5" width="239"> <img src="shapes/s0x0_0x1_4xm4_5xm4_d5.svg" alt="B47 holding reply 6" width="239">

</details>

### B48

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3.svg" alt="B48" width="260"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3_d0.svg" alt="B48 holding reply 1" width="260"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm3_6xm3_d1.svg" alt="B48 holding reply 2" width="270"><br>Holds</td></tr></table>

**Six on turn 6 · 43% of replies hold · one stone is enough on the 18 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm3_6xm3_map.svg" alt="B48 defence map" width="343"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d2.svg" alt="B48 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d3.svg" alt="B48 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d4.svg" alt="B48 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm3_6xm3_d5.svg" alt="B48 holding reply 6" width="260">

</details>

### B49

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4.svg" alt="B49" width="208"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4_d0.svg" alt="B49 holding reply 1" width="250"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_1xm4_4xm4_d1.svg" alt="B49 holding reply 2" width="218"><br>Holds</td></tr></table>

**Six on turn 6 · 44% of replies hold · one stone is enough on the 19 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_1xm4_4xm4_map.svg" alt="B49 defence map" width="312"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d2.svg" alt="B49 holding reply 3" width="229"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d3.svg" alt="B49 holding reply 4" width="218"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d4.svg" alt="B49 holding reply 5" width="218"> <img src="shapes/s0x0_0x1_1xm4_4xm4_d5.svg" alt="B49 holding reply 6" width="218">

</details>

### B50

<table><tr><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4.svg" alt="B50" width="250"><br>Winning first turn</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4_d0.svg" alt="B50 holding reply 1" width="270"><br>Holds</td><td align="center"><img src="shapes/s0x0_0x1_4xm4_6xm4_d1.svg" alt="B50 holding reply 2" width="260"><br>Holds</td></tr></table>

**Six on turn 6 · 48% of replies hold · one stone is enough on the 21 dotted cells in the map below**

<details><summary>Defence map and more holding replies</summary>

<img src="shapes/s0x0_0x1_4xm4_6xm4_map.svg" alt="B50 defence map" width="332"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d2.svg" alt="B50 holding reply 3" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d3.svg" alt="B50 holding reply 4" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d4.svg" alt="B50 holding reply 5" width="260"> <img src="shapes/s0x0_0x1_4xm4_6xm4_d5.svg" alt="B50 holding reply 6" width="260">

</details>

</details>

## 4 stones containing a must-answer three

456 shapes, each with one reply that holds (or, where one stone is enough, the dotted cells it can go on). The cheat-sheet reply for a two-stone three inside holds only about 63% of the time, so answer the whole shape. With a two-stone three inside, a two-lines reply with one stone on a line joining the fourth stone to one of the other three, within 2 cells of the fourth stone, held every time (705 of 705). Shapes no reply holds are under [Unstoppable shapes](#unstoppable-shapes) instead. Grouped by the three inside (the first, if there are several), hardest first.

<details><summary>A1 · Triangle 1+1 plus a stone (4)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1x0_3xm1_reply.svg" alt="A1.1" width="135"><br><b>A1.1</b> <sub>0.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x0_reply.svg" alt="A1.2" width="156"><br><b>A1.2</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x0_reply.svg" alt="A1.3" width="146"><br><b>A1.3</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_1x0_reply.svg" alt="A1.4" width="124"><br><b>A1.4</b> <sub>2.0% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A2 · Triangle 1+2 plus a stone (43)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm3_1x0_reply.svg" alt="A2.1" width="114"><br><b>A2.1</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U39)</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_1x0_reply.svg" alt="A2.2" width="104"><br><b>A2.2</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U28)</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2x0_reply.svg" alt="A2.3" width="104"><br><b>A2.3</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U34)</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2xm1_reply.svg" alt="A2.4" width="124"><br><b>A2.4</b> <sub>0.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2xm1_reply.svg" alt="A2.5" width="114"><br><b>A2.5</b> <sub>0.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_3xm3_reply.svg" alt="A2.6" width="104"><br><b>A2.6</b> <sub>0.3% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm1_3x0_reply.svg" alt="A2.7" width="146"><br><b>A2.7</b> <sub>0.3% hold · this pair holds · stops the forced win only: unstoppable (U27)</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_2xm1_reply.svg" alt="A2.8" width="135"><br><b>A2.8</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm1_reply.svg" alt="A2.9" width="135"><br><b>A2.9</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm2_reply.svg" alt="A2.10" width="104"><br><b>A2.10</b> <sub>0.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x1_reply.svg" alt="A2.11" width="124"><br><b>A2.11</b> <sub>0.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2x0_reply.svg" alt="A2.12" width="146"><br><b>A2.12</b> <sub>0.8% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_2xm1_reply.svg" alt="A2.13" width="114"><br><b>A2.13</b> <sub>0.9% hold · this pair holds · stops the forced win only: unstoppable (U45)</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x2_reply.svg" alt="A2.14" width="104"><br><b>A2.14</b> <sub>0.9% hold · this pair holds · stops the forced win only: unstoppable (U15)</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm1_reply.svg" alt="A2.15" width="146"><br><b>A2.15</b> <sub>0.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2xm1_reply.svg" alt="A2.16" width="104"><br><b>A2.16</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2x0_reply.svg" alt="A2.17" width="124"><br><b>A2.17</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm3_reply.svg" alt="A2.18" width="104"><br><b>A2.18</b> <sub>1.2% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x4_1x1_reply.svg" alt="A2.19" width="135"><br><b>A2.19</b> <sub>1.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_3xm2_reply.svg" alt="A2.20" width="146"><br><b>A2.20</b> <sub>1.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm1_reply.svg" alt="A2.21" width="124"><br><b>A2.21</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm3_reply.svg" alt="A2.22" width="156"><br><b>A2.22</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2x0_reply.svg" alt="A2.23" width="146"><br><b>A2.23</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_5xm1_reply.svg" alt="A2.24" width="166"><br><b>A2.24</b> <sub>1.8% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_1x1_reply.svg" alt="A2.25" width="124"><br><b>A2.25</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm3_reply.svg" alt="A2.26" width="135"><br><b>A2.26</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_6xm1_reply.svg" alt="A2.27" width="197"><br><b>A2.27</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_6xm5_reply.svg" alt="A2.28" width="156"><br><b>A2.28</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm2_reply.svg" alt="A2.29" width="166"><br><b>A2.29</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x1_reply.svg" alt="A2.30" width="114"><br><b>A2.30</b> <sub>2.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm1_5xm4_reply.svg" alt="A2.31" width="146"><br><b>A2.31</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x0_reply.svg" alt="A2.32" width="146"><br><b>A2.32</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2xm1_reply.svg" alt="A2.33" width="135"><br><b>A2.33</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_5xm4_reply.svg" alt="A2.34" width="166"><br><b>A2.34</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x0_reply.svg" alt="A2.35" width="156"><br><b>A2.35</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm5_2xm1_reply.svg" alt="A2.36" width="114"><br><b>A2.36</b> <sub>2.3% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm4_1x0_reply.svg" alt="A2.37" width="124"><br><b>A2.37</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1x0_4xm4_reply.svg" alt="A2.38" width="146"><br><b>A2.38</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2xm1_reply.svg" alt="A2.39" width="114"><br><b>A2.39</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4x1_reply.svg" alt="A2.40" width="177"><br><b>A2.40</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm2_reply.svg" alt="A2.41" width="146"><br><b>A2.41</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_4x0_reply.svg" alt="A2.42" width="166"><br><b>A2.42</b> <sub>2.7% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm1_4xm4_reply.svg" alt="A2.43" width="124"><br><b>A2.43</b> <sub>2.8% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A3 · Triangle 1+3 plus a stone (46)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x3_1xm3_1x0_reply.svg" alt="A3.1" width="124"><br><b>A3.1</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U43)</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3x0_reply.svg" alt="A3.2" width="124"><br><b>A3.2</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U41)</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3xm2_reply.svg" alt="A3.3" width="104"><br><b>A3.3</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_3xm1_reply.svg" alt="A3.4" width="135"><br><b>A3.4</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x1_reply.svg" alt="A3.5" width="104"><br><b>A3.5</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U16)</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm3_reply.svg" alt="A3.6" width="104"><br><b>A3.6</b> <sub>0.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm2_reply.svg" alt="A3.7" width="124"><br><b>A3.7</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_3xm2_reply.svg" alt="A3.8" width="146"><br><b>A3.8</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm2_reply.svg" alt="A3.9" width="146"><br><b>A3.9</b> <sub>0.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm1_reply.svg" alt="A3.10" width="135"><br><b>A3.10</b> <sub>0.9% hold · this pair holds · stops the forced win only: unstoppable (U49)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3x0_reply.svg" alt="A3.11" width="166"><br><b>A3.11</b> <sub>1.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x2_reply.svg" alt="A3.12" width="135"><br><b>A3.12</b> <sub>1.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm2_reply.svg" alt="A3.13" width="166"><br><b>A3.13</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3xm2_reply.svg" alt="A3.14" width="146"><br><b>A3.14</b> <sub>1.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x1_reply.svg" alt="A3.15" width="135"><br><b>A3.15</b> <sub>1.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm2_reply.svg" alt="A3.16" width="146"><br><b>A3.16</b> <sub>1.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_3xm3_reply.svg" alt="A3.17" width="124"><br><b>A3.17</b> <sub>1.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_2xm1_reply.svg" alt="A3.18" width="135"><br><b>A3.18</b> <sub>1.4% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1x0_3xm1_reply.svg" alt="A3.19" width="114"><br><b>A3.19</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm2_reply.svg" alt="A3.20" width="146"><br><b>A3.20</b> <sub>1.6% hold · this pair holds · stops the forced win only: unstoppable (U50)</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x2_reply.svg" alt="A3.21" width="135"><br><b>A3.21</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm3_reply.svg" alt="A3.22" width="114"><br><b>A3.22</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_3x0_reply.svg" alt="A3.23" width="146"><br><b>A3.23</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_3xm2_reply.svg" alt="A3.24" width="135"><br><b>A3.24</b> <sub>1.9% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_1x2_reply.svg" alt="A3.25" width="124"><br><b>A3.25</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm3_reply.svg" alt="A3.26" width="135"><br><b>A3.26</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_7xm6_reply.svg" alt="A3.27" width="156"><br><b>A3.27</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_7xm2_reply.svg" alt="A3.28" width="197"><br><b>A3.28</b> <sub>2.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3xm2_reply.svg" alt="A3.29" width="124"><br><b>A3.29</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm6_3xm2_reply.svg" alt="A3.30" width="114"><br><b>A3.30</b> <sub>2.8% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1x0_5xm4_reply.svg" alt="A3.31" width="146"><br><b>A3.31</b> <sub>2.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm4_1x0_reply.svg" alt="A3.32" width="114"><br><b>A3.32</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm4_reply.svg" alt="A3.33" width="135"><br><b>A3.33</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3x0_reply.svg" alt="A3.34" width="166"><br><b>A3.34</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_6xm5_reply.svg" alt="A3.35" width="146"><br><b>A3.35</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm1_reply.svg" alt="A3.36" width="156"><br><b>A3.36</b> <sub>2.9% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_4xm1_reply.svg" alt="A3.37" width="146"><br><b>A3.37</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x0_reply.svg" alt="A3.38" width="166"><br><b>A3.38</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x0_4xm4_reply.svg" alt="A3.39" width="124"><br><b>A3.39</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_6xm2_reply.svg" alt="A3.40" width="166"><br><b>A3.40</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4x1_reply.svg" alt="A3.41" width="166"><br><b>A3.41</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3xm2_reply.svg" alt="A3.42" width="114"><br><b>A3.42</b> <sub>3.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm2_4x0_reply.svg" alt="A3.43" width="156"><br><b>A3.43</b> <sub>3.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x3_reply.svg" alt="A3.44" width="124"><br><b>A3.44</b> <sub>3.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_4xm4_reply.svg" alt="A3.45" width="114"><br><b>A3.45</b> <sub>3.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_5xm3_reply.svg" alt="A3.46" width="146"><br><b>A3.46</b> <sub>3.9% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A4 · Triangle 2+2 plus a stone (6)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x0_reply.svg" alt="A4.1" width="124"><br><b>A4.1</b> <sub>0.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2x0_4xm1_reply.svg" alt="A4.2" width="177"><br><b>A4.2</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x0_reply.svg" alt="A4.3" width="166"><br><b>A4.3</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2x0_reply.svg" alt="A4.4" width="146"><br><b>A4.4</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x0_reply.svg" alt="A4.5" width="156"><br><b>A4.5</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2x0_reply.svg" alt="A4.6" width="146"><br><b>A4.6</b> <sub>2.5% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A5 · Triangle 2+3 plus a stone (48)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm3_2x0_reply.svg" alt="A5.1" width="124"><br><b>A5.1</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U44)</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x0_reply.svg" alt="A5.2" width="124"><br><b>A5.2</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3xm1_reply.svg" alt="A5.3" width="114"><br><b>A5.3</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_3x0_reply.svg" alt="A5.4" width="124"><br><b>A5.4</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm3_reply.svg" alt="A5.5" width="104"><br><b>A5.5</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm2_3x0_reply.svg" alt="A5.6" width="124"><br><b>A5.6</b> <sub>0.2% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x1_reply.svg" alt="A5.7" width="114"><br><b>A5.7</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_3xm1_reply.svg" alt="A5.8" width="124"><br><b>A5.8</b> <sub>0.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm4_3xm1_reply.svg" alt="A5.9" width="135"><br><b>A5.9</b> <sub>0.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_3xm3_reply.svg" alt="A5.10" width="124"><br><b>A5.10</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_3x0_reply.svg" alt="A5.11" width="146"><br><b>A5.11</b> <sub>1.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm2_reply.svg" alt="A5.12" width="104"><br><b>A5.12</b> <sub>1.4% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2x0_3xm1_reply.svg" alt="A5.13" width="156"><br><b>A5.13</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3x1_reply.svg" alt="A5.14" width="166"><br><b>A5.14</b> <sub>1.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3x0_reply.svg" alt="A5.15" width="146"><br><b>A5.15</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm1_reply.svg" alt="A5.16" width="135"><br><b>A5.16</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm2_reply.svg" alt="A5.17" width="166"><br><b>A5.17</b> <sub>1.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x1_reply.svg" alt="A5.18" width="146"><br><b>A5.18</b> <sub>1.9% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm4_reply.svg" alt="A5.19" width="124"><br><b>A5.19</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_5xm3_reply.svg" alt="A5.20" width="177"><br><b>A5.20</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2x0_reply.svg" alt="A5.21" width="146"><br><b>A5.21</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3x0_reply.svg" alt="A5.22" width="166"><br><b>A5.22</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x1_reply.svg" alt="A5.23" width="135"><br><b>A5.23</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_3xm3_reply.svg" alt="A5.24" width="124"><br><b>A5.24</b> <sub>2.2% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm1_7xm5_reply.svg" alt="A5.25" width="156"><br><b>A5.25</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x3_reply.svg" alt="A5.26" width="135"><br><b>A5.26</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3x0_reply.svg" alt="A5.27" width="166"><br><b>A5.27</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_3x0_reply.svg" alt="A5.28" width="166"><br><b>A5.28</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_7xm1_reply.svg" alt="A5.29" width="197"><br><b>A5.29</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x2_reply.svg" alt="A5.30" width="146"><br><b>A5.30</b> <sub>2.5% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_2x1_reply.svg" alt="A5.31" width="124"><br><b>A5.31</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_6xm4_reply.svg" alt="A5.32" width="187"><br><b>A5.32</b> <sub>2.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_6xm4_reply.svg" alt="A5.33" width="146"><br><b>A5.33</b> <sub>2.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3xm1_reply.svg" alt="A5.34" width="124"><br><b>A5.34</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x2_reply.svg" alt="A5.35" width="135"><br><b>A5.35</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm5_3xm1_reply.svg" alt="A5.36" width="114"><br><b>A5.36</b> <sub>2.7% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm1_6xm1_reply.svg" alt="A5.37" width="197"><br><b>A5.37</b> <sub>2.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm1_reply.svg" alt="A5.38" width="177"><br><b>A5.38</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2x0_4xm4_reply.svg" alt="A5.39" width="146"><br><b>A5.39</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm4_2x0_reply.svg" alt="A5.40" width="146"><br><b>A5.40</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm4_3x0_reply.svg" alt="A5.41" width="166"><br><b>A5.41</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4x2_reply.svg" alt="A5.42" width="166"><br><b>A5.42</b> <sub>3.0% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x4_3xm1_reply.svg" alt="A5.43" width="124"><br><b>A5.43</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3xm1_reply.svg" alt="A5.44" width="114"><br><b>A5.44</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4x0_reply.svg" alt="A5.45" width="146"><br><b>A5.45</b> <sub>3.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4xm4_reply.svg" alt="A5.46" width="135"><br><b>A5.46</b> <sub>3.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_4xm3_reply.svg" alt="A5.47" width="114"><br><b>A5.47</b> <sub>3.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm1_5xm2_reply.svg" alt="A5.48" width="146"><br><b>A5.48</b> <sub>3.8% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A6 · Triangle 3+3 plus a stone (10)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x3_3xm3_3x0_reply.svg" alt="A6.1" width="124"><br><b>A6.1</b> <sub>under 0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_3x0_reply.svg" alt="A6.2" width="124"><br><b>A6.2</b> <sub>0.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3x0_reply.svg" alt="A6.3" width="124"><br><b>A6.3</b> <sub>0.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3x2_reply.svg" alt="A6.4" width="166"><br><b>A6.4</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_3x0_reply.svg" alt="A6.5" width="135"><br><b>A6.5</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_3x0_reply.svg" alt="A6.6" width="166"><br><b>A6.6</b> <sub>2.6% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x6_3x0_reply.svg" alt="A6.7" width="166"><br><b>A6.7</b> <sub>2.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3x1_reply.svg" alt="A6.8" width="166"><br><b>A6.8</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_3xm4_3x0_reply.svg" alt="A6.9" width="166"><br><b>A6.9</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_3x0_5xm1_reply.svg" alt="A6.10" width="197"><br><b>A6.10</b> <sub>3.7% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A7 · Chevron 1+1 plus a stone (17)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_1xm1_reply.svg" alt="A7.1" width="114"><br><b>A7.1</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U9)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_2x1_reply.svg" alt="A7.2" width="135"><br><b>A7.2</b> <sub>0.2% hold · this pair holds · stops the forced win only: unstoppable (U17)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_3x1_reply.svg" alt="A7.3" width="156"><br><b>A7.3</b> <sub>1.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_1xm1_reply.svg" alt="A7.4" width="114"><br><b>A7.4</b> <sub>1.0% hold · this pair holds · stops the forced win only: unstoppable (U7)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_2xm3_reply.svg" alt="A7.5" width="104"><br><b>A7.5</b> <sub>1.1% hold · this pair holds · stops the forced win only: unstoppable (U24)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm4_1xm1_reply.svg" alt="A7.6" width="104"><br><b>A7.6</b> <sub>1.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm1_2xm1_reply.svg" alt="A7.7" width="124"><br><b>A7.7</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1xm1_reply.svg" alt="A7.8" width="124"><br><b>A7.8</b> <sub>1.3% hold · this pair holds · stops the forced win only: unstoppable (U20)</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_1x1_reply.svg" alt="A7.9" width="146"><br><b>A7.9</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm5_1xm1_reply.svg" alt="A7.10" width="104"><br><b>A7.10</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1xm1_reply.svg" alt="A7.11" width="135"><br><b>A7.11</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_2xm1_reply.svg" alt="A7.12" width="124"><br><b>A7.12</b> <sub>2.2% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1x0_2xm1_reply.svg" alt="A7.13" width="146"><br><b>A7.13</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_4x1_reply.svg" alt="A7.14" width="177"><br><b>A7.14</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1xm1_reply.svg" alt="A7.15" width="124"><br><b>A7.15</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x1_reply.svg" alt="A7.16" width="146"><br><b>A7.16</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_4x0_reply.svg" alt="A7.17" width="166"><br><b>A7.17</b> <sub>2.6% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A8 · Chevron 1+2 plus a stone (36)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1xm1_3xm1_reply.svg" alt="A8.1" width="124"><br><b>A8.1</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U38)</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2xm2_reply.svg" alt="A8.2" width="146"><br><b>A8.2</b> <sub>under 0.1% hold · this pair holds · stops the forced win only: unstoppable (U30)</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_1xm1_reply.svg" alt="A8.3" width="94"><br><b>A8.3</b> <sub>0.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_2xm2_reply.svg" alt="A8.4" width="104"><br><b>A8.4</b> <sub>0.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm2_reply.svg" alt="A8.5" width="146"><br><b>A8.5</b> <sub>0.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_1xm1_reply.svg" alt="A8.6" width="114"><br><b>A8.6</b> <sub>1.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm1_2xm3_reply.svg" alt="A8.7" width="114"><br><b>A8.7</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm1_reply.svg" alt="A8.8" width="124"><br><b>A8.8</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_5xm2_reply.svg" alt="A8.9" width="166"><br><b>A8.9</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2x1_reply.svg" alt="A8.10" width="146"><br><b>A8.10</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3x1_reply.svg" alt="A8.11" width="146"><br><b>A8.11</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm1_3xm1_reply.svg" alt="A8.12" width="135"><br><b>A8.12</b> <sub>1.3% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1xm2_3xm2_reply.svg" alt="A8.13" width="114"><br><b>A8.13</b> <sub>1.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm3_2xm2_reply.svg" alt="A8.14" width="114"><br><b>A8.14</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_3xm4_reply.svg" alt="A8.15" width="114"><br><b>A8.15</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2xm2_reply.svg" alt="A8.16" width="146"><br><b>A8.16</b> <sub>1.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm5_2xm2_reply.svg" alt="A8.17" width="114"><br><b>A8.17</b> <sub>1.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_1x3_reply.svg" alt="A8.18" width="146"><br><b>A8.18</b> <sub>1.8% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_2xm2_reply.svg" alt="A8.19" width="146"><br><b>A8.19</b> <sub>1.9% hold · this pair holds · stops the forced win only: unstoppable (U48)</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm3_2x1_reply.svg" alt="A8.20" width="146"><br><b>A8.20</b> <sub>2.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x2_reply.svg" alt="A8.21" width="146"><br><b>A8.21</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm3_reply.svg" alt="A8.22" width="146"><br><b>A8.22</b> <sub>2.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_6xm2_reply.svg" alt="A8.23" width="187"><br><b>A8.23</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2xm2_reply.svg" alt="A8.24" width="135"><br><b>A8.24</b> <sub>2.8% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_6xm6_reply.svg" alt="A8.25" width="146"><br><b>A8.25</b> <sub>2.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm5_1xm1_reply.svg" alt="A8.26" width="114"><br><b>A8.26</b> <sub>2.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm6_2xm2_reply.svg" alt="A8.27" width="104"><br><b>A8.27</b> <sub>2.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_3xm1_reply.svg" alt="A8.28" width="146"><br><b>A8.28</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4x1_reply.svg" alt="A8.29" width="177"><br><b>A8.29</b> <sub>3.0% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_3xm1_reply.svg" alt="A8.30" width="114"><br><b>A8.30</b> <sub>3.1% hold · this pair holds</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_2xm2_5xm5_reply.svg" alt="A8.31" width="135"><br><b>A8.31</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4xm4_reply.svg" alt="A8.32" width="124"><br><b>A8.32</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_3xm2_reply.svg" alt="A8.33" width="124"><br><b>A8.33</b> <sub>3.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2xm2_reply.svg" alt="A8.34" width="104"><br><b>A8.34</b> <sub>3.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_2x1_reply.svg" alt="A8.35" width="114"><br><b>A8.35</b> <sub>3.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_4x0_reply.svg" alt="A8.36" width="166"><br><b>A8.36</b> <sub>3.5% hold · this pair holds</sub></td></tr>
</table>

</details>

<details><summary>A9 · Chevron 1+3 plus a stone (35)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm3_reply.svg" alt="A9.1" width="114"><br><b>A9.1</b> <sub>1.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm4_3xm3_reply.svg" alt="A9.2" width="114"><br><b>A9.2</b> <sub>2.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_3x1_reply.svg" alt="A9.3" width="166"><br><b>A9.3</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm3_reply.svg" alt="A9.4" width="135"><br><b>A9.4</b> <sub>4.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm4_3xm3_reply.svg" alt="A9.5" width="124"><br><b>A9.5</b> <sub>4.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm1_3xm2_reply.svg" alt="A9.6" width="124"><br><b>A9.6</b> <sub>5.0% hold · 1 one-stone cell</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_3xm3_reply.svg" alt="A9.7" width="114"><br><b>A9.7</b> <sub>8.1% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_3xm3_reply.svg" alt="A9.8" width="114"><br><b>A9.8</b> <sub>9.0% hold · 3 one-stone cells · stops the forced win only: unstoppable (U52)</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x3_reply.svg" alt="A9.9" width="135"><br><b>A9.9</b> <sub>9.8% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm1_2xm3_reply.svg" alt="A9.10" width="114"><br><b>A9.10</b> <sub>11% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm4_1xm1_reply.svg" alt="A9.11" width="114"><br><b>A9.11</b> <sub>12% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm1_4xm1_reply.svg" alt="A9.12" width="156"><br><b>A9.12</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_3x1_reply.svg" alt="A9.13" width="156"><br><b>A9.13</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_3xm3_reply.svg" alt="A9.14" width="135"><br><b>A9.14</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm6_3xm3_reply.svg" alt="A9.15" width="124"><br><b>A9.15</b> <sub>18% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm3_reply.svg" alt="A9.16" width="166"><br><b>A9.16</b> <sub>20% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm2_reply.svg" alt="A9.17" width="146"><br><b>A9.17</b> <sub>20% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm3_reply.svg" alt="A9.18" width="146"><br><b>A9.18</b> <sub>21% hold · 7 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm5_reply.svg" alt="A9.19" width="146"><br><b>A9.19</b> <sub>22% hold · 8 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_7xm7_reply.svg" alt="A9.20" width="166"><br><b>A9.20</b> <sub>22% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x4_reply.svg" alt="A9.21" width="187"><br><b>A9.21</b> <sub>23% hold · 8 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3xm3_reply.svg" alt="A9.22" width="146"><br><b>A9.22</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_6xm6_reply.svg" alt="A9.23" width="156"><br><b>A9.23</b> <sub>24% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm5_1xm1_reply.svg" alt="A9.24" width="146"><br><b>A9.24</b> <sub>24% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm1_4xm1_reply.svg" alt="A9.25" width="208"><br><b>A9.25</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm7_3xm3_reply.svg" alt="A9.26" width="146"><br><b>A9.26</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_7xm3_reply.svg" alt="A9.27" width="208"><br><b>A9.27</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4x1_reply.svg" alt="A9.28" width="187"><br><b>A9.28</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x0_4xm3_reply.svg" alt="A9.29" width="187"><br><b>A9.29</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_4xm1_reply.svg" alt="A9.30" width="208"><br><b>A9.30</b> <sub>26% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_6xm3_reply.svg" alt="A9.31" width="187"><br><b>A9.31</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_3x1_reply.svg" alt="A9.32" width="208"><br><b>A9.32</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4x0_reply.svg" alt="A9.33" width="177"><br><b>A9.33</b> <sub>27% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_4xm5_reply.svg" alt="A9.34" width="146"><br><b>A9.34</b> <sub>29% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_5xm4_reply.svg" alt="A9.35" width="156"><br><b>A9.35</b> <sub>29% hold · 11 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A10 · Chevron 2+2 plus a stone (20)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_2xm4_2xm2_4xm2_reply.svg" alt="A10.1" width="146"><br><b>A10.1</b> <sub>2.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2xm2_reply.svg" alt="A10.2" width="94"><br><b>A10.2</b> <sub>3.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_2xm5_2xm2_4xm2_reply.svg" alt="A10.3" width="146"><br><b>A10.3</b> <sub>4.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_3xm4_reply.svg" alt="A10.4" width="104"><br><b>A10.4</b> <sub>4.9% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_3xm2_reply.svg" alt="A10.5" width="124"><br><b>A10.5</b> <sub>4.9% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2x3_reply.svg" alt="A10.6" width="146"><br><b>A10.6</b> <sub>9.4% hold · 3 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm5_2xm2_reply.svg" alt="A10.7" width="114"><br><b>A10.7</b> <sub>10% hold · 2 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x2_reply.svg" alt="A10.8" width="135"><br><b>A10.8</b> <sub>11% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2xm2_reply.svg" alt="A10.9" width="114"><br><b>A10.9</b> <sub>12% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm3_2xm2_reply.svg" alt="A10.10" width="124"><br><b>A10.10</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x2_reply.svg" alt="A10.11" width="146"><br><b>A10.11</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2xm2_reply.svg" alt="A10.12" width="135"><br><b>A10.12</b> <sub>15% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm2_3x2_reply.svg" alt="A10.13" width="166"><br><b>A10.13</b> <sub>16% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_2x2_reply.svg" alt="A10.14" width="146"><br><b>A10.14</b> <sub>16% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_2xm6_2xm2_4xm2_reply.svg" alt="A10.15" width="187"><br><b>A10.15</b> <sub>22% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2xm2_reply.svg" alt="A10.16" width="146"><br><b>A10.16</b> <sub>22% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm6_2xm2_reply.svg" alt="A10.17" width="124"><br><b>A10.17</b> <sub>22% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_4x2_reply.svg" alt="A10.18" width="187"><br><b>A10.18</b> <sub>22% hold · 10 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_2x0_4xm2_reply.svg" alt="A10.19" width="187"><br><b>A10.19</b> <sub>23% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_4x0_reply.svg" alt="A10.20" width="166"><br><b>A10.20</b> <sub>25% hold · 10 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A11 · Chevron 2+3 plus a stone (38)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_3xm3_reply.svg" alt="A11.1" width="104"><br><b>A11.1</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm3_reply.svg" alt="A11.2" width="114"><br><b>A11.2</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_3x2_reply.svg" alt="A11.3" width="146"><br><b>A11.3</b> <sub>2.5% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x3_reply.svg" alt="A11.4" width="135"><br><b>A11.4</b> <sub>10% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_3x3_reply.svg" alt="A11.5" width="166"><br><b>A11.5</b> <sub>11% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm5_3xm3_reply.svg" alt="A11.6" width="135"><br><b>A11.6</b> <sub>12% hold · 2 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_1xm3_2xm2_reply.svg" alt="A11.7" width="124"><br><b>A11.7</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm2_reply.svg" alt="A11.8" width="187"><br><b>A11.8</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_4xm2_reply.svg" alt="A11.9" width="146"><br><b>A11.9</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3x2_reply.svg" alt="A11.10" width="166"><br><b>A11.10</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm2_3xm4_reply.svg" alt="A11.11" width="124"><br><b>A11.11</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm5_2xm2_reply.svg" alt="A11.12" width="124"><br><b>A11.12</b> <sub>15% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x1_reply.svg" alt="A11.13" width="156"><br><b>A11.13</b> <sub>17% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_2xm5_2xm2_5xm2_reply.svg" alt="A11.14" width="166"><br><b>A11.14</b> <sub>17% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_3xm3_reply.svg" alt="A11.15" width="135"><br><b>A11.15</b> <sub>19% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_3x2_reply.svg" alt="A11.16" width="166"><br><b>A11.16</b> <sub>19% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4xm2_reply.svg" alt="A11.17" width="146"><br><b>A11.17</b> <sub>19% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_5xm3_reply.svg" alt="A11.18" width="166"><br><b>A11.18</b> <sub>22% hold · 8 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x6_3x2_reply.svg" alt="A11.19" width="208"><br><b>A11.19</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_3xm3_reply.svg" alt="A11.20" width="146"><br><b>A11.20</b> <sub>27% hold · 12 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_3xm3_reply.svg" alt="A11.21" width="146"><br><b>A11.21</b> <sub>27% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm6_3xm3_reply.svg" alt="A11.22" width="146"><br><b>A11.22</b> <sub>31% hold · 14 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_7xm3_reply.svg" alt="A11.23" width="229"><br><b>A11.23</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm7_3xm3_reply.svg" alt="A11.24" width="187"><br><b>A11.24</b> <sub>34% hold · 17 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm6_2xm2_reply.svg" alt="A11.25" width="187"><br><b>A11.25</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_3xm3_reply.svg" alt="A11.26" width="187"><br><b>A11.26</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_7xm7_reply.svg" alt="A11.27" width="187"><br><b>A11.27</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_2xm6_2xm2_5xm2_reply.svg" alt="A11.28" width="208"><br><b>A11.28</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4x2_reply.svg" alt="A11.29" width="218"><br><b>A11.29</b> <sub>34% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_5xm3_reply.svg" alt="A11.30" width="208"><br><b>A11.30</b> <sub>35% hold · 17 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_3x0_5xm2_reply.svg" alt="A11.31" width="208"><br><b>A11.31</b> <sub>36% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_6xm3_reply.svg" alt="A11.32" width="208"><br><b>A11.32</b> <sub>36% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_6xm6_reply.svg" alt="A11.33" width="187"><br><b>A11.33</b> <sub>36% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x4_reply.svg" alt="A11.34" width="208"><br><b>A11.34</b> <sub>37% hold · 15 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x5_reply.svg" alt="A11.35" width="208"><br><b>A11.35</b> <sub>37% hold · 16 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_4x0_reply.svg" alt="A11.36" width="197"><br><b>A11.36</b> <sub>38% hold · 17 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_3xm3_4xm5_reply.svg" alt="A11.37" width="187"><br><b>A11.37</b> <sub>39% hold · 17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_5xm4_reply.svg" alt="A11.38" width="187"><br><b>A11.38</b> <sub>39% hold · 17 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A12 · Line 1+2 plus a stone (13)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_1xm2_reply.svg" alt="A12.1" width="114"><br><b>A12.1</b> <sub>8.9% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_2x2_reply.svg" alt="A12.2" width="135"><br><b>A12.2</b> <sub>9.4% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x3_0x7_reply.svg" alt="A12.3" width="146"><br><b>A12.3</b> <sub>9.6% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x3_0x6_reply.svg" alt="A12.4" width="135"><br><b>A12.4</b> <sub>10% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm4_reply.svg" alt="A12.5" width="135"><br><b>A12.5</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x3_reply.svg" alt="A12.6" width="197"><br><b>A12.6</b> <sub>12% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_1x4_reply.svg" alt="A12.7" width="135"><br><b>A12.7</b> <sub>12% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_0x7_reply.svg" alt="A12.8" width="156"><br><b>A12.8</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm3_reply.svg" alt="A12.9" width="135"><br><b>A12.9</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x1_reply.svg" alt="A12.10" width="177"><br><b>A12.10</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4xm1_reply.svg" alt="A12.11" width="156"><br><b>A12.11</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x3_4x0_reply.svg" alt="A12.12" width="166"><br><b>A12.12</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x3_0x6_reply.svg" alt="A12.13" width="146"><br><b>A12.13</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A13 · One-gap pair + 1 (2,3) plus a stone (33)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm3_2xm1_reply.svg" alt="A13.1" width="114"><br><b>A13.1</b> <sub>1.1% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_2x1_reply.svg" alt="A13.2" width="135"><br><b>A13.2</b> <sub>1.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm4_2xm1_reply.svg" alt="A13.3" width="104"><br><b>A13.3</b> <sub>2.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm2_reply.svg" alt="A13.4" width="124"><br><b>A13.4</b> <sub>3.9% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_5xm1_reply.svg" alt="A13.5" width="166"><br><b>A13.5</b> <sub>4.6% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_3xm1_reply.svg" alt="A13.6" width="114"><br><b>A13.6</b> <sub>4.6% hold · 1 one-stone cell</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm3_reply.svg" alt="A13.7" width="114"><br><b>A13.7</b> <sub>5.2% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_3xm2_reply.svg" alt="A13.8" width="104"><br><b>A13.8</b> <sub>5.5% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2x1_reply.svg" alt="A13.9" width="114"><br><b>A13.9</b> <sub>7.4% hold · 2 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x1_reply.svg" alt="A13.10" width="114"><br><b>A13.10</b> <sub>9.1% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_2xm1_reply.svg" alt="A13.11" width="114"><br><b>A13.11</b> <sub>10.0% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2x1_reply.svg" alt="A13.12" width="135"><br><b>A13.12</b> <sub>11% hold · 4 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_6xm1_reply.svg" alt="A13.13" width="197"><br><b>A13.13</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm3_2xm2_reply.svg" alt="A13.14" width="124"><br><b>A13.14</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_6xm5_reply.svg" alt="A13.15" width="156"><br><b>A13.15</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_3xm2_reply.svg" alt="A13.16" width="187"><br><b>A13.16</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_2xm1_reply.svg" alt="A13.17" width="146"><br><b>A13.17</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm5_2xm1_reply.svg" alt="A13.18" width="124"><br><b>A13.18</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_4x2_reply.svg" alt="A13.19" width="187"><br><b>A13.19</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_3xm2_reply.svg" alt="A13.20" width="187"><br><b>A13.20</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm3_2x1_reply.svg" alt="A13.21" width="135"><br><b>A13.21</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_2x0_reply.svg" alt="A13.22" width="187"><br><b>A13.22</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_5xm4_reply.svg" alt="A13.23" width="146"><br><b>A13.23</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_3xm1_reply.svg" alt="A13.24" width="135"><br><b>A13.24</b> <sub>14% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_0x5_2xm1_reply.svg" alt="A13.25" width="135"><br><b>A13.25</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_3xm5_reply.svg" alt="A13.26" width="124"><br><b>A13.26</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm4_reply.svg" alt="A13.27" width="124"><br><b>A13.27</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1x1_2xm2_reply.svg" alt="A13.28" width="124"><br><b>A13.28</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm3_2xm2_3xm1_reply.svg" alt="A13.29" width="135"><br><b>A13.29</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2x1_reply.svg" alt="A13.30" width="135"><br><b>A13.30</b> <sub>14% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_4x0_reply.svg" alt="A13.31" width="166"><br><b>A13.31</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2xm1_reply.svg" alt="A13.32" width="124"><br><b>A13.32</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm1_4xm2_reply.svg" alt="A13.33" width="146"><br><b>A13.33</b> <sub>15% hold · 5 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A14 · One-gap pair + 1 (2,4) plus a stone (29)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm4_1xm2_reply.svg" alt="A14.1" width="104"><br><b>A14.1</b> <sub>2.8% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm4_1xm2_reply.svg" alt="A14.2" width="104"><br><b>A14.2</b> <sub>3.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm2_reply.svg" alt="A14.3" width="146"><br><b>A14.3</b> <sub>6.5% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1x3_reply.svg" alt="A14.4" width="114"><br><b>A14.4</b> <sub>9.4% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_1xm2_reply.svg" alt="A14.5" width="114"><br><b>A14.5</b> <sub>9.9% hold · 3 one-stone cells · stops the forced win only: unstoppable (U47)</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm3_reply.svg" alt="A14.6" width="114"><br><b>A14.6</b> <sub>12% hold · 4 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_3xm4_reply.svg" alt="A14.7" width="114"><br><b>A14.7</b> <sub>13% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1x3_reply.svg" alt="A14.8" width="135"><br><b>A14.8</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x4_1xm2_reply.svg" alt="A14.9" width="135"><br><b>A14.9</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_1x3_reply.svg" alt="A14.10" width="135"><br><b>A14.10</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm6_reply.svg" alt="A14.11" width="124"><br><b>A14.11</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_1xm2_reply.svg" alt="A14.12" width="146"><br><b>A14.12</b> <sub>16% hold · 6 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm4_1xm2_2xm1_reply.svg" alt="A14.13" width="135"><br><b>A14.13</b> <sub>18% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_3xm4_reply.svg" alt="A14.14" width="114"><br><b>A14.14</b> <sub>18% hold · 7 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_5xm6_reply.svg" alt="A14.15" width="146"><br><b>A14.15</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm5_1xm2_reply.svg" alt="A14.16" width="135"><br><b>A14.16</b> <sub>24% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm4_reply.svg" alt="A14.17" width="135"><br><b>A14.17</b> <sub>24% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm6_1xm2_reply.svg" alt="A14.18" width="146"><br><b>A14.18</b> <sub>25% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm2_4x2_reply.svg" alt="A14.19" width="208"><br><b>A14.19</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm2_3xm4_reply.svg" alt="A14.20" width="146"><br><b>A14.20</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x6_1xm2_reply.svg" alt="A14.21" width="166"><br><b>A14.21</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm4_1xm2_5xm2_reply.svg" alt="A14.22" width="187"><br><b>A14.22</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_4xm3_reply.svg" alt="A14.23" width="187"><br><b>A14.23</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_5xm2_reply.svg" alt="A14.24" width="187"><br><b>A14.24</b> <sub>25% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x2_1xm2_4xm5_reply.svg" alt="A14.25" width="146"><br><b>A14.25</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_2xm4_reply.svg" alt="A14.26" width="135"><br><b>A14.26</b> <sub>26% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2x0_4xm1_reply.svg" alt="A14.27" width="208"><br><b>A14.27</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_3xm4_reply.svg" alt="A14.28" width="146"><br><b>A14.28</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_4x0_reply.svg" alt="A14.29" width="187"><br><b>A14.29</b> <sub>27% hold · 11 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A15 · Pair + 1 (2,3) plus a stone (27)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm3_1xm2_reply.svg" alt="A15.1" width="104"><br><b>A15.1</b> <sub>1.4% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm2_reply.svg" alt="A15.2" width="146"><br><b>A15.2</b> <sub>4.3% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm3_reply.svg" alt="A15.3" width="83"><br><b>A15.3</b> <sub>6.4% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1x2_reply.svg" alt="A15.4" width="114"><br><b>A15.4</b> <sub>10% hold · 3 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1x1_2x1_reply.svg" alt="A15.5" width="166"><br><b>A15.5</b> <sub>12% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3xm2_reply.svg" alt="A15.6" width="114"><br><b>A15.6</b> <sub>12% hold · 4 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1xm2_2xm5_reply.svg" alt="A15.7" width="114"><br><b>A15.7</b> <sub>12% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x2_reply.svg" alt="A15.8" width="124"><br><b>A15.8</b> <sub>12% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1xm2_reply.svg" alt="A15.9" width="146"><br><b>A15.9</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm1_2xm3_reply.svg" alt="A15.10" width="124"><br><b>A15.10</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_5xm6_reply.svg" alt="A15.11" width="135"><br><b>A15.11</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm6_1xm2_reply.svg" alt="A15.12" width="135"><br><b>A15.12</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_4x1_reply.svg" alt="A15.13" width="187"><br><b>A15.13</b> <sub>13% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm5_1xm2_reply.svg" alt="A15.14" width="124"><br><b>A15.14</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm1_3xm2_reply.svg" alt="A15.15" width="135"><br><b>A15.15</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_3xm2_reply.svg" alt="A15.16" width="124"><br><b>A15.16</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_2xm3_reply.svg" alt="A15.17" width="135"><br><b>A15.17</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_5xm2_reply.svg" alt="A15.18" width="177"><br><b>A15.18</b> <sub>14% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1x0_3xm1_reply.svg" alt="A15.19" width="187"><br><b>A15.19</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x5_1x2_reply.svg" alt="A15.20" width="135"><br><b>A15.20</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_1xm2_reply.svg" alt="A15.21" width="135"><br><b>A15.21</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4x0_reply.svg" alt="A15.22" width="177"><br><b>A15.22</b> <sub>14% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm5_reply.svg" alt="A15.23" width="124"><br><b>A15.23</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm4_reply.svg" alt="A15.24" width="135"><br><b>A15.24</b> <sub>15% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x1_1xm2_2xm4_reply.svg" alt="A15.25" width="124"><br><b>A15.25</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_4xm3_reply.svg" alt="A15.26" width="146"><br><b>A15.26</b> <sub>15% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm3_1xm2_2xm1_reply.svg" alt="A15.27" width="124"><br><b>A15.27</b> <sub>16% hold · 5 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A16 · Three in a row plus a stone (4)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x1_0x2_0x6_reply.svg" alt="A16.1" width="146"><br><b>A16.1</b> <sub>10% hold · 4 one-stone cells · stops the forced win only: unstoppable (U55)</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm4_reply.svg" alt="A16.2" width="124"><br><b>A16.2</b> <sub>10% hold · 4 one-stone cells · stops the forced win only: unstoppable (U56)</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm3_reply.svg" alt="A16.3" width="135"><br><b>A16.3</b> <sub>11% hold · 4 one-stone cells · stops the forced win only: unstoppable (U54)</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x2_4xm2_reply.svg" alt="A16.4" width="146"><br><b>A16.4</b> <sub>11% hold · 4 one-stone cells · stops the forced win only: unstoppable (U53)</sub></td></tr>
</table>

</details>

<details><summary>A17 · Two-gap pair + 1 (2,2) plus a stone (17)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x3_1xm2_1x1_reply.svg" alt="A17.1" width="114"><br><b>A17.1</b> <sub>1.7% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_3xm3_reply.svg" alt="A17.2" width="114"><br><b>A17.2</b> <sub>2.6% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1x1_3xm3_reply.svg" alt="A17.3" width="94"><br><b>A17.3</b> <sub>4.6% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm2_reply.svg" alt="A17.4" width="124"><br><b>A17.4</b> <sub>4.8% hold · 1 one-stone cell</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_1x1_reply.svg" alt="A17.5" width="146"><br><b>A17.5</b> <sub>12% hold · 5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_1x1_reply.svg" alt="A17.6" width="135"><br><b>A17.6</b> <sub>13% hold · 5 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1xm2_3xm3_reply.svg" alt="A17.7" width="135"><br><b>A17.7</b> <sub>14% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_5xm3_reply.svg" alt="A17.8" width="156"><br><b>A17.8</b> <sub>14% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm4_reply.svg" alt="A17.9" width="135"><br><b>A17.9</b> <sub>14% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm1_3x0_reply.svg" alt="A17.10" width="208"><br><b>A17.10</b> <sub>15% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_3xm3_reply.svg" alt="A17.11" width="135"><br><b>A17.11</b> <sub>15% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm3_1x1_reply.svg" alt="A17.12" width="135"><br><b>A17.12</b> <sub>16% hold · 6 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm3_1x1_3x0_reply.svg" alt="A17.13" width="208"><br><b>A17.13</b> <sub>16% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_4xm1_reply.svg" alt="A17.14" width="156"><br><b>A17.14</b> <sub>16% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_2xm4_reply.svg" alt="A17.15" width="135"><br><b>A17.15</b> <sub>17% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_2xm1_reply.svg" alt="A17.16" width="135"><br><b>A17.16</b> <sub>17% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1x1_2xm1_reply.svg" alt="A17.17" width="135"><br><b>A17.17</b> <sub>19% hold · 6 one-stone cells</sub></td></tr>
</table>

</details>

<details><summary>A18 · Two-gap pair + 1 (2,4) plus a stone (30)</summary>

<table>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm1_2x2_reply.svg" alt="A18.1" width="124"><br><b>A18.1</b> <sub>2.2% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm4_2xm1_reply.svg" alt="A18.2" width="114"><br><b>A18.2</b> <sub>4.3% hold · this pair holds</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x7_2x2_reply.svg" alt="A18.3" width="135"><br><b>A18.3</b> <sub>9.6% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_2x2_reply.svg" alt="A18.4" width="124"><br><b>A18.4</b> <sub>10% hold · 4 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2xm4_4xm2_reply.svg" alt="A18.5" width="208"><br><b>A18.5</b> <sub>16% hold · 6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm2_2x2_3x0_reply.svg" alt="A18.6" width="208"><br><b>A18.6</b> <sub>17% hold · 6 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_0x7_2xm1_reply.svg" alt="A18.7" width="156"><br><b>A18.7</b> <sub>23% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_6xm5_reply.svg" alt="A18.8" width="156"><br><b>A18.8</b> <sub>23% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_2xm4_3xm3_reply.svg" alt="A18.9" width="135"><br><b>A18.9</b> <sub>23% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm6_1xm2_4xm2_reply.svg" alt="A18.10" width="208"><br><b>A18.10</b> <sub>23% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4x3_reply.svg" alt="A18.11" width="197"><br><b>A18.11</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_6xm1_reply.svg" alt="A18.12" width="197"><br><b>A18.12</b> <sub>24% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x3_2xm5_2xm1_reply.svg" alt="A18.13" width="135"><br><b>A18.13</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_5xm4_reply.svg" alt="A18.14" width="146"><br><b>A18.14</b> <sub>24% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_1xm2_3x0_reply.svg" alt="A18.15" width="208"><br><b>A18.15</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x4_3x0_4xm2_reply.svg" alt="A18.16" width="208"><br><b>A18.16</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_0x4_2x3_reply.svg" alt="A18.17" width="187"><br><b>A18.17</b> <sub>25% hold · 9 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm4_3xm3_reply.svg" alt="A18.18" width="135"><br><b>A18.18</b> <sub>25% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_1xm5_1xm2_4xm2_reply.svg" alt="A18.19" width="208"><br><b>A18.19</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_0x5_2x4_reply.svg" alt="A18.20" width="187"><br><b>A18.20</b> <sub>25% hold · 10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_0x6_2xm1_reply.svg" alt="A18.21" width="146"><br><b>A18.21</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_3x3_reply.svg" alt="A18.22" width="177"><br><b>A18.22</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_4xm2_reply.svg" alt="A18.23" width="208"><br><b>A18.23</b> <sub>25% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm4_reply.svg" alt="A18.24" width="135"><br><b>A18.24</b> <sub>25% hold · 11 one-stone cells</sub></td></tr>
<tr><td align="center"><img src="shapes/s0x0_0x4_1x1_4xm2_reply.svg" alt="A18.25" width="187"><br><b>A18.25</b> <sub>26% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4x0_reply.svg" alt="A18.26" width="166"><br><b>A18.26</b> <sub>27% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_1xm5_1xm2_3xm6_reply.svg" alt="A18.27" width="135"><br><b>A18.27</b> <sub>27% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2x2_reply.svg" alt="A18.28" width="187"><br><b>A18.28</b> <sub>27% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_4xm2_reply.svg" alt="A18.29" width="146"><br><b>A18.29</b> <sub>28% hold · 11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1xm2_2xm1_reply.svg" alt="A18.30" width="135"><br><b>A18.30</b> <sub>28% hold · 11 one-stone cells</sub></td></tr>
</table>

</details>

## 5 stones

The 144 minimal ones, quickest wins first. Each has a reply within 3 cells that stops its forced win (checked), so none is unstoppable by a forced win; the replies themselves aren't listed.

<table>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_1xm3_4xm4_5xm3.svg" alt="C1" width="156"><br><b>C1</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm4_4xm3_6xm4.svg" alt="C2" width="166"><br><b>C2</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_3xm5_3xm1_4xm4.svg" alt="C3" width="135"><br><b>C3</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_2xm3_4xm2_6xm3.svg" alt="C4" width="166"><br><b>C4</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x2_3xm2_4xm1_4x2.svg" alt="C5" width="177"><br><b>C5</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_2x4_4x3.svg" alt="C6" width="177"><br><b>C6</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_1x4_4x4.svg" alt="C7" width="187"><br><b>C7</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_3x3_4x4.svg" alt="C8" width="187"><br><b>C8</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_1xm2_3xm1_5xm2.svg" alt="C9" width="146"><br><b>C9</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x3_3xm5_3xm1_4xm4.svg" alt="C10" width="114"><br><b>C10</b> · six on turn 5</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_5x0_8x0.svg" alt="C11" width="229"><br><b>C11</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x4_0x8_3x2_4x0.svg" alt="C12" width="146"><br><b>C12</b> · six on turn 5</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_0x8.svg" alt="C13" width="197"><br><b>C13</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_0x9.svg" alt="C14" width="156"><br><b>C14</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_1x8.svg" alt="C15" width="166"><br><b>C15</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x7_3x7.svg" alt="C16" width="197"><br><b>C16</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_2x7.svg" alt="C17" width="177"><br><b>C17</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_2x8.svg" alt="C18" width="187"><br><b>C18</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_1x5_4x5.svg" alt="C19" width="197"><br><b>C19</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3xm5_4xm4.svg" alt="C20" width="124"><br><b>C20</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm4_7xm4.svg" alt="C21" width="208"><br><b>C21</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm3_7xm3.svg" alt="C22" width="208"><br><b>C22</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm3_8xm3.svg" alt="C23" width="229"><br><b>C23</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x7_0x9.svg" alt="C24" width="156"><br><b>C24</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x4_5x1.svg" alt="C25" width="177"><br><b>C25</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x4_5x4.svg" alt="C26" width="208"><br><b>C26</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_4x0.svg" alt="C27" width="156"><br><b>C27</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_4x5.svg" alt="C28" width="197"><br><b>C28</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3xm5_4xm4.svg" alt="C29" width="135"><br><b>C29</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_3x3_4x1.svg" alt="C30" width="156"><br><b>C30</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4xm3_7xm3.svg" alt="C31" width="208"><br><b>C31</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4x1_7xm2.svg" alt="C32" width="197"><br><b>C32</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_4x1_8xm3.svg" alt="C33" width="197"><br><b>C33</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_0x6_3x3_4x1.svg" alt="C34" width="156"><br><b>C34</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_2xm6_3xm5_4xm4.svg" alt="C35" width="124"><br><b>C35</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_3xm5_4xm4_7xm9.svg" alt="C36" width="135"><br><b>C36</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm3_7xm9.svg" alt="C37" width="135"><br><b>C37</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm2_8xm6.svg" alt="C38" width="177"><br><b>C38</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm2_8xm2.svg" alt="C39" width="229"><br><b>C39</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_7xm1.svg" alt="C40" width="218"><br><b>C40</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm2_8xm6.svg" alt="C41" width="177"><br><b>C41</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm2_8xm2.svg" alt="C42" width="229"><br><b>C42</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm1_8xm5.svg" alt="C43" width="177"><br><b>C43</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_4xm1_8xm1.svg" alt="C44" width="229"><br><b>C44</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm5_8xm8.svg" alt="C45" width="146"><br><b>C45</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm3_5xm2_8xm2.svg" alt="C46" width="229"><br><b>C46</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_2x7.svg" alt="C47" width="177"><br><b>C47</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_2x8.svg" alt="C48" width="187"><br><b>C48</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_3xm5_4xm4.svg" alt="C49" width="124"><br><b>C49</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm2_7xm2.svg" alt="C50" width="208"><br><b>C50</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm2_8xm2.svg" alt="C51" width="229"><br><b>C51</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_3xm5_4xm4.svg" alt="C52" width="135"><br><b>C52</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm2_7xm2.svg" alt="C53" width="208"><br><b>C53</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm2_8xm2.svg" alt="C54" width="229"><br><b>C54</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4x0_7xm3.svg" alt="C55" width="177"><br><b>C55</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4x1_7x1.svg" alt="C56" width="218"><br><b>C56</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_3x4_4x2.svg" alt="C57" width="166"><br><b>C57</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x0_7xm3.svg" alt="C58" width="177"><br><b>C58</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_5x2.svg" alt="C59" width="187"><br><b>C59</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_6x0.svg" alt="C60" width="187"><br><b>C60</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_6x2.svg" alt="C61" width="208"><br><b>C61</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_7xm1.svg" alt="C62" width="197"><br><b>C62</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_7x2.svg" alt="C63" width="229"><br><b>C63</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x6_4x2_8xm2.svg" alt="C64" width="208"><br><b>C64</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_0x7_3x4_4x2.svg" alt="C65" width="166"><br><b>C65</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm2_7xm8.svg" alt="C66" width="135"><br><b>C66</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_7xm1.svg" alt="C67" width="208"><br><b>C67</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4x0_7xm6.svg" alt="C68" width="156"><br><b>C68</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_4xm1_8xm5.svg" alt="C69" width="177"><br><b>C69</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_4xm1_8xm1.svg" alt="C70" width="229"><br><b>C70</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm1_8xm1.svg" alt="C71" width="229"><br><b>C71</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x6_4x0_7xm3.svg" alt="C72" width="177"><br><b>C72</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_3x5_4x3.svg" alt="C73" width="177"><br><b>C73</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x0_7xm3.svg" alt="C74" width="177"><br><b>C74</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_5x3.svg" alt="C75" width="197"><br><b>C75</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_6x3.svg" alt="C76" width="218"><br><b>C76</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_7x0.svg" alt="C77" width="208"><br><b>C77</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_7x3.svg" alt="C78" width="239"><br><b>C78</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x7_4x3_8xm1.svg" alt="C79" width="218"><br><b>C79</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x3_0x8_3x5_4x3.svg" alt="C80" width="177"><br><b>C80</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x8_2x1_4x0.svg" alt="C81" width="146"><br><b>C81</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_6x1.svg" alt="C82" width="197"><br><b>C82</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x4_4x0_8xm4_8x0.svg" alt="C83" width="229"><br><b>C83</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_0x5_1x1_4x1_5x1.svg" alt="C84" width="177"><br><b>C84</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm7_1xm4_1x1_4xm4.svg" alt="C85" width="156"><br><b>C85</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_1xm7_1xm3_1x1_4xm4.svg" alt="C86" width="156"><br><b>C86</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_5xm5.svg" alt="C87" width="124"><br><b>C87</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_6xm6.svg" alt="C88" width="135"><br><b>C88</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_7xm7.svg" alt="C89" width="146"><br><b>C89</b> · six on turn 6</td>
<td align="center"><img src="shapes/s0x0_1xm3_1x1_4xm4_8xm8.svg" alt="C90" width="156"><br><b>C90</b> · six on turn 6</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_0x9.svg" alt="C91" width="208"><br><b>C91</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_1x9.svg" alt="C92" width="177"><br><b>C92</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x8_3x8.svg" alt="C93" width="208"><br><b>C93</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3x4_4x4.svg" alt="C94" width="187"><br><b>C94</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_3x4_5x4.svg" alt="C95" width="208"><br><b>C95</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x8_1x9.svg" alt="C96" width="177"><br><b>C96</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x8_3x8.svg" alt="C97" width="208"><br><b>C97</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_1x7.svg" alt="C98" width="156"><br><b>C98</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_1x9.svg" alt="C99" width="177"><br><b>C99</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_2x8.svg" alt="C100" width="187"><br><b>C100</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_0x5_0x9_2x9.svg" alt="C101" width="197"><br><b>C101</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x5_2x5_5x5.svg" alt="C102" width="218"><br><b>C102</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm4_8xm10.svg" alt="C103" width="146"><br><b>C103</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm6_4xm3_8xm10.svg" alt="C104" width="146"><br><b>C104</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm4_8xm9.svg" alt="C105" width="156"><br><b>C105</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x1_4xm5_4xm3_8xm9.svg" alt="C106" width="156"><br><b>C106</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_8xm5.svg" alt="C107" width="177"><br><b>C107</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_4xm1_8xm1.svg" alt="C108" width="239"><br><b>C108</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_4xm4_5xm6_8xm9.svg" alt="C109" width="156"><br><b>C109</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_1x9.svg" alt="C110" width="177"><br><b>C110</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x4_0x8_3x8.svg" alt="C111" width="208"><br><b>C111</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm4_6xm6.svg" alt="C112" width="146"><br><b>C112</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x4_4xm4_7xm7.svg" alt="C113" width="156"><br><b>C113</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x8_1x9.svg" alt="C114" width="177"><br><b>C114</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x8_3x8.svg" alt="C115" width="208"><br><b>C115</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x9_2x8.svg" alt="C116" width="187"><br><b>C116</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_0x9_2x9.svg" alt="C117" width="197"><br><b>C117</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm4_6xm6.svg" alt="C118" width="124"><br><b>C118</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_0x5_4xm4_7xm7.svg" alt="C119" width="156"><br><b>C119</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm4_8xm9.svg" alt="C120" width="146"><br><b>C120</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm5_4xm2_8xm9.svg" alt="C121" width="146"><br><b>C121</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm3_8xm7.svg" alt="C122" width="166"><br><b>C122</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_8xm5.svg" alt="C123" width="177"><br><b>C123</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_4xm1_8xm1.svg" alt="C124" width="229"><br><b>C124</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm6_8xm9.svg" alt="C125" width="146"><br><b>C125</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_5xm5_9xm9.svg" alt="C126" width="166"><br><b>C126</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm4_6xm6_9xm9.svg" alt="C127" width="166"><br><b>C127</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4xm2_8xm7.svg" alt="C128" width="166"><br><b>C128</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm3_4x0_8xm7.svg" alt="C129" width="166"><br><b>C129</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x2_4xm2_5xm4_8xm7.svg" alt="C130" width="166"><br><b>C130</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_0x5_0x9_2x8.svg" alt="C131" width="187"><br><b>C131</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_1xm5_1xm2_3x3.svg" alt="C132" width="187"><br><b>C132</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm4_4xm3_8xm7.svg" alt="C133" width="156"><br><b>C133</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm4_4xm2_8xm6.svg" alt="C134" width="166"><br><b>C134</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4xm1_8xm7.svg" alt="C135" width="156"><br><b>C135</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4x0_7xm6.svg" alt="C136" width="146"><br><b>C136</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm3_4x0_8xm7.svg" alt="C137" width="156"><br><b>C137</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm2_4xm1_8xm6.svg" alt="C138" width="166"><br><b>C138</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm2_4x0_8xm6.svg" alt="C139" width="166"><br><b>C139</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x3_4xm1_5xm3_8xm6.svg" alt="C140" width="166"><br><b>C140</b> · six on turn 7</td>
</tr>
<tr>
<td align="center"><img src="shapes/s0x0_0x4_0x5_0x9_2xm1.svg" alt="C141" width="156"><br><b>C141</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_7x1.svg" alt="C142" width="218"><br><b>C142</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x4_1x1_5x1_8x1.svg" alt="C143" width="239"><br><b>C143</b> · six on turn 7</td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_4xm4_8xm8.svg" alt="C144" width="177"><br><b>C144</b> · six on turn 8</td>
</tr>
</table>

