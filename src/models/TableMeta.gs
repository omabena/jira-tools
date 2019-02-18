// Node required code block
const Storage_ = require('./Storage.gs').Storage_;
// End of Node required code block

/* ----- DEV ------------------- */

var TestTable = {
  sheetId: '6.02713257E8',
  /*
  Range names:
  - Can contain only letters, numbers, and underscores.
  - Can't start with a number, or the words "true" or "false."
  - Can't contain any spaces or punctuation.
  - Must be 1–250 characters.
  - Can't be in either A1 or R1C1 syntax. For example, you might get an error if you give your range a name like "A1:B2" or "R1C1:R2C2."
  */
  rangeName: 'table1_6_02713257E8',
  rangeA1: 'B3:D6',
  headerRowOffset: 1,
  headerValues: ['colA', 'colB', 'colC']
};

function testDefineRange() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var range = getTicketSheet().getRange(TestTable.rangeA1);
  ss.setNamedRange(TestTable.rangeName, range);
  
  // check
  var rangeCheck = ss.getRangeByName(TestTable.rangeName);
  var rangeCheckName = rangeCheck.getA1Notation();
  console.log('rangeCheckName: %s === TestTable.rangeA1', rangeCheckName, TestTable.rangeA1);
}

function testTable1() {
  console.log('testTable1()');

  SpreadsheetTriggers_.register('onEdit', 'onEditTableMeta', true);
  SpreadsheetTriggers_.register('onChange', 'onEditTableMeta', true);
}

function onEditTableMeta(e) {
  console.log('onEditTableMeta(): %s', e);

  // check against if current sheet has any monitored IssueTable (loop)
  if(getTicketSheet().getSheetId() != TestTable.sheetId) {
    console.log('not monitored sheet, leave...');
    return;
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rangeCheck = ss.getRangeByName(TestTable.rangeName);
  // get range left/top corner
  var rangeCoord = {
    'c': rangeCheck.getColumn(), 
    'r': rangeCheck.getRow()
  };
  
  // EDIT, INSERT_ROW, INSERT_COLUMN, REMOVE_ROW, REMOVE_COLUMN, INSERT_GRID, REMOVE_GRID, FORMAT, or OTHER
  switch(e.changeType) {
    case 'EDIT': // cell values changed; currently same validation rules as rest

    case 'REMOVE_GRID':
    case 'INSERT_GRID':
    case 'REMOVE_COLUMN':
    case 'REMOVE_ROW':
    case 'INSERT_COLUMN':
    case 'INSERT_ROW':
      // get issue table header (always in 2nd row)
      var tableHeader = getTicketSheet().getRange(rangeCoord.r + TestTable.headerRowOffset, rangeCoord.c, 1, (rangeCheck.getLastColumn()-rangeCoord.c+1));
      // header changed?
      if(tableHeader.getValues()[0].join('|') !== TestTable.headerValues.join('|') ) {
        console.log('Compare header: %s !== %s', tableHeader.getValues()[0].join('|'), TestTable.headerValues.join('|'));
        console.log('New header values: %s', tableHeader.getValues());

        /*
         * @TODO: logic needed to check new header values
         * - parse and check if new value is a supported Jira field
         *   - yes: update meta
         *   - no:  flag column to be skipped
         * - header moved inside table range (relative offset update?) / not 2nd row anymore? allowed at all?
         */
        
        // update meta - changed header
        TestTable.headerValues = tableHeader.getValues();
        
      } else {
        console.log('table header didnt change, skip...');
      }

      // check for structural changes and update table meta OR throw warning (refresh wont be possible after such change)
      if(rangeCheck.getA1Notation() === TestTable.rangeA1) {
        console.log('Range dimension didnt change, skip...');
        //return; // nothing to do
      } else {
        console.log('! Range changed !');
        
        /* !! check if new change is affecting IssueTable functionality
         * If YES: prompt user with warning and undo or accept with IssueTable beeing converted to static sheet table (remove trigger)
         * If NO: simply update TableMeta if necessary
         */
        // update meta - changed dimension/range
        TestTable.rangeA1 = rangeCheck.getA1Notation();
        
        console.log('New Tables Range: %s', TestTable.rangeA1);
      }

      break;

    default:
      return;
      break;
  }

}

/* ---------------------------------- */

var TableMeta = {
  _appStorage: false,

  getValue: function(key) {
    return this._getAppStorage().getValue(key);
  },

  setValue: function(key, value) {
    return this._getAppStorage().setValue(key, value);
  },

  _getAppStorage: function() {
    if (!this._appStorage) {
      // https://developers.google.com/apps-script/guides/services/quotas
      this._appStorage = new Storage_('jst_tbl', PropertiesService.getUserProperties()||{});
    }
    return this._appStorage;
  }
};


// Node required code block
module.exports = {
  TableMeta: TableMeta
};
// End of Node required code block
