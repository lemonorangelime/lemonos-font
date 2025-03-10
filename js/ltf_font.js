"use strict";

var font = new Uint32Array(260);
var is_node = (typeof process !== "undefined") && (process.release.name === "node");

if (is_node) {
	var fs = require("fs");
}

var legacy_colour = [0x000000, 0x0000aa, 0x00aa00, 0x00aaaa, 0xaa0000, 0xaa00aa, 0xaa5500, 0xaaaaaa, 0x555555, 0x5555ff, 0x55ff55, 0x55ffff, 0xff5555, 0xff55ff, 0xffff55, 0xffffff];
function font_legacy_drawer(fb, chr, colour, position) {
        if (chr == 1) {
                fb[position] = colour | 0xff000000;
        } else if (chr > 1) {
                fb[position] = legacy_colour[chr] | 0xff000000;
        }
}

function font_blank_drawer(fb, chr, colour, position) {
        fb[position] = 0;
}

function font_combining_drawer(fb, chr, colour, position) {
        font_legacy_drawer(fb, chr, colour, position - 8);
}

function font_truecolour_drawer(fb, chr, colour, position) {
        if (chr & 0xff000000) {
                fb[position] = chr | 0xff000000;
        }
}

function font_get_drawer(control) {
	switch (control) {
		case 0:
			return font_legacy_drawer;
		case 1:
			return font_blank_drawer;
		case 2:
			return font_combining_drawer;
		case 16:
			return font_truecolour_drawer;
	}
	return font_legacy_drawer;
}

function font_address(codepoint) {
	var address = 0;
	while ((font[address] != codepoint) && address < font.length) {
		address += 130;
	}
	if (address >= font.length) {
		return font.length - 130;
	}
	return address;
}

function font_get(codepoint) {
	if (typeof codepoint == "string") {
		codepoint = codepoint.codePointAt(0);
	}
	var address = font_address(codepoint);
	return font.slice(address, address + 130);
}

function font_load(filename) {
	if (is_node) {
		var data = fs.readFileSync(filename);
		font = new Uint32Array(data.buffer, 0, data.length / 4);
		return data;
	}
}

function font_draw_line(character, offset, colour, fb, drawer, line) {
	var i = offset;
	var j = 0;
	for (var i = offset; i < (offset + 8); i++) {
		var code = character[i];
		if (code == 0) {
			j++;
			continue;
		}
		drawer(fb, code, colour, line + j);
		j++;
	}
}

function font_draw(character, colour, y, x, width, fb) {
	var i = 2;
	var drawer = font_get_drawer(character[1]);
	for (var j = 0; j < 16; j++) {
		var line = x + (y++ * width);
		font_draw_line(character, i, colour, fb, drawer, line);
		// console.log(line, fb.slice(line, line + 8));
		i += 8;
	}
}
