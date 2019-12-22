const fs    = require('fs');
const path  = require('path');
const xlsx  = require('xlsx');

const isArray       = (arr) => Array.isArray(arr);
const isString      = (str) => typeof str === 'string';
const isFunction    = (fn)  => typeof fn === 'function';
const isNumber      = (num) => typeof num === 'number';
const isUndefined   = (val) => typeof val === 'undefined';
const isObject      = (obj) => (obj && typeof obj === 'object');
const isExist       = (pathToFile) => fs.existsSync(pathToFile);

const getFileName   = (pathToFile) => path.basename(pathToFile, path.extname(pathToFile));

const normalizeSpaces = (str) => str.replace(/\n/g, ' ').replace(/^\s+|\s(?=\s)|\s+$/g, '');
const capitalize = (str) => str.toLowerCase().replace(/^.|(?<=\.\s*)./g, (match) => match.toUpperCase());

const isMatch = (srcStr, searchStr, matchRate) => {
    const srcStrWords   = normalizeSpaces(srcStr.replace(/[^a-zа-я0-9\s]/, '')).split(' ');
    const searchWords   = normalizeSpaces(searchStr.replace(/[^a-zа-я0-9\s]/, '')).split(' ').filter((el) => el.length > 1);
    const matches       = (srcStrWords.join(' ').match(new RegExp(searchWords.join('|'), 'ig')) || []).length;
    
    return {
        ifFit: (matches >= (srcStrWords.length * matchRate)),
        matches
    };
}


const colors =  {
    'светл': 'l',
    'бел': 'w',
    'темн': 'd',
    'тёмн': 'd',
    'dark': 'd',
    'white': 'w',
    'light': 'l'
};

const getListOfFiles = (dir) => {
    return fs.readdirSync(dir).reduce((acc, file) => {
       /*  let name = path.parse(file).name.replace(/(\w+)\s*\-?(\d+(?:\-\d+)?)\_?\-?\s*\(?([a-zа-я]+)\)?/i, (world, letters, num, col) => {
            let regExp;
            let nums;
            let names;

            for (let color in colors) {
                regExp = new RegExp(`${color}.*?`, 'gi');
                
                if (regExp.test(col)) {
                    nums = num.match(/(\d+)\-(\d+)/);

                    if (nums) {
                        names = [];
                        for (let i = +nums[1], max = +nums[2]; i <= max; i++) {
                            names.push(`${letters}${ ((i + '').length === 1) ? '00' + i : i }${colors[color]}`.toLowerCase());
                        }
                        // console.log(names);
                        return names;
                    }

                    return `${letters}${num}${colors[color]}`.toLowerCase();
                }
            }

            return '';
        })


        name = (/,/.test(name)) ? name.split(',') : name;

        ///[^0-9a-zа-я_@]|@.+$|_.+$/ig

        //.replace(/[^a-z]/ig, '')
 */
        const name = path.parse(file).name.toLowerCase();

        return {
            ...acc,
            ...(fs.statSync(`${dir}\\${file}`).isDirectory())
            ? getListOfFiles(`${dir}\\${file}`)
            : ( 
                (name in acc) 
                ? ((Array.isArray(acc[name])) ? {[name]: acc[name].concat(file)} : {[name]: [acc[name], file]})
                : {[name]: file}
            ),
        };
    }, {});
};

const getAllFilesInDir = (dir) => {
    if (fs.statSync(dir).isDirectory()) {
        return fs.readdirSync(dir).reduce((acc, name) => {
            return [
                ...acc,
                ...getAllFilesInDir(path.join(dir, name))
            ]
        }, []);
    }
    return [dir];
}

const fileToJson = (pathToFile) => {
    return (fs.existsSync(pathToFile)) ? JSON.parse(fs.readFileSync(pathToFile)) : {};
}

const jsonToFile = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, '\t'));
}

const xlsxToCsv = (pathToFile) => {
    let pathTokens,
        workBook;

    if (fs.existsSync(pathToFile)) {
        pathTokens = path.parse(pathToFile);
        if (pathTokens.ext === '.xlsx') {
            workBook = xlsx.readFile(pathToFile);
            xlsx.writeFile(workBook, `${pathTokens.dir}\\${pathTokens.name}.csv`, { bookType: "csv" });
        }
    }
    
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const letterToNumber = (str) => {
    if (typeof str === 'string') {
        str = str.toLowerCase();
        let num = 0;

        for(let i = 0, len = str.length; i < len; i++) {
            const letter = ALPHABET.indexOf(str[i]);
            if(letter === -1) throw Error(`Incorrect char: ${str[i]}`);
            num += (letter + 1) * Math.pow(26, len - (i + 1));
        }
        return num - 1;
    }
    return -1;
}

module.exports = {
    isArray,
    isString,
    isNumber,
    isFunction,
    isUndefined,
    isObject,
    isExist,
    isMatch,
    getFileName,
    getListOfFiles,
    fileToJson,
    jsonToFile,
    xlsxToCsv,
    letterToNumber,
    normalizeSpaces,
    capitalize
}