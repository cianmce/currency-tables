"use strict";

$(function(){
    get_current_prices();

    $('.add_table').click(add_new_table);
    $('.swap-from-to').click(function(){
        var from_currency = $('#from-currency').val();
        $('#from-currency').val($('#to-currency').val());
        $('#to-currency').val(from_currency);
    });

});

// GLOBALS
var available_currencies = {};
var default_from = 'USD';
var default_to   = 'EUR';
// GLOBALS


function get_current_prices(){
    $.getJSON("https://api.fixer.io/latest", function(data) {
        var rates = data.rates;
        rates[data['base']] = 1; // add base, normally eur
        fx.rates = rates;
        add_bitcoin();
    });
}

function add_bitcoin(){
    var url = 'https://api.bitcoinaverage.com/ticker/EUR/';
    $.getJSON(url, function(data) {
        fx.rates['BTC'] = 1/data['24h_avg'];
        fx.rates['VND'] = 24868.9578;
        init_currency_selects();
    });
}

function add_new_table(){
    // called onclick and when 1st currency is loaded(maybe)
    var from_currency = $('#from-currency').val();
    var to_currency   = $('#to-currency').val();

    var digits_from = currencies[from_currency].digits;
    var digits_to   = currencies[to_currency].digits;
    if(digits_to === undefined){
        digits_to = 2;
    }

    // 1 "from" = rate "to"
    var rate = fx.convert(1, {from: from_currency, to: to_currency});

    var template_data = {
        'from_currency': from_currency,
        'to_currency': to_currency,
        'rows': []
    }

    // get multiplier
    var eur_rate = fx.convert(1, {from: 'EUR', to: from_currency});
    var multiplier = Math.pow(10, Math.round(Math.log10( eur_rate )));
    console.log(multiplier);
    if(multiplier > 1){
        digits_from = 0;
    }

    var row_step = [1,2,3,4,5,10,25,30,35,45];

    for (var i = 0; i < row_step.length; i++) {
        var step = row_step[i] * multiplier;
        template_data.rows.push({
            'from_val': step.toFixed(digits_from), 
            'to_val': (step*rate).toFixed(digits_to)
        });
    }

    var template = $('#table_template').html();
    Mustache.parse(template);   // optional, speeds up future uses
    var rendered = Mustache.render(template, template_data);
    $('#tables').append(rendered);
}


function init_currency_selects(){
    var from = $("#from-currency");
    var to = $("#to-currency");
    $.each(currencies, function(index, obj) {
        var code = obj['code'];
        var full_name = obj['currency'];
        if(code in fx.rates){
            var option = $('<option></option>').val(code).html(code+' - '+full_name);
            from.append(option.clone());
            to.append(option);
        }
    });
    // set defaults
    from.val(default_from);
    to.val(default_to);
}


