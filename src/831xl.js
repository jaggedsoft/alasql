//
// 831xl.js - Coloring Excel
// 18.04.2015
// Generate XLS file with colors and styles
// with Excel

alasql.into.XLS = function(filename, opts, data, columns, cb) {

	// If filename is not defined then output to the result
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}

	// Set sheets
	var sheets = {};
	if(opts && opts.sheets) {
		sheets = opts.sheets;
	};

	// Default sheet
	var sheet = {};
	if(typeof sheets[0] != 'undefined') {
		sheet = sheets[0];
	} else {
		if(typeof opts != 'undefined') {
			sheet = opts;
		}
	};

	// Set sheet name and default is 'Sheet1'
	if(typeof sheet.sheetid == 'undefined') {
		sheet.sheetid = 'Sheet1';
	};
	
	// Generate prologue
	var s = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" \
	xmlns="http://www.w3.org/TR/REC-html40"><head> \
	<meta charset="utf-8" /> \
	<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets> ';

	// Worksheets
	s+=' <x:ExcelWorksheet><x:Name>' + sheet.sheetid + '</x:Name><x:WorksheetOptions><x:DisplayGridlines/>     </x:WorksheetOptions> \
	</x:ExcelWorksheet>';

	s += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';

	// Generate body
	s += '<body>';
	s += '<table>';

	// Columns

	// If columns defined in sheet, then take them
	if(typeof sheet.columns != 'undefined') {
		columns = sheet.columns;
	} else {
		// Autogenerate columns if they are passed as parameters
		if(columns.length == 0 && data.length > 0) {
			if(typeof data[0] == 'object') {
				if(data[0] instanceof Array) {
					columns = data[0].map(function(d,columnidx){
						return {columnid:columnidx};
					});
				} else {
					columns = Object.keys(data[0]).map(function(columnid){
						return {columnid:columnid};
					});
				}
			}
		}
	};

	// Prepare columns
	columns.forEach(function(column,columnidx){
		if(typeof column.width == 'undefined') {
			if(sheet.column && sheet.column.width !='undefined') {
				column.width = sheet.column.width;
			
			} else {
				column.width = "200px";
			}
		}
		if(typeof column.width == 'number') column.width = column.width + "px";
		if(typeof column.columnid == 'undefined') column.columnid = columnidx;
		if(typeof column.title == 'undefined') column.title = ""+column.columnid;
		if(sheet.headers && sheet.headers instanceof Array) column.title = sheet.headers[idx];
	});

	// Set columns widths
	s += '<colgroups>';
	columns.forEach(function (column) {
		s += '<col style="width: '+column.width+'"></col>';
	});
	s += '</colgroups>';

	// Headers
	if(sheet.headers) {
	 	s += '<thead>';
	 	s += '<tr>';

		// TODO: Skip columns to body

		// Headers
		columns.forEach(function (column) {
			s += '<th '+style(sheet.column,column)+'>' + column.title + '</th>';
		});	

		s += '</tr>';	
		s += '</thead>';
	}

	s += '<tbody>';

	// TODO: Skip lines between header and body

	if(data && data.length > 0) {

		// TODO: Skip columns to body

		// Loop over data rows
		data.forEach(function(row,rowidx){
			// Limit number of rows on the sheet
			if(rowidx>sheet.limit) return;
			// Create row
			s += '<tr '+style(sheet.row,row)+'>';

			// Loop over columns
			columns.forEach(function (column,columnidx) {
				// Value
				var value = row[column.columnid];
				if(typeof value == 'function') value = value(row,column,sheet,rowidx,columnidx);

				var cell = {value:value};
				if(typeof value == 'object' && !(value instanceof Date) 
					&& typeof value.value != 'undefined') {
					cell = value;
					value = cell.value;
				}

				// Define cell type
				var typeid = cell.typeid || column.typeid;
				if(typeof typeid == 'function') typeid = typeid(row,column,sheet,rowidx,columnidx);

				if(typeof typeid == 'undefined') {
					if(typeof value == 'number') typeid = 'number';
					else if(typeof value == 'string') typeid = 'string';
					else if(typeof value == 'boolean') typeid = 'boolean';
					else if(typeof value == 'object') {
						if(value instanceof Date) typeid = 'date';
					}
				};

				var typestyle = '';

				if(typeid == 'money') {
					typestyle = 'mso-number-format:\"\\#\\,\\#\\#0\\\\ _р_\\.\";white-space:normal;';
				} else if(typeid == 'number') {
					typestyle = ' ';
				} else if (typeid == 'date') {
					typestyle = 'mso-number-format:\"Short Date\";'; 
				} else {
					// FOr other types is saved
					if(opts.types[typeid] && opts.types[typeid].typestyle) {
						typestyle = opts.types[typeid].typestyle;
					} 
				}

				// TODO Replace with extend...
				typestyle = cell.typestyle || column.typestyle 
				           || row.typestyle || typestyle || 'mso-number-format:\"\\@\";'; // Default type style

				s += "<td style='" + typestyle+"' " ;
				s += style(sheet.cell, column.cell, row.cell, cell);
				s += '>';

				// TODO Replace with extend...
/*				var format = sheet.cell.format 
					|| (column.cell && column.cell.format) 
					|| (row.cell && row.cell.format)
					|| cell.format;
*/				var format = undefined;
				if(typeof value == 'undefined') {
					s += '';
				} else if(typeof format != 'undefined') {
					if(typeof format == 'function') {
						s += format(value);
					} else if(typeof format == 'string') {
						s += value; // TODO - add string format
					} else {
						throw new Error('Unknown format type. Should be function or string');
					}
				} else {
					if(typeid == 'number' || typeid == 'date') {
						s += value.toString();
					} else if(typeid == 'money') {
						s += (+value).toFixed(2);
					}
				}
				s += '</td>';
			});

			s += '</tr>';
		});
	}

	s += '</tbody>';

	// Generate epilogue
	s += '</table>';
	s += '</body>';
	s += '</html>';

	// File is ready to save
	var res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;

	// Style function
	function style() {
		return '';
	}

};
