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

// Given an array of items, randomize the order
function shuffle_array(arr) {
	if (arr.length < 2) return;
	if (Math.random() < 0.5) {
		var tmp = arr[0];
		arr[0] = arr[1];
		arr[1] = tmp;
	}
	if (arr.length > 2) {
		for (var j=2; j<arr.length; j++) {
			var random_idx = Math.floor(Math.random() * j);
			if (random_idx != j) {
				var tmp = arr[random_idx];
				arr[random_idx] = arr[j];
				arr[j] = tmp;
			}
		}
	}
}

// Create a randomly ordered list of values 0 to size-1
function random_list(size) {
	var ret = new Array();
	for (var i=0; i<size; i++) {
		ret.push(i);
	}
	shuffle_array(ret);
	return ret;
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
	'conflicts': null,
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
	},
	'find_conflicts': function() {
		this.conflicts = new Array();
		for (var x=0; x<this.range; x++) {
			var test_cell = this.row.cell_at(x);
			if (test_cell.value == this.value) {
				this.conflicts.push(test_cell);
			}
		}
		for (var x=0; x<this.range; x++) {
			var test_cell = this.col.cell_at(x);
			if (test_cell.value == this.value) {
				this.conflicts.push(test_cell);
			}
		}
		for (var x=0; x<this.range; x++) {
			var test_cell = this.group.cell_at(x);
			if (test_cell.value == this.value) {
				this.conflicts.push(test_cell);
			}
		}
	},
	'may_set_to': function(val) {
		for (var x=0; x<this.range; x++) {
			if (this.row.cell_at(x).value == val) return false;
			if (this.col.cell_at(x).value == val) return false;
			if (this.group.cell_at(x).value == val) return false;
		}
		return true;
	},
	'reveal_conflicts': function() {
		if (this.conflicts.size > 0) {
			this.div.addClass('conflict');
		} else {
			this.div.removeClass('conflict');
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
	},
	'already_contains': function(val) {
		for (var i=0; i<this.size; i++) {
			if (this.cells[i].value == val) return true;
		}
		return false;
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
	},
	'already_contains': function(val) {
		for (var i=0; i<this.size; i++) {
			if (this.cells[i].value == val) return true;
		}
		return false;
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
	},
	'already_contains': function(val) {
		for (var i=0; i<this.size; i++) {
			if (this.cells[i].value == val) return true;
		}
		return false;
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
	'group_sizes': {
			4: [2,2],
			6: [2,3],
			8: [2,4],
			9: [3,3],
			10: [2,5],
			12: [3,4],
			14: [2,7],
			15: [3,5],
			16: [4,4],
			18: [3,6],
			20: [4,5],
			24: [4,6],
			25: [5,5],
			28: [4,7],
			30: [5,6]
	},
	'init': function(size) {
		if (size < 4 || size > 25) {
			throw new Error("Size must be at least 4 and no more than 25");
		}
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
	'clear_group_map': function() {
		this.group_map = new Array(this.size);
		for (i=0 ; i<this.size ; i++) {
			this.group_map[i] = new Array(this.size);
			for (j=0 ; j<this.size ; j++) {
				this.group_map[i][j] = null;
			}
		}
	},
	'simple_groups': function() {
		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			this.clear_group_map();
			for (i=0 ; i<this.size ; i++) {
				for (j=0 ; j<this.size ; j++) {
					var group_number = Math.floor(i/xsize) * xsize + Math.floor(j/ysize);
					this.group_map[i][j] = group_number;
				}
			}
		} else {
			throw new Error("Simple groups are only possible if size is the square of an integer.");
		}
	},
	'complex_groups': function() {
		this.clear_group_map();

		var group_anchors = new Array(this.size);

		function distance_squared(p1, p2) {
			return (p2[0]-p1[0])**2 + (p2[1]-p1[1])**2;
		}

		function clear_size_check(group_map, size, replace_with = null) {
			for (var i=0 ; i<size; i++) {
				for (var j=0 ; j<size; j++) {
					if (group_map[i][j] == -1) {
						group_map[i][j] = replace_with;
					}
				}
			}
		}

		// Returns the number of blocks filled in starting at x,y
		function check_size(group_map, size, x, y) {
			if (group_map[x][y] != null) { return 0; }
			group_map[x][y] = -1;
			var neighbors = new Array();
			if (x>0) neighbors.push([x-1,y]);
			if (x<size-1) neighbors.push([x+1,y]);
			if (y>0) neighbors.push([x,y-1]);
			if (y<size-1) neighbors.push([x,y+1]);
			var count = 1;
			for (var i=0 ; i<neighbors.length; i++) {
				count += check_size(group_map,size,neighbors[i][0],neighbors[i][1]);
			}
			return count;
		}

		// Starting points:
		// 1. on edge, beside current blocks, with three neighbors
		// 2. on edge, beside current blocks, with two neighbors
		// 3. three neighbors
		// 4. two neighbors
		// 5. one neighbor
		function find_starting_points(group_map, size) {
			var on_edge_three_neighbors = new Array();
			var on_edge_two_neighbors = new Array();
			var three_neighbors = new Array();
			var two_neighbors = new Array();
			var one_neighbor = new Array();
			for (var x=0 ; x<size; x++) {
				for (var y=0 ; y<size; y++) {
					var edge_count = 0;
					var neighbor_count = 0;
					if (x==0) {
						edge_count++;
					} else if (group_map[x-1][y] != null) {
						neighbor_count++;
					}
					if (x == size-1) {
						edge_count++;
					} else if (group_map[x+1][y] != null) {
						neighbor_count++;
					}
					if (y==0) {
						edge_count++;
					} else if (group_map[x][y-1] != null) {
						neighbor_count++;
					}
					if (y == size-1) {
						edge_count++;
					} else if (group_map[x][y+1] != null) {
						neighbor_count++;
					}
					if (edge_count > 0 && edge_count + neighbor_count == 3) {
						on_edge_three_neighbors.push([x,y])
					} else if (edge_count > 0 && edge_count + neighbor_count == 2) {
						on_edge_two_neighbors.push([x,y])
					} else if (edge_count + neighbor_count > 2) {
						three_neighbors.push([x,y])
					} else if (edge_count + neighbor_count == 2) {
						two_neighbors.push([x,y])
					} else if (edge_count + neighbor_count == 1) {
						one_neighbor.push([x,y])
					}
				}
			}
			return on_edge_three_neighbors.concat(on_edge_two_neighbors, three_neighbors, two_neighbors, one_neighbor);
		}

		function log_map(group_map,size) {
			console.log("Map:");
			for (var i=0 ; i<size; i++) {
				var str = '';
				for (var j=0 ; j<size; j++) {
					var item = group_map[i][j];
					if (item != null) {
						str += item;
					} else {
						str += '_';
					}
				}
				console.log('' + i + ': ' + str);
			}
		}

		function recurse_group(group_map,size,x,y,group_number,cell_count) {
			if (x<0 || x>=size || y<0 || y>=size) return false;
			if (group_map[x][y] != null) return false;
			//console.log("Trying " + x + "," + y + " group: " + group_number + " cells: " + cell_count);
			group_map[x][y] = group_number;
			if (cell_count == 1) {
				group_anchors[group_number] = [x,y];
			} else if (cell_count == size) {
				group_number++;
				if (group_number == size) return true;
				// Make sure there are no orphaned pieces
				for (var i=0 ; i<size; i++) {
					for (var j=0 ; j<size; j++) {
						if (group_map[i][j] == null) {
							var count = check_size(group_map, size, i, j);
							if (count % size != 0) {
								clear_size_check(group_map, size);
								//console.log("Found an orphaned group of size " + count + ", backtracking");
								//log_map(group_map,size);
								group_map[x][y] = null;
								return false;
							} else if (count == size && group_number == size - 1) {
								// short cut - fill these suckers in
								//console.log("Short cut to end for group " + group_number);
								//log_map(group_map,size);
								clear_size_check(group_map, size, group_number);
								//log_map(group_map,size);
								return true;
							}
						}
					}
				}
				clear_size_check(group_map, size);
				// find another starting point for this group
				potential_starting_points = find_starting_points(group_map, size);
				//console.log("Reset cell count, going to group " + group_number + " at " + x + "," + y);
				//log_map(group_map,size);
				for (var k=0; k<potential_starting_points.length; k++) {
					x = potential_starting_points[k][0];
					y = potential_starting_points[k][1];
					if (recurse_group(group_map,size,x,y,group_number,1)) {
						return true;
					}
				}
				//log_map(group_map,size);
				group_map[x][y] = null;
				return false;
			}
			// There are at most 3  or 4 cells that touch this one and are
			// unused.  We need to try them in order of how close they are to
			// the current group anchor.
			function find_frontier_cells(group_map, size, x, y, group_number) {
				if (x<0 || x>=size || y<0 || y>size) return [];
				if (group_map[x][y] == null) {
					group_map[x][y] = 'f';
					return [[x,y]];
				}
				if (group_map[x][y] == group_number) {
					group_map[x][y] = 's:' + group_number;
					return [].concat(
						find_frontier_cells(group_map, size, x-1, y, group_number),
						find_frontier_cells(group_map, size, x+1, y, group_number),
						find_frontier_cells(group_map, size, x, y-1, group_number),
						find_frontier_cells(group_map, size, x, y+1, group_number)
						);
				} else {
					return [];
				}
			}
			function replace_seen_group_numbers(group_map, size, x, y) {
				if (x<0 || x>=size || y<0 || y>size) return;
				if (group_map[x][y] == null) return;
				if (group_map[x][y] == 'f') {
					group_map[x][y] = null;
					return;
				}
				if (group_map[x][y].toString().startsWith('s:')) {
					group_map[x][y] = parseInt(group_map[x][y].slice(2));
					replace_seen_group_numbers(group_map, size, x-1, y);
					replace_seen_group_numbers(group_map, size, x+1, y);
					replace_seen_group_numbers(group_map, size, x, y-1);
					replace_seen_group_numbers(group_map, size, x, y+1);
				}
			}
			var frontier_cells = find_frontier_cells(group_map, size, x, y, group_number);
			// clean up
			replace_seen_group_numbers(group_map, size, x, y);
			// sort frontier cells in order of distance from group anchor
			var group_anchor = group_anchors[group_number];
			for (var i=0 ; i<frontier_cells.length; i++) {
				frontier_cells[i][2] = distance_squared(frontier_cells[i], group_anchor);
			}
			frontier_cells.sort(function(a,b) {
				if (a[2]==b[2]) {
					// the two are equal, so choose one randomly
					return Math.random() - 0.5;
				} else {
					return a[2]-b[2];
				}
			});
			// try each frontier cell
			for (var i=0 ; i<frontier_cells.length; i++) {
				if (recurse_group(group_map,size,frontier_cells[i][0],frontier_cells[i][1],group_number,cell_count+1)) {
					return true;
				}
			}
			// backtrack
			//console.log("Backtrack from " + x + "," + y);
			//log_map(group_map,size);
			group_map[x][y] = null;
			return false;
		}

		return recurse_group(this.group_map,this.size,0,0,0,1);
	},
	'gather_groups': function() {
		for (i=0 ; i<this.size ; i++) {
			for (j=0 ; j<this.size ; j++) {
				var group_number = this.group_map[i][j];
				if (group_number != null) {
				this.groups[group_number].add_cell(this.cells[i][j]);
				}
			}
		}
	},
	'make_simple': function() {
		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			for (var x = 0 ; x < this.size ; x++) {
				for (var y = 0 ; y < this.size ; y++) {
					var new_val = ((x % xsize) * ysize + Math.floor(x / xsize) + y) % this.size;
					this.cells[x][y].value = new_val;
				}
			}
		} else {
			throw new Error("Simple groups are only possible if size is the square of an integer.");
		}
	},
	'shuffle_simple': function() {
		function debug_if_out_of_bounds(shuffle_map, size) {
			for (var x = 0 ; x < size ; x++) {
				for (var y = 0 ; y < size ; y++) {
					if (shuffle_map[x][y][0] < 0 || shuffle_map[x][y][0] >= size || shuffle_map[x][y][1] < 0 || shuffle_map[x][y][1] >= size) {
						debugger;
						return;
					}
				}
			}
		}

		function show_shuffle_map(shuffle_map, size) {
			console.log("map:")
			for (var y = 0 ; y < size ; y++) {
				var map_line = '' + y + ': ';
				for (var x = 0 ; x < size ; x++) {
					map_line += ("[" + shuffle_map[x][y][0] + "," + shuffle_map[x][y][1] + "] ");
				}
				console.log(map_line);
			}
		}

		function init_shuffle_map(size) {
			var shuffle_map = new Array(size);
			for (var x = 0 ; x < size ; x++) {
				shuffle_map[x] = new Array(size);
				for (var y = 0 ; y < size ; y++) {
					shuffle_map[x][y] = [x,y];
				}
			}
			return shuffle_map;
		}

		function apply_shuffle_map(shuffle_map, cells, size) {
			function walk_shuffle_map(shuffle_map, cells, x, y, val) {
				var next_point = shuffle_map[x][y];
				if (!next_point) {
					debugger;
				}
				if (next_point[0] != x || next_point[1] != y) {
					shuffle_map[x][y] = [x,y];
					walk_shuffle_map(shuffle_map, cells, next_point[0], next_point[1], cells[x][y].value);
				}
				if (val !== null) cells[x][y].value = val;
			}

			for (var x = 0 ; x < size ; x++) {
				for (var y = 0 ; y < size ; y++) {
					walk_shuffle_map(shuffle_map, cells, x, y, null);
				}
			}
		}

		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			var xgroup_size = ysize;
			var ygroup_size = xsize;

			var shuffle_map = init_shuffle_map(this.size);
			debug_if_out_of_bounds(shuffle_map, this.size);

			// choose new row order for each group row
			var new_ygroup_order = random_list(ygroup_size);
			for (var ygroup=0; ygroup<ygroup_size; ygroup++) {
				var first_y_in_group = ygroup * ysize;
				if (new_ygroup_order[ygroup] != ygroup) {
					var y_movement = (new_ygroup_order[ygroup] - ygroup) * ysize;
					for (var y=first_y_in_group; y<first_y_in_group+ysize; y++) {
						for (var x = 0 ; x < this.size ; x++) {
							shuffle_map[x][y][1] += y_movement;
						}
					}
				}
			}

			//show_shuffle_map(shuffle_map, this.size);
			apply_shuffle_map(shuffle_map, this.cells, this.size);
			shuffle_map = init_shuffle_map(this.size);

			for (var ygroup=0; ygroup<ygroup_size; ygroup++) {
				var new_y_order = random_list(ysize);
				var first_y_in_group = ygroup * ysize;
				for (var y=0; y<ysize; y++) {
					if (new_y_order[y] != y) {
						var y_movement = new_y_order[y] - y;
						for (var x = 0 ; x < this.size ; x++) {
							shuffle_map[x][y+first_y_in_group][1] += y_movement;
						}
					}
				}
				debug_if_out_of_bounds(shuffle_map, this.size);
			}

			//show_shuffle_map(shuffle_map, this.size);
			apply_shuffle_map(shuffle_map, this.cells, this.size);
			shuffle_map = init_shuffle_map(this.size);

			var new_xgroup_order = random_list(xgroup_size);
			for (var xgroup=0; xgroup<xgroup_size; xgroup++) {
				var first_x_in_group = xgroup * xsize;
				if (new_xgroup_order[xgroup] != xgroup) {
					var x_movement = (new_xgroup_order[xgroup] - xgroup) * xsize;
					for (var x=first_x_in_group; x<first_x_in_group+xsize; x++) {
						for (var y = 0 ; y < this.size ; y++) {
							shuffle_map[x][y][0] += x_movement;
						}
					}
				}
				debug_if_out_of_bounds(shuffle_map, this.size);
			}

			//show_shuffle_map(shuffle_map, this.size);
			apply_shuffle_map(shuffle_map, this.cells, this.size);
			shuffle_map = init_shuffle_map(this.size);

			for (var xgroup=0; xgroup<xgroup_size; xgroup++) {
				var new_x_order = random_list(xsize);
				var first_x_in_group = xgroup * xsize;
				for (var x=0; x<xsize; x++) {
					if (new_x_order[x] != x) {
						var x_movement = new_x_order[x] - x;
						for (var y = 0 ; y < this.size ; y++) {
							shuffle_map[x+first_x_in_group][y][0] += x_movement;
						}
					}
				}
				debug_if_out_of_bounds(shuffle_map, this.size);
			}

			//show_shuffle_map(shuffle_map, this.size);
			apply_shuffle_map(shuffle_map, this.cells, this.size);

			this.log_puzzle();

		} else {
			throw new Error("Simple groups are only possible if size is the square of an integer.");
		}
	},
	'make_complex': function() {

		if (this.group_sizes[this.size]) {

			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];

			var initial_groups = new Array();

			for (var i=0; i<Math.min(xsize,ysize); i++) {
				initial_groups.push(i*xsize+i);
			}

			// Fill initial groups - these groups have no cells in common
			for (var i=0; i<initial_groups.length; i++) {
				var group_number = initial_groups[i];

				var this_group = this.groups[group_number];

				var group_fill = random_list(this.size);
				for (var j=0; j<this.size; j++) {
					this_group.cells[j].value = group_fill[j];
				}
			}

			// Put all remaining cells in an array and shuffle them

			var remaining_cells = [];

			for (var i=0; i<this.size; i++) {
				var found = false;
				for (var j=0; j<initial_groups.length; j++) {
					if (initial_groups[j]==i) {
						found = true;
						break;
					}
				}
				if (!found) {
					remaining_cells = remaining_cells.concat(this.groups[i].cells)
				}
			}

		} else {

			// Not a simple map, fill in single group to start

			var first_group_num = Math.floor(Math.random() * this.size);
			var first_group = this.groups[first_group_num];

			// First, randomly fill the cells in one random group

			var first_group_fill = random_list(this.size);
			for (var i=0; i<this.size; i++) {
				first_group.cells[i].value = first_group_fill[i];
			}

			// Put all remaining cells in an array and shuffle them

			var remaining_cells = [];

			for (var i=0; i<this.size; i++) {
				if (i != first_group_num) {
					remaining_cells = remaining_cells.concat(this.groups[i].cells)
				}
			}
		}

		shuffle_array(remaining_cells);

		function walk_puzzle(remaining_cells) {
			if (remaining_cells.length == 0) return true;
			var this_cell = remaining_cells.shift();
			var order_to_try = random_list(this_cell.range);
			for (var i=0; i<this_cell.range; i++) {
				this_cell.value = null;
				if (this_cell.may_set_to(order_to_try[i])) {
					this_cell.value = order_to_try[i];
					if (walk_puzzle(remaining_cells)) return true;
				}
			}
			this_cell.value = null;
			remaining_cells.unshift(this_cell);
			return false;
		}

		walk_puzzle(remaining_cells);

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
	'find_conflicts': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].find_conflicts();
			}
		}
	},
	'reveal_conflicts': function() {
		for (var x=0 ; x < this.size; x++) {
			for (var y=0 ; y < this.size; y++) {
				this.cells[x][y].reveal_conflicts();
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
	'log_puzzle': function() {
		console.log('puzzle:')
		var str = '    +-' + '-'.repeat(this.size*5-2) + '+';
		console.log(str);
		for (var y=0 ; y < this.size; y++) {
			var bottom_change = (y==this.size-1 || this.cells[0][y].group != this.cells[0][y+1].group);
			var str = (' '+y).substr(-2) + ': | ';
			var str2 = bottom_change ? '    +' : '    |';
			for (var x=0 ; x < this.size; x++) {
				var cell = this.cells[x][y];
				if (cell.value === null) {
					str += ' _';
				} else {
					str += (' ' + this.cells[x][y].value).substr(-2);
				}
				var right_change = (x==this.size-1 || this.cells[x][y].group != this.cells[x+1][y].group);
				var bottom_change = (y==this.size-1 || this.cells[x][y].group != this.cells[x][y+1].group);
				str += right_change ? ' | ' : '   ';
				if (bottom_change) {
					str2 += '----';
					str2 += right_change ? '+' : '-';
				} else {
					str2 += '    ';
					str2 += right_change ? '|' : ' ';
				}
			}
			console.log(str);
			console.log(str2);
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
