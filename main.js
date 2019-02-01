const xlsx      = require("xlsx");
const fs        = require("fs");
const tempfile  = require('tempfile');

const fileName  = "test";
const fileOut   = "out";
const filePath  = `${__dirname}\\src\\${fileName}.xlsx`;

const indexRE1  = /^[A-Z]{2}\.\d{3}/;
const indexRE2  = /\d?SLT[0-9A-Z]*/;

const heading   = [[ 
                    "name : Название", 
                    "article : Артикул", 
                    "amount : Количество", 
                    "price : Цена", 
                    "image : Иллюстрация",
                    "cf_rez_ba : Резьба",
                    "cf_pn : PN",
                    "cf_ves : Вес"
                    ]];


//parseExcel(filePath, 2, handleData);
const opts = {
    start: 8,
    //caption: true,
    order: ["name", "article", "amount", "price", "image", "type", "pn", "weight"],
    caption: "Фитинг аксиальный",
    set: {
        name: {
            pos: 1,
            main: true,
            replace: [/\s+/g, " "],
            prev: true
        },
        article: {
            pos: 2,
            main: true
        },
        image: {
            pos: 2,
            match: /^[A-Z]{2}\.\d{3}/,
            after: ".jpg"
        },
        type: {
            pos: 3,
        },
        pn: {
            pos: 4,
            type: 'number'
        },
        weight: {
            pos: 5,
            type: 'number'
        },
        price: {
            pos: 10,
            main: true,
            replace: [/[^\d\.]/g, ""],
            type: 'number'
        },
        amount: {
            pos: {
                multi: [7, 8],
                handle: function(a, b) {
                    return Number(a) * Number(b);
                }
            }   
        }
    }
}

parseEx({path: filePath, sheet: 1, opts}, function(data) {
    console.log(data);
}); 

function parseEx({path, sheet = 0, opts}, callback) {
    if(!path) throw Error("No path specified");
    if(!fs.existsSync(path)) throw Error("File not exist");

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
            blankrows: false
        });
        callback(dataProcessing(data, opts));
    });
}

function dataProcessing(data, {start = 0, captions = false, order, set = {}, global = {}}) {
    const result = [];
    const mainPos = [];

    global.prev = {};

    for(const key in set) {
        if(set[key].main) {
           mainPos.push(set[key].pos);
        }
        if(!set[key].pos && typeof set[key].pos !== 'number') {
            throw Error(`uncorrect pos in ${set[key]}`);
        } 
    }
  
    for(let i = start; i < data.length; i++) {
        /* if(captions) {
            data[i]
        } */
        if(mainPos.every((e) => (data[i][e] && data[i][e].trim()) ? false : true)) continue;
        
        const item = {};

        for(const key in set) {
            if (typeof set[key].pos === 'object') {
                if(!set[key].pos.handle && typeof set[key].pos.handle !== 'function') 
                    throw Error("handler function not defined");
                set[key].val = set[key].pos.handle(...set[key].pos.multi.map(e => data[i][e]));
            } else if (typeof set[key].pos === 'number') {
                set[key].val = data[i][set[key].pos].trim();
            } else {
                throw Error("unexpected type");
            }
            if(set[key].val && typeof set[key].val === 'string') {
                if(set[key].replace) {
                    set[key].val = set[key].val.replace(set[key].replace[0], set[key].replace[1])
                }
                if(set[key].match) {
                    set[key].val = set[key].val.match(set[key].match)[0];
                }                    
                if(set[key].type) {
                    if(set[key].type === 'number') {
                        set[key].val = Number(set[key].val);
                        if(isNaN(set[key].val)) throw Error("Can't be number");
                    }
                }
                if(set[key].after) {
                    set[key].val += set[key].after;
                }
                if(set[key].before) {
                    set[key].val = set[key].before + set[key].val;
                }
                if(set[key].prev) {
                    global.prev[key] = set[key].val;
                }
            } else {
                if(set[key].prev || global.prev[key]) {
                    set[key].val = global.prev[key];
                }
            }
            item[key] = set[key].val;
        }
        if(order) {
            if(Object.values(item).length !== order.length) 
                throw Error("order: the number of elements does not match");
            const list = [];
            order.forEach(e => {
                if(!(e in item)) throw Error(`order: uncorrect name ${e}`);
                list.push(item[e]);
            });
            result.push(list);
        } else {
            result.push(Object.values(item));
        }
    }
    return result;
}

// Создание файла с расширение csv из массива данных 
function arrToCsv(arrData, outName) {
    xlsx.stream.to_csv(xlsx.utils.aoa_to_sheet(arrData), {FS: ";"})
               .pipe(fs.createWriteStream(`dist\\${outName}.csv`));
}


/* old code */


// Получаем данные с файла Excel и передаем их в callback
function parseExcel(pathToExcel, sheetIndex, callback) {
    const fname = tempfile('.sheetjs');
    const ostream = fs.createWriteStream(fname);
    fs.ReadStream(pathToExcel).pipe(ostream);
    ostream.on('finish', function() {
        const workbook = xlsx.readFile(fname);
        fs.unlinkSync(fname);
        const {Sheets, SheetNames} = workbook;
        const arrData = xlsx.utils.sheet_to_json(Sheets[SheetNames[sheetIndex]], {header: 1});
        callback(arrData);
    });
}
// Обарботка данных 
function handleData(arr) {
    const data = {};

    let caption = "out";
    let itemImage;
    let itemIndex;
    let itemName;
    let itemType;
    let itemAmount;
    let itemPrice;
    let itemPN;
    let itemWeight;

    for(let i = 7, j = 0; i < arr.length; i++) {
        if(arr[i].length === 1) {
            caption = arr[i][0].trim().replace(/\.$/,"");
            if(!(caption in data)) {
                data[caption] = [];
                j = 0;
            } else {
                j = data[caption].length;
            }
        }
        
        if(arr[i][2] && (itemIndex = arr[i][2].trim())) {
            // картинка
            itemImage = itemIndex.match(indexRE1)[0] + ".jpg";
            // название
            if( arr[i][0] && arr[i][0].trim() ) {
                itemName = arr[i][0];
            } else if( arr[i][1] && arr[i][1].trim() ) {
                itemName = arr[i][1];
            }
            itemName = correctStr(itemName).replace(/\.$/, "");
            // резьба
            itemType = (typeof arr[i][3] === "string") ? correctStr(arr[i][3]) : arr[i][3];
            
            // кол-во
            if(arr[i][8]) {
                itemAmount = Number(arr[i][7] * arr[i][8]);
            } else {
                itemAmount = arr[i][7].match(/\d+/)[0];
            }
            // цена
            itemPrice = arr[i][10];
            // PN
            itemPN = arr[i][4];
            // вес
            itemWeight = (isInteger(arr[i][5])) ? arr[i][5] : Math.round(arr[i][5]);

            if(typeof arr[i][10] !== "number") throw Error("NaN");
            if(isNaN(itemAmount)) throw Error("isNaN");
            console.log(data);
            data[caption][j++] = [
                `${itemName} (${itemType})`,
                itemIndex,
                itemAmount,
                itemPrice,
                itemImage,
                itemType,
                itemPN,
                itemWeight
            ];
        }
    }
    Object.entries(data).forEach(function(e) {
        if(e[1].length) arrToCsv([...heading,...e[1]], e[0]);
    });
}

function removeExcess(str) {
    return str.replace(/\s+/g, " ");
}

// Убирает пробелы в начале и в конце, и заменяет несколько пробелов на один
function correctStr(str) {
    return str.trim().replace(/\s+/g, " ");
}
// Проверка на целое число
function isInteger(num) {
    return (num ^ 0) === num;
}
// Взяитие числа из строки
function takeNum(str) {
    return Number(str.replace(/[,\s]/g, "").match(/\d+(\.\d+)?/)[0]);
}

function decimalLength(num) {
    let str = num.toString();
    return (str.includes(".")) ? (str.split(".").pop().length) : 0;
}
// конвертирут строку со значеним и 
function convert(str, {eur, usd}) {
    let currency = str.match(/[^\s\d\.]+/);
    currency = (currency) ? currency[0].toLowerCase() : "";
    let price = takeNum(str);
    console.log(price);
    //let dLen = Math.pow(10, decimalLength(price));
    switch(currency) {
        case "usd":
        case "$":
            price *= usd;
            break;
        case "eur":
        case "€":
            price *= eur;
            break;
        case "руб":
        case "₽":
            break;
        case "":
            throw Error("no currency in string");
        default:
            throw Error(`unfamiliar currency: ${currency}`);
    }
    return price;
}
