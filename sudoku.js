// Copyright 2010-2017 Michael Chaney
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
	'div': null,
	'value': null,
	'showing': null,
	'guesses': null,
	'locked': null,
	'guess_rows': null,
	'conflicts': null,
	'display_values': ['1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','0'],
	'init': function(puzzle) {
		this.puzzle = puzzle;
		this.range = puzzle.size;
		this.guesses = new Array(this.range);
		this.guess_rows = Math.ceil(Math.sqrt(this.range));
	},
	'div_id': function() {
		return "cell_" + this.x + "_" + this.y;
	},
	'set_group': function(group) {
		this.group = group;
	},
	'set_row': function(row) {
		this.row = row;
		this.y = row.id;
	},
	'set_col': function(col) {
		this.col = col;
		this.x = col.id;
	},
	'left_neighbor': function() {
		if (this.x > 0) {
			return this.row.cells[this.x-1];
		} else {
			return undefined;
		}
	},
	'right_neighbor': function() {
		if (this.x < this.row.size) {
			return this.row.cells[this.x+1];
		} else {
			return undefined;
		}
	},
	'upper_neighbor': function() {
		if (this.y > 0) {
			return this.col.cells[this.y-1];
		} else {
			return undefined;
		}
	},
	'lower_neighbor': function() {
		if (this.y < this.col.size) {
			return this.col.cells[this.y+1];
		} else {
			return undefined;
		}
	},
	'neighbors': function() {
		// The filter will remove "undefined" and leave only actual cells
		var ret = new Array(this.upper_neighbor(), this.right_neighbor(), this.lower_neighbor(), this.left_neighbor());
		return ret.filter(function(cell) { return cell; });
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
	'display': function(reveal) {
		var td = document.createElement('td');
		td.id = this.div_id();
		td.classList.add('cell');
		td.classList.add('x_' + this.x);
		td.classList.add('y_' + this.y);
		td.classList.add('group_' + this.group.id);
		if (this.group.color !== null) {
			td.classList.add('color_' + this.group.color);
		}
		if (this.x == 0 || this.row.cells[this.x-1].group != this.group) {
			td.classList.add('ldiff');
		}
		if (this.x == this.range-1 || this.row.cells[this.x+1].group != this.group) {
			td.classList.add('rdiff');
		}
		if (this.y == 0 || this.col.cells[this.y-1].group != this.group) {
			td.classList.add('tdiff');
		}
		if (this.y == this.range-1 || this.col.cells[this.y+1].group != this.group) {
			td.classList.add('bdiff');
		}
		this.div = td;
		if (reveal) this.reveal();
		return td;
	},
	'show_marker': function() {
		var marker = '' + this.group.id + "/" + this.x + "," + this.y;
		var text_node = document.createTextNode(marker);
		this.div.appendChild(text_node);
	},
	'empty': function() {
		while (this.div.firstChild) this.div.removeChild(this.div.firstChild);
	},
	'clear': function() {
		this.empty();
		this.showing = null;
	},
	'set_color': function(color) {
		this.div.classList.remove('color_0');
		this.div.classList.remove('color_1');
		this.div.classList.remove('color_2');
		this.div.classList.remove('color_3');
		this.div.classList.add('color_'+color);
	},
	'display_guesses': function() {
		this.clear();
		this.showing='guess';
		for (var i=0; i<this.range; i++) {
			if (this.guesses[i]) this.display_guess(i);
		}
	},
	'guess_div_id': function(guess) {
		return this.div_id() + '_guess_' + guess;
	},
	'display_guess': function(guess) {
		if (this.showing!==null && this.showing!=='guess') this.clear();
		this.showing='guess';
		var guess_row = Math.floor(guess/this.guess_rows);
		var guess_col = guess % this.guess_rows;
		var guess_div = document.createElement('div');
		guess_div.classList.add('guess');
		guess_div.id = this.guess_div_id(guess);
		var guess_div_txt = document.createTextNode(this.display_values[guess]);
		guess_div.appendChild(guess_div_txt);
		var pixel_padding = 2;
		var guess_width = guess_div.offsetWidth;
		var cell_width = this.div.offsetWidth - pixel_padding * 2;
		var guess_height = guess_div.offsetHeight;
		var cell_height = this.div.offsetHeight - pixel_padding * 2;
		if (guess_row == 0) {
			guess_div.style.top = '' + pixel_padding + 'px';
		} else if (guess_row == this.guess_rows - 1) {
			guess_div.style.bottom = '' + pixel_padding + 'px';
		} else {
			guess_div.style.top = '' + (cell_height * guess_row / (this.guess_rows-1) - guess_height/2.0 + pixel_padding) + 'px';
		}
		if (guess_col == 0) {
			guess_div.style.left = '' + pixel_padding + 'px';
		} else if (guess_col == this.guess_rows - 1) {
			guess_div.style.right = '' + pixel_padding + 'px';
		} else {
			guess_div.style.left = '' + (cell_width * guess_col / (this.guess_rows-1) - guess_width/2.0 + pixel_padding) + 'px';
		}
		this.div.appendChild(guess_div);
	},
	'reveal': function() {
		this.clear();
		if (this.value!==null && this.showing!=='answer') {
			this.showing = 'answer';
			var span = document.createElement('span');
			span.classList.add('revealed');
			span.classList.add('value');
			var span_txt = document.createTextNode(this.display_values[this.value]);
			span.appendChild(span_txt);
			this.div.appendChild(span);
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
		// If the value directly conflicts with any other member
		// of the group, reject it.
		for (var x=0; x<this.range; x++) {
			if (this.row.cell_at(x).value == val) return false;
			if (this.col.cell_at(x).value == val) return false;
			if (this.group.cell_at(x).value == val) return false;
		}
		// This is a little more subtle.  If the value would cause
		// any currently empty member of any of the three groups to
		// have no possible value, then reject it.
		// Simply, we find all possible remaining values for each
		// empty group member.  If there is a single possible
		// remaining value for a member and it's "val", then we
		// must reject this value.
		for (var x=0; x<this.range; x++) {
			var test_cell = this.row.cell_at(x);
			if (test_cell != this && test_cell.value === null) {
				var current_conflicts = test_cell.current_conflicts();
				current_conflicts[val] = true;
				if (current_conflicts.every(function(value) { return value; })) return false;
			}
			test_cell = this.col.cell_at(x);
			if (test_cell != this && test_cell.value === null) {
				var current_conflicts = test_cell.current_conflicts();
				current_conflicts[val] = true;
				if (current_conflicts.every(function(value) { return value; })) return false;
			}
			test_cell = this.group.cell_at(x);
			if (test_cell != this && test_cell.value === null) {
				var current_conflicts = test_cell.current_conflicts();
				current_conflicts[val] = true;
				if (current_conflicts.every(function(value) { return value; })) return false;
			}
		}
		return true;
	},
	'current_conflicts': function() {
		var ret = new Array(this.range).fill(false);
		for (var i=0; i<this.range; i++) {
			var val = this.row.cell_at(i).value;
			if (val !== null) ret[val] = true;
			val = this.col.cell_at(i).value;
			if (val !== null) ret[val] = true;
			val = this.group.cell_at(i).value;
			if (val !== null) ret[val] = true;
		}
		return ret;
	},
	'reveal_conflicts': function() {
		if (this.conflicts.size > 0) {
			this.div.classList.add('conflict');
		} else {
			this.div.classList.remove('conflict');
		}
	}
};

var Group = {
	'puzzle': null,
	'size': null,
	'id': null,
	'cells': null,
	'color': null,
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
	'set_color': function(color_number) {
		this.color = color_number;
	},
	'clear_color': function() {
		this.set_color(null);
	},
	'color_cells': function() {
		for (var i=0; i<this.size; i++) {
			this.cells[i].set_color(this.color);
		}
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
	'layout_style': null,
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
		// setting up cells - the cells are set in the x,y grid (as
		// referenced by the "cols" property) and all are stored in
		// a 1D array called "cells".  Groups are not assigned at this
		// point to cells, although they are created.
		this.size = size;
		this.cells = new Array;
		this.rows = new Array(size);
		this.cols = new Array(size);
		this.groups = new Array(size);
		for (var i = 0; i < size; i++) {
			this.rows[i] = Object.create(Row);
			this.rows[i].init(this, i, size);
			this.cols[i] = Object.create(Col);
			this.cols[i].init(this, i, size);
			this.groups[i] = Object.create(Group);
			this.groups[i].init(this, i, size);
		}
		for (var x = 0; x < size; x++) {
			for (var y = 0; y < size; y++) {
				var cell = Object.create(Cell);
				cell.init(this);
				this.cells.push(cell);
				this.rows[y].add_cell(cell,x);
				this.cols[x].add_cell(cell,y);
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
	'regular_groups': function() {
		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			this.clear_group_map();
			this.layout_style = 'regular';
			for (i=0 ; i<this.size ; i++) {
				for (j=0 ; j<this.size ; j++) {
					var group_number = Math.floor(i/xsize) * xsize + Math.floor(j/ysize);
					this.group_map[i][j] = group_number;
				}
			}
		} else {
			throw new Error("Regular groups are only possible if size is the square of an integer.");
		}
	},
	'irregular_groups': function() {
		this.clear_group_map();
		this.layout_style = 'irregular';

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
	'color_groups': function() {
		for (var i=0; i<this.size; i++) {
			this.groups[i].clear_color();
		}

		function try_colors(groups, size, group_number) {
			if (group_number >= size) { return true; }
			var group = groups[group_number];
			for (var color=0; color<4; color++) {
				// if any cell touching this one is in a different group and
				// has the color, skip to the next color
				var found_color_in_neighbor = false;
				for (var i=0; i<size; i++) {
					if (group.cells[i].neighbors().some(function(neighbor_cell) {
						return neighbor_cell.group != group &&
								neighbor_cell.group.color !== null &&
								neighbor_cell.group.color == color;
							})) {
						found_color_in_neighbor = true;
						break;
					}
				}
				if (!found_color_in_neighbor) {
					group.set_color(color);
					if (try_colors(groups, size, group_number+1)) { return true; }
				}
			}
			group.clear_color();
			return false;
		}

		try_colors(this.groups, this.size, 0);
	},
	'gather_groups': function() {
		for (var i=0 ; i<this.size ; i++) {
			for (var j=0 ; j<this.size ; j++) {
				var group_number = this.group_map[i][j];
				if (group_number != null) {
					this.groups[group_number].add_cell(this.cols[i].cells[j]);
				}
			}
		}
	},
	'make_regular': function() {
		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			for (var x = 0 ; x < this.size ; x++) {
				for (var y = 0 ; y < this.size ; y++) {
					var new_val = ((x % xsize) * ysize + Math.floor(x / xsize) + y) % this.size;
					this.cols[x].cells[y].value = new_val;
				}
			}
		} else {
			throw new Error("Regular groups are only possible if size is the square of an integer.");
		}
	},
	'shuffle_regular': function() {
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

		if (this.group_sizes[this.size]) {
			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];
			var xgroup_size = ysize;
			var ygroup_size = xsize;

			var shuffle_map = this.null_shuffle_map();
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

			//this.log_shuffle_map(shuffle_map);
			this.apply_shuffle_map_to_values(shuffle_map);

			shuffle_map = this.null_shuffle_map();

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

			//this.log_shuffle_map(shuffle_map);
			this.apply_shuffle_map_to_values(shuffle_map);

			shuffle_map = this.null_shuffle_map();

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

			//this.log_shuffle_map(shuffle_map);
			this.apply_shuffle_map_to_values(shuffle_map);

			shuffle_map = this.null_shuffle_map();

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

			//this.log_shuffle_map(shuffle_map);
			this.apply_shuffle_map_to_values(shuffle_map);

			//this.log_puzzle();

		} else {
			throw new Error("Regular groups are only possible if size is the square of an integer.");
		}
	},
	'seed_puzzle': function() {

		var initial_groups = new Array();

		if (this.layout_style == 'regular' && this.size > 4) {

			var xsize = this.group_sizes[this.size][0];
			var ysize = this.group_sizes[this.size][1];

			for (var i=0; i<Math.min(xsize,ysize); i++) {
				initial_groups.push(this.groups[i*xsize+i]);
			}
		} else {
			var first_group_num = Math.floor(Math.random() * this.size);
			initial_groups.push(this.groups[first_group_num]);
		}

		// Fill initial groups - these groups have no cells in common
		for (var i=0; i<initial_groups.length; i++) {
			var this_group = initial_groups[i];

			var group_fill = random_list(this.size);
			for (var j=0; j<this.size; j++) {
				this_group.cells[j].value = group_fill[j];
			}
		}

	},
	'make_irregular': function() {

		this.seed_puzzle();

		// Put all groups in a list and shuffle them
		var remaining_groups = [];

		for (var i=0; i<this.size; i++) {
			if (!this.groups[i].cells.every(function(cell) { return cell.value !== null; })) {
				remaining_groups.push(this.groups[i])
			}
		}

		shuffle_array(remaining_groups);

		function walk_groups(remaining_groups, current_group_number) {
			if (current_group_number == remaining_groups.length) return true;
			var this_group = remaining_groups[current_group_number];

			// Before we try to fill this in, let's make sure that it's
			// possible.
			var all_conflicts = new Array(this_group.size);
			for (i=0; i<this_group.size; i++) {
				all_conflicts[i] = this_group.cell_at(i).current_conflicts();
			}

			// Make sure there are no cells that conflict with all values.
			for (i=0; i<this_group.size; i++) {
				if (all_conflicts[i].every(function(val) { return val; })) return false;
			}

			// Make sure every value has somewhere that it can be placed.
			for (j=0; j<this_group.size; j++) {
				if (all_conflicts.every(function(val) {return val[j];})) return false;
			}

			// For each value, map the cells where it can be placed
			var possible_cells_by_value = new Array();

			for (var test_value=0; test_value<this_group.size; test_value++) {
				these_cells = new Array();
				for (j=0; j<this_group.size; j++) {
					if (!all_conflicts[j][test_value]) {
						these_cells.push(this_group.cell_at(j));
					}
				}
				possible_cells_by_value.push([test_value, these_cells]);
			}

			// Sort smallest list to largest list, but randomly
			// if the list is same size.
			possible_cells_by_value.sort(function(a,b) {
				if (a[1].length == b[1].length) {
					return Math.random() - 0.5;
				} else {
					return a[1].length - b[1].length;
				}
			});

			var singles = possible_cells_by_value.filter(function(item) { return item[1].length == 1; });

			// If any of the singles point to the same cell, this ain't
			// gonna work
			if (singles.find(function(item, idx, arr) { for (var i=0; i<arr.length; i++) { return (i != idx && item[1][0] == arr[i][1][0]); } })) return false;

			var in_between = possible_cells_by_value.filter(function(item, idx, arr) { return (item[1].length > 1 && idx < arr.length - 1); });

			var last_item = possible_cells_by_value[possible_cells_by_value.length-1];
			if (last_item[1].length == 1) last_item = null;

			// shuffle cell lists
			for (var i=0; i<in_between.length ; i++) {
				shuffle_array(in_between[i][1]);
			}

			var inc_steps = new Array(in_between.length);
			var inc_levels = new Array(in_between.length);
			for (i=0; i<in_between.length; i++) {
				inc_steps[i] = in_between[i][1].length;
				inc_levels[i] = 0;
			}

			// We'll go through each value and then try each in squares
			// based on order in possible_cells_by_value

			function walk_cells(this_group, possible_cells_by_value, current_number) {
				if (current_number == possible_cells_by_value.length) return true;
				var val = possible_cells_by_value[current_number][0];
				var cell_order = possible_cells_by_value[current_number][1];
				for (var i=0; i<cell_order.length; i++) {
					var this_cell = cell_order[i];
					if (this_cell.value === null) {
						this_cell.value = val;
						if (walk_cells(this_group, possible_cells_by_value, current_number + 1)) return true;
						this_cell.value = null;
					}
				}
				return false;
			}

			while (true) {
				if (walk_cells(this_group, singles, 0)) {
					if (walk_cells(this_group, in_between, 0)) {
						if (last_item === null || walk_cells(this_group, [last_item], 0)) {

							if (walk_groups(remaining_groups, current_group_number + 1)) return true;
						}
					}
				}

				// Clean out this group, try again
				for (var i=0; i<this_group.size; i++) {
					this_group.cells[i].value = null;
				}

				if (in_between.length ==0) break;

				// This didn't work, so rotate each cell order list and
				// try again.
				var carry = 1;
				for (var k=0 ; k<in_between.length; k++) {
					inc_levels[k] += carry;
					in_between[k][1].push(in_between[k][1].shift());
					if (inc_levels[k] >= inc_steps[k]) {
						inc_levels[k] = 0;
						carry = 1;
					} else {
						carry = 0;
						break;
					}
				}
				if (carry > 0) break;
			}

			return false;
		}

		walk_groups(remaining_groups, 0);

	},
	'make_irregular_random_cell_order': function() {

		this.seed_puzzle();

		// Put all remaining cells in an array and shuffle them

		var remaining_cells = new Array();

		for (var i=0; i<this.size*this.size; i++) {
			if (this.cells[i].value === null) {
				remaining_cells.push(this.cells[i]);
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
	'make_irregular_group_cell_order': function() {

		this.seed_puzzle();

		var remaining_cells = new Array();

		var group_order = random_list(this.size);

		for (var i=0; i<this.size; i++) {
			for (var j=0; j<this.size; j++) {
				if (this.groups[group_order[i]].cells[j].value === null) {
					remaining_cells.push(this.groups[group_order[i]].cells[j]);
				}
			}
		}

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
	'rotate_puzzle_clockwise': function(degrees) {

		var shuffle_map = this.blank_shuffle_map();

		if (degrees == 90 || degrees == -270) {
			// for a 90 degree turn, y is the old x value, x is size - old y - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ this.size - y - 1, x ];
				}
			}
		} else if (degrees == 180 || degrees == -180) {
			// for a 180 degree turn, x = size - old x - 1, y = size - old y - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ this.size - x - 1, this.size - y - 1 ];
				}
			}
		} else if (degrees == -90 || degrees == 270) {
			// for a -90 degree turn, x is the old y value, y is size - old x - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ y, this.size - x - 1 ];
				}
			}
		}

		//this.log_shuffle_map(shuffle_map);
		this.apply_shuffle_map_to_cells(shuffle_map);
	},
	'flip_puzzle': function(axis) {
		// axis is a multiple of 45 degrees, with 0 being "vertical".
		// There are really only 4 values - 0, 45, 90, and 135:
		// 0 - vertical axis
		// 45 - northeast/southwest axis
		// 90 - horizontal axis
		// 135 - southeast/northwest axis

		var shuffle_map = this.blank_shuffle_map();

		if (axis == 0) {
			// vertical axis flip - y is same, x is size - x - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ this.size - x - 1, y ];
				}
			}
		} else if (axis == 45) {
			// northeast/southwest axis flip - y is size - x - 1, x is size - y - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ this.size - y - 1, this.size - x - 1 ];
				}
			}
		} else if (axis == 90) {
			// horizontal axis flip - x is same, y is size - y - 1
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ x, this.size - y - 1 ];
				}
			}
		} else if (axis == 135) {
			// southeast/northwest axis flip - x is y and y is x
			for (var x=0; x<this.size; x++) {
				for (var y=0; y<this.size; y++) {
					shuffle_map[x][y] = [ y, x ];
				}
			}
		}

		this.apply_shuffle_map_to_cells(shuffle_map);
	},
	'blank_shuffle_map': function() {
		// Each shuffle map element is an x,y pair
		// of where that cell needs to move to
		var shuffle_map = new Array(this.size);
		for (var x=0; x<this.size; x++) {
			shuffle_map[x] = new Array(this.size);
		}
		return shuffle_map;
	},
	'null_shuffle_map': function() {
		var shuffle_map = new Array(this.size);
		for (var x = 0 ; x < this.size ; x++) {
			shuffle_map[x] = new Array(this.size);
			for (var y = 0 ; y < this.size ; y++) {
				shuffle_map[x][y] = [x,y];
			}
		}
		return shuffle_map;
	},
	'apply_shuffle_map_to_cells': function(shuffle_map) {

		var old_cols = this.cols;

		// Make new rows & cols, move cells to new positions there
		this.rows = new Array(this.size);
		this.cols = new Array(this.size);
		for (var i = 0; i < this.size; i++) {
			this.rows[i] = Object.create(Row);
			this.rows[i].init(this, i, this.size);
			this.cols[i] = Object.create(Col);
			this.cols[i].init(this, i, this.size);
		}

		for (var x = 0; x < this.size; x++) {
			for (var y = 0; y < this.size; y++) {
				var cell = old_cols[x].cells[y];
				cell.showing = null;
				var new_x = shuffle_map[x][y][0];
				var new_y = shuffle_map[x][y][1];
				this.rows[new_y].add_cell(cell,new_x);
				this.cols[new_x].add_cell(cell,new_y);
			}
		}
	},
	'apply_shuffle_map_to_values': function(shuffle_map) {

		function walk_shuffle_map(shuffle_map, cols, x, y, val) {
			var next_point = shuffle_map[x][y];
			if (!next_point) { debugger; }
			if (next_point[0] != x || next_point[1] != y) {
				shuffle_map[x][y] = [x,y];
 				walk_shuffle_map(shuffle_map, cols, next_point[0], next_point[1], cols[x].cells[y].value);
			}
			if (val !== null) cols[x].cells[y].value = val;
		}

		for (var x = 0 ; x < this.size ; x++) {
			for (var y = 0 ; y < this.size ; y++) {
				walk_shuffle_map(shuffle_map, this.cols, x, y, null);
			}
		}
	},
	'log_shuffle_map': function(shuffle_map) {
		console.log("map:")
		var width = (this.size >= 10 ? 2 : 1);
		var str = '  '.substr(-width);
		for (var x=0 ; x < this.size; x++) {
		   str += '    ' + ('    '+x).substr(-width*2);
		}
		console.log(str);
		for (var y = 0 ; y < this.size ; y++) {
			var map_line = ('  ' + y + ': ').substr(-width-2);
			for (var x = 0 ; x < this.size ; x++) {
				map_line += ("[" + ('  ' + shuffle_map[x][y][0]).substr(-width) + "," + ('  ' + shuffle_map[x][y][1]).substr(-width) + "] ");
			}
			console.log(map_line);
		}
	},
	'show_all_solutions': function(display_function) {
		// This is a simple BFI solver, shows all possible solutions

		var remaining_cells = new Array();
		var puzzle = this;

		var group_order = random_list(this.size);

		for (var i=0; i<this.size; i++) {
			for (var j=0; j<this.size; j++) {
				if (this.groups[group_order[i]].cells[j].value === null) {
					remaining_cells.push(this.groups[group_order[i]].cells[j]);
				}
			}
		}

		function walk_puzzle(remaining_cells, cell_number) {
			if (cell_number >= remaining_cells.length) {
				// solution
				display_function(puzzle);
			} else {
				var this_cell = remaining_cells[cell_number];
				var order_to_try = random_list(this_cell.range);
				for (var i=0; i<this_cell.range; i++) {
					this_cell.value = null;
					if (this_cell.may_set_to(order_to_try[i])) {
						this_cell.value = order_to_try[i];
						walk_puzzle(remaining_cells, cell_number+1);
					}
				}
				this_cell.value = null;
				// no solution found, drop back and try next value
			}
		}

		walk_puzzle(remaining_cells,0);

	},
	'display': function(containing_div, reveal) {
		if (this.size) {
			var table = document.createElement('table');
			table.classList.add('sudoku');
			for (j=0 ; j<this.size ; j++) {
				var table_row = document.createElement('tr');
				for (i=0 ; i<this.size ; i++) {
					var cell = this.rows[j].cells[i];
					var col = cell.display(reveal);
					table_row.appendChild(col);
				}
				table.appendChild(table_row);
			}
			this.element = table;
			containing_div.appendChild(table);
		}
	},
	'display_group_colors': function() {
		for (var i=0; i<this.size; i++) {
			this.groups[i].color_cells();
		}
	},
	'cell_at': function(x,y) {
		return this.cols[x].cells[y];
	},
	'show_markers': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].show_marker();
		}
	},
	'reveal': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].reveal();
		}
	},
	'show_guesses': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			for (var guess=0 ; guess < this.size; guess++) {
				this.cells[i].guesses[guess] = true;
			}
			this.cells[i].display_guesses();
		}
	},
	'find_conflicts': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].find_conflicts();
		}
	},
	'reveal_conflicts': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].reveal_conflicts();
		}
	},
	'clear': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].clear();
		}
	},
	'empty': function() {
		for (var i=0 ; i < this.size*this.size; i++) {
			this.cells[i].value = null;
			this.cells[i].clear();
		}
	},
	'log_puzzle': function() {
		console.log('puzzle:')
		var str = '     ';
		var str2 = '    +';
		for (var x=0 ; x < this.size; x++) {
		   str += ('  '+x).substr(-3) + '  ';
			var right_change = (x==this.size-1 || this.cols[x].cells[0].group != this.cols[x+1].cells[0].group);
			str2 += '----';
			str2 += right_change ? '+' : '-';
		}
		console.log(str);
		console.log(str2);
		for (var y=0 ; y < this.size; y++) {
			var bottom_change = (y==this.size-1 || this.cols[0].cells[y].group != this.cols[0].cells[y+1].group);
			var str = (' '+y).substr(-2) + ': | ';
			var str2 = bottom_change ? '    +' : '    |';
			for (var x=0 ; x < this.size; x++) {
				var cell = this.cols[x].cells[y];
				if (cell.value === null) {
					str += ' _';
				} else {
					str += (' ' + this.cols[x].cells[y].value).substr(-2);
				}
				if (x == this.size - 1) {
					var bottom_change_next = false;
				} else {
					var bottom_change_next = (y==this.size-1 || this.cols[x+1].cells[y].group != this.cols[x+1].cells[y+1].group);
				}
				if (y == this.size - 1) {
					var right_change_next = false;
				} else {
					var right_change_next = (x==this.size-1 || this.cols[x].cells[y+1].group != this.cols[x+1].cells[y+1].group);
				}
				var right_change = (x==this.size-1 || this.cols[x].cells[y].group != this.cols[x+1].cells[y].group);
				var bottom_change = (y==this.size-1 || this.cols[x].cells[y].group != this.cols[x].cells[y+1].group);
				str += right_change ? ' | ' : '   ';
				if (bottom_change) {
					str2 += '----';
					str2 += right_change ? '+' : (right_change_next ? '+' : '-');
				} else {
					str2 += '    ';
					str2 += right_change_next ? (bottom_change_next ? '+' : '|') : (right_change ? (bottom_change_next ? '+' : '|') : ' ');
				}
			}
			console.log(str);
			console.log(str2);
		}
	},
	'setup_inputs': function() {
		for (var i=0; i<this.size*this.size; i++) {
			var cell = this.cells[i];
			var val = cell.val;
			if (val === undefined || val === null) val='';
			var input = document.createElement('input');
			input.type = 'text';
			input.size = 2;
			input.maxLength = 2;
			input.value = val;
			cell.div.appendChild(input);
		}
	},
	'read_inputs': function() {
		for (var i=0; i<this.size*this.size; i++) {
			var cell = this.cells[i];
			var value = cell.value_from_display(cell.div.querySelector('input').value);
			if (value !== null) {
				cell.value = value;
			}
		}
	},
	'create_controls': function(containing_div) {
		var controls_div = document.getElementById('controls');
		for (var i=0 ; i<size ; i++) {
			var a = document.createElement('a');
			a.id = 'choose_' + i;
			a.classList.add('chooser');
			var a_txt = document.createTextNode(Cell.display_values[i]);
			a.appendChild(a_txt);
			controls_div.appendChild(a);
			a.addEventListener('click', this.handle_number_click);
		}
		containing_div.addEventListener('keyup', function(event) {
			var clicked_item = String.fromCharCode(event.keyCode);
			var num = Cell.value_from_display(clicked_item);
			sudoku.set_number(num);
		});
		document.addEventListener('click', function(event) {
			if (!sudoku.current_number) { return; }
			if (event.target.classList.contains('cell')) {
				var reg;
				// assignment on next line
				if (reg=this.id.match(/group_(\d+)_(\d+)_cell_(\d+)_(\d+)/)) {
					var cell=sudoku.groups[parseInt(reg[1])][parseInt(reg[2])].cols[parseInt(reg[3])].cells[parseInt(reg[4])];
					if (cell) {
						if (event.shiftKey) {
							cell.display_guess(sudoku.current_number);
						} else {
							cell.set_value(sudoku.current_number);
						}
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
		var chooser_els = document.querySelectorAll('a.chooser.current');
		for (var a of Array.from(chooser_els)) { a.classList.remove('current'); }
		document.getElementById('choose_'+num).classList.add('current');
	},
	'solve': function() {
	}
};
