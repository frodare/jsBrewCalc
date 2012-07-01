/*
 * jsBrewCalc
 */
var BREWCALC = {};


/*global console:true*/
/*
 * Brewing units
 */
BREWCALC.units = (function($) {
	'use strict';

	var u, addUnit, createPowerConverter, unityConverter;

	u = {};

	unityConverter = function(val) {
		return {
			from: function(val) {
				return val;
			},
			to: function(val) {
				return val;
			}
		};
	};

	createPowerConverter = function(factor) {
		return {
			from: function(val) {
				return val * Math.pow(10, factor);
			},
			to: function(val) {
				return val / Math.pow(10, factor);
			}
		};
	};

	addUnit = function(unit, base, converter) {
		if (!base) { /* this is a base unit */
			u[unit] = {};
		} else {
			u[base][unit] = converter;
		}
	};



	/* create base units and base units with scalers (g, kg, mg, ...) */
	var prefixes = ['', 'k', 'c', 'm'];
	var factors = [0, 3, -2, -3];
	var units = ['g', 'l', 'm'];
	var j, i;
	for (j = 0; j < units.length; j++) {
		var base = units[j];
		for (i = 0; i < prefixes.length; i++) {
			if (prefixes[i]) {
				addUnit(prefixes[i] + base, base, createPowerConverter(factors[i]));
			} else { /* base unit */
				addUnit(base);
			}
		}
	}



	/*
	 * Color
	 */

	var srm = [];
	srm[1] = {r: '243', g: 249, b: 147};
	srm[2] = {r: '248', g: 247, b: 83};
	srm[3] = {r: '246', g: 245, b: 19};
	srm[4] = {r: '236', g: 230, b: 26};
	srm[5] = {r: '224', g: 208, b: 27};
	srm[6] = {r: '213', g: 188, b: 38};
	srm[7] = {r: '201', g: 167, b: 50};
	srm[8] = {r: '191', g: 146, b: 59};
	srm[9] = {r: '190', g: 140, b: 58};
	srm[10] = {r: '191', g: 129, b: 58};
	srm[11] = {r: '190', g: 124, b: 55};
	srm[12] = {r: '191', g: 113, b: 56};
	srm[13] = {r: '188', g: 103, b: 51};
	srm[14] = {r: '178', g: 96, b: 51};
	srm[15] = {r: '165', g: 89, b: 54};
	srm[16] = {r: '152', g: 83, b: 54};
	srm[17] = {r: '141', g: 76, b: 50};
	srm[18] = {r: '124', g: 69, b: 45};
	srm[19] = {r: '107', g: 58, b: 30};
	srm[20] = {r: '93', g: 52, b: 26};
	srm[21] = {r: '78', g: 42, b: 12};
	srm[22] = {r: '74', g: 39, b: 39};
	srm[23] = {r: '54', g: 31, b: 27};
	srm[24] = {r: '38', g: 23, b: 22};
	srm[25] = {r: '38', g: 23, b: 22};
	srm[26] = {r: '25', g: 16, b: 15};
	srm[27] = {r: '25', g: 16, b: 15};
	srm[28] = {r: '18', g: 13, b: 12};
	srm[29] = {r: '16', g: 11, b: 10};
	srm[30] = {r: '16', g: 11, b: 10};
	srm[31] = {r: '14', g: 9, b: 8};
	srm[32] = {r: '15', g: 11, b: 8};
	srm[33] = {r: '12', g: 9, b: 7};
	srm[34] = {r: '8', g: 7, b: 7};
	srm[35] = {r: '8', g: 7, b: 7};
	srm[36] = {r: '7', g: 6, b: 6};
	srm[37] = {r: '4', g: 5, b: 4};
	srm[38] = {r: '4', g: 5, b: 4};
	srm[39] = {r: '3', g: 4, b: 3};
	srm[40] = {r: '3', g: 4, b: 3};

	var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
	function hex(x) {
		return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
	}

	addUnit('SRM');
	addUnit('RGB', 'SRM', {
		from: function(val) {
			throw new Error('RGB to SRM not yet supported');
		},
		to: function(val) {
			val = parseInt(val, 10);
			if(val < 1){
				val = 1;
			}else if(val > 40) {
				val = 40;
			}
			return srm[val];
		}
	});

	addUnit('HTML_RGB', 'SRM', {
		from: function () {
			throw new Error('HTML_RGB to SRM not yet supported');
		},
		to: function (val) {
			var rgb = u.SRM.RGB.to(val);
			return '#' + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
		}
	});


	return u;

}(jQuery));