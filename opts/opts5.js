const opts = {
    start: 1,
    caption: function(a) {
        a = a[0].trim().replace(/\s+/g, " ");
        return ( !(/\d/.test(a)) ) ? a : '';
    },
    param: {
        name: {
            pos: 'b',
            main: true,
            handler: function(a) {
                return a.trim().replace(/\s+/g, " ");
            }
        },
        article: {
            pos: 'a',
            hanlder: function(a) {
                return a.trim();
            }
        },
        price: {
            pos: 'e',
            main: true,
            handler: function(a) {
                return Number(a.replace(/([^\d\.]|\.$)/g, ''));
            },
        },
        amount: {
            custom: '1000'
        },
        image: {
            pos: 'b',
            handler: function(a) {
                a = a.match(/([А-Я]{3,}).+/);
                if(a) return a[0].replace(/("[А-Я]+").+(ДГ)/, '$2 $1').replace(/([А-Я]{3,})(-\d{1,3})\s("СТРИМ")/, '$1 $3$2').replace(/("|,(?= класс)|(?<=м3\/ч).+)/g, "").replace(/класс/, 'Класс').trim() + '.jpg';
                return '';
            }
        },
        du: {
            pos: 'c',
            handler: function(a) {
                return a.replace(/[^\d]/g, '');
            }
        },
        len: {
            pos: 'd',
            handler: function(a) {
                return a.replace(/[^\d]/g, '');
            }
        }
    }
}

module.exports = opts;