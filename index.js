const ExcelParser = require('./ExcelParser');
const opts = require('./opts/alpina');
const cyrToTran = require('cyrillic-to-translit-js')().transform;

const data = new ExcelParser('C:\\myDoc\\work\\Центр-красок\\alpina\\прайс1.xlsx', {
    handler: function(e, row) {
        return {
            ...row,
            I: ''
        }
    }
});

// console.log(data.getData());
data.save();
/* getAllFilesInDir('C:\\myDoc\\work\\Центр-красок\\alpina\\images').forEach((file) => {
    const tokens = path.parse(file);
    fs.renameSync(file, `${tokens.dir}\\${cyrToTran(tokens.base)}`);
});  */
// console.log(getAllFilesInDir('C:\\myDoc\\work\\Центр-красок\\alpina\\images'));
// console.log(path.parse('C:\\myDoc\\work\\Центр-красок\\alpina\\images\\alpina direkt auf rost молотковый эффект mедный.png'));
// console.log(cyrToTran('привер Hello'));

// console.log(new ExcelParser().handleFile().sheets);