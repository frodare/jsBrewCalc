


(function($, B) {
	'use strict';

	B.util = {};
	B.util.round = function (number, places) {
		var p = Math.pow(10, places);
		return Math.round(p * number) / p;
	};

	var w = B.water = {};

	w.profile = {
		Ca: 43,
		Mg: 12,
		SO: 6,
		Na: 3,
		Cl: 6,
		HCO: 174
		/* not sure need to convert from Hardness 156 and Alkalinity: 143*/
		/* NOTE: HCO3- = Alkalinity x 61 / 50 ::: HCO = Alkalinity * 1.22 */
	};

	/* ions concentration  at 1 gram/gallon, units in ppm */
	w.salts = {
		CaSO: {
			name: 'Gypsum',
			effect: {
				Ca: 61.5,
				SO: 147.4
			},
			/* grams per level teaspoon */
			tsp : 4
		},
		CaCl: {
			name: 'Calcium Chloride',
			effect: {
				Ca: 72,
				Cl: 127
			},
			tsp: 3.4
		}
	};

	w.ions = {
		Ca: {
			max: 200
		},
		Cl: {
			max: 250
		},
		SO: {
			max: 250
		}
	};

	/* inputs in ppm */
	w.toRA = function (water) {
		if(!water){
			water = w.profile;
		}
		return (water.HCO * 0.819672131) - (0.714 * water.Ca) - (0.585 * water.Mg);
	};
	/*
	w.fromRA = function (RA, water) {
		return 3.5 * ((water.HCO * 0.819672131) - (0.585 * water.Mg) - RA);
	};
	*/

	w.raToPh = function (ra) {
		return 5.8 + 0.00168 * ra;
	};

	w.computeRaFromColor = function (srm) {
		var low, high;

		low = srm * 12.2 - 122.4;
		high = (srm - 5.2) * 12.2;

		return ( low + high ) / 2;
	};

	/* Ca required to lower RA */
	w.caRequired = function (RA, water) {
		if(!water){
			water = w.profile;
		}
		
		var ca2 = 1.40056 * ((water.HCO * 0.819672131) - (0.714 * water.Ca) - (0.585 * water.Mg) - RA);
		return Math.min(w.ions.Ca.max, ca2);
		//return ca2;
	};

	/* ca in ppm, ratio in Cl/SO, returns grams for 1 gallon */
	/* c is Ca to be added, r is the Cl/SO ratio */
	w.caSaltsRequired = function (c, r, p) {

		if(!p){
			p = w.profile;
		}

		c += p.Ca;

		var c1 = p.Ca,
		s1 = p.SO,
		d1 = p.Cl,
		k1 = w.salts.CaSO.effect.Ca,
		k2 = w.salts.CaCl.effect.Ca,
		k3 = w.salts.CaSO.effect.SO,
		k4 = w.salts.CaCl.effect.Cl;

		var g1_top = c - c1 - ((r * k2 * s1) / k4) + ((k2 * d1) / k4);
		var g1_bot = k1 + ((r * k2 * k3) / k4);
		var g1 = g1_top / g1_bot;

		var g2 = (c - c1 - (k1 * g1)) / k2;

		if(g1 < 0){
			g1 = 0;
		}

		if(g2 < 0){
			g2 = 0;
		}

		return {
			CaSO: g1,
			CaCl: g2
		};

	};

	/* returns new profile */
	w.adjustWaterWithSalts = function (salts, water) {
		if(!water){
			water = w.profile;
		}
		var s, effect, saltDef, newWater = $.extend({}, water);
		for(s in salts){
			if(salts.hasOwnProperty(s)){
				saltDef = w.salts[s];
				if(!saltDef){
					continue;
				}
				for(effect in saltDef.effect){
					if(saltDef.effect.hasOwnProperty(effect)){
						newWater[effect] += saltDef.effect[effect] * salts[s];
					}
				}
			}
		}

		return newWater;
	};


}(jQuery, BREWCALC));



(function($, B) {
	'use strict';

	var templates = {};
	$('script[type="text/x-jquery-tmpl"]').each(function () {
		var s = $(this);
		templates[s.attr('id')] = $.template(s);
	});

	$.widget('beer.waterProfileSelector', {
		
		options: {
			profiles: []
		},

		_create: function () {
			var self = this, e = this.element;
			
			e.html($.tmpl(templates.waterProfileForm));
		}

	});


	var compute;

	var calc, srmSlider, maltBalanceSlider;

	var srmColor, srmValue, raValue;

	calc = $('.simple-water-calculator');

	srmColor = calc.find('.srm-slider-info .srm-color');
	srmValue = calc.find('.srm-slider-info .srm-value');
	raValue = calc.find('.srm-slider-info .ra-value');

	srmSlider = calc.find('.srm-slider').slider({
		value: 10,
		min: 2,
		max: 40,
		step: 0.1
	});

	srmSlider.on('slide', updateSrm);

	function updateSrm() {
		var v = srmSlider.slider( "option", "value" );
		srmValue.html('SRM: ' + parseInt(v, 10));
		raValue.html(' RA: ' + parseInt(B.water.computeRaFromColor(v), 10));
		srmColor.css({
			background: B.units.convert('SRM', 'HTML_RGB', v)
		});
		compute();
	}

	

	var toRatio, ratioValue, ratioDescription, toDescription;

	toRatio = function(rangeValue) {
		if (rangeValue > 0) {
			return rangeValue;
		} else if (rangeValue < 0) {
			return -Math.round(100 / rangeValue) / 100;
		} else {
			return 1;
		}
	};

	toDescription = function(ratio) {
		if (ratio > 2) {
			return 'very malty';
		} else if (ratio > 1.3) {
			return 'malty';
		} else if (ratio > 0.77) {
			return 'balanced';
		} else if (ratio > 0.5) {
			return 'bitter';
		} else {
			return 'very bitter';
		}
	};

	ratioValue = calc.find('.ratio-slider-info .value');
	ratioDescription = calc.find('.ratio-slider-info .description');

	//Chloride:Sulfate ratio
	maltBalanceSlider = calc.find('.malt-balance-slider').slider({
		min: -10,
		max: 10,
		step: 0.1
	});

	maltBalanceSlider.on('slide', updateBalance);

	function updateBalance()  {
		var v = maltBalanceSlider.slider( "option", "value" );
		var r = toRatio(v);
		ratioValue.html('Chloride:Sulfate: ' + r);
		ratioDescription.html(toDescription(r));
		compute();
	}


	var result = calc.find('.result');
	var volume = calc.find('input[name="volume"]');

	compute = function () {
		var r = toRatio(maltBalanceSlider.slider( "option", "value" ));
		
		var srm = srmSlider.slider( "option", "value" );
		
		var w = B.water;

		/* why do I have to offset by 13?? */
		var ra = w.computeRaFromColor(srm);
		var ca = w.caRequired(ra);

		//console.log('Ca required');
		//console.log(ca);

		var salts = w.caSaltsRequired(ca, r);

		var newWater = w.adjustWaterWithSalts(salts);
		//console.log(w.profile);
		//console.log(newWater);
		var newRA = parseInt(w.toRA(newWater), 10);
		

		var CaSOgrams = salts.CaSO * volume.val();
		var CaSOtsp = CaSOgrams / w.salts.CaSO.tsp;
		

		var CaClgrams = salts.CaCl * volume.val();
		var CaCltsp = CaClgrams / w.salts.CaCl.tsp;


		result.html('<div><b>CaSO</b>: ' + B.util.round(CaSOgrams, 2) + 'g  &nbsp;&nbsp;&nbsp; ' + B.util.round(CaSOtsp, 1) + ' tsp</div>');
		result.append('<div><b>CaCl</b>: ' + B.util.round(CaClgrams, 2) + 'g &nbsp;&nbsp;&nbsp; ' + B.util.round(CaCltsp, 1) + ' tsp</div>');
		
		result.append('<BR><BR><div><b>RA</b>: ' + newRA + '</div>');
		result.append('<div><b>Chloride:Sulfate</b>: ' + r + '</div>');
		//result.append('<div><b>Est. Mash PH</b>: ' + w.raToPh(ra) + '</div>');

		if(newWater.Ca >= w.ions.Ca.max || (salts.CaSO + salts.CaCl) <= 0){
			result.css({
				color: 'red'
			});
		}else{
			result.css({
				color: 'black'
			});
		}

	};

	updateSrm();
	updateBalance();

}(jQuery, BREWCALC));