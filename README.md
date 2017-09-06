Sudoku
======

Released under terms of MIT License.

Javascript version of Sudoku - intend to make this a full-fledged game
with capability to generate random puzzles and self-solve (i.e. enter an
existing puzzle and see solution).

Requires jquery.

About Sudoku Puzzles
--------------------

Normally, Sudoku puzzles are made on a 9x9 square board, which is
further subdivided into 9 3x3 squares.  Each position has a digit 1
to 9 in it, and each digit appears only one time in each row, each
column, and each 3x3 square.

In its generalized form, a puzzle has a scale, which is the number of
positions available (typically 9).  Let's call the scale "s".  For a
puzzle, each position is a member of 3 sets, traditionally rows,
columns, and squares within the board. Each one of these sets consists
of s subsets, and each subset consists of s elements.  Again, in the
traditional setup there are 9 rows each with 9 positions, 9 columns each
with 9 positions, and 9 inner squares, each with 9 positions.

The scale is usually a square.  A scale of "4" makes a pretty simple
little puzzle, and a scale of 16 makes a larger, more difficult puzzle.

A really simple 4x4 puzzle:

    +-+-+-+-+
    |1 2|3 4|
    +   +   +
    |3 4|1 2|
    +-+-+-+-+
    |2 1|4 3|
    +   +   +
    |4 3|2 1|
    +-+-+-+-+

Breaking from tradition, the third set of elements isn't required to be
squares, just contiguous positions.  And if they're not, it's possible
to have a scale that isn't a square.  For instance, a 7x7 puzzle can be
created with 7 rows and 7 columns.  The third set of items can then be
various shapes as long as each contains 7 positions.

Here's an example of a 5x5 puzzle with the third set being different
shapes:

    +-+-+-+-+-+
    |2 3|1 4 5|
    +   +-+   +
    |1 5|4|2 3|
    + +-+ +-+-+
    |4|2 5|3 1|
    +-+ +-+   +
    |3 1|2|5 4|
    +-+-+ +-+ +
    |5 4 3 1|2|
    +-+-+-+-+-+


