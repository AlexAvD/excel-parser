const opts = {
    start: 7,
    caption: function(a) {

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