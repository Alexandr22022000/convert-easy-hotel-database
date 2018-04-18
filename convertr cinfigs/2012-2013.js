const columnsParams = [
    {name: 'date_temp', type: 0},
    {name: 'time_temp', type: 0},
    {name: 'time_reserv_temp', type: 0},
    {name: 'client_temp', type: 0},
    {name: 'number_temp', type: 0},
    {name: 'apartment', type: 0},
    {name: 'period_temp', type: 0},
    {name: 'hostess', type: 0},
    {name: 'status_temp', type: 0},
    {name: 'note', type: 0},
    {name: 'price', type: 1},
    {name: 'percent', type: 1},
];

const types = [
    {name: 'string', default: ''},
    {name: 'price', default: -1}
];

const convert = (data, type, name) => {
    switch (+type) {
        case 1:
            if (data === '*') return -2;
            if (data === '-') return -1;
            if (data === '') return 0;

            return +data;

        default:
            return data;
    }
};

const compressing = (main) => {
    main = main.splice(1, main.length);

    let lasteDate;
    for (let key in main) {
        if (main[key].date_temp === '') {
            main[key].date_temp = lasteDate;
        }
        else {
            lasteDate = main[key].date_temp;
        }
    }

    return main;
};