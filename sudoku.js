// Copyright 2010 Michael Chaney
// Please see accompanying LICENSE file - MIT license.

// From page 22 in the Javascript: The Good Parts book from O'Reilly Press.
if (typeof Object.create !== 'function') {
	Object.create = function(o) {
		var F = function(){};
		F.prototype=o;
		return new F();
	}
}

// Each position on the puzzle is a "cell".  Each cell is a member
// of three sets: row (y), column (x), and group.  The groups are typically
// squares within the puzzle, but can be made of any contiguous set of
// cells.  Traditionally, a puzzle is 9x9, with the group inset as sets
// of cells each 3x3.
//
// Each cell must contain a value that is unique in all three sets of
// which it is a part.

// In following code, i is analogous to x, j is analogous to y
var Cell = {
	'puzzle': null,
	'group': null,
	'row': null,
	'col': null,
	'x': null,
	'y': null,
	'range': null,
	'div_id': null,
	'div': null,
	'value': null,
	'showing': null,
	'guesses': null,
	'locked': null,
	'guess_rows': null,
	'display_values': ['1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','0'],
	'init': function(puzzle, x, y, range) {
		this.puzzle = puzzle;
		this.x = x;
		this.y = y;
		this.range = range;
		this.div_id = "cell_" + x + "_" + y;
		this.guesses = new Array(range);
		this.guess_rows = Math.ceil(Math.sqrt(range));
	},
	'set_group': function(group) {
		this.group = group;
	},
	'set_row': function(row) {
		this.row = row;
	},
	'set_col': function(col) {
		this.col = col;
	},
	'set_value': function(value) {
		this.value = value;
	},
	'value_from_display': function(display) {
		for (var i=0; i<this.display_values.length; i++) {
			if (display == this.display_values[i]) {
				return i;
			}
		}
		return null;
	},
	'display': function() {
		var td= $("<td id='" + this.div_id + "'></td>").addClass('cell').addClass('x_'+this.x).addClass('y_'+this.y).addClass('group_'+this.group.id);
		if (this.x == 0 || this.row.cells[this.x-1].group != this.group) {
			td.addClass('ldiff');
		}
		if (this.x == this.range-1 || this.row.cells[this.x+1].group != this.group) {
			td.addClass('rdiff');
		}
		if (this.y == 0 || this.col.cells[this.y-1].group != this.group) {
			td.addClass('tdiff');
		}
		if (this.y == this.range-1 || this.col.cells[this.y+1].group != this.group) {
			td.addClass('bdiff');
		}
		this.div = td;
		return td;
	},
	'show_marker': function() {
		var marker = '' + this.group.id + "/" + this.x + "," + this.y;
		$('#' + this.div_id).text(marker);
	},
	'clear': function() {
		this.showing = null;
		$('#'+this.div_id+' *').remove();
	},
	'display_guesses': function() {
		this.clear();
		this.showing='guess';
		for (var i=0; i<this.range; i++) {
			if (this.guesses[i]) this.display_guess(i);
		}
	},
	'guess_div_id': function(guess) {
		return this.div_id + '_guess_' + guess;
	},
	'display_guess': function(guess) {
		if (this.showing!==null && this.showing!=='guess') this.clear();
		this.showing='guess';
		var guess_row = Math.floor(guess/this.guess_rows);
		var guess_col = guess % this.guess_rows;
		var guess_div = $('<div class="guess" id="'+this.guess_div_id(guess)+'">'+this.display_values[guess]+'</div>')
		var pixel_padding = 2;
		var guess_width = guess_div.width();
		var cell_width = this.div.width() - pixel_padding * 2;
		var guess_height = guess_div.height();
		var cell_height = this.div.height() - pixel_padding * 2;
		if (guess_row == 0) {
			guess_div.css('top', '' + pixel_padding + 'px');
		} else if (guess_row == this.guess_rows - 1) {
			guess_div.css('bottom', '' + pixel_padding + 'px');
		} else {
			guess_div.css('top', '' + (cell_height * guess_row / (this.guess_rows-1) - guess_height/2.0 + pixel_padding) + 'px');
		}
		if (guess_col == 0) {
			guess_div.css('left', '' + pixel_padding + 'px');
		} else if (guess_col == this.guess_rows - 1) {
			guess_div.css('right', '' + pixel_padding + 'px');
		} else {
			guess_div.css('left', '' + (cell_width * guess_col / (this.guess_rows-1) - guess_width/2.0 + pixel_padding) + 'px');
		}
		guess_div.appendTo('#'+this.div_id);
	},
	'reveal': function() {
		if (this.value!==null && this.showing!=='answer') {
			this.clear();
			this.showing = 'answer';
			$('<span class="revealed value">' + this.display_values[this.value] + '</span>').appendTo('#'+this.div_id)
		}
	},
	'set_value': function(answer) {
		if (!this.locked) {
			this.value=answer;
			this.reveal();
		}
	}
};

var Group = {
	'puzzle': null,
	'size': null,
	'id': null,
	'cells': null,
	'init': function(puzzle,id,size) {
		this.puzzle = puzzle;
		this.id = id;
		this.size = size;
		this.cells = new Array();
	},
	'add_cell': function(cell) {
		this.cells.push(cell);
		cell.set_group(this);
	},
	'cell_at': function(pos) {
		return this.cells[pos];
	}
};

var Row = {
	'puzzle': null,
	'size': null,
	'id': null,
	'cells': null,
	'init': function(puzzle,id,size) {
		this.puzzle = puzzle;
		this.id = id;
		this.size = size;
		this.cells = new Array(size);
	},
	'add_cell': function(cell,pos) {
		this.cells[pos] = cell;
		cell.set_row(this);
	},
	'cell_at': function(pos) {
		return this.cells[pos];
	}
};

var Col = {
	'puzzle': null,
	'size': null,
	'id': null,
	'cells': null,
	'init': function(puzzle,id,size) {
		this.puzzle = puzzle;
		this.id = id;
		this.size = size;
		this.cells = new Array(size);
	},
	'add_cell': function(cell,pos) {
		this.cells[pos] = cell;
		cell.set_col(this);
	},
	'cell_at': function(pos) {
		return this.cells[pos];
	}
};

var Sudoku = {
	'size': null,
	'groups': null,
	'rows': null,
	'cols': null,
	'cells': null,
	'group_map': null,
	'current_number': null,
	'element': null,
	'init': function(size) {
		this.size = size;
		this.cells = new Array(size)
		for (var i = 0; i < size; i++) {
			this.cells[i] = new Array(size);
			for (var j = 0; j < size; j++) {
				this.cells[i][j] = Object.create(Cell);
				this.cells[i][j].init(this,i,j,size);
			}
		}
		this.groups = new Array(size);
		for (var i = 0; i < size; i++) {
			this.groups[i] = Object.create(Group);
			this.groups[i].init(this, i, size);
		}
		this.rows = new Array(size);
		for (var i = 0; i < size; i++) {
			this.rows[i] = Object.create(Row);
			this.rows[i].init(this, i, size);
			for (var j = 0; j < size; j++) {
				this.rows[i].add_cell(this.cells[j][i],j);
			}
		}
		this.cols = new Array(size);
		for (var i = 0; i < size; i++) {
			this.cols[i] = Object.create(Col);
			this.cols[i].init(this, i, size);
			for (var j = 0; j < size; j++) {
				this.cols[i].add_cell(this.cells[i][j],j);
			}
		}
	},
	'simple_groups': function() {
		var s = Math.sqrt(this.size);
		if (Math.floor(s) == s) {
			this.group_map = new Array(this.size);
			for (i=0 ; i<this.size ; i++) {
				this.group_map[i] = new Array(this.size);
				for (j=0 ; j<this.size ; j++) {
					var group_number = Math.floor(i/s) * s + Math.floor(j/s);
					this.group_map[i][j] = group_number;
				}
			}
		} else {
			throw new Error("Simple groups are only possible if size is the square of an integer.");
		}
	},
	'gather_groups': function() {
		for (i=0 ; i<this.size ; i++) {
			for (j=0 ; j<this.size ; j++) {
				var group_number = this.group_map[i][j];
				this.groups[group_number].add_cell(this.cells[i][j]);
			}
		}
	},
	'make_simple': function() {
		var s = Math.sqrt(this.size);
		if (Math.floor(s) == s) {
			for (var x = 0 ; x < this.size ; x++) {
				for (var y = 0 ; y < this.size ; y++) {
					var new_val = ((x % s) * s + Math.floor(x / s) + y) % this.size;
					this.cells[x][y].set_value(new_val);
				}
			}
		} else {
			throw new Error("Simple groups are only possible if size is the square of an integer.");
		}
	},
	'display': function(div_id) {
		if (this.size) {
			var table = $('<table class="sudoku"></table>');
			for (j=0 ; j<this.size ; j++) {
				var row = $("<tr></tr>");
				for (i=0 ; i<this.size ; i++) {
					var cell = this.cells[i][j];
					var col = cell.display();
					col.appendTo(row);
				}
				row.appendTo(table);
			}
			this.element = table;
			table.appendTo($(div_id));
		}
	},
	'cell_at': function(x,y) {
		return this.cells[x][y];
	},
	'show_markers': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].show_marker();
			}
		}
	},
	'reveal': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].reveal();
			}
		}
	},
	'show_guesses': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				for (var guess=0 ; guess < this.size; guess++) {
					this.cells[x][y].guesses[guess] = true;
				}
				this.cells[x][y].display_guesses();
			}
		}
	},
	'clear': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].clear();
			}
		}
	},
	'create_controls': function(div_id) {
		for (var i=0 ; i<size ; i++) {
			$('<a href="#" id="choose_' + i + '" class="chooser">' + Cell.display_values[i] + '</a>').appendTo('div#controls');
			$('#choose_'+i).click(this.handle_number_click);
		}
		$(document).keyup(function(event) {
			var clicked_item = String.fromCharCode(event.keyCode);
			var num = Cell.value_from_display(clicked_item);
			sudoku.set_number(num);
		});
		$(".cell").click(function(event) {
			if (!sudoku.current_number) { return; }
			var reg;
			// assignment on next line
			if (reg=this.id.match(/group_(\d+)_(\d+)_cell_(\d+)_(\d+)/)) {
				var cell=sudoku.groups[parseInt(reg[1])][parseInt(reg[2])].cells[parseInt(reg[3])][parseInt(reg[4])];
				if (cell) {
					if (event.shiftKey) {
						cell.display_guess(sudoku.current_number);
					} else {
						cell.set_value(sudoku.current_number);
					}
				}
			}
		});
	},
	'handle_number_click': function() {
		var reg;
		// next line is assignment, not comparison
		if (reg=this.id.match(/choose_(.*)$/)) {
			sudoku.set_number(parseInt(reg[1]));
		}
	},
	'set_number': function(num) {
		this.current_number = num;
		$('.chooser').removeClass('current');
		$('a#choose_'+num).addClass('current');
	},
	'solve': function() {
	}
};
