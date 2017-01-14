
		// downloadData = [10,12,16,9,3];
		// importData = [5,18,26,7,18];
		// selectionData = [6,7,3,19,2];
		// searchData = [20,25,40,45,28];
		// viewData = [9,10,15,19,21];
		userActivityObj.datasets.push({label: "Downloads",fillColor: "rgba(220,220,220,0.5)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",data: downloadData});
		userActivityObj.datasets.push({label: "Imports",             fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,0.8)",
            highlightFill: "rgba(151,187,205,0.75)",
            highlightStroke: "rgba(151,187,205,1)",data: importData});
		userActivityObj.datasets.push({label: "Selections",fillColor: "red", strokeColor:"red",
             data: selectionData});
		userActivityObj.datasets.push({label: "Searches", fillColor:"green", strokeColor:"green", data: searchData});
		userActivityObj.datasets.push({label: "Views", fillColor:"yellow", strokeColor:"yellow", data: viewData});

		var visitorActivityObj = {labels:userActivityObj.labels, datasets:[]};
		var requestActivityObj = {labels:userActivityObj.labels, datasets: []};

		visitorActivityObj.datasets.push( {label: "Total Visitors",             
								fillColor: "rgba(220,220,220,0.2)",
					            strokeColor: "rgba(220,220,220,1)",
					            pointColor: "rgba(220,220,220,1)",
					            pointStrokeColor: "#fff",
					            pointHighlightFill: "#fff",
					            pointHighlightStroke: "rgba(220,220,220,1)",
					            data: total_visitors_data
					            });

		visitorActivityObj.datasets.push(        {
            label: "New Visitors",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: new_visitors_data
        });

		visitorActivityObj.datasets.push(        {
            label: "Visitor Sessions",
            fillColor: "purple",
            strokeColor: "purple",
            pointColor: "purple",
            data: visitor_session_data
        });

		requestActivityObj.datasets.push({
            label: "Total Requests",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: request_data
        });
		// Chart.defaults.global.responsive = true;
		var ctx = $('#visitorActivity').get(0).getContext("2d");
		var visitorActivityChart = new Chart(ctx).Bar(visitorActivityObj, {
		   animation: true,
		   barValueSpacing : 5,
		   barDatasetSpacing : 1,
		   tooltipFillColor: "rgba(0,0,0,0.8)",
		   multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>",
		   legendTemplate : "<ul style=\"list-style-type: none; display:block;\" class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><div class=\"legend-color\" style=\"background-color:<%=datasets[i].strokeColor%>; height:20px; width: 20px; float: left; margin:5px;\"></div><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
		});
		// var legend = visitorActivityChart.generateLegend();
		// $('#visitorLegend').append(legend);

        ctx = $("#userActivity").get(0).getContext("2d");
        var myBarChart = new Chart(ctx).Bar(userActivityObj, { 
		   animation: true,
		   barValueSpacing : 5,
		   barDatasetSpacing : 1,
		   tooltipFillColor: "rgba(0,0,0,0.8)",
		   multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>",
		   legendTemplate : "<ul style=\"list-style-type: none; display:block;\" class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><div class=\"legend-color\" style=\"background-color:<%=datasets[i].strokeColor%>; height:20px; width: 20px; float: left; margin:5px;\"></div><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
		  });     

        // legend = myBarChart.generateLegend();
        // $('#userLegend').append(legend);
		// Chart.defaults.global.responsive = true;
        ctx = $("#requestActivity").get(0).getContext("2d");
        var requestChart = new Chart(ctx).Line(requestActivityObj);