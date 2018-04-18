/*
---Modules---
 */

const moment = require('moment');

//postgres://{user}:{password}@{hostname}:{port}/{database-name}
const DATABASE_URL = 'postgres://test00:0000@localhost:5432/secret-database-00',
    TABLE_NAME = 'main';

const convert = (row, index, rows) => {

    row.date = normalDate(row.date_temp);

    row.reserve_date = addNormalDateReserve(row.date, row.time_temp);

    row.date = addNormalTime(row.date, row.time_reserv_temp);

    return row;
};


/*
---Temp---
 */

const normalDate = (dateOld) => {
    let i;
    for (i = 0; dateOld.substring(i, i + 1) !== ' '; i++) {}
    let dateBase = dateOld.substring(0, i);
    for (i++; dateOld.substring(i, i + 1) === ' '; i++) {}
    let dateDay = dateOld.substring(i, i + 3);
    dateDay = getDayOfWeek(dateDay);

    for (let year = 2010; year < 2020; year++) {
        try {
            let date = moment(dateBase + '.' + year,'DD.MM.YYYY');
            date = date.toDate();
            if (date == 'Invalid Date') throw new Error();

            if (date.getDay() === dateDay) {
                return date.getTime();
            }
        }
        catch (e) {console.log(e)}
    }

    console.log('Invalid year!');
};

const getDayOfWeek = (dateDay) => {
    if (dateDay.indexOf('пн', 0) !== -1) return 1;
    if (dateDay.indexOf('вт', 0) !== -1) return 2;
    if (dateDay.indexOf('ср', 0) !== -1) return 3;
    if (dateDay.indexOf('чт', 0) !== -1) return 4;
    if (dateDay.indexOf('пт', 0) !== -1) return 5;
    if (dateDay.indexOf('сб', 0) !== -1) return 6;
    if (dateDay.indexOf('вс', 0) !== -1) return 0;
};

const addNormalTime = (date, time) => {
    if (time.indexOf('                               ', 0) !== -1) return date;

    date = new Date(date);

    if (time.substring(1, 2) === '.') time = '0' + time;

    try {
        date = moment(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${time}`,'DD.MM.YYYY hh.mm');
        date = date.toDate();
        if (date == 'Invalid Date') throw new Error();

        return date.getTime();
    }
    catch (e) {console.log(e)}
};

const addNormalDateReserve = (date, dateRes) => {
    if (dateRes.indexOf('                               ', 0) !== -1) return date;

    date = new Date(date);

    if (dateRes.substring(1, 2) === '.') dateRes = '0' + dateRes;

    let i = dateRes.indexOf('..', 0);
    if (i !== -1)
        dateRes = dateRes.substring(0, i) + dateRes.substring(i + 1, dateRes.length);

    i = dateRes.indexOf(',', 0);
    if (i !== -1)
        dateRes = dateRes.substring(0, i) + '.' + dateRes.substring(i + 1, dateRes.length);

    dateRes = dateRes.substring(0, 5);

    try {
        date = moment(`${dateRes}.${date.getFullYear()}`,'DD.MM.YYYY');
        date = date.toDate();
        if (date == 'Invalid Date') throw new Error();

        return date.getTime();
    }
    catch (e) {console.log(e)}
};

























const pg = require('pg'),
    writeSuccess = {};

const pool = pg.Pool({
    connectionString: DATABASE_URL
});

pool.query(`SELECT * FROM ${TABLE_NAME}`, (error, data) => {
    for (let key in data.rows)
        data.rows[key] = convert(data.rows[key], key, data.rows);


    for (let key in data.rows)
        writeSuccess[key] = false;

    for (let dataKey in data.rows) {
        let queryParamNames = '', queryData = [data.rows[dataKey].id], i = 2;
        for (let queryKey in data.rows[dataKey]) {
            queryParamNames += `${queryKey}=$${i}, `;
            i++;
            queryData = [...queryData, data.rows[dataKey][queryKey]];
        }
        queryParamNames = queryParamNames.substring(0, queryParamNames.length - 2);

        pool.query(`UPDATE ${TABLE_NAME} SET ${queryParamNames} WHERE id = $1`, queryData,(error, data) => {
            if (error) console.log(error);

            writeSuccess[dataKey] = true;

            let isEnd = true;
            for (let key2 in writeSuccess) {
                if (!writeSuccess[key2]) isEnd = false;
            }

            if (isEnd) {
                pool.end();
                console.log('Done');
            }
        });
    }
});