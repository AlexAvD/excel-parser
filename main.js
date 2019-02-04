const xlsx      = require("xlsx");
const fs        = require("fs");
const tempfile  = require('tempfile');
const opts      = require('./opts/opts2');

const {log} = console;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const parseSettings = {
    path: './src/test.xlsx',
    sheet: 2,
    opts
}

parseEx(parseSettings, function(data) {
    const heading = [ 
        "name : Название", 
        "article : Артикул",  
        "price : Цена",
        "amount : Количество",
        "image : Иллюстрация"
        // "cf_montaznaa_dlina : Монтажная длина",
        // "cf_du : Ду"
    ];
    log(data);
    // for(const key in data) {
    //     arrToCsv([heading, ...data[key]], key);
    // }
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
        caption
}) {
    
    const result    = {};
    const main      = [];
    let title       = 'out';

    for(const key in param) {
        if(isNumber(param[key].pos)) {
            if(param[key].main) main.push(param[key].pos);
        } else if(isString(param[key].pos)) {
            param[key].pos = alphToArab(param[key].pos);
            if(param[key].main) main.push(param[key].pos);
        } else if(isArray(param[key].pos)) {
            param[key].pos = param[key].pos.map(e => (isString(e)) ? alphToArab(e) : e);
            if(param[key].main) main.push(...param[key].pos);
        } else if(isUndefined(param[key].pos)) {
            if(isUndefined(param[key].custom)) throw Error(`${key}.custom: is missing`);
            if(!isString(param[key].custom)) throw Error(`${key}.custom: is not a string`);
            param[key].val = param[key].custom;
        } else throw Error(`${key}.pos: ${param[key].pos}: unexpected type`); 
        if(!isUndefined(param[key].pos)) {
            if(isUndefined(param[key].handler)) throw Error(`${key}.handler: is missing`);
            if(!isFunction(param[key].handler)) throw Error(`${key}.handler: is not a function`);
        }
        if(order && !isNumber(param[key].order)) throw Error(`${key}.order: not a number`);
    }
    
    for(let i = start; i < data.length; i++) {
        if(isFunction(caption)) {
            const t = caption(data[i]);
            title = (t) ? t : title;
            if(!(title in result)) result[title] = [];
        } 

        if(main.length && main.some(e => (data[i][e].trim()) ? false : true)) continue;

        const item = [];

        for(const key in param) {
            if(!param[key].custom) {
                const {pos, val} = param[key];
                param[key].val = param[key].handler(
                    (isArray(pos)) ? pos.map(e => data[i][e]) : data[i][pos], 
                    (param[key].prev) ? val : undefined
                );
            }

            if(order) item[param[key].order] = param[key].val;
            else item.push(param[key].val);
        }
        result[title].push(item);
    }
    return result;
}

// Создание файла с расширение csv из массива данных 
function arrToCsv(arrData, outName) {
    xlsx.stream
        .to_csv(xlsx.utils.aoa_to_sheet(arrData), {FS: ";"})
        .pipe(fs.createWriteStream(`dist\\${outName}.csv`));
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