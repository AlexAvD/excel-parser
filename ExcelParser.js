const xlsx  = require('xlsx');
const fs    = require('fs');
const path  = require('path');
const {
    isArray, 
    isString,
    isNumber,
    isFunction,
    isObject,
    isUndefined,
    isExist,
    getFileName,
    getListOfFiles,
    fileToJson,
    letterToNumber,
    normalizeSpaces
} = require('./helpers');

class ExcelParser {
    constructor(pathToFile, opts = {}) {
        if (typeof pathToFile === 'string') {
            this.opts = {
                caption:    !isUndefined(opts.caption) ? opts.caption : null,
                workbook:   !isUndefined(opts.workbook) ? opts.workbook : 0,
                start:      !isUndefined(opts.start) ? opts.start : 0,
                page:      !isUndefined(opts.page) ? opts.page : 0,
                handler:    !isUndefined(opts.handler) ? opts.handler : null,
                general:    !isUndefined(opts.general) ? opts.general : {}
            };
    
            this.pathToFile = pathToFile;
            this.workbook   = this.handleFile(pathToFile);        
            this.currentHandledSheet = this.handleWorkbook(this.workbook);
        }
    }
    
    handleFile(pathToFile)  {
        if (!isExist(pathToFile)) throw Error('File doesn\'t exist');

        const raw       = xlsx.readFile(pathToFile);
        const workbook  = {
            sheetNames: raw.SheetNames,
            sheets: []
        }
        
        raw.SheetNames.forEach((sheetName) => {
            const sheet = {
                name: sheetName,
                cols: 0,
                rows: 0,
                data: [],
            }

            sheet.data = xlsx.utils.sheet_to_json(raw.Sheets[sheetName], {
                header: 'A', 
                raw: false,
                defval: '',
                blankrows: true
            });

            sheet.cols = Object.keys(sheet.data[0]).length;
            sheet.rows = sheet.data.length;

            workbook.sheets.push(sheet);
        });

        return workbook;
    }

    handleWorkbook(workbook) {
        const opts      = this.opts
        const page      = isString(opts.page) ? workbook.sheetNames.indexOf(opts.page) : opts.page;
        const sheet     = workbook.sheets[(page === -1) ? 0 : page];
        const sheetData = sheet.data;
        const handler   = (typeof opts.handler === 'function') ? opts.handler.bind(opts.general) : null;
        const handled   = [];
        const caption   = opts.caption;
        const sheetCopy = {...sheetData};

        this.currentRawSheet = sheet;

        if (caption) {
            if (isArray(caption)) {
                handled.push(caption);    
            } else if (isObject(caption)) {
                handled.push(this.normalizeRow(caption));
            }
        }

        for (let i = opts.start, len = sheetData.length, row = sheetData[i]; i < len; i++, row = sheetData[i]) {

            if (typeof handler === 'function') {
                row = handler(i, row, sheetCopy);
            }
    
            if (isArray(row)) {
                if (isArray(row[0])) {
                    handled.push(...row);
                } else if (isObject(row[0])) {
                    handled.push(...row.filter((el) => Object.keys(el).length).map((el) => this.normalizeRow(el)));
                } else {
                    if (row.length) {
                        handled.push(row);
                    }
                }
            } else if (isObject(row)) {
                handled.push(this.normalizeRow(row));
            }
        }

        return handled;
    }

    normalizeRow(obj) {
        const row = Array(this.currentRawSheet.cols).fill('');
        
        Object.entries(obj).forEach((el) => {
            row[letterToNumber(el[0])] = el[1];
        });

        return row;
    }

    getData() {
        return this.currentHandledSheet;
    }

    save(dist) {
        let wb,
            ws;

        if (this.currentHandledSheet.length) {
            dist = dist || path.dirname(this.pathToFile) + '\\out.xlsx';

            wb = xlsx.utils.book_new();
            ws = xlsx.utils.aoa_to_sheet(this.currentHandledSheet);

            xlsx.utils.book_append_sheet(wb, ws);
            xlsx.writeFile(wb, dist);
        }

    }
}

module.exports = ExcelParser;