'use strict';

$(function(){

	$.ajax({
		url: 'public/data/jsondata.json',
		dataType: 'json',
		success: [heatMapProcess],
		async: true,
		cache: false,
		error: function(){
            alert('Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, https.');
        },
	});

});