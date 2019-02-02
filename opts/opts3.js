const opts = {
    start: 7,
    param: {
        name: {
            pos: 'b',
            main: true,
            handler: function(a) {
                return a.trim().replace(/\s+/g, " ");
            }
        },
        article: {
            pos: 'c',
            main: true,
            hanlder: function(a) {
                return a.trim();
            }
        },
        price: {
            pos: 'j',
            main: true,
            handler: function(a) {
                return Number(a.replace(/([^\d\.]|\.$)/g, ''));
            },
        },
        amount: {
            custom: '1000'
        },
        image: {
            pos: 'c',
            handler: function(a) {
                let name = '';
                if(/SLTPPERT1/.test(a)) {
                    name = 'SLTPPERT1.jpg';
                } else if(/SLTPS11/.test(a)) {
                    name = 'SLTPS11.jpg';
                } else if(/SLTPS7/.test(a)) {
                    name = 'SLTPS7.jpg';
                }
                return name;
            }
        }
    }
}

module.exports = opts;