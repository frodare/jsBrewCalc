


(function($, B) {
	'use strict';

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
			}
		},
		CaCl: {
			name: 'Calcium Chloride',
			effect: {
				Ca: 72,
				Cl: 127
			}
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
			max: 200
		}
	};

	/* inputs in ppm */
	w.toRA = function (HCO) {
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
		
		var ca2 = 3.5 * ((water.HCO * 0.819672131) - (0.714 * water.Ca) - (0.585 * water.Mg) - RA);
		return Math.min(w.ions.Ca.max, ca2);
		//return ca2;
	};

	/* ca in ppm, ratio in Cl/SO, returns grams for 1 gallon */
	/* c is Ca to be added, r is the Cl/SO ratio */
	w.caSaltsRequired = function (c, r, p) {

		if(!p){
			p = w.profile;
		}

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

	var srmColor, srmValue;

	calc = $('.simple-water-calculator');

	srmColor = calc.find('.srm-slider-info .srm-color');
	srmValue = calc.find('.srm-slider-info .srm-value');

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

	compute = function () {
		var r = toRatio(maltBalanceSlider.slider( "option", "value" ));
		
		var srm = srmSlider.slider( "option", "value" );
		
		var w = B.water;

		
		var ra = w.computeRaFromColor(srm);
		var ca = w.caRequired(ra);

		console.log('r: ' + r + ' srm: ' + srm + ' Ca: ' + ca + ' RA: ' + ra);
		
		var salts = w.caSaltsRequired(ca, r);
		
		result.html('<div><b>CaSO</b>:' + salts.CaSO + '</div><div><b>CaCl</b>:' + salts.CaCl + '</div>');

	};

	updateSrm();
	updateBalance();

}(jQuery, BREWCALC));