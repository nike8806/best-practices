require('base-layout-investor');
require('rilix-style-guide');
var $ = require('lc-jquery');
var c3 = require('lc-c3');
var NotificationBox = require('ui-notification-box');
var Handlebars = require('handlebars/runtime').default;
var registerHelpers = require('ui-handlebars-helpers');
registerHelpers(Handlebars);

module.exports = HoldingsClient;

function HoldingsClient(container, options) {
  this.container = container;
  this.options = options || {};
  // Adding notificationBox
  this.notificationBox = new NotificationBox('[data-notification-box]');

  this.initMultiAccount();
  this.getTabs();
  this.rendingAggregateNoteCharts();

}

/*
 * Initializing the holdings client
 * @returns
 */
HoldingsClient.prototype.initMultiAccount = function() {
  // Grab multi-account number if it exists
  $.ajaxSetup({
    headers: {
      'X-Account-Number': $('meta[name=account-number]').attr('content')
    }
  });
};

/*
 * Function to render the aggregateNoteCharts
 * @returns void
 */
HoldingsClient.prototype.rendingAggregateNoteCharts = function() {
    // initializing the default aggregated data for notes (works with test)
    
    var tablesHoldings = this.getDynamicModule('aggregatedDataNotes', false);
    if(!tablesHoldings) {
      this.notificationBox.showErrors('An error has occurred retrieving the data');
      return;
    }

    getChart({ id: '#chartGrade', title: 'Grade' }, tablesHoldings.byGrade);
    var statusHoldingsData = {
      chartColors: $.extend({}, tablesHoldings.byStatus.active.chartColors, tablesHoldings.byStatus.inActive.chartColors),
      chartColumns: tablesHoldings.byStatus.active.chartColumns.concat(tablesHoldings.byStatus.inActive.chartColumns)
    };
    getChart({ id: '#chartStatus', title: 'Status' }, statusHoldingsData);
    getChart({ id: '#chartTerm', title: 'Term' }, tablesHoldings.byTerm);   
};


/**
 * Function to build the chart with the configuration sent it
 * @param {type} opt Options for create the table
 * @param {type} data Data with collumns and colors to draw the Chart
 * @returns {undefined}
 */
function getChart(opt, data) {
  var defaults = {
    height: 235,
    width: 280
  };
  var options = $.extend(true, {}, defaults, opt);

  // Create pie chart.
  c3.generate({
    bindto: options.id,
    legend: {
      show: false
    },
    size: {
      height: options.height,
      width: options.width
    },
    pie: {
      label: {
        show: false
      }
    },
    tooltip: {
      format: {
        name: function (name, ratio, id, index) {
          return name + ': ';
        },
        value: function (value, ratio, id, index) {
          return (value*100).toFixed(2) + '%';
        }
      }
    },
    data: {
      type: 'pie',
      columns: data.chartColumns,
      colors: data.chartColors
    }
  });
}

/**
 * Creating the tabs for each aggregated notes
 */
HoldingsClient.prototype.getTabs = function getTabs() {
  // Getting the tabs
  var tabs = this.container.find('[data-target-tab]');

  // Setting default display none
  $('[data-target-composition-area][data-is-default="true"]').css('display', 'block');
  var clickFn = function () {
    // Hide all
    tabs.removeClass('active');
    $('[data-target-composition-area]').css('display', 'none');

    // Assign active CSS class and show section.
    this.classList.add('active');
    var currentTab = this.getAttribute('data-target-tab');
    $('#'+currentTab).css('display', 'block');
  };

  // Initializing the event
  tabs.on('click', clickFn);
};

/**
 * Function to get dinamicly a module from hbs
 * @param {string} moduleName to load
 */ 
HoldingsClient.prototype.getDynamicModule = function(moduleName, myDefault) {
  return require('dynamic-module-registry').get(moduleName) || myDefault;
};

/**
 * Initializing the client when the document is ready
 */
$(document).ready(function() {
  new HoldingsClient($('[data-dashboard-holdings-page]'));
  $('.filter').on('click', function(e) {
    // TODO Here will trigger the behavior with the name filter.
    console.log('filter by ' + e.target.innerHTML);
  });
  $('#csv-download').on('click', function(e) {
    e.preventDefault();
    console.log('clicked on download CSV');
  });
});
