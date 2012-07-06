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

	var u, addUnit, createBaseUnit, createPowerUnit, createFactorUnit;

	u = {};

	createBaseUnit = function() {
		return {
			from: function(val) {
				return val;
			},
			to: function(val) {
				return val;
			}
		};
	};

	createPowerUnit = function(base, factor) {
		return {
			base: base,
			from: function(val) {
				return val * Math.pow(10, factor);
			},
			to: function(val) {
				return val / Math.pow(10, factor);
			}
		};
	};

	createFactorUnit = function(base, factor) {
		return {
			base: base,
			from: function(val) {
				return val / factor;
			},
			to: function(val) {
				return val * factor;
			}
		};
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
				u[prefixes[i] + base] = createPowerUnit(base, factors[i]);
			} else { /* base unit */
				u[base] = createBaseUnit();
			}
		}
	}

	//TODO: check factors here http://scphillips.com/units/convfact.html
	/*
	 * Volume
	 */
	u['fl_oz'] = createFactorUnit('l', 33.81402266);
	u['pt'] = createFactorUnit('l', 2.11337642);
	u['qt'] = createFactorUnit('l', 1.05668821);
	u['gal'] = createFactorUnit('l', 0.26417205);


	/*
	 * Volume
	 */
	u['lb'] = createFactorUnit('g', 0.002204622622);
	u['oz'] = createFactorUnit('g', 0.03527);

	/*
	 * Volume
	 */

	/*
	 * Temperature
	 */
	u['C'] = createBaseUnit();

	u['F'] = {
		base: 'C',
		from: function (F) {
			return  (F - 32) / 1.8;
		},
		to: function (C) {
			return (C * 1.8) + 32;
		}
	};
	u['K'] = {
		base: 'C',
		from: function (K) {
			return  K - 273.15;
		},
		to: function (C) {
			return C  + 273.15;
		}
	};


	/*
	* Beer Color
	*/
	u['SRM'] = createBaseUnit();

	/*
	 * RGB Color Unit
	 */

	(function() {
		function poly(aCoef, x) {
			var i, out = 0;
			for (i = 0; i < aCoef.length; i++) {
				out += aCoef[i] * Math.pow(x, i);
			}
			if (out > 255) {
				out = 255;
			} else if (out < 0) {
				return 0;
			}
			return parseInt(out, 10);
		}

		/*
		 * SRM formula fitted from values in this XML table: http://www.barleydogbrewery.com/xml/colors.xml
		 */

		function red(srm) {
			return poly([238.6303585006, 17.6108782693, -8.9883800316, 1.3709404563, -0.1002066713, 0.0037034703, -0.0000669932197182277, 0.000000472459865365479], srm);
		}

		function green(srm) {
			return poly([236.4190457383, 24.5851535763, -11.2609108061, 1.3928617335, -0.085670751, 0.0028098906, -0.0000468322823271471, 0.000000311720440784933], srm);
		}

		function blue(srm) {
			return poly([246.8168629488, -133.9153654594, 29.8154633754, -3.0816135668, 0.1688592584, -0.0050872708, 0.0000796771402841231, -0.000000507065454065039], srm);
		}


		u['RGB'] = {
			base: 'SRM',
			from: function(val) {
				throw new Error('RGB to SRM not yet supported');
			},
			to: function(srm) {
				return {
					r: red(srm),
					g: green(srm),
					b: blue(srm)
				};
			}
		};

	}());

	/* hex routine from here: http://methodbrewery.com/srm.php */
	//TODO: there should be a better way to do hex conversion
	var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

	function hex(x) {
		return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
	}

	u['HTML_RGB'] = {
		base: 'SRM',
		from: function() {
			throw new Error('HTML_RGB to SRM not yet supported');
		},
		to: function(val) {
			var rgb = u.RGB.to(val);
			return '#' + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
		}
	};


	u.convert = function (fromUnit, toUnit, val) {
		var fromBase, toBase;
		fromBase = u[fromUnit].base || fromUnit;
		toBase = u[toUnit].base || toUnit;
		if(fromBase !== toBase){
			throw new Error('Invalid unit convertion, base unit missmatch [' + fromBase + '] != [' + toBase + ']');
		}
		return u[toUnit].to(u[fromUnit].from(val));
	};

	return u;

}(jQuery));