const xlsx      = require("xlsx");
const fs        = require("fs");
const tempfile  = require('tempfile');
const opts      = require('./opts/opts5');

const log = console.log;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const parseSettings = {
    path: './src/test.xlsx',
    sheet: 5,
    opts
}

parseEx(parseSettings, function(data) {
    const heading = [ 
        "name : Название", 
        "article : Артикул",  
        "price : Цена",
        "amount : Количество",
        "image : Иллюстрация",
        "cf_montaznaa_dlina : Монтажная длина",
        "cf_du : Ду"
    ];

    for(const key in data) {
        arrToCsv([heading, ...data[key]], key);
    }
}); 

function parseEx({path, sheet = 0, opts}, callback) {
    if (isUndefined(path) || !isString(path)) throw Error("path error")
    if (!fs.existsSync(path)) throw Error("File not exist");

    const fname = tempfile('.sheetjs');
    const ostream = fs.createWriteStream(fname);

    fs.ReadStream(path).pipe(ostream);
    ostream.on('finish', function() {
        const workbook = xlsx.readFile(fname);
        fs.unlinkSync(fname);
        const {Sheets, SheetNames} = workbook;
        const data = xlsx.utils.sheet_to_json(Sheets[SheetNames[sheet]], {
            header: 1, 
            raw: false,
            defval: "",
            blankrows: true
        });
        callback(dataProcessing(data, opts));
    });
}

function dataProcessing(data, {
        start = 0, 
        order = false,
        param = {}, 
        global = {
            caption: "OUT"
        },
        caption
}) {
    
    const result = {};
    const main = [];

    for(const key in param) {
        if(isFunction(param[key].prev)) global.prev = {};
        if(isString(param[key].pos)) param[key].pos = alphToArab(param[key].pos);
        if(param[key].main) {
            if(isNumber(param[key].pos)) main.push(param[key].pos);
            else if(isArray(param[key].pos)) main.push(...param[key].pos);
        }
    }

    for(let i = start; i < data.length; i++) {

        if(isFunction(caption)) {
            const head = caption(data[i]);
            if(head) global.caption = head;
        } 

        if(main.length && main.some(e => (!isUndefined(data[i][e]) && data[i][e].trim()) ? false : true)) continue;

        const item = [];

        for(const key in param) {
            
            if (isNumber(param[key].pos)) {
                param[key].val = (checkHandlerFun(param[key].handler)) ? 
                                param[key].handler(data[i][param[key].pos], (param[key].prev) ? global.prev[key] : undefined) : 
                                data[i][param[key].pos];
            } else if (isArray(param[key].pos)) {
                if(!checkHandlerFun(param[key].handler)) throw Error("missing handler");
                param[key].val = param[key].handler(...param[key].pos.map(e => data[i][e]), (param[key].prev) ? global.prev[key] : undefined);
            } else if (isUndefined(param[key].pos) && param[key].custom) {
                param[key].val = param[key].custom;
            } else throw Error("unexpected type");

            if (param[key].prev) {
                let prev;
                if (isNumber(param[key].pos)) {
                    prev = data[i][param[key].pos].trim();
                    if (prev) global.prev[key] = prev;
                } 
                else if (isArray(param[key].pos)) {
                    prev = param[key].pos.map(e => data[i][e]);
                    if (prev.some(e => (e.trim) ? true : false)) global.prev[key] = prev;
                }
            }
            
            if(order) {
                if(isUndefined(param[key].order)) throw Error(`${key}.order not set`);
                item[param[key].order] = param[key].val;
            } else {
                item.push(param[key].val);
            }
        }

        if(isFunction(caption)) {
            if(!(global.caption in result)) result[global.caption] = [];
            result[global.caption].push(item);
        } else result[i] = item;
        
    }
    return result;
}

// Создание файла с расширение csv из массива данных 
function arrToCsv(arrData, outName) {
    xlsx.stream
        .to_csv(xlsx.utils.aoa_to_sheet(arrData), {FS: ";"})
        .pipe(fs.createWriteStream(`dist\\${outName}.csv`));
}


function checkHandlerFun(fun) {
    if(!isUndefined(fun)) {
        if(isFunction(fun)) return true;
        else throw Error("handler is not a function");
    } 
    return false;
}

// CHECK TYPES
function isFunction(fun) {
    return (typeof fun === 'function') ? true : false;
}
function isNumber(num) {
    return (typeof num === 'number') ? true : false;
}
function isString(str) {
    return (typeof str === 'string') ? true : false;
}
function isArray(arr) {
    return Array.isArray(arr);
}
function isUndefined(und) {
    return (typeof und === 'undefined') ? true : false;
}


// CUSTOM FUNCTIONS
function alphToArab(str) {
    str = str.toLowerCase();
    let rez = 0;
    for(let i = 0; i < str.length; i++) {
        const n = ALPHABET.indexOf(str[i]);
        if(n === -1) throw Error(`uncorrect char: ${str[i]}`);
        rez += (n + 1) * Math.pow(26, str.length - (i + 1));
    }
    return rez - 1;
}