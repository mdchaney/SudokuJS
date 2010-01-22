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

// In following code, i is analogous to x, j is analogous to y
var Cell = {
	'box': null, 'x': null, 'y': null, 'value': null, 'div_id': null,
	'showing': null, 'guesses': null, 'locked': null,
	'display_values': ['1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','0'],
	'init': function(box, x, y, value) {
		this.box = box;
		this.x = x;
		this.y = y;
		this.div_id = box.div_id + "_cell_" + x + "_" + y;
		this.guesses = new Array(this.box.size*this.box.size);
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
		$('<div class="cell" id="'+this.div_id+'"></div>').appendTo("#"+this.box.div_id);
		$('#'+this.div_id).width(23).height(23).css('top',this.y*30+5).css('left',this.x*30+5).addClass('x_'+(this.x+this.box.x*this.box.size)).addClass('y_'+(this.y+this.box.y*this.box.size));
	},
	'clear': function() {
		this.showing = null;
		$('#'+this.div_id+' *').remove();
	},
	'display_guesses': function() {
		this.clear();
		this.showing='guess';
		for (var i=0; i<this.box.size*this.box.size; i++) {
			if (this.guesses[i]) this.display_guess(i);
		}
	},
	'display_guess': function(guess) {
		if (this.showing!==null && this.showing!=='guess') this.clear();
		this.showing='guess';
		$('<div class="guess" id="'+this.div_id+'_guess_'+guess+'">'+this.display_values[guess]+'</div>').appendTo('#'+this.div_id);
		$('#'+this.div_id+'_guess_'+guess).css('top',Math.floor(guess/this.box.size)*8-1).css('left',(guess%this.box.size)*8+2);
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

var Box = {
	'x': null, 'y': null, 'size': null, 'div_id': null,
	'cells': null,
	'init': function(x, y, size) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.div_id = 'box_'+x+'_'+y;
		this.cells = new Array(size);
		for (var i = 0; i < size; i++) {
			this.cells[i] = new Array(size);
			for (var j = 0; j < size; j++) {
				var cell = Object.create(Cell);
				cell.init(this, i, j, null);
				this.cells[i][j] = cell;
			}
		}
	},
	'make_simple': function() {
		for (var x = 0 ; x < this.size ; x++) {
			for (var y = 0 ; y < this.size ; y++) {
				// (i*size+j+x+y*size)%(size*size)
				this.cells[x][y].value = (x*this.size+y+this.x+this.y*this.size)%(this.size*this.size);
			}
		}
	},
	'display': function(div_id) {
		// create a new div - assume cells are 25x25 px with a 5px margin
		var total_width = this.size * 30 + 5;
		$('<div class="box" id="'+this.div_id+'"></div>').appendTo("#"+div_id);
		$('#'+this.div_id).width(total_width).height(total_width).css('top',this.y*total_width).css('left',this.x*total_width);
		if ((this.x+this.y*this.size)&1==1) $('#'+this.div_id).addClass('odd');
		// Now create the cells
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].display();
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
	'clear': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].clear();
			}
		}
	}
};

var Sudoku = {
	size: null,
	'boxes': null,
	'cells': null,
	'current_number': null,
	'init': function(size) {
		this.size = size;
		this.cells = new Array(size*size)
		for (var i = 0; i < size*size; i++) {
			this.cells[i] = new Array(size*size);
		}
		this.boxes = new Array(size);
		for (var i = 0; i < size; i++) {
			this.boxes[i] = new Array(size);
			for (var j = 0; j < size; j++) {
				var box = Object.create(Box);
				box.init(i, j, size);
				this.boxes[i][j] = box;
				for (var x=0; x < size; x++) {
					for (var y=0; y < size; y++) {
						this.cells[i*size+x][j*size+y] = box.cells[x][y];
					}
				}
			}
		}
	},
	'make_simple': function() {
		for (var x = 0 ; x < this.size ; x++) {
			for (var y = 0 ; y < this.size ; y++) {
				this.boxes[x][y].make_simple();
			}
		}
	},
	'display': function(div_id) {
		if (this.size) {
			// display each box, which in turn displays each cell
			for (var x=0 ; x < this.size; x++) {
				for (var y=0 ; y < this.size; y++) {
					this.boxes[x][y].display(div_id);
				}
			}
		}
	},
	'reveal': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.boxes[x][y].reveal();
			}
		}
	},
	'show_guesses': function() {
		for (var x=0 ; x < this.size*this.size; x++) {
			for (var y=0 ; y < this.size*this.size; y++) {
				for (var guess=0 ; guess < this.size*this.size; guess++) {
					this.cells[x][y].guesses[guess] = true;
				}
				this.cells[x][y].display_guesses();
			}
		}
	},
	'clear': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.boxes[x][y].clear();
			}
		}
	},
	'create_controls': function(div_id) {
		for (var i=0 ; i<size*size ; i++) {
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
			if (reg=this.id.match(/box_(\d+)_(\d+)_cell_(\d+)_(\d+)/)) {
				var cell=sudoku.boxes[parseInt(reg[1])][parseInt(reg[2])].cells[parseInt(reg[3])][parseInt(reg[4])];
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
