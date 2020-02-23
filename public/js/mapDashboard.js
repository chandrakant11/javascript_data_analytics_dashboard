let complete_json;
let scale;
let colorScale;
let confidence_arr;
let chartData;

let relevanceList = ['vague', 'Early Stage', 'Gaining Traction', 'Evolving', 'Established', 'Expansionary', 'Growing'];
let likelihoodList = ['Potential', 'Possible', 'Probable', 'Business as usual'];

let year_value_heat_1;
let year_value_heat_2;

let x_axis_array_list = ['topic', 'region', 'pestle', 'country', 'city','sector'];
let y_axis_array_list = ['topic', 'pestle', 'sector', 'region', 'city','country'];

let previousSelectedXcoordinate;
let previousSelectedYcoordinate;

let correspondingjsondata = [];

let itemSize = 20,
	cellSize = itemSize - 1,
	margin = {top: 120, right: 20, bottom: 0, left: 160};

let width = 1000 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

let coordinateX,
	coordinateY

function heatMapProcess(data) {
	complete_json = data;
	filteringData();
	chartload();
}

function removeA(arr) {
	let what, a = arguments, L = a.length, ax;
	while (L > 1 && arr.length) {
		what = a[--L];
		while ((ax = arr.indexOf(what)) !== -1) {
			arr.splice(ax, 1);
		}
	}
	return arr;
}

function chartload() {
	let data = chartData;

	let jsonArrayForMean = [];
	let sortArrayForMean = [];
	let xAxisData = [];
	let yAxisData = [];

	for (let i = 0; i < data.length; i++) {
		if (xAxisData.indexOf(data[i].xAxisValue) == -1 && data[i].xAxisValue !== '') {
			xAxisData.push(data[i].xAxisValue);
		}
		if (yAxisData.indexOf(data[i].yAxisValue) == -1 && data[i].yAxisValue !== '') {
			yAxisData.push(data[i].yAxisValue);

		}
	}

	for (let i = 0; i < xAxisData.length; i++) {
		let temporary;
		for (let j = 0; j < yAxisData.length; j++) {
			temporary = data.filter(function (item) {
				return (item.xAxisValue == xAxisData[i] && item.yAxisValue == yAxisData[j]);
			})
			if (temporary.length > 0) {
				jsonArrayForMean.push(temporary);
			}
		}
	}

	for (let i = 0; i < jsonArrayForMean.length; i++) {
		jsonArrayForMean[i].sort(sort_by('intensity', true));
		sortArrayForMean.push(calculateAggregate(jsonArrayForMean[i]));
	}

	width = 1000 - margin.right - margin.left;
	$('#heat_Loading').css("display", 'none');

	// adding confidence level/mean/standard deviation/lower/upper in head
	storeScaleValue(chartData);

	let x_elements = xAxisData.sort();
	let y_elements = yAxisData.sort();


	let xScale = d3.scale.ordinal()
		.domain(x_elements)
		.rangeBands([0, x_elements.length * itemSize]);

	let xAxis = d3.svg.axis()
		.scale(xScale)
		.tickFormat(function (d) {
			return d;
		})
		.orient("top");

	let yScale = d3.scale.ordinal()
		.domain(y_elements)
		.rangeBands([0, y_elements.length * itemSize]);

	let yAxis = d3.svg.axis()
		.scale(yScale)
		.tickFormat(function (d) {
			return d;
		})
		.orient("left");

	// change color of cells
	changecolorscale();

	let checkXAxisLength = x_elements.length;
	let checkYAxisLength = y_elements.length;

	while(checkXAxisLength > 32) {
		width = width + 600;
		checkXAxisLength = checkXAxisLength - 32;
	}

	while(checkYAxisLength > 23) {
		height = height + 100;
		checkYAxisLength = checkYAxisLength - 23;
	}

	let svg = d3.select('#heat_chart')
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	$('#heat_loading').hide();

	let cells = svg.selectAll('rect')
		.data(sortArrayForMean)
		.enter().append('g').append('rect')
		.attr('class', 'cell')
		.attr('width', cellSize)
		.attr('height', cellSize)
		.attr('y', function (d) {
			return yScale(d.yAxisValue);
		})
		.attr('x', function (d) {
			if (d.xAxisValue !== '')
				return xScale(d.xAxisValue);
		})
		.attr('fill', function (d) {
			return colorScale(d.scale);
		})
		.on('click', function (d) {
			let relevanceindex;
			let relevance;
			let likelihoodindex;
			let likelihood;
			relevanceindex = correspondingjsondata.findIndex(item =>
				item.url == d.url
			);
			relevance = correspondingjsondata[relevanceindex]['relevance'];
			likelihood = correspondingjsondata[relevanceindex]['likelihood'];
			$('#heat_change1').html("<h3 align = 'center' class='m-t-0' style='text-transform: capitalize' id='searchItem'>" + d.xAxisValue + "</h3>" + "<p align = 'center'>" + d.scale.toFixed(2) + " | " + relevanceList[relevance - 1] + " | " + likelihoodList[likelihood - 1] + "</p>" + "<a target='_blank' href=" + d.url + ">" + d.title + "</a><br><a href='#heat_table'><p style='float: right; cursor: pointer' onclick=searchByItem1(chartData)>...more</p></a>");
		})
		.attr('cursor', 'pointer')

	cells.on('mouseover', function(d, i){
		d3.select(this).attr('class', 'hover', true);
	});

	cells.on('mouseout', function (d) {
		d3.select(this).attr('class', 'cell', false);
	});

	cells.append("title").text(function (d) {
		return (d.scale.toFixed(2) + ' | ' + d.xAxisValue + ' | ' + d.yAxisValue);
	}).attr('font-weight', 'bolder');

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.selectAll('text')
		.attr('font-weight', 'normal')
		.attr('cursor','pointer')
		.on('mouseover',function (d) {
		d3.select(this).attr('class', 'hover', true);
		//console.log(calculateActivePassiveSum(sortArrayForMean,d,'y'));
	})
		.append("title").text(function (d) {
		return ('Active Sum : '+calculateActivePassiveSum(sortArrayForMean,d,'y').toFixed(2));
	});

	svg.append("g")
		.attr("class", "x axis")
		.call(xAxis)
		.selectAll('text')
		.attr('font-weight', 'normal')
		.style("text-anchor", "start")
		.attr("dx", ".8em")
		.attr("dy", ".5em")
		.attr("transform", function(d){
			return "rotate(-65)";
		})
		.attr('cursor','pointer')
		.on('mouseover',function (d){
			d3.select(this).attr('class', 'hover', true);
		})
		.append("title").text(function(d){
			return ('Passive Sum : '+calculateActivePassiveSum(sortArrayForMean,d,'x').toFixed(2));
		});

	if ($('#heat_filter1_heading').html() == 'Pestle' || $('#heat_filter1_heading').html() == 'PESTLE') {
		$('#heat_filter1_heading').css("textTransform", 'uppercase');
	} else {
		$('#heat_filter1_heading').css("textTransform", 'capitalize');
	}

	if ($('#heat_filter2_heading').html() == 'Pestle' || $('#heat_filter2_heading').html() == 'PESTLE') {
		$('#heat_filter2_heading').css("textTransfor", 'uppercase');
	} else {
		$('#heat_filter2_heading').css("textTransfor", 'capitalize');
	}

	if ($('#heat_filter3_heading').html() == 'Pestle' || $('#heat_filter3_heading').html() == 'PESTLE') {
		$('#heat_filter3_heading').css("textTransform", 'uppercase');
	} else {
		$('#heat_filter3_heading').css("textTransform", 'capitalize');
	}

	if ($('#heat_filter4_heading').html() == 'Pestle' || $('#heat_filter4_heading').html() == 'PESTLE') {
		$('#heat_filter4_heading').css("textTransform", 'uppercase');
	} else {
		$('#heat_filter4_heading').css("textTransform", 'capitalize');
	}

	if ($('#heat_x_coordinate_list').val() == 'Pestle') {
		$('#heat_x_coordinate_list').css("textTransform", 'uppercase');
	} else {
		$('#heat_x_coordinate_list').css("textTransform", 'capitalize');
	}

	displayTopTen(chartData, xAxisData);
	heat_drawTable();

	let insertelement = "<div class='chart-label' id='showgrid'>\n" + "<ul class='list-unstyled'>\n" + "<li style='margin: 2px'>Low</li>" + "<li style='background-color:#90CAF9;width:  10px; height:10px; text-decoration:none; margin:2px'></li>\n" + "<li style='background-color:#64DD17; width:10px; height:10px; text-decoration:none; margin:2px'></li>\n" + "<li style='background-color:#BF360C; width:10px; height:10px; text-decoration:none; margin:2px'></li>\n" + "<li style='margin:2px'>High</li>" + "</ul>\n" + "</div>";
	
    $('#heat_chart').append(insertelement);
}

function filteringData() {
	correspondingjsondata = [];
	let filter1ArrayList = [];
	let measures = ['topic', 'region', 'pestle', 'sector', 'City', 'Country'];
	let temp_measures = ['Topic', 'Region', 'PESTLE', 'Sector'];
	let xAxisValue = $("#heat_x_coordinate_list").val();
	let yAxisValue = $("#heat_y_coordinate_list").val();
	let filters = removeA(measures, xAxisValue, yAxisValue);
	let filter1 = filters[0];
	let filter2 = filters[1];
	let filter3 = filters[2];
	let filter4 = filters[3]

	scale = $('#heat_measures_selector').val().toLowerCase();
	$('#heat_filter1_heading').html(filter1);
	$('#heat_filter2_heading').html(filter2);
	$('#heat_filter3_heading').html(filter3);
	$('#heat_filter4_heading').html(filter4);

	let data = [];

	complete_json.forEach(function (item, i) {
		if($("#toggle_heat").is(':checked')){
			if((item.end_year > year_value_heat_1-1) && (item.end_year < year_value_heat_2+1)) {
				if (item[xAxisValue] !== '' && item[yAxisValue] !== '') {
					let newitem = {};
					correspondingjsondata.push(item);
					newitem.xAxisValue = item[xAxisValue];
					newitem.yAxisValue = item[yAxisValue];
					newitem.scale = item[scale];
					newitem.intensity = item.intensity;
					newitem.likelihood = item.likelihood;
					newitem.relevance = item.relevance;
					newitem.swot = item.swot;
					newitem.url = item.url;
					newitem.title = item.title;
					newitem.end_year = item.end_year;

					if(item[filter1] !== '')
						filter1ArrayList.push(item[filter1]);
					data.push(newitem);
					return newitem;
				}
			}
		} else {
			if(item[xAxisValue] !== '' && item[yAxisValue] !== '') {
				let newitem = {};
				correspondingjsondata.push(item);
				newitem.xAxisValue = item[xAxisValue];
				newitem.yAxisValue = item[yAxisValue];
				newitem.scale = item[scale];
				newitem.intensity = item.intensity;
				newitem.likelihood = item.likelihood;
				newitem.relevance = item.relevance;
				newitem.swot = item.swot;
				newitem.url = item.url;
				newitem.title = item.title;
				newitem.end_year = item.end_year;

				if (item[filter1] !== '')
					filter1ArrayList.push(item[filter1]);
				data.push(newitem);
				return newitem;
			}
		}
	})

	let updatedfilterdata = changeFilterData();
	let updatedfilter1data = updatedfilterdata.filter1Array;
	let updatedfilter2data = updatedfilterdata.filter2Array;
	let updatedfilter3data = updatedfilterdata.filter3Array;
	let updatedfilter4data = updatedfilterdata.filter4Array;

	let x = $('#heat_filter1_selector');
	while (x.length > 1) {
		x.remove(x.length - 1);
	}

	updatedfilter1data.forEach(function (filterItem, i) {
		let option1 = document.createElement("option");
		option1.text = filterItem;
		x.add(option1);
	})

	let y = document.getElementById('heat_filter2_selector');
	while (y.length > 1) {
		y.remove(y.length - 1);
	}

	updatedfilter2data.forEach(function (filterItem, i) {
		let option2 = document.createElement("option");
		option2.text = filterItem;
		y.add(option2);
	})

	let z = document.getElementById('heat_filter3_selector');
	while (z.length > 1) {
		z.remove(z.length - 1);
	}

	updatedfilter3data.forEach(function (filterItem, i) {
		let option3 = document.createElement("option");
		option3.text = filterItem;
		z.add(option3);
	})

	let w = document.getElementById('heat_filter4_selector');
	while (w.length > 1) {
		w.remove(w.length - 1);
	}

	updatedfilter4data.forEach(function (filterItem, i) {
		let option4 = document.createElement("option");
		option4.text = filterItem;
		w.add(option4);
	})

	onSelectedFilter('filter1');
	chartData = data;
	heatRiskopp();
}

function changeFilterData() {
	let filter1Name = $('#heat_filter1_heading').html().toLowerCase();
	let filter2Name = $('#heat_filter2_heading').html().toLowerCase();
	let filter3Name = $('#heat_filter3_heading').html().toLowerCase();
	let filter4Name = $('#heat_filter4_heading').html().toLowerCase();
	let filter1Array = [];
	let filter2Array = [];
	let filter3Array = [];
	let filter4Array = [];

	correspondingjsondata.forEach((item, i) => {
		if (filter1Array.indexOf(item[filter1Name]) == -1) {
			if (item[filter1Name] !== '') {
				filter1Array.push(item[filter1Name]);
			}
		}
		if (filter2Array.indexOf(item[filter2Name]) == -1) {
			if (item[filter2Name] !== '') {
				filter2Array.push(item[filter2Name]);
			}
		}
		if (filter3Array.indexOf(item[filter3Name]) == -1) {
			if (item[filter3Name] !== '') {
				filter3Array.push(item[filter3Name]);
			}
		}
		if (filter4Array.indexOf(item[filter4Name]) == -1) {
			if (item[filter4Name] !== '') {
				filter4Array.push(item[filter4Name]);
			}
		}
	});

    return {filter1Array, filter2Array, filter3Array, filter4Array};
}

function onSelectedFilter(name) {
	let xAxisValue = $("#heat_x_coordinate_list").val();
	let yAxisValue = $("#heat_y_coordinate_list").val();
	let filterHeading = $('#heat_' + name + '_heading').html();
	let filterName = $('#heat_' + name + '_selector').val();
	let filter1Heading = $('#heat_filter1_heading').html().toLowerCase();
	let filter2Heading = $('#heat_filter2_heading').html().toLowerCase();
	let filter3Heading = $('#heat_filter3_heading').html().toLowerCase();
	let filter4Heading = $('#heat_filter4_heading').html().toLowerCase();
	let filter1Name = $('#heat_filter1_selector').val();
	let filter2Name = $('#heat_filter2_selector').val();
	let filter3Name = $('#heat_filter3_selector').val();
	let filter4Name = $('#heat_filter4_selector').val();
    let storeData = [];

	if ((filter1Name == 'All' && filter2Name !== 'All' && filter3Name == 'All' && filter4Name == 'All')) {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter2Heading] == filter2Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name == 'All' && filter3Name == 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter1Heading] == filter1Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if ((filter1Name == 'All' && filter2Name == 'All' && filter3Name == 'All' && filter4Name == 'All')) {
		correspondingjsondata.forEach((item, i) => {
			storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
		})
	} else if (filter1Name !== 'All' && filter2Name !== 'All' && filter3Name == 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter1Heading] == filter1Name && item[filter2Heading] == filter2Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name == 'All' && filter3Name !== 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter3Heading] == filter3Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name == 'All' && filter3Name !== 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter3Heading] == filter3Name && item[filter1Heading] == filter1Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name !== 'All' && filter3Name !== 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter3Heading] == filter3Name && item[filter2Heading] == filter2Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name !== 'All' && filter3Name !== 'All' && filter4Name == 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter3Heading] == filter3Name && item[filter2Heading] == filter2Name && item[filter1Heading] == filter1Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name == 'All' && filter3Name == 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name == 'All' && filter3Name == 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter1Heading] == filter1Name && item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name !== 'All' && filter3Name == 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter2Heading] == filter2Name && item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name == 'All' && filter3Name !== 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter3Heading] == filter3Name && item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name !== 'All' && filter3Name == 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter1Heading] == filter1Name && item[filter2Heading] == filter2Name && item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name == 'All' && filter2Name !== 'All' && filter3Name !== 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter2Heading] == filter2Name && item[filter3Heading] == filter3Name && item[filter4Heading] == filter4Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	} else if (filter1Name !== 'All' && filter2Name !== 'All' && filter3Name !== 'All' && filter4Name !== 'All') {
		correspondingjsondata.forEach((item, i) => {
			if (item[filter1Heading] == filter1Name && item[filter4Heading] == filter4Name && item[filter3Heading] == filter3Name && item[filter2Heading] == filter2Name) {
				storeData.push(insertNewItem(item, xAxisValue, yAxisValue));
			}
		})
	}

	chartData = storeData;

	$('#heat_chart').html('');
    $('#heat_chart').html(`<div id='heat_Loading'><img src='public/images/loader.gif'></div>`);
}

function changecolorscale() {
    scale = scale.toLowerCase();
    if (scale == 'intensity') {
        colorScale = d3.scale.threshold().domain([13, 35]).range(["#64B5F6", "#64DD17", '#BF360C']);
    } else if (scale == 'likelihood') {
        colorScale = d3.scale.threshold().domain([2, 3]).range(["#90CAF9", "#64DD17", '#BF360C']);
    } else if (scale == 'relevance') {
        colorScale = d3.scale.threshold().domain([3, 5]).range(["#90CAF9", "#64DD17", '#BF360C']);
    }
}

function storeScaleValue(data) {
	let scale_values = [];
	for (let i = 0; i < data.length; i++) {
		scale_values.push(data[i]['scale']);
	}
	heat_calculate_confidence(scale_values);
}

function heat_calculate_confidence(scale_values) {
    
	$('#heat_conf').on('change', function(event){
		if ($(event.target).val() == '90%') {
			if (scale_values.stdDeviation(0.90) !== undefined) {
				$('#heat_standard').html(
					`<p class='tooltip1'>CL<span class='tooltiptext'>The confidence level is the probability that the value of a parameter falls within a specified range of values</span></p> =  ${scale_values.stdDeviation(0.90)['confidence'] * 100}% | <p class='tooltip1'> &mu;<span class='tooltiptext'>The mean is the average of the numbers: a calculated 'central' value of a set of numbers</span></p> =  ${parseFloat(scale_values.mean()).toFixed(1)} | <p class='tooltip1'>&sigma;<span class='tooltiptext'>The standard deviation is a measure of how spread out numbers are</span></p> = ${parseFloat(scale_values.stdDeviation()).toFixed(1)} | <p class='tooltip1'>Lower<span class='tooltiptext'>Minimum estimated value of standard deviation</span></p> =  ${parseFloat(scale_values.stdDeviation(0.90)['lower']).toFixed(1)} | <p class='tooltip1'>Upper<span class='tooltiptext'>Maximum estimated value of standard deviation</span></p> =  ${parseFloat(scale_values.stdDeviation(0.90)['upper']).toFixed(1)}`
				);
			}

			if(isNaN(scale_values.stdDeviation(0.90)['lower'])){
				alert('There were very few records from that search. You need to adjust your search or filter or control parameters. You can do this from the original search or filter and controls interface.');
			} 
		} else if ($(event.target).val() == '95%') {
			if (scale_values.stdDeviation(0.95) !== undefined) {
				$('#heat_standard').html(
				`<p class='tooltip1'>CL<span class='tooltiptext'>The confidence level is the probability that the value of a parameter falls within a specified range of values</span></p> =  ${scale_values.stdDeviation(0.95)['confidence'] * 100}% | <p class='tooltip1'> &mu;<span class='tooltiptext'>The mean is the average of the numbers: a calculated 'central' value of a set of numbers</span></p> = ${parseFloat(scale_values.mean()).toFixed(1)} | <p class='tooltip1'>&sigma;<span class='tooltiptext'>The standard deviation is a measure of how spread out numbers are</span></p> = ${parseFloat(scale_values.stdDeviation()).toFixed(1)}  | <p class='tooltip1'>Lower<span class='tooltiptext'>Minimum estimated value of standard deviation</span></p> = ${parseFloat(scale_values.stdDeviation(0.95)['lower']).toFixed(1)} | <p class='tooltip1'>Upper<span class='tooltiptext'>Maximum estimated value of standard deviation</span></p> = ${parseFloat(scale_values.stdDeviation(0.95)['upper']).toFixed(1)}`
				);
			}

			if(isNaN(scale_values.stdDeviation(0.95)['lower'])){
				alert('There were very few records from that search. You need to adjust your search or filter or control parameters. You can do this from the original search or filter and controls interface.');
			}    
		} else if ($(event.target).val() == '99%') {
			if (scale_values.stdDeviation(0.99) !== undefined) {
				$('#heat_standard').html(
				`<p class='tooltip1'>CL<span class='tooltiptext'>The confidence level is the probability that the value of a parameter falls within a specified range of values</span></p> =  ${scale_values.stdDeviation(0.99)['confidence'] * 100}% | <p class='tooltip1'> &mu;<span class='tooltiptext'>The mean is the average of the numbers: a calculated 'central' value of a set of numbers</span></p> = ${parseFloat(scale_values.mean()).toFixed(1)} | <p class='tooltip1'>&sigma;<span class='tooltiptext'>The standard deviation is a measure of how spread out numbers are</span></p> = ${parseFloat(scale_values.stdDeviation()).toFixed(1)} | <p class='tooltip1'>Lower<span class='tooltiptext'>Minimum estimated value of standard deviation</span></p> = ${parseFloat(scale_values.stdDeviation(0.99)['lower']).toFixed(1)} | <p class='tooltip1'>Upper<span class='tooltiptext'>Maximum estimated value of standard deviation</span></p> =  ${parseFloat(scale_values.stdDeviation(0.99)['upper']).toFixed(1)}`
				);
			}
			if(isNaN(scale_values.stdDeviation(0.99)['lower'])){
				alert('There were very few records from that search. You need to adjust your search or filter or control parameters. You can do this from the original search or filter and controls interface.');
			} 
		}
	});
}

let sort_by = function (field, reverse, primer) {
    let key = primer ?
        function (x) {
            return primer(x[field])
        } :
        function (x) {
            return x[field]
        };
    reverse = !reverse ? 1 : -1;
    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
}

function convert_case(str) {
	let lower = str.toLowerCase();
	return lower.replace(/(^| )(\w)/g, function (x) {
		return x.toUpperCase();
	});
}

function displayTopTen(data, uniqueList) {
	let newdata = [];
	data.sort(sort_by('intensity', true));
	let horizontalAxisChosen = $('#heat_x_coordinate_list').val();

	if (horizontalAxisChosen == 'topic' || horizontalAxisChosen == 'region' || horizontalAxisChosen == 'pestle' || horizontalAxisChosen == 'sector' ) {
		$('#heat_topTenShow').html("<strong style='font-size: large; text-transform: capitalize; margin-left:10px'>Top Ten " + horizontalAxisChosen + "s</strong>");
	} else if (horizontalAxisChosen == 'country' ) {
		$('#heat_topTenShow').html("<strong style='font-size: large; text-transform: capitalize; margin-left:10px'>Top Ten Countries</strong>");
	} else {
		$('#heat_topTenShow').html("<strong style='font-size: large; text-transform: capitalize; margin-left:10px'>Top Ten Cities</strong>");
	}

	for(let i=0;i<uniqueList.length;i++){
		let arrayStore = data.filter(function (item) {
			return item.xAxisValue==uniqueList[i];
		});
		newdata.push(calculateAggregate(arrayStore));
	}

	newdata.sort(sort_by('intensity', true));

	let coordinateX = $('#heat_x_coordinate_list').val();
	let coordinateY = $('#heat_y_coordinate_list').val();

	for (let j = 0; j < 10; j++) {
		if (j < newdata.length) {
			$(`#heat_link${j}`).css("display", 'block');
			$(`#heat_link${j}`).attr("href", newdata[j]['url']);
			$(`#heat_text${j}`).html(convert_case(newdata[j].xAxisValue));
			$(`#heat_num${j}`).html((newdata[j]['intensity'].toFixed(2) + ' | ' + relevanceList[newdata[j]['relevance'] - 1] + ' | ' + likelihoodList[newdata[j]['likelihood'] - 1] + ' | ' + newdata[j]['end_year']));
		} else {
			$(`#heat_link${j}`).css("display", 'none');
			$(`#heat_text${j}`).html('');
			$(`#heat_num${j}`).html('');
		}
	}
}

function insertNewItem(item, xAxisValue, yAxisValue) {
	let newitem = {};
	let filter1 = $('#heat_filter1_heading').html().toLowerCase();
	let filter2 = $('#heat_filter2_heading').html().toLowerCase();
	newitem.xAxisValue = item[xAxisValue];
	newitem.yAxisValue = item[yAxisValue];
	newitem.scale = item[scale];
	newitem.intensity = item.intensity;
	newitem.swot = item.swot;
	newitem.url = item.url;
	newitem.title = item.title;
	newitem.likelihood = item.likelihood;
	newitem.relevance = item.relevance;
	newitem.end_year = item.end_year;
	newitem.filter1 = item[filter1];
	newitem.filter2 = item[filter2];
	return newitem;
}

$("#heat_table").DataTable({
	"aaSorting": [[3, "desc"]],
	columns: [
		{ title: "Title"},
		{ title: "Topic"},
		{ title: "Year"},
		{ title: "Intensity"},
		{ title: "Sector"},
		{ title: "Region"},
		{ title: "Pestle"}
	]
});

function heat_drawTable() {
    let table = $('#heat_table').DataTable();
    table.clear();
    for (let i = 0; i < correspondingjsondata.length; i++) {
        correspondingjsondata.forEach((item, j) => {
            if (item.url == correspondingjsondata[i]['url']) {
                table.row.add([
                    '<a href=' + item.url + ' target="_blank">' + item.title + '</a>',
                    item.topic,
                    item.end_year,
                    item.intensity,
                    item.sector,
                    item.region,
                    item.pestle
                ]).draw(true);
            }
        })
    }
}

function searchByItem1(data) {
    let table = $('#heat_table').DataTable();
    table.search($('#searchItem').html()).draw();
}

function calculateAggregate(data) {
	let total_intensity = 0;
	let total_scale = 0;
	let newdata = {};
	let coordinateX = $('#heat_x_coordinate_list').val();
	let coordinateY = $('#heat_y_coordinate_list').val();

	newdata.xAxisValue = data[0].xAxisValue;
	newdata.yAxisValue = data[0].yAxisValue;

	newdata.swot = data[0].swot;
	newdata.filter1 = data[0].filter1;
	newdata.filter2 = data[0].filter2;
	newdata.url = data[0].url;
	newdata.title = data[0].title;
	newdata.likelihood = data[0].likelihood;
	newdata.relevance = data[0].relevance;
	newdata.end_year = data[0].end_year;

	for (let i = 0; i < data.length; i++) {
		total_scale = total_scale + data[i].scale;
		total_intensity = total_intensity + data[i].intensity;
	}

	total_scale = total_scale / data.length;
	total_intensity = (total_intensity / data.length);
	newdata.scale = total_scale;
	newdata.intensity = total_intensity;

	return newdata;
}

function calculateActivePassiveSum(data,element,axis){
	let total=0;
	for (let i=0;i<data.length;i++) {
		if(axis=='x') {
			if(data[i].xAxisValue==element){
				total = total+data[i].intensity;
			}
		} else if(axis=='y') {
			if(data[i].yAxisValue==element) {
				total = total+data[i].intensity;
			}
		}
	}
	return total;
}