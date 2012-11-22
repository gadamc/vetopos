var db = $.couch.db(window.location.pathname.split("/")[1]);
var webinterfacedb = $.couch.db('webinterface');
var appName = window.location.pathname.split("/")[3];

var now = new Date();
var fourHoursAgo=new Date();
fourHoursAgo.setUTCHours(fourHoursAgo.getUTCHours() - 12);

var theCurrentChart;
var theCurrentChartOptions;

$(document).ready(function() {

  //
  //
  //
  //boiler-plate code to set up the datetimepicker ojbects
  //
  //
  //

  $('#idate').datetimepicker({
    numberOfMonths: 1,
    showButtonPanel: true,
    changeMonth: true,
    changeYear: true,
    defaultDate: fourHoursAgo,
    addSliderAccess: true,
    sliderAccessArgs: { touchonly: false },
    onClose: function(dateText, inst) {
          var endDateTextBox = $('#fdate');
          if (endDateTextBox.val() != '') {
              var testStartDate = new Date(dateText);
              var testEndDate = new Date(endDateTextBox.val());
              if (testStartDate > testEndDate)
                  endDateTextBox.val(dateText);
          }
          else {
              endDateTextBox.val(dateText);
          }
      },
      onSelect: function (selectedDateTime){
          var start = $(this).datetimepicker('getDate');
          $('#fdate').datetimepicker('option', 'minDate', new Date(start.getTime()));
      }
  });


  $('#fdate').datetimepicker({
    numberOfMonths: 1,
    showButtonPanel: true,
    defaultDate: now,
    changeMonth: true,
    changeYear: true,
    addSliderAccess: true,
    sliderAccessArgs: { touchonly: false },
      onClose: function(dateText, inst) {
          var startDateTextBox = $('#idate');
          if (startDateTextBox.val() != '') {
              var testStartDate = new Date(startDateTextBox.val());
              var testEndDate = new Date(dateText);
              if (testStartDate > testEndDate)
                  startDateTextBox.val(dateText);
          }
          else {
              startDateTextBox.val(dateText);
          }
      },
      onSelect: function (selectedDateTime){
          var end = $(this).datetimepicker('getDate');
          $('#idate').datetimepicker('option', 'maxDate', new Date(end.getTime()) );
      }
  });

  $('#fdate').datetimepicker('setDate', now );
  $('#idate').datetimepicker('setDate', fourHoursAgo );
  //
  //
  // end of boiler plate
  //
  //
  //



  //setting up the non-boiler plate stuff....

  //the bootstrap documentation says $('.nav-tabs').button()... but this also seems to work
  //and seems like the correct way. perhaps this is a typo in the documentation.
  $('.btn').button()

  //connect the button to a function
  $('#plotButton').click(function(e) {
    $('#plotButton').button('loading');
    getDataAndPlot();
  });

  //set the page title
  getLatestShieldPosition();


});

function chartOptions()
{
  var options = { 
    chart: {
       renderTo: 'theplot',
       type: 'scatter',
       zoomType: 'x'
    },
    title: {
      text:null
    },
    subtitle: {
      text: null
    },
    xAxis: {
       type: 'datetime',
       // maxZoom: 1000.0* 60.0, // 1 minutes
       // title: {
       //    text: null
       // }
       dateTimeLabelFormats: {
           day: '%e %b',
           hour: '%e %b %H:%M'   
       }
    },
    yAxis: 
      {  //primary axis
       title: {
          text: 'Position [m]'//,
        }
    },
    plotOptions: {
                scatter: {
                    marker: {
                        radius: 6,
                        states: {
                            hover: {
                                enabled: true,
                                radius: 9,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    }
                }
    },
    tooltip: {
      enabled: true,
      formatter: function() {
                        return '<b>'+ this.series.name +'</b><br/>'+
                        Highcharts.dateFormat('%Y.%m.%d %H:%M:%S UTC',this.x) +'</b><br/>'+ this.y +' m';
                }
    },

    series: [
      {
        name: 'Nemo Position',
        color: 'rgba(223, 83, 83, .75)',
        data: []
      },
      {
        name: 'Est Position',
        color: 'rgba(119, 152, 191, .75)',
        data: []
      }
    ]

  };

  return options;
}

function addToChart(skey, ekey, callbackFunction)
{

  viewName = appName + '/nemo_bydate';
  theCurrentChartOptions = chartOptions();

  db.view(viewName, {
    startkey: skey,
    endkey: ekey,
    reduce:false,
    descending:true,
    include_docs:false,
    success:function(data){
      
      $.each(data.rows, function(i, row){
          theCurrentChartOptions.series[0].data.push( [ row["key"]*1000.0, Math.round(row['value']*1000.0) / 1000.0 ]);
      });
         

      viewName = appName + '/est_bydate';
      db.view(viewName, {
        startkey: skey,
        endkey: ekey,
        reduce:false,
        descending:true,
        include_docs:false,
        success:function(data){
      
          $.each(data.rows, function(i, row){
            theCurrentChartOptions.series[1].data.push( [ row["key"]*1000.0, Math.round(row['value']*1000.0) / 1000.0 ] );
          });
          
          theCurrentChart = new Highcharts.Chart(theCurrentChartOptions);

          callbackFunction();
        }
      });  
    }
  });

}

function getDataAndPlot()
{


  addToChart( 
      Date.parse($("#fdate").val())/1000.0, 
      Date.parse($("#idate").val())/1000.0, 
      function (){
        $('#plotButton').button('reset');
    });

}

function getLatestValue(position, date, callbackFunction)
{
  viewName = appName + '/' + position + '_bydate';

  db.view(viewName, {
      startkey: date,
      reduce: false,
      limit: 1,
      descending:true,
      success:function(data){
        callbackFunction(data);
        return data;
      }
  });
}

function getLatestNemoValue(date, callbackFunction)
{
  getLatestValue('nemo', date, callbackFunction);
}


function getLatestEstValue(date, callbackFunction)
{
  getLatestValue('est', date, callbackFunction);
}

function getLatestShieldPosition()
{

  var localNow = new Date(); 
  var localNow_utc = new Date(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(),  localNow.getUTCHours(), localNow.getUTCMinutes(), localNow.getUTCSeconds());

  var unixtime = localNow_utc.valueOf()/1000.0;

  getLatestNemoValue(unixtime, 

    function(data){
      var nemoTime = data.rows[0]['key'];
      var nemoPos =  data.rows[0]['value'];
      
      getLatestEstValue(unixtime, 
        
        function(dataEst){

          var estTime = dataEst.rows[0]['key'];
          var estPos =  dataEst.rows[0]['value']; 
        
          var timeDiff = new Number(estTime - nemoTime);
          var vetoPos =  new Number(estPos - nemoPos);
          var message = '<p>Muon Veto Shield Position is ...</p>'
          
          var estDate = new Date(estTime*1000.0);
          var nemoDate = new Date(nemoTime*1000.0);

          message = '<p>Current Muon Veto shield position is   ' + vetoPos.toFixed(2) + ' meters </p>'
          message += 'last Nemo position measurement  &nbsp;  &nbsp;  &nbsp; ' + nemoDate + ' : &nbsp; ' + new Number(nemoPos).toFixed(2) +' m<br>'
          message += 'last Est position measurement  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  ' + estDate +  ' : &nbsp; ' + new Number(estPos).toFixed(2) +' m<br>'
          message += 'time difference (est - nemo): &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; ' + timeDiff.toFixed() + ' seconds'

          if(Math.abs(timeDiff.valueOf()) < 5.0*60.0){
            message += '</p>'
          }
          else{
           message += '<br><br>'
           message += ' &nbsp; &nbsp; &nbsp; &nbsp; warning: time difference is greater than 5 minutes.</p>'

          }
          
          $("#pageheader").html(message);
      });
    
  });
  
 
}
