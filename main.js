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


//parseExcel(filePath, 2, handlerData);
const opts = {
    start: 8,
    //caption: true,
    //order: ["name", "article", "amount", "price", "image", "type", "pn", "weight"],
    caption: "Фитинг аксиальный",
    set: {
        name: {
            pos: [1, 3],
            main: true,
            prev: function(a) {
                return a.trim();
            },
            handler: function(a, b, c) {
                a = a.trim(); 
                b = b.trim();
                return (a) ? `${a.replace(/\s+/g, " ")} (${b})` : `${c.replace(/\s+/g, " ")} (${b})`;
            }
        },
        article: {
            pos: 2,
            main: true
        },
        image: {
            pos: 2,
            handler: function(a) {
                return a.match(/^[A-Z]{2}\.\d{3}/)[0] + ".jpg";
            }
        },
        type: {
            pos: 3,
            handler: function(a) {
                return a.trim();
            }
        },
        pn: {
            pos: 4,
            handler: function(a) {
                return a.trim();
            },
        },
        weight: {
            pos: 5,
            handler: function(a) {
                return Number(a);
            },
        },
        price: {
            pos: 10,
            main: true,
            handler: function(a) {
                return Number(a.replace(/[^\d\.]/g, ""));
            },
        },
        amount: {
            pos: [7, 8],
            handler: function(a, b) {
                return Number(a.replace(/[^\d\.]/g, "")) * Number(b.replace(/[^\d\.]/g, ""));
            }
        }
    }
}

parseEx({path: filePath, sheet: 1, opts}, function(data) {
    arrToCsv(data, 'check');
    //console.log(data);
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

function dataProcessing(data, {
        start = 0, 
        captions = false, 
        order,
        set = {}, 
        global = {}
}) {

    const result = [];
    let mainPos = [];

    global.prev = {};

    for(const key in set) {
        if(set[key].main) mainPos = mainPos.concat(set[key].pos);
    }
  
    for(let i = start; i < data.length; i++) {
        /* if(captions) {
            data[i]
        } */
        if(mainPos.length && mainPos.every((e) => (data[i][e] && data[i][e].trim()) ? false : true)) continue;
        
        const item = {};

        for(const key in set) {
            if (typeof set[key].pos === 'number') {
                set[key].val = (checkHandlerFun(set[key].handler)) ? 
                                set[key].handler(data[i][set[key].pos], (set[key].prev) ? global.prev[key] : undefined) : 
                                data[i][set[key].pos];
                if(set[key].prev) {
                    const prev = set[key].prev(data[i][set[key].pos]);
                    if(prev) global.prev[key] = prev;
                }
            } else if (Array.isArray(set[key].pos)) {
                if(!checkHandlerFun(set[key].handler)) throw Error("missing handler");
                set[key].val = set[key].handler(...set[key].pos.map(e => data[i][e]), (set[key].prev) ? global.prev[key] : undefined);
                if(set[key].prev) {
                    const prev = set[key].prev(...set[key].pos.map(e => data[i][e]));
                    if(prev) global.prev[key] = prev;
                }
            } else throw Error("unexpected type");

            item[key] = set[key].val;
        }
        if(Array.isArray(order) && order.length) {
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
function handlerData(arr) {
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
function checkHandlerFun(fun) {
    if(fun) {
        if(typeof fun === 'function') return true;
        else throw Error("handler is not a function");
    } 
    return false;
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
