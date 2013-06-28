var people = [];
var checkParams = function(entry) {

    if (
            this.rows.length < 20
            && entry[0].toString().search(this.phone) !== -1
            && entry[1].toString().toLowerCase().search(this.name) !== -1
            && entry[4].toString().toLowerCase().search(this.street) !== -1
            && (!this.house || entry[5] == this.house)
            && (!this.apt || entry[6] == this.apt)
            ) {
        this.rows.push(entry);
    }
};

var found = function(res) {
//    console.log(res.rows);
};
var foundfull = function(res) {
//    console.log(res);
};

var search = function(params) {
    var callback = eval(arguments[1]) || found;
    if (!people.length) {
        callback(false);
        return false;
    }
    var params = {
        phone: params.phone || '',
        name: params.name || '',
        street: params.street || '',
        house: params.house || '',
        apt: params.apt || '',
        rows: []
    };
    params.name = params.name.toString().toLowerCase();
    params.street = params.street.toString().toLowerCase();
    people.forEach(checkParams, params);
    callback(params);
    return params.rows;
};
showPopup();
$.getJSON('sumy.db', function(json) {
    people = json;
    hidePopup();
});
