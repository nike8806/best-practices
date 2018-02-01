const logger = require('lc-logger');
const holdingsService = require('service-holdings');
const extend = require('lodash').assign;
const dashboardHoldings = 'dashboard-holdings/client/dashboard-holdings';
const async = require('async');

/*
 * Getting the dashboard holdings page
 * @param {type} req
 * @param {type} res
 * @returns {reder} render page
 */
function getPage(req, res) {
  const actorId = req.user.investor.accountGuid;
  const pageObject = {};
  pageObject.metaTags = [{
    name: 'account-number',
    content: req.user.investor.accountGuid
  }];

  async.parallel({
    getNotesDetails: async.apply(holdingsService.allNotes, {actorId}),
    allAggregatesHoldings: async.apply(holdingsService.allAggregatesHoldings, actorId)
  }, function(error, result) {
    if (error) {
      extend(pageObject, {
        errorMessage: {
          isShown: true
        }
      });
      logger.error(error, 'Holdings page: an error has ocurred getting the data');
      return res.render(dashboardHoldings, pageObject);
    }

    var aggregatedDataNotes = addingColorsToHoldingsData(result.allAggregatesHoldings);
    // Adding the color data to the response
      extend(pageObject, { 
        aggregatedDataNotes: aggregatedDataNotes,
        aggregatedDataNotesStr: JSON.stringify(aggregatedDataNotes),
        notes: result.getNotesDetails.map(function(row) {
          row.gradeType = row.grade.replace(/\d/g, '');
          return row;
        })
      });
    return res.render(dashboardHoldings, pageObject);
  });
}

/**
 * Function to get the data adding the information for create the charts
 * @param {type} notes Data with the information to crate
 * @returns Object with The components to render and the data to use in charts
 */
function addingColorsToHoldingsData(notes) {
  // Mapping the colors and classes in the notes
  var mappingColorsData = function (notesGrouped, indexColor = 0) {
    var chartColumns = [];
    var chartColors = {};

    // @TODO FIX THIS PART (GET FROM CONFIG OR LESS OR MAP THE TABLE FROM JS)
    var mapColors = [
      {style: 'colorA', color: '#1592D4'},
      {style: 'colorB', color: '#82DBF0'},
      {style: 'colorC', color: '#00AF97'},
      {style: 'colorD', color: '#9ECE7B'},
      {style: 'colorE', color: '#E1E676'},
      {style: 'colorF', color: '#FCB813'},
      {style: 'colorG', color: '#FF8F00'},
      {style: 'colorH', color: '#DC7633'},
      {style: 'colorI', color: '#E74C3C'},
      {style: 'colorJ', color: '#A569BD'},
      {style: 'colorK', color: '#ABB2B9'}
    ];

    // Colors to map in the graph and in the table
    Object.keys(notesGrouped).forEach(groupKey => {
      // Creating the new note attributes to add to the note's object
      var newNoteAttr = {
        color: mapColors[indexColor].color,
        style: mapColors[indexColor].style
      };

      var note = notesGrouped[groupKey];
      // Updating the new object
      notesGrouped[groupKey] = extend(true, {}, note, newNoteAttr);


      // Settings colors for the chart
      chartColors[groupKey] = mapColors[indexColor].color;
      chartColumns.push([groupKey, notesGrouped[groupKey].percentage]);

      // Incrementing index color
      indexColor++;
      // Reinizialize the indexcolor
      if (indexColor === mapColors.length) {
        indexColor = 0;
      }
    });
    
    return { chartColumns: chartColumns, chartColors: chartColors, notesGrouped: notesGrouped };
  };

  return {
    byGrade: mappingColorsData(notes.notesByGrade),
    byStatus: {
      active: mappingColorsData(notes.notesByStatus.active),
      inActive: mappingColorsData(notes.notesByStatus.inActive, Object.keys(notes.notesByStatus.active).length)
    },
    byTerm: mappingColorsData(notes.notesByTerm)
  };
}


/**
 * Get all notes (for ajax)
 * @param {Object} req
 * @param {Object} res
 * @returns {String}
 */
function getAllNotes(req, res) {
  const actorId = req.user.investor.accountGuid;
  holdingsService.allNotes(
    actorId,
    (error, res) => {
      if (error) {
        logger.error(error, 'There was an error retrieving all notes for user %s', actorId);
        return res.status(500).json({
          serverError: `${error}`
        });
      }
      return res.json(res);
    });
}

module.exports = {
  getPage: getPage,
  getAllNotes: getAllNotes
};
