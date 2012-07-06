(function($, B) {
	'use strict';

	var calc, srmSlider, maltBalanceSlider;

	var srmColor, srmValue;

	calc = $('.simple-water-calculator');

	srmColor = calc.find('.srm-slider-info .srm-color');
	srmValue = calc.find('.srm-slider-info .srm-value');

	srmSlider = calc.find('.srm-slider').slider({
		min: 2,
		max: 40,
		step: 0.1
	});

	srmSlider.on('slide', function(ev, ui) {
		srmValue.html('SRM: ' + parseInt(ui.value, 10));
		srmColor.css({
			background: B.units.convert('SRM', 'HTML_RGB', ui.value)
		});
	});

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
		if (ratio > 1.5) {
			return 'very malty';
		} else if (ratio > 1.2) {
			return 'malty';
		} else if (ratio > 0.85) {
			return 'balanced';
		} else if (ratio > 0.7) {
			return 'bitter';
		} else {
			return 'very bitter';
		}
	};

	ratioValue = calc.find('.ratio-slider-info .value');
	ratioDescription = calc.find('.ratio-slider-info .description');

	//Chloride:Suphate ratio
	maltBalanceSlider = calc.find('.malt-balance-slider').slider({
		min: -10,
		max: 10,
		step: 0.1
	});

	maltBalanceSlider.on('slide', function(ev, ui) {
		var r = toRatio(ui.value);
		ratioValue.html('Chloride:Suphate: ' + r);
		ratioDescription.html(toDescription(r));
	});

}(jQuery, BREWCALC));