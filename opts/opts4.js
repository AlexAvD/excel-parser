const opts = {
    start: 7,
    set: {
        name: {
            pos: 1,
            main: true,
            handler: function(a) {
                return a.trim().replace(/\s+/g, " ");
            }
        },
        article: {
            pos: 2,
            main: true,
            hanlder: function(a) {
                return a.trim();
            }
        },
        price: {
            pos: 9,
            main: true,
            handler: function(a) {
                return Number(a.replace(/([^\d\.]|\.$)/g, ''));
            },
        },
        amount: {
            pos: '1000',
        },
        image: {
            pos: 2,
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