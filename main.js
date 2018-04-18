/*
---Modules---
 */
//postgres://{user}:{password}@{hostname}:{port}/{database-name}
const DATABASE_URL = 'postgres://test00:0000@localhost:5432/secret-database-00',
    TABLE_NAME = 'main';

const columnsParams = [
    {name: 'date_temp', type: 0},
    //{name: 'time_temp', type: 0},
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













const pg = require('pg'),
    columns = {},
    rowsIsWriting = {},
    columnsType = {};

let activeColumn = 0;

process.stdin.resume();

process.stdin.pipe(require('split')()).on('data', (data) => {

    if (data === 'STOP') {
        activeColumn++;

        if (activeColumn >= columnsParams.length) {
            writeData();
            return;
        }

        console.log(`Copy column ${columnsParams[activeColumn].name} (for write enter STOP)):`);
        return;
    }

    if (!columns[columnsParams[activeColumn].name])
        columns[columnsParams[activeColumn].name] = [];

    if (!columnsType[columnsParams[activeColumn].name])
        columnsType[columnsParams[activeColumn].name] = columnsParams[activeColumn].type;

    columns[columnsParams[activeColumn].name].push(convert(data, columnsType[columnsParams[activeColumn].name], columnsParams[activeColumn].name));
});

console.log(`Copy column ${columnsParams[activeColumn].name} (for write enter STOP):`);

const writeData = () => {
    console.log('Compressing...');

    let bigLength = -1, main = [];

    for (let key in columns) {
        bigLength = columns[key].length > bigLength ? columns[key].length : bigLength;
    }

    for (let ii = 0; ii < bigLength; ii++) {
        const row = {};

        for (let key in columns) {
            if (columns[key].length <= ii) {
                row[key] = types[+columnsType[key]].default;
            }
            else {
                row[key] = columns[key][ii];
            }
        }

        main.push(row);
    }

    main = compressing(main);

    console.log('Writing...');

    for (let key in main) {
        rowsIsWriting[key] = false;
    }

    const pool = pg.Pool({
        connectionString: DATABASE_URL
    });

    for (let dataKey in main) {
        let queryParamNames = '', queryParamNumbers = '', queryData = [], i = 1;
        for (let queryKey in main[dataKey]) {
            queryParamNames += `${queryKey}, `;
            queryParamNumbers += `$${i}, `;
            i++;
            queryData = [...queryData, main[dataKey][queryKey]];
        }
        queryParamNames = queryParamNames.substring(0, queryParamNames.length - 2);
        queryParamNumbers = queryParamNumbers.substring(0, queryParamNumbers.length - 2);

        pool.query(`INSERT INTO ${TABLE_NAME}(${queryParamNames}) VALUES(${queryParamNumbers})`, queryData, (error, data) => {
            if (error) {console.log(error); console.log(queryData);}

            rowsIsWriting[dataKey] = true;

            let isEnd = true;
            for (let key in rowsIsWriting) {
                if (!rowsIsWriting[key]) isEnd = false;
            }

            if (isEnd) {
                pool.end();
                console.log('Done');
            }
        });
    }
};