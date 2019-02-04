const opts = {
    start: 7,
    caption: function(a) {
        a = a[0].trim().replace(/\s+/g, " ");
        return ( !(/\d/.test(a)) ) ? a : '';
    },
    param: {
        name: {
            pos: 'b',
            //main: true,
            prev: true,
            handler: function(a, b) {
                a = a.trim();
                return (a) ? a.replace(/\s+/g, " ") : b;
            }
        },
        article: {
            pos: 'c',
            main: true,
            handler: function(a) {
                return a.trim();
            }
        },
        price: {
            pos: 'k',
            main: true,
            handler: function(a) {
                return Number(a.replace(/([^\d\.]|\.$)/g, ''));
            },
        },
        amount: {
            pos: ['h', 'i'],
            handler: function(a) {
                return Number(a[0]) * Number(a[1]);
            }
        },
        image: {
            pos: 'c',
            handler: function(a) {
                return a.match(/[A-Z]{2}\.\d{3}/) + ".jpg";
            }
        }
    }
}

module.exports = opts;