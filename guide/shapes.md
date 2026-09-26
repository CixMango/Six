# Shapes that win

Every small shape of one player's stones, checked by the forced-win solver in Six (the bot in this repository): which ones you must answer, the replies that work, and the ones that can't be answered at all. The full lists are in the [catalogue](shapes-catalog.md).

<img src="shapes/basics.svg" alt="A triangle, its three lines, and one window of six" align="right">

**The game:** X opens with one stone, then each player places two stones a turn; six in a row wins. Every threat lives in a **window of six** cells in a row (orange), and a **four** (four of your stones in one window, none of the opponent's) threatens six next turn.

**Tempo:** some fours take one stone to block, others (like four in a row with open ends) take both. A defender who spends both stones builds nothing. A win is a turn whose threats take three or more stones to block, reached by fours that take both stones every turn before it.

**Words:** a **shape** is some of one player's stones with nothing else nearby; stones belong to one shape when they're within 2 cells, or on one line within 4, close enough to share a window of six (rotations and mirror images count as the same shape). A shape is **must-answer** if its owner, moving next, wins by threats alone; a reply **holds** if the solver then finds no such win (replies within 3 cells were tried). **Tight** and **loose** threes and **close pairs** are defined below as they come up.

**On this page:** [In short](#in-short) · [Using this in a game](#using-this-in-a-game) · [Fours](#fours) · [Close pairs](#close-pairs) · [Cheat sheet](#cheat-sheet) · [Attacking](#attacking) · [Worked examples](#worked-examples) · [Unstoppable shapes](#unstoppable-shapes) · [Test yourself](#test-yourself)

<img src="shapes/legend-main.svg" alt="Diagram key" width="520">

## In short

- **Must-answer three** (its owner, to move, wins by threats alone) → **answer it this turn with the cheat-sheet reply.**
- **Tight three** (triangle or chevron, no two stones more than 3 apart; A1–A8) → **one stone on each of two of its lines (blue), both within 2 cells of it.** Every such pair holds.
- **Loose three** (any other must-answer three; A9–A16) → **one stone on one of its lines, in a gap or within 2 cells of its stones.** The other stone isn't needed against the threats: put it next to the shape's close pair, or attack.
- **Four** → **block it now**: one stone in its gap, or both ends if it's solid.
- **Close pair** (two stones within 2 cells, or 3 apart on one line) → **needs an answer too: your stones near it.** In open space, two more stones make any close pair unstoppable.
- **21 unstoppable 4-stone shapes** win even when the opponent moves first. Each holds two or more tight threes, though that alone isn't enough.

## Using this in a game

Each turn, in this order:

1. **Can you make six?** Do it.
2. **Does the opponent have a four?** Block it (see [Fours](#fours)). A block that also makes your own four is best.
3. **Can you force a win?** You need a four that takes both of their stones every turn, until one turn's threats take three stones to block (see the [worked example](#worked-examples)).
4. **Does the opponent have a must-answer shape?** Check their two new stones and anything of theirs within 5 cells (a window of six spans 5 steps). Threes: the [cheat sheet](#cheat-sheet). Four-stone clusters: most are must-answer, so treat them as urgent (the ones with no must-answer three inside are in the [catalogue](shapes-catalog.md)). Only skip this if step 3 wins first: an unstoppable shape of yours doesn't stop their fours.
5. **Do you have a close pair in open space?** Add the two stones (+) that make it an unstoppable shape (see [Close pairs](#close-pairs)).
6. **Does the opponent have a close pair in open space?** Take its two ringed cells (see [Close pairs](#close-pairs)). With two such pairs, answer neighbours or a one-gap pair first (a rule of thumb: they have the most ways to finish).
7. **Otherwise, [attack](#attacking).**

**Must-answer** needs a specific reply now (the cheat sheet); a **close pair** needs stones of yours near it (see Close pairs). Nearly every enemy cluster needs one or the other.

<details><summary>Definitions and details</summary>

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1x0_name.svg" alt="Triangle 1+1" width="110"><br><sub>Triangle 1+1</sub></td><td align="center"><img src="shapes/s0x0_0x1_3x0_name.svg" alt="Triangle 1+3" width="110"><br><sub>Triangle 1+3</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_name.svg" alt="Chevron 1+1" width="110"><br><sub>Chevron 1+1</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_name.svg" alt="Chevron 1+2" width="110"><br><sub>Chevron 1+2</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_name.svg" alt="Pair + 1 (2,3)" width="110"><br><sub>Pair + 1 (2,3)</sub></td></tr></table>

<sub>Names: the numbers are how far the two outer stones are from the corner stone. A triangle's lines meet at 60°, a chevron's at 120°.</sub>

- **Holds:** after the reply, the solver finds no forced win. That stops the forced win; it doesn't make the position safe.
- 16 of the 41 three-stone shapes are must-answer. Against a tight three, only about 5% of all replies hold.
- The two-lines defence works for all 11 threes with two or more lines (A1–A11); against the classic triangle, those pairs are the only replies that hold.
- The loose-three rule works for every loose three; some also hold with one stone on other cells (extra cells: A9 1, A11 6, A12 1, A14 6, A16 5).
- The other 25 threes aren't must-answer, but 22 of them contain a close pair that can grow into an unstoppable shape.
- All 7 four-stone shapes in which every three stones form a tight three are unstoppable.
- **Within 2 cells:** at most 2 steps across the hex grid.
- **Lines of a shape:** the lines through two of its stones. The triangle 1+1 has three.
- **Triangle a+b, chevron a+b:** two stones on two different lines from a corner stone, a and b cells away. The lines meet at 60° in a triangle and 120° in a chevron; only the equal triangles (1+1, 2+2, 3+3) close into a full triangle. The classic triangle and chevron (boomerang) are both 1+1.
- **Pair + 1 (2,3):** a pair plus a third stone 2 and 3 cells from the two; a split pair has one cell between its stones, a wide pair two.

</details>

## Fours

Four stones in one window of six threaten six next turn. With a gap, one stone on a dotted cell holds; the solid four needs both stones (only 3 replies hold, one shown).

<table><tr>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x3_four.svg" alt="F1" width="106"><br><b>F1</b><br><sub>both stones</sub></td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x4_four.svg" alt="F2" width="106"><br><b>F2</b><br><sub>1 stone in a gap</sub></td>
<td align="center"><img src="shapes/s0x0_0x1_0x3_0x4_four.svg" alt="F3" width="106"><br><b>F3</b><br><sub>1 stone in a gap</sub></td>
<td align="center"><img src="shapes/s0x0_0x1_0x2_0x5_four.svg" alt="F4" width="106"><br><b>F4</b><br><sub>1 stone in a gap</sub></td>
</tr><tr><td align="center"><img src="shapes/s0x0_0x1_0x3_0x5_four.svg" alt="F5" width="106"><br><b>F5</b><br><sub>1 stone in a gap</sub></td>
<td align="center"><img src="shapes/s0x0_0x1_0x4_0x5_four.svg" alt="F6" width="106"><br><b>F6</b><br><sub>1 stone in a gap</sub></td>
<td align="center"><img src="shapes/s0x0_0x2_0x3_0x5_four.svg" alt="F7" width="106"><br><b>F7</b><br><sub>1 stone in a gap</sub></td>
</tr></table>

## Close pairs

Each close pair becomes an [unstoppable shape](#unstoppable-shapes) with two more stones; one way is marked (+). Two stones 4 apart on a line never do, so they aren't a close pair.

<table><tr>
<td align="center"><img src="shapes/s0x0_0x1_grow.svg" alt="Neighbours" width="112"><br><b>Neighbours</b><br><sub>add these two → <a href="#unstoppable-shapes">U1 (diamond)</a></sub></td>
<td align="center"><img src="shapes/s0x0_0x2_grow.svg" alt="One-gap pair" width="112"><br><b>One-gap pair</b><br><sub>add these two → <a href="#unstoppable-shapes">U2</a></sub></td>
<td align="center"><img src="shapes/s0x0_0x3_grow.svg" alt="Two-gap pair" width="112"><br><b>Two-gap pair</b><br><sub>add these two → <a href="shapes-catalog.md#unstoppable-shapes">U11</a></sub></td>
<td align="center"><img src="shapes/s0x0_1xm2_grow.svg" alt="Off-line pair" width="112"><br><b>Off-line pair</b><br><sub>add these two → <a href="#unstoppable-shapes">U1 (diamond)</a></sub></td>
</tr><tr>
<td align="center"><img src="shapes/s0x0_0x1_answer.svg" alt="Your answer" width="124"><br><sub>your answer: these two (or their mirror image)</sub></td>
<td align="center"><img src="shapes/s0x0_0x2_answer.svg" alt="Your answer" width="124"><br><sub>your answer: these two (or their mirror image)</sub></td>
<td align="center"><img src="shapes/s0x0_0x3_answer.svg" alt="Your answer" width="124"><br><sub>your answer: these two (or their mirror image)</sub></td>
<td align="center"><img src="shapes/s0x0_1xm2_answer.svg" alt="Your answer" width="124"><br><sub>your answer: these two (or their mirror image)</sub></td>
</tr><tr>
<td align="center"><img src="shapes/s0x0_0x1_ways.svg" alt="Where it can be finished" width="150"><br><sub>stones on the two ringed cells take away 29 of its 89 ways; the other 60 can all be held</sub></td>
<td align="center"><img src="shapes/s0x0_0x2_ways.svg" alt="Where it can be finished" width="150"><br><sub>stones on the two ringed cells take away 29 of its 73 ways; the other 44 can all be held</sub></td>
<td align="center"><img src="shapes/s0x0_0x3_ways.svg" alt="Where it can be finished" width="150"><br><sub>stones on the two ringed cells take away 12 of its 30 ways; the other 18 can all be held</sub></td>
<td align="center"><img src="shapes/s0x0_1xm2_ways.svg" alt="Where it can be finished" width="150"><br><sub>stones on the two ringed cells take away 18 of its 45 ways; the other 27 can all be held</sub></td>
</tr></table>

The maps show the cells the owner can finish with (bluer = more ways). **Two stones on the ringed cells are enough to stop it becoming unstoppable:** they take away about a third of the ways outright, and the solver checked every other way with those two stones on the board and found a reply that holds each time (replies within 3 cells). The owner can still build threats later; this only removes the sure win. So answer an opponent's close pair in open space with the ringed cells, and don't leave your own pairs where they can be answered this way before you use them.

## Cheat sheet

**Tight threes: two stones, one on each of two different ringed lines.** Any rotation or mirror image works the same way.

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1x0_cheat.svg" alt="A1" width="180"><br><b>A1</b> · Triangle 1+1<br><sub>3 lines: pick any two</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm1_cheat.svg" alt="A2" width="180"><br><b>A2</b> · Triangle 1+2<br><sub>2 lines: one stone on each</sub></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_cheat.svg" alt="A3" width="180"><br><b>A3</b> · Triangle 1+3<br><sub>2 lines: one stone on each</sub></td><td align="center"><img src="shapes/s0x0_0x2_2x0_cheat.svg" alt="A4" width="180"><br><b>A4</b> · Triangle 2+2<br><sub>3 lines: pick any two</sub></td></tr><tr><td align="center"><img src="shapes/s0x0_0x2_3xm1_cheat.svg" alt="A5" width="180"><br><b>A5</b> · Triangle 2+3<br><sub>2 lines: one stone on each</sub></td><td align="center"><img src="shapes/s0x0_0x3_3x0_cheat.svg" alt="A6" width="180"><br><b>A6</b> · Triangle 3+3<br><sub>3 lines: pick any two</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_cheat.svg" alt="A7" width="180"><br><b>A7</b> · Chevron 1+1<br><sub>2 lines: one stone on each</sub></td><td align="center"><img src="shapes/s0x0_0x1_2xm2_cheat.svg" alt="A8" width="180"><br><b>A8</b> · Chevron 1+2<br><sub>2 lines: one stone on each</sub></td></tr></table>

**Loose threes: one stone on any dotted cell.** The ringed ones are the rule's cells; every dotted cell works.

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_cheat.svg" alt="A9" width="180"><br><b>A9</b> · Chevron 1+3<br><sub>11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_2xm2_cheat.svg" alt="A10" width="180"><br><b>A10</b> · Chevron 2+2<br><sub>10 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_3xm3_cheat.svg" alt="A11" width="180"><br><b>A11</b> · Chevron 2+3<br><sub>17 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_cheat.svg" alt="A12" width="180"><br><b>A12</b> · Pair + 1 (2,3)<br><sub>5 one-stone cells</sub></td></tr><tr><td align="center"><img src="shapes/s0x0_0x2_2xm1_cheat.svg" alt="A13" width="180"><br><b>A13</b> · Split pair + 1 (2,3)<br><sub>5 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x2_1xm2_cheat.svg" alt="A14" width="180"><br><b>A14</b> · Split pair + 1 (2,4)<br><sub>11 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_1x1_cheat.svg" alt="A15" width="180"><br><b>A15</b> · Wide pair + 1 (2,2)<br><sub>6 one-stone cells</sub></td><td align="center"><img src="shapes/s0x0_0x3_2xm1_cheat.svg" alt="A16" width="180"><br><b>A16</b> · Wide pair + 1 (2,4)<br><sub>11 one-stone cells</sub></td></tr></table>

Defence maps and every holding reply are in the [catalogue](shapes-catalog.md#3-stone-must-answer-shapes).

## Attacking

<img src="shapes/s0x0_0x1_attack.svg" alt="A pair plus one stone makes a triangle" align="right">

- **Finish a close pair in open space.** If the opponent leaves one of your close pairs alone, the two (+) stones in [Close pairs](#close-pairs) make an unstoppable shape.
- **Turn a close pair into a tight three.** One stone does it (+ makes the triangle). The opponent must answer with both stones, and your other stone is free to build somewhere else.
- **Keep fours coming.** A four that takes both stones every turn leaves the opponent no time, as in the worked example below.
- **Three in a window plus one.** Three of your stones in one window of six with a fourth stone off that line is often must-answer (14 minimal patterns in the catalogue). One of them, with the winning first turn outlined:

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x5_3x2_plus.svg" alt="Three plus one" width="146"><br><sub>the outlined turn makes a four (five stones in the window); six on turn 6</sub></td></tr></table>

The three by itself isn't must-answer. The catalogue has all of them, with every holding reply, under [a three plus one](shapes-catalog.md#4-stones-a-three-plus-one).

## Worked examples

Numbers are turns: a yellow n is X's turn n, and a blue n is O's answer to it. Each picture shows X's new stones and O's latest block bright, older stones dim, and the starting shape bright. Each block is the toughest one the solver found.

### How the triangle wins (A1)

<img src="shapes/directions.svg" alt="The three line directions" width="520">

<table><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line0.svg" alt="X1: a four · horizontal line" width="260"><br><sub>X1: a four · horizontal line</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line1.svg" alt="X2: a four · up-right diagonal" width="260"><br><sub>X2: a four · up-right diagonal</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line2.svg" alt="X3: a four · down-right diagonal" width="260"><br><sub>X3: a four · down-right diagonal</sub></td></tr><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line3.svg" alt="X4: a four and a new three (dashed) · horizontal line" width="260"><br><sub>X4: a four and a new three (dashed) · horizontal line</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line4.svg" alt="X5: blocking takes 3 stones (one way ringed)" width="260"><br><sub>X5: blocking takes 3 stones (one way ringed)</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_line5.svg" alt="X6: six in a row" width="260"><br><sub>X6: six in a row</sub></td></tr></table>

Every turn is a four that takes both of O's stones, so O never builds anything. On turn 5 the threats need three stones to block, and O has two. The key move is X4: its four also lines up three stones on a second line, which becomes part of the unstoppable threats on turn 5.

<details><summary>Turn by turn</summary>

1. **X1:** a four on the horizontal line: 2 stones already there plus two new ones. It takes both of O's stones to block.
2. **X2:** another four (up-right diagonal), another two stones for O.
3. **X3:** another four (down-right diagonal), another two stones for O.
4. **X4:** another four (horizontal line), another two stones for O. It also lines up three on the up-right diagonal.
5. **X5:** threats on two lines: the down-right diagonal takes 1 stone and the up-right diagonal takes 2 stones to block. That's more than O's two stones.
6. **X6:** six in a row.

</details>

### Defending the triangle (A1)

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1x0_wrong0.svg" alt="Both ends of one line: loses" width="261"><br>Both ends of one line: loses</td><td align="center"><img src="shapes/s0x0_0x1_1x0_holds.svg" alt="One stone on each of two lines: holds" width="261"><br>One stone on each of two lines: holds</td></tr></table>

Blocking both ends of one line looks solid, but it leaves the triangle's other two lines untouched, and X still wins with a four every turn. One stone on each of two lines cuts two of the three lines at once, and the solver finds no win after it. After the losing reply, X makes six on turn 6.

<details><summary>Turn by turn after the reply</summary>

<table><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn0.svg" alt="X1: a four · up-right diagonal" width="260"><br><sub>X1: a four · up-right diagonal</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn1.svg" alt="X2: a four · down-right diagonal" width="260"><br><sub>X2: a four · down-right diagonal</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn2.svg" alt="X3: a four · horizontal line" width="260"><br><sub>X3: a four · horizontal line</sub></td></tr><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn3.svg" alt="X4: a four and a new three (dashed) · down-right diagonal" width="260"><br><sub>X4: a four and a new three (dashed) · down-right diagonal</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn4.svg" alt="X5: blocking takes 4 stones (one way ringed)" width="260"><br><sub>X5: blocking takes 4 stones (one way ringed)</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1x0_wrongturn5.svg" alt="X6: six in a row" width="260"><br><sub>X6: six in a row</sub></td></tr></table>

1. **X1:** a four on the up-right diagonal: 2 stones already there plus two new ones. It takes both of O's stones to block.
2. **X2:** another four (down-right diagonal), another two stones for O.
3. **X3:** another four (horizontal line), another two stones for O.
4. **X4:** another four (down-right diagonal), another two stones for O. It also lines up three on the up-right diagonal.
5. **X5:** threats on two lines: the up-right diagonal takes 2 stones and the horizontal line takes 2 stones to block. That's more than O's two stones.
6. **X6:** six in a row.

</details>

## Unstoppable shapes

21 four-stone shapes win even with the opponent to move: the solver tried every two-stone reply within 5 cells of each (about 6,000 to 10,600 replies) and none holds. You'll rarely meet one finished; it appears in one turn when a close pair gets two free stones. Two tight threes inside aren't enough on their own: 45 other four-stone shapes have two or more and can still be held, so learn these shapes rather than a rule. The four most compact (the rest are in the [catalogue](shapes-catalog.md#unstoppable-shapes)):

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x0_big.svg" alt="U1" width="112"><br><b>U1</b> · Diamond (two triangles)<br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x1_big.svg" alt="U2" width="112"><br><b>U2</b><br><sub>4 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_1xm2_1xm1_2xm1_big.svg" alt="U3" width="112"><br><b>U3</b><br><sub>3 tight threes inside</sub></td><td align="center"><img src="shapes/s0x0_0x1_1xm2_1x0_big.svg" alt="U4" width="112"><br><b>U4</b><br><sub>3 tight threes inside</sub></td></tr></table>

### Why the diamond (U1) can't be stopped

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_1x0_wrong0.svg" alt="The two-lines defence on one of its triangles" width="204"><br>The two-lines defence on one of its triangles</td></tr></table>

The diamond is two triangles sharing a side. The defence that stops a lone triangle doesn't stop both: X still makes a four every turn and six on the last. After the losing reply, X makes six on turn 5.

<details><summary>Turn by turn after the reply</summary>

<table><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1xm1_1x0_wrongturn0.svg" alt="X1: a four · up-right diagonal" width="260"><br><sub>X1: a four · up-right diagonal</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1xm1_1x0_wrongturn1.svg" alt="X2: a four and a new three (dashed) · horizontal line" width="260"><br><sub>X2: a four and a new three (dashed) · horizontal line</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1xm1_1x0_wrongturn2.svg" alt="X3: a four and a new three (dashed) · down-right diagonal" width="260"><br><sub>X3: a four and a new three (dashed) · down-right diagonal</sub></td></tr><tr><td align="center" valign="top"><img src="shapes/s0x0_0x1_1xm1_1x0_wrongturn3.svg" alt="X4: blocking takes 4 stones (one way ringed)" width="260"><br><sub>X4: blocking takes 4 stones (one way ringed)</sub></td><td align="center" valign="top"><img src="shapes/s0x0_0x1_1xm1_1x0_wrongturn4.svg" alt="X5: six in a row" width="260"><br><sub>X5: six in a row</sub></td></tr></table>

1. **X1:** a four on the up-right diagonal: 2 stones already there plus two new ones. It takes both of O's stones to block.
2. **X2:** another four (horizontal line), another two stones for O. It also lines up three on the down-right diagonal.
3. **X3:** another four (down-right diagonal), another two stones for O. It also lines up three on the up-right diagonal.
4. **X4:** threats on two lines: the down-right diagonal takes 2 stones and the up-right diagonal takes 2 stones to block. That's more than O's two stones.
5. **X5:** six in a row.

</details>

## Test yourself

The answer is folded under each question.

**1. A7 · Chevron 1+1: which reply holds?**

<table><tr><td align="center"><img src="shapes/s0x0_0x1_1xm1_quizA.svg" alt="Reply A" width="124"><br><b>A</b></td><td align="center"><img src="shapes/s0x0_0x1_1xm1_quizB.svg" alt="Reply B" width="124"><br><b>B</b></td></tr></table>

<details><summary>Answer</summary>

**B** holds: one stone on each of two of its lines, both within 2 cells. The other reply looks the same, but one stone is 3 cells out, too far to stop the fours.

<img src="shapes/s0x0_0x1_1xm1_quizwin.svg" alt="The winning reply" width="124">

After the other reply, X wins starting here (outlined), with six on turn 6. The ringed stone is the one that's too far out.

</details>

**2. A9 · Chevron 1+3: which reply holds?**

<table><tr><td align="center"><img src="shapes/s0x0_0x1_3xm3_quizA.svg" alt="Reply A" width="114"><br><b>A</b></td><td align="center"><img src="shapes/s0x0_0x1_3xm3_quizB.svg" alt="Reply B" width="114"><br><b>B</b></td></tr></table>

<details><summary>Answer</summary>

**A** holds: one stone in a gap on one of its lines is enough. The other reply hugs the shape and looks solid, but neither stone is on any of the shape's lines.

<img src="shapes/s0x0_0x1_3xm3_quizwin.svg" alt="The winning reply" width="114">

After the other reply, X wins starting here (outlined), with six on turn 6.

</details>

**3. F1 · solid four: which reply holds?**

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2_0x3_quizA.svg" alt="Reply A" width="124"><br><b>A</b></td><td align="center"><img src="shapes/s0x0_0x1_0x2_0x3_quizB.svg" alt="Reply B" width="124"><br><b>B</b></td></tr></table>

<details><summary>Answer</summary>

**B** holds: a solid four needs a stone at each end; it's one of only 3 replies that hold. Two stones at one end leave the other end open.

<img src="shapes/s0x0_0x1_0x2_0x3_quizwin.svg" alt="The winning reply" width="135">

After the other reply, X makes six right away (outlined).

</details>

**4. Which one needs the cheat-sheet reply right now?**

<table><tr><td align="center"><img src="shapes/s0x0_0x1_0x2_quizA.svg" alt="Shape A" width="83"><br><b>A</b></td><td align="center"><img src="shapes/s0x0_0x1_3xm2_quizB.svg" alt="Shape B" width="104"><br><b>B</b></td></tr></table>

<details><summary>Answer</summary>

**B**, the triangle 1+3 (A3): its owner wins by threats alone if you don't. Three in a row has no such win; treat it as close pairs: take the ringed cells of its most dangerous pair (neighbours first).

<img src="shapes/s0x0_0x1_3xm2_quizfix.svg" alt="The reply for B" width="124">

The cheat-sheet reply for B: one stone on each of two of its lines.

</details>

**5. Left alone in open space, which pair can't become an unstoppable shape?**

<table><tr><td align="center"><img src="shapes/s0x0_0x2_quizA.svg" alt="Pair A" width="124"><br><b>A</b></td><td align="center"><img src="shapes/s0x0_0x4_quizB.svg" alt="Pair B" width="124"><br><b>B</b></td></tr></table>

<details><summary>Answer</summary>

**B**: stones 4 apart on a line aren't a close pair, and they never become an unstoppable shape. The one-gap pair (A) becomes one with two more stones (+):

<img src="shapes/s0x0_0x2_quizgrow.svg" alt="A grows" width="83">

</details>

## What this doesn't cover

- **Shapes near other stones.** Every shape here stands alone. In a real game the opponent's own threats (a counter-four while defending) and other stones change things.
- **Threes that aren't must-answer.** Answering their most dangerous pair with that pair's ringed cells is a rule of thumb; the solver check covered pairs on their own, not inside a three.
- **Quiet wins.** Must-answer means a win by threats alone. A shape without one, like three in a row, can still win with a free turn (see [Close pairs](#close-pairs)).
- **Bigger shapes.** The [catalogue](shapes-catalog.md) lists 54 more 4-stone shapes (not fours) and 196 5-stone shapes that are must-answer and contain no smaller must-answer shape.

