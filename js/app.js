"use strict";

$(function(){
    get_current_prices();
    $.when( got_prices ).done(add_bitcoin);
    $.when( got_bitcoin ).done(init_currency_selects);

    $('.add_table').click(add_new_table);
    $('.steps_container').keypress(function(e) {
        if(e.which == 13) {
            add_new_table();
        }
    });

    $('.swap-from-to').click(function(){
        var from_currency = $('#from-currency').val();
        $('#from-currency').val($('#to-currency').val());
        $('#to-currency').val(from_currency);
    });
    $('body').on('click', 'a.remove_table', remove_table);

    $('.edit_steps').click(edit_steps);

    $('select').on('change', set_multiplier);


});

// GLOBALS
var available_currencies = {};
var default_from = 'USD';
var default_to   = 'EUR';

var default_row_step = [1,2,3,4,5,10,25,30,35,45];

var got_prices  = $.Deferred();
var got_bitcoin = $.Deferred();
// GLOBALS

function set_multiplier(){
    var multiplier = get_multiplier();
    $('#multiplier').text(multiplier);
}

function get_steps(){
    // validates and returns steps or default
    var steps = $('#steps').val().split(/[\s*(\,|\s)\s*]+/);
    
    steps = steps.map(function(n){
        n = +n;
        if(n!=NaN){
            return n;
        }
        return null;
    });

    console.log(steps);

    if(steps.length>0){
        return steps;
    }
    return default_row_step;
}

function edit_steps(e){
    e.preventDefault();
    console.log('current steps: ' + get_steps());
    $('.steps_container').slideToggle(300);

}

function remove_table(){
    var table_container = $(this).closest('.table-container');

    table_container.hide(300, function(){
        table_container.remove();
    });
}

function get_current_prices(){
    $.getJSON("https://api.fixer.io/latest", function(data) {
        var rates = data.rates;
        rates[data['base']] = 1; // add base, normally eur
        fx.rates = rates;
        // Vietnamese Dong not got from this API
        fx.rates['VND'] = 24868.9578;

        got_prices.resolve();
    });
}

function add_bitcoin(){
    var url = 'https://api.bitcoinaverage.com/ticker/EUR/';
    $.getJSON(url, function(data) {
        fx.rates['BTC'] = 1/data['24h_avg'];

        got_bitcoin.resolve();
    });
}

function get_multiplier(){
    var from_currency = $('#from-currency').val();
    var eur_rate = fx.convert(1, {from: 'EUR', to: from_currency});
    return Math.pow(10, Math.round(Math.log10( eur_rate )));
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
    var multiplier = get_multiplier();
    // console.log(multiplier);
    if(multiplier > 1){
        digits_from = 0;
    }

    var steps = get_steps();
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i] * multiplier;
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


